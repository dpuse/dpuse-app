// ── External Dependencies & Registrations
import type { AnyState, Claims, FlowName, Hanko } from '@teamhanko/hanko-frontend-sdk';

// ── Types ────────────────────────────────────────────────────────────────────────────────────────────────────────────

export type AuthSessionChangeId = 'created' | 'deleted' | 'expired' | 'terminated';

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

// Chosen by where the app is served rather than by build, because CI tests the production build on 'localhost' and the
// production Hanko project accepts only 'my.dpuse.app'. Public addresses, kept here so a build needs no '.env'.
const HANKO_API_URL = location.hostname === 'localhost' ? 'https://aed89ef7-2e5e-4e63-ae1a-851bbe2d4bb1.hanko.io' : 'https://auth.dpuse.app';

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

const state: { hankoInstance: Hanko | undefined; hankoFlowCleanupFunction: (() => void) | undefined } = {
    hankoInstance: undefined,
    hankoFlowCleanupFunction: undefined
};

// ── Actions ──────────────────────────────────────────────────────────────────────────────────────────────────────────

export async function loadAuthClient(handleSessionChange: (changeId: AuthSessionChangeId, claims?: Claims) => void): Promise<void> {
    const hankoModule = await import('@teamhanko/hanko-frontend-sdk');
    const hankoInstance = new hankoModule.Hanko(HANKO_API_URL);
    hankoInstance.onSessionCreated((sessionDetails) => {
        handleSessionChange('created', sessionDetails.claims);
    });
    hankoInstance.onSessionExpired(() => {
        handleSessionChange('expired');
    });
    hankoInstance.onUserDeleted(() => {
        handleSessionChange('deleted');
    });
    hankoInstance.onUserLoggedOut(() => {
        handleSessionChange('terminated');
    });
    state.hankoInstance = hankoInstance;
}

// The claims of a valid session, or undefined when the user is signed out.
export async function validateAuthSession(): Promise<Claims | undefined> {
    const result = await state.hankoInstance?.validateSession();
    return result?.is_valid === true ? result.claims : undefined;
}

export async function constructFlow(name: FlowName, stateHandler: ({ state }: { state: AnyState }) => void): Promise<void> {
    state.hankoFlowCleanupFunction = state.hankoInstance?.onAfterStateChange(stateHandler);
    await state.hankoInstance?.createState(name);
}

export function destroyFlow(): void {
    state.hankoFlowCleanupFunction?.();
    state.hankoFlowCleanupFunction = undefined;
}

export async function signOut(): Promise<void> {
    await state.hankoInstance?.logout();
}
