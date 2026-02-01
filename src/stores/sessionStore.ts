/* eslint-disable unicorn/consistent-function-scoping */

// Vendor dependencies
import { defineStore } from 'pinia';
import type { AnyState, Claims, FlowName, Hanko } from '@teamhanko/hanko-frontend-sdk';
import { ref, shallowRef } from 'vue';

// Workbench core
import type { ConnectionConfig } from '@datapos/datapos-shared/component/connector';
import type { ToolConfig } from '@datapos/datapos-shared/component/tool';

// Engine
import type { EngineConfig } from '@datapos/datapos-shared/engine';

// Session status
export interface SessionStatus {
    establishedAt?: number;
    expiresAt?: number;
    expiresIn?: number;
    isAuthenticated?: boolean; // undefined if Hanko validate session pending; false if not signed in; true if signed in
    lifetime?: number;
    monitorSessionId?: string;
    monitorUserId?: string;
    sessionId?: string;
    userId?: string;
}

// Constants
const DPU_ANON_USER_ID_KEY = 'dpu_anon_user_id';
// const DPU_ANON_SESSION_ID_KEY = 'dpu_anon_session_id';
// const DPU_ANON_SESSION_LAST_KEY = 'dpu_anon_session_last';
// const EXPIRE_INTERVAL_FAST = 1000; // Milliseconds (1 second).
// const EXPIRE_INTERVAL_SLOW = 300_000; // Milliseconds (5 minutes).
const HANKO_API_URL = import.meta.env.PROD ? import.meta.env.VITE_HANKO_API_URL_PROD : import.meta.env.VITE_HANKO_API_URL_DEV;

// Populated once hanko imported and constructed
let hankoInstance: Hanko | undefined;

// Populate each time a new flow is created; cleared each time a flow is destroyed
let flowCleanupFunction: (() => void) | undefined;

//
// let sessionExpiryTimer: ReturnType<typeof setTimeout> | undefined;

// Pina store for session state
export const useSessionStore = defineStore('session', () => {
    const areUpdatesPending = ref(false);
    const connectionConfigs = shallowRef<ConnectionConfig[]>([]);
    const engineConfig = shallowRef<EngineConfig | undefined>();
    const localMetaNodeConnectionConfig = shallowRef<ConnectionConfig | undefined>();
    const sessionStatus = ref<SessionStatus>({});
    const toolConfigs = shallowRef<ToolConfig[] | undefined>();

    function initialiseServices(): void {
        import('@teamhanko/hanko-frontend-sdk').then(({ Hanko }) => {
            hankoInstance = new Hanko(HANKO_API_URL);
            hankoInstance.onSessionCreated((sessionDetails) => (sessionStatus.value = constructSessionStatus(sessionDetails.claims)));
            hankoInstance.onSessionExpired(() => (sessionStatus.value = constructSessionStatus()));
            hankoInstance.onUserDeleted(() => (sessionStatus.value = constructSessionStatus()));
            hankoInstance.onUserLoggedOut(() => (sessionStatus.value = constructSessionStatus()));
            hankoInstance.validateSession().then((result) => {
                sessionStatus.value = constructSessionStatus(result.is_valid ? result.claims : undefined);
                import('@/composables/useMonitor').then(({ useMonitor }) => {
                    useMonitor().initialise(sessionStatus.value.monitorUserId!);
                    window.addEventListener('beforeunload', (event) => {
                        if (!areUpdatesPending.value) return;
                        useMonitor().cleanUp();
                        event.preventDefault();
                        event.returnValue = '';
                    });
                });
            });
        });
    }

    function constructFlow(name: FlowName, stateHandler: ({ state }: { state: AnyState }) => void): void {
        flowCleanupFunction = hankoInstance?.onAfterStateChange(stateHandler); // Fails silently in no Hanko instance
        hankoInstance?.createState(name);
    }

    function destroyFlow(): void {
        flowCleanupFunction?.(); // Fails silently in no Hanko instance
        flowCleanupFunction = undefined;
    }

    async function signOut(): Promise<void> {
        await hankoInstance?.logout(); // Fails silently in no Hanko instance
    }

    return { connectionConfigs, constructFlow, destroyFlow, engineConfig, initialiseServices, localMetaNodeConnectionConfig, sessionStatus, signOut, toolConfigs };
});

// Helpers ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function constructSessionStatus(claims?: Claims): SessionStatus {
    if (claims) {
        const establishedAt = claims.issued_at ? Date.parse(claims?.issued_at) : 0;
        const expiresAt = claims.expiration ? Date.parse(claims.expiration) : 0;
        const userId = claims.subject ?? 'unknown';
        const sessionId = claims.session_id ?? 'unknown';
        return {
            establishedAt,
            expiresAt,
            expiresIn: 0,
            isAuthenticated: true,
            lifetime: expiresAt - establishedAt,
            monitorSessionId: `user_${sessionId}`,
            monitorUserId: `user_${userId}`,
            sessionId,
            userId
        };
    }

    let monitorUserId = localStorage.getItem(DPU_ANON_USER_ID_KEY);
    if (!monitorUserId) {
        monitorUserId = `anon_${crypto.randomUUID()}`;
        localStorage.setItem(DPU_ANON_USER_ID_KEY, monitorUserId);
    }
    return { isAuthenticated: false, monitorUserId };
}

// function clearSessionExpiryTimer(): void {
//     clearInterval(sessionExpiryTimer);
//     sessionExpiryTimer = undefined;
// }

// function startSessionExpiryTimer(runQuickly: boolean = false): void {
//     clearSessionExpiryTimer();
//     sessionExpiryTimer = setInterval(
//         () => {
//             sessionStatus.value.expiresIn = Math.max(0, (sessionStatus.value.expiresAt || 0) - Date.now());
//             if (sessionStatus.value.expiresIn === 0) clearSessionExpiryTimer();
//         },
//         runQuickly ? EXPIRE_INTERVAL_FAST : EXPIRE_INTERVAL_SLOW
//     );
// }
