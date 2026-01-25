// External dependencies
import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { AnyState, Claims, FlowName, Hanko } from '@teamhanko/hanko-frontend-sdk';

// Constants
const HANKO_API_URL = import.meta.env.PROD ? import.meta.env.VITE_HANKO_API_URL_PROD : import.meta.env.VITE_HANKO_API_URL_DEV;

interface SessionStatus {
    establishedAt?: number;
    expiresAt?: number;
    expiresIn?: number;
    isAuthenticated?: boolean;
    lifetime?: number;
    sessionId?: string;
    userId?: string;
}

// Pina store for session state
export const useSessionStore = defineStore('session', () => {
    let flowCleanupFunction: (() => void) | undefined;
    let hankoInstance: Hanko | undefined;
    const sessionStatus = ref<SessionStatus>({});

    async function initServices(hankoImportPromise: Promise<typeof import('@teamhanko/hanko-frontend-sdk')>): Promise<void> {
        const hankoModule = await hankoImportPromise;
        hankoInstance = new hankoModule.Hanko(HANKO_API_URL);
        hankoInstance.onSessionCreated((sessionDetails) => (sessionStatus.value = constructSessionStatus(sessionDetails.claims)));
        hankoInstance.onSessionExpired(() => (sessionStatus.value = constructSessionStatus()));
        hankoInstance.onUserDeleted(() => (sessionStatus.value = constructSessionStatus()));
        hankoInstance.onUserLoggedOut(() => (sessionStatus.value = constructSessionStatus()));

        const validateSessionResponse = await hankoInstance.validateSession();
        sessionStatus.value = constructSessionStatus(validateSessionResponse.is_valid ? validateSessionResponse.claims : undefined);
    }

    function constructFlow(name: FlowName, stateHandler: ({ state }: { state: AnyState }) => void): void {
        flowCleanupFunction = hankoInstance?.onAfterStateChange(stateHandler);
        hankoInstance?.createState(name);
    }

    function destroyFlow(): void {
        flowCleanupFunction?.();
    }

    async function signOut(): Promise<void> {
        await hankoInstance?.logout();
    }

    return { constructFlow, destroyFlow, initServices, sessionStatus, signOut };
});

//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//#region Authentication Helpers
//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// ???
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

//#endregion ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
