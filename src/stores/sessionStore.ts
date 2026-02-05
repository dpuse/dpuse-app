/* eslint-disable unicorn/consistent-function-scoping */

// Vendor dependencies
import { defineStore } from 'pinia';
// import { useIdle } from '@vueuse/core';
import type { AnyState, Claims, FlowName, Hanko } from '@teamhanko/hanko-frontend-sdk';
import { ref, shallowRef } from 'vue';

// Application framework
import type { ConnectionConfig } from '@datapos/datapos-shared/component/connector';
import type { ToolConfig } from '@datapos/datapos-shared/component/tool';

// Engine
import type { EngineConfig } from '@datapos/datapos-shared/engine';

//
export type Exception = { typeId: 'handled' | 'promise' | 'runtime' | 'vue'; error?: unknown; message?: string; info?: string; context?: string };

// Constants
const DPU_ANON_USER_ID_KEY = 'dpu_anon_user_id';
const DPU_ANON_SESSION_ID_KEY = 'dpu_anon_session_id';
const EXPIRE_INTERVAL_FAST = 1000; // Milliseconds (1 second).
const EXPIRE_INTERVAL_SLOW = 300_000; // Milliseconds (5 minutes).
const HANKO_API_URL = import.meta.env.PROD ? import.meta.env.VITE_HANKO_API_URL_PROD : import.meta.env.VITE_HANKO_API_URL_DEV;
// const SESSION_IDLE_TIMEOUT = 30 * 60 * 1000; // 30 minutes

// Long-lived module-scoped Hanko instance reused across multiple authentication sessions
let hankoInstance: Hanko | undefined;

// Cleanup callback for the active Hanko flow
let hankoFlowCleanupFunction: (() => void) | undefined;

// Long-lived app-scoped monitor instance
export let monitorInstance: ReturnType<typeof import('@/composables/useMonitor').useMonitor> | undefined;

// Temporary app-scoped pending exception array
export const pendingExceptions: Exception[] = [];

// Long-lived authenticated-session-scoped expiry timer
let expiryTimer: ReturnType<typeof setTimeout> | undefined;

// Pina store for session state
export const useSessionStore = defineStore('session', () => {
    const areUpdatesPending = ref(false);
    const connectionConfigs = shallowRef<ConnectionConfig[]>([]);
    const engineConfig = shallowRef<EngineConfig | undefined>();
    const expiresAt = ref<number | undefined>();
    const expiresIn = ref<number | undefined>();
    const isAuthenticated = ref<boolean | undefined>(); // undefined if Hanko validate session pending; false if signed OUT; true if signed IN
    const lifetime = ref<number | undefined>();
    const localMetaNodeConnectionConfig = shallowRef<ConnectionConfig | undefined>();
    const sessionId = ref<string | undefined>();
    const toolConfigs = shallowRef<ToolConfig[] | undefined>();
    const userId = ref<string | undefined>();

    // const { idle: isIdle } = useIdle(SESSION_IDLE_TIMEOUT);
    // watch(isIdle, (newIsIdle) => {
    //     if (newIsIdle && isAuthenticated.value === false) {
    //         const anonSessionId = crypto.randomUUID();
    //         sessionId.value = anonSessionId;
    //         localStorage.setItem(DPU_ANON_SESSION_ID_KEY, anonSessionId);
    //         monitorInstance?.resetSession(sessionId.value!); // Fails silently in no monitor instance
    //     }
    // });

    function initialiseServices(): void {
        // TODO: Return promise...
        import('@teamhanko/hanko-frontend-sdk').then(({ Hanko }) => {
            hankoInstance = new Hanko(HANKO_API_URL);
            hankoInstance.onSessionCreated((sessionDetails) => initialiseSession(sessionDetails.claims));
            hankoInstance.onSessionExpired(() => initialiseSession());
            hankoInstance.onUserDeleted(() => initialiseSession());
            hankoInstance.onUserLoggedOut(() => initialiseSession());
            hankoInstance.validateSession().then((result) => {
                initialiseSession(result.is_valid ? result.claims : undefined);
                import('@/composables/useMonitor').then((module) => {
                    monitorInstance = module.useMonitor();
                    monitorInstance.initialise(userId.value!, sessionId.value!);
                    window.addEventListener('beforeunload', (event) => {
                        if (!areUpdatesPending.value) return;
                        monitorInstance?.shutdown(); // Fails silently in no monitor instance
                        event.preventDefault();
                        event.returnValue = '';
                    });
                });
            });
        });
    }

    function constructFlow(name: FlowName, stateHandler: ({ state }: { state: AnyState }) => void): void {
        hankoFlowCleanupFunction = hankoInstance?.onAfterStateChange(stateHandler); // Fails silently in no Hanko instance
        hankoInstance?.createState(name);
    }

    function destroyFlow(): void {
        hankoFlowCleanupFunction?.(); // Fails silently in no Hanko flow cleanup function
        hankoFlowCleanupFunction = undefined;
    }

    async function signOut(): Promise<void> {
        await hankoInstance?.logout(); // Fails silently in no Hanko instance
    }

    return {
        connectionConfigs,
        constructFlow,
        destroyFlow,
        engineConfig,
        expiresAt,
        expiresIn,
        initialiseServices,
        isAuthenticated,
        lifetime,
        localMetaNodeConnectionConfig,
        signOut,
        toolConfigs
    };

    // Helpers ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    function initialiseSession(claims?: Claims): void {
        if (claims) {
            const establishedAt = claims.issued_at ? Date.parse(claims?.issued_at) : 0;
            expiresAt.value = claims.expiration ? Date.parse(claims.expiration) : 0;
            expiresIn.value = Math.max(0, (expiresAt.value || 0) - Date.now());
            isAuthenticated.value = true;
            lifetime.value = expiresAt.value - establishedAt;
            sessionId.value = claims.session_id ?? 'unknown';
            userId.value = claims.subject ?? 'unknown';
            startSessionExpiryTimer();
        } else {
            clearSessionExpiryTimer();
            expiresAt.value = undefined;
            expiresIn.value = undefined;
            isAuthenticated.value = false;
            lifetime.value = undefined;
            let anonUserId = localStorage.getItem(DPU_ANON_USER_ID_KEY);
            if (!anonUserId) {
                anonUserId = `anon_${crypto.randomUUID()}`;
                localStorage.setItem(DPU_ANON_USER_ID_KEY, anonUserId);
            }
            userId.value = anonUserId;
            let anonSessionId = localStorage.getItem(DPU_ANON_SESSION_ID_KEY);
            if (!anonSessionId) {
                anonSessionId = crypto.randomUUID();
                localStorage.setItem(DPU_ANON_SESSION_ID_KEY, anonSessionId);
            }
            sessionId.value = anonSessionId;
        }
    }

    function startSessionExpiryTimer(runQuickly: boolean = false): void {
        clearSessionExpiryTimer();
        expiryTimer = globalThis.setInterval(
            () => {
                expiresIn.value = Math.max(0, (expiresAt.value || 0) - Date.now());
                if (expiresIn.value <= 0) clearSessionExpiryTimer();
            },
            runQuickly ? EXPIRE_INTERVAL_FAST : EXPIRE_INTERVAL_SLOW
        );
    }

    function clearSessionExpiryTimer(): void {
        globalThis.clearInterval(expiryTimer);
        expiryTimer = undefined;
    }
});
