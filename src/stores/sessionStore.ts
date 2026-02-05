/* eslint-disable unicorn/consistent-function-scoping */

// Vendor dependencies
import { defineStore } from 'pinia';
import { useIdle } from '@vueuse/core';
import type { AnyState, Claims, FlowName, Hanko } from '@teamhanko/hanko-frontend-sdk';
import { type ComponentPublicInstance, ref, shallowRef } from 'vue';

// DPU framework
import type { ConnectionConfig } from '@datapos/datapos-shared/component/connector';
import type { EngineConfig } from '@datapos/datapos-shared/engine';
import type { ToolConfig } from '@datapos/datapos-shared/component/tool';

// Exception declarations
type HandledException = { typeId: 'handled'; payload: { error?: unknown; locator: string } };
type UnhandledVueException = { typeId: 'unhandledVue'; payload: { error?: unknown; instance: ComponentPublicInstance | null; info?: string } };
type UnhandledRuntimeException = { typeId: 'unhandledRuntime'; payload: ErrorEvent };
type UnhandledPromiseRejectException = { typeId: 'unhandledPromise'; payload: PromiseRejectionEvent };
export type Exception = HandledException | UnhandledRuntimeException | UnhandledPromiseRejectException | UnhandledVueException;

// Constants
const EXPIRE_INTERVAL_FAST = 1000; // Milliseconds (1 second).
const EXPIRE_INTERVAL_SLOW = 300_000; // Milliseconds (5 minutes).
const HANKO_API_URL = import.meta.env.PROD ? import.meta.env.VITE_HANKO_API_URL_PROD : import.meta.env.VITE_HANKO_API_URL_DEV;
const SESSION_IDLE_TIMEOUT = 30 * 60 * 1000; // 30 minutes

// Long-lived module-scoped Hanko instance reused across multiple authentication sessions
let hankoInstance: Hanko | undefined;

// Cleanup callback for the active Hanko flow
let hankoFlowCleanupFunction: (() => void) | undefined;

// Long-lived app-scoped monitor instance
export let monitorInstance: ReturnType<typeof import('@/composables/useMonitor').useMonitor> | undefined;

// Temporary app-scoped pending exceptions array
export const pendingExceptions: Exception[] = [];

// Long-lived authenticated-session-scoped expiry timer
let expiryTimer: ReturnType<typeof setTimeout> | undefined;

// Pina store for session state
export const useSessionStore = defineStore('session', () => {
    const areUpdatesPending = ref(false);
    const connectionConfigs = shallowRef<ConnectionConfig[]>([]);
    const emailAddress = ref<string | undefined>();
    const emailIsPrimary = ref<boolean | undefined>();
    const emailIsVerified = ref<boolean | undefined>();
    const engineConfig = shallowRef<EngineConfig | undefined>();
    const expiresAt = ref<number | undefined>();
    const expiresIn = ref<number | undefined>();
    const isAuthenticated = ref<boolean | undefined>(); // undefined if Hanko validate session pending; false if signed OUT; true if signed IN
    const lifetime = ref<number | undefined>();
    const localMetaNodeConnectionConfig = shallowRef<ConnectionConfig | undefined>();
    const sessionId = ref<string | undefined>();
    const toolConfigs = shallowRef<ToolConfig[] | undefined>();
    const userId = ref<string | undefined>();

    const { idle, lastActive } = useIdle(SESSION_IDLE_TIMEOUT);

    function initialiseServices(): void {
        // TODO: Return promise...
        import('@teamhanko/hanko-frontend-sdk').then(({ Hanko }) => {
            hankoInstance = new Hanko(HANKO_API_URL);
            hankoInstance.onSessionCreated((sessionDetails) => establishSession(sessionDetails.claims));
            hankoInstance.onSessionExpired(() => establishSession());
            hankoInstance.onUserDeleted(() => establishSession());
            hankoInstance.onUserLoggedOut(() => establishSession());
            hankoInstance.validateSession().then((result) => {
                establishSession(result.is_valid ? result.claims : undefined, true);
                import('@/composables/useMonitor').then((module) => {
                    console.log(userId.value, sessionId.value, emailAddress.value);
                    monitorInstance = module.useMonitor(userId.value, sessionId.value, emailAddress.value);
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
        idle,
        initialiseServices,
        isAuthenticated,
        lastActive,
        lifetime,
        localMetaNodeConnectionConfig,
        signOut,
        toolConfigs
    };

    // Session helpers ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    function establishSession(claims?: Claims, isLoading = false): void {
        if (claims) {
            console.log(claims);
            if (claims.email) {
                emailAddress.value = claims.email.address;
                emailIsPrimary.value = claims.email.is_primary;
                emailIsVerified.value = claims.email.is_verified;
            } else {
                emailAddress.value = undefined;
                emailIsPrimary.value = undefined;
                emailIsVerified.value = undefined;
            }
            const establishedAt = claims.issued_at ? Date.parse(claims?.issued_at) : 0;
            expiresAt.value = claims.expiration ? Date.parse(claims.expiration) : 0;
            expiresIn.value = Math.max(0, (expiresAt.value || 0) - Date.now());
            isAuthenticated.value = true;
            lifetime.value = expiresAt.value - establishedAt;
            sessionId.value = claims.session_id;
            userId.value = claims.subject;
            startSessionExpiryTimer();
            if (!isLoading) monitorInstance?.identifyUser(claims.subject, claims.session_id, claims.email?.address); // Fails silently in no monitor instance
        } else {
            clearSessionExpiryTimer();
            emailAddress.value = undefined;
            emailIsPrimary.value = undefined;
            emailIsVerified.value = undefined;
            expiresAt.value = undefined;
            expiresIn.value = undefined;
            isAuthenticated.value = false;
            lifetime.value = undefined;
            userId.value = undefined;
            sessionId.value = undefined;
            monitorInstance?.resetUser(); // Fails silently in no monitor instance
        }
    }

    // Expiry timer helpers ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

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
