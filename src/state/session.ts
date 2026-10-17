// ── External Dependencies & Registrations
import type { Claims } from '@teamhanko/hanko-frontend-sdk';
import { ref, watch } from 'vue';
import { useDocumentVisibility, useIntervalFn } from '@vueuse/core';

// ── DPUse Framework
import { AppError } from '@dpuse/dpuse-shared';

// ── Local Framework
import { hasReportedAppError } from '@/observability/errorTracking';
import { raiseAppFailure } from '@/state/errors';
import { accountConfigStatus, connectionAccountConfigs, initialiseConfigMonitor, initialiseContextConfig } from '@/state/configs';
import { type AuthSessionChangeId, loadAuthClient, validateAuthSession } from '@/services/auth';
import { forgetUser, identifyUser } from '@/observability/eventTracking';

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

const EXPIRE_INTERVAL_FAST_MS = 1000;
const EXPIRE_INTERVAL_SLOW_MS = 60_000;

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

export const accountId = ref<string | undefined>();
export const emailAddress = ref<string | undefined>();
const emailIsPrimary = ref<boolean | undefined>();
const emailIsVerified = ref<boolean | undefined>();
export const expiresAt = ref<number | undefined>();
export const expiresIn = ref<number | undefined>();
const expiryIntervalMs = ref(EXPIRE_INTERVAL_SLOW_MS);
export const sessionIsAuthenticated = ref<boolean | undefined>(); // Undefined while Hanko checks the session, then true when signed in and false when signed out.
export const lifetime = ref<number | undefined>();
const sessionId = ref<string | undefined>();
export const signInFollowsGuestUse = ref(false); // True once a user signs in after using this page signed out, so their guest work can be offered to the account.
const state = { accountMonitorIsStarted: false }; // A visitor who never signed in has no account monitor, so signing out skips loading its code.

const { pause: pauseExpiryTimer, resume: resumeExpiryTimer } = useIntervalFn(updateExpiresIn, expiryIntervalMs, { immediate: false });

// ── Side Effects ─────────────────────────────────────────────────────────────────────────────────────────────────────

// A backgrounded tab has its timers throttled, so the countdown is brought up to date as soon as the tab is looked at.
// eslint-disable-next-line unicorn/no-top-level-side-effects -- An app-lifetime singleton, so the watcher belongs to the module rather than a component.
watch(useDocumentVisibility(), (visibility) => {
    if (visibility === 'visible' && expiresAt.value != null) updateExpiresIn();
});

// ── Actions ──────────────────────────────────────────────────────────────────────────────────────────────────────────

export function initialiseServices(): void {
    void initialiseHanko();
    void initialiseConfigMonitor();
    void initialiseContextConfig();
}

export function setSessionExpiryTimer(isRunQuickly = false): void {
    if (isRunQuickly && expiresAt.value != null) updateExpiresIn();
    expiryIntervalMs.value = isRunQuickly ? EXPIRE_INTERVAL_FAST_MS : EXPIRE_INTERVAL_SLOW_MS;
    resumeExpiryTimer();
}

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

async function initialiseHanko(): Promise<void> {
    try {
        await loadAuthClient(establishSession);
    } catch (error) {
        // Without this the session stays pending, so every view that depends on it waits for ever. 'validationFailure'
        // marks the user as signed out, as a failed validation would.
        //
        // Raised at app level because no region owns signing in: a signed-out user looking at a working app has no
        // other way to learn why the sign-in button leads nowhere.
        establishSession('validationFailure');
        raiseAppFailure(new AppError('Failed to load the authentication service.', 'dpuse-app.session.initialiseHanko', { typeId: 'handled' }, { cause: error }), {
            capability: 'authentication'
        });
        return;
    }

    try {
        establishSession('validated', await validateAuthSession());
        void initialisePerformanceTracking();
    } catch (error) {
        // The same capability as a failed SDK load, and for the user the same loss: they cannot sign in. Named
        // alike so a session that is offline for both reasons is one entry rather than two.
        raiseAppFailure(new AppError('Session validation failed.', 'dpuse-app.session.initialiseHanko', { typeId: 'handled' }, { cause: error }), {
            capability: 'authentication'
        });
        establishSession('validationFailure');
    }
}

