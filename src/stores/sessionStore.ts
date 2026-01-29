/* eslint-disable unicorn/consistent-function-scoping */

// Vendor dependencies
import { defineStore } from 'pinia';
import type { EngineConfig } from '@datapos/datapos-shared/engine';
import type { ToolConfig } from '@datapos/datapos-shared/component/tool';
import { type AnyState, type Claims, type FlowName, Hanko } from '@teamhanko/hanko-frontend-sdk';
import { ref, shallowRef } from 'vue';

// Session status
interface SessionStatus {
    establishedAt?: number;
    expiresAt?: number;
    expiresIn?: number;
    isAuthenticated?: boolean; // undefined if Hanko validate session pending; false if not signed in; true if signed in
    lifetime?: number;
    sessionId?: string;
    userId?: string;
}

// Constants
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
    const engineConfig = shallowRef<EngineConfig | undefined>();
    const sessionStatus = ref<SessionStatus>({});
    const toolConfigs = shallowRef<ToolConfig[] | undefined>();

    function initServices(): void {
        // import('@teamhanko/hanko-frontend-sdk').then((hankoSDK) => {
        hankoInstance = new Hanko(HANKO_API_URL);
        hankoInstance.onSessionCreated((sessionDetails) => (sessionStatus.value = constructSessionStatus(sessionDetails.claims)));
        hankoInstance.onSessionExpired(() => (sessionStatus.value = constructSessionStatus()));
        hankoInstance.onUserDeleted(() => (sessionStatus.value = constructSessionStatus()));
        hankoInstance.onUserLoggedOut(() => (sessionStatus.value = constructSessionStatus()));
        hankoInstance.validateSession().then((validateSessionResponse) => {
            const claims = validateSessionResponse.is_valid ? validateSessionResponse.claims : undefined;
            sessionStatus.value = constructSessionStatus(claims);
            import('@/composables/useEventWorker').then(({ useEventWorker }) => useEventWorker().init(claims));
        });
        // });
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

    return { constructFlow, destroyFlow, engineConfig, initServices, sessionStatus, signOut, toolConfigs };
});

// Helpers ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

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

function constructSessionStatus(claims?: Claims): SessionStatus {
    if (claims) {
        const establishedAt = claims.issued_at ? Date.parse(claims?.issued_at) : 0;
        const expiresAt = claims.expiration ? Date.parse(claims.expiration) : 0;
        return {
            establishedAt,
            expiresAt,
            expiresIn: 0,
            isAuthenticated: true,
            lifetime: expiresAt - establishedAt,
            sessionId: claims.session_id ?? undefined,
            userId: claims.subject
        };
    }
    return { isAuthenticated: false };
}
