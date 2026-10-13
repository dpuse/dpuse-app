// ── External Dependencies & Registrations
import type { AnyState, Claims, FlowName, Hanko } from '@teamhanko/hanko-frontend-sdk';

// ── Local Framework
import { throwOnFault } from '@/observability/faultInjection';

// ── Types ────────────────────────────────────────────────────────────────────────────────────────────────────────────

export type AuthSessionChangeId = 'created' | 'deleted' | 'expired' | 'terminated';

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

const HANKO_API_URL = import.meta.env.PROD ? 'https://auth.dpuse.app' : 'https://aed89ef7-2e5e-4e63-ae1a-851bbe2d4bb1.hanko.io'; // Public addresses, kept here so a build needs no '.env'.

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

const state: { hankoInstance: Hanko | undefined; hankoFlowCleanupFunction: (() => void) | undefined } = {
    hankoInstance: undefined,
    hankoFlowCleanupFunction: undefined
};

// ── Actions ──────────────────────────────────────────────────────────────────────────────────────────────────────────

export async function loadAuthClient(handleSessionChange: (changeId: AuthSessionChangeId, claims?: Claims) => void): Promise<void> {
    if (import.meta.env.DEV) throwOnFault('auth');
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