// Logged and reported, but not shown to the user: performance tracking is invisible, so its loss changes nothing they
// can see or act on.
async function initialisePerformanceTracking(): Promise<void> {
    try {
        const performanceTrackingModule = await import('@/observability/performanceTracking');
        performanceTrackingModule.initialise();
    } catch (error) {
        void hasReportedAppError(new AppError('Failed to load performance tracking.', 'dpuse-app.session.initialisePerformanceTracking', { typeId: 'handled' }, { cause: error }));
    }
}

async function initialiseAccountMonitor(): Promise<void> {
    try {
        const accountMonitorModule = await import('@/observability/accountMonitor');
        accountMonitorModule.initialise();
        state.accountMonitorIsStarted = true;
    } catch (error) {
        // Raised at app level because no screen shows the account's connections on their own. The status stops screens
        // waiting for a list that will never arrive.
        const failure = raiseAppFailure(
            new AppError('Failed to load the account service.', 'dpuse-app.session.initialiseAccountMonitor', { typeId: 'handled' }, { cause: error }),
            {
                capability: 'account'
            }
        );
        accountConfigStatus.value = { typeId: 'failed', failure };
    }
}

// Not shown to the user: a skipped teardown in a tab that is discarding its session state is not something the user can
// act on.
async function terminateAccountMonitor(): Promise<void> {
    if (!state.accountMonitorIsStarted) return;
    state.accountMonitorIsStarted = false;
    try {
        const accountMonitorModule = await import('@/observability/accountMonitor');
        accountMonitorModule.terminate();
    } catch (error) {
        void hasReportedAppError(new AppError('Failed to terminate the account service.', 'dpuse-app.session.terminateAccountMonitor', { typeId: 'handled' }, { cause: error }));
    }
}

function establishSession(actionId: AuthSessionChangeId | 'validated' | 'validationFailure', claims?: Claims): void {
    if (claims) {
        if (claims.email) {
            emailAddress.value = claims.email.address;
            emailIsPrimary.value = claims.email.is_primary;
            emailIsVerified.value = claims.email.is_verified;
        } else {
            emailAddress.value = undefined;
            emailIsPrimary.value = undefined;
            emailIsVerified.value = undefined;
        }
        signInFollowsGuestUse.value ||= sessionIsAuthenticated.value === false; // Not on a page load already signed in, which starts undefined.
        accountId.value = claims.subject;
        const establishedAt = claims.issued_at == null ? 0 : Date.parse(claims.issued_at);
        expiresAt.value = claims.expiration ? Date.parse(claims.expiration) : 0;
        expiresIn.value = Math.max(0, (expiresAt.value || 0) - Date.now());
        sessionIsAuthenticated.value = true;
        lifetime.value = expiresAt.value - establishedAt;
        sessionId.value = claims.session_id;

        void initialiseAccountMonitor();

        setSessionExpiryTimer();
        identifyUser(claims.subject, claims.session_id, claims.email?.address ?? emailAddress.value);

        if (import.meta.env.DEV) console.info(`[dpuse:app] ℹ️  Authenticated session established (${actionId}).`);
    } else {
        forgetUser();
        pauseExpiryTimer();

        void terminateAccountMonitor();

        connectionAccountConfigs.value = [];
        accountConfigStatus.value = { typeId: 'pending' };
        emailAddress.value = undefined;
        emailIsPrimary.value = undefined;
        emailIsVerified.value = undefined;
        expiresAt.value = undefined;
        expiresIn.value = undefined;
        sessionIsAuthenticated.value = false;
        lifetime.value = undefined;
        accountId.value = undefined;
        sessionId.value = undefined;
        signInFollowsGuestUse.value = false;

        const icon = actionId === 'validationFailure' ? '⚠️ ' : 'ℹ️ ';
        if (import.meta.env.DEV) console.info(`[dpuse:app] ${icon} Unauthenticated session established (${actionId}).`);
    }
}

// The interval keeps running while the countdown is live and stops itself once the session has expired.
function updateExpiresIn(): void {
    expiresIn.value = Math.max(0, (expiresAt.value ?? 0) - Date.now());
    if (expiresIn.value <= 0) pauseExpiryTimer();
}
