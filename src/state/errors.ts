// ── External Dependencies & Registrations
import { ref, shallowRef } from 'vue';

// ── DPUse Framework
import { type AppError, type SerialisedError, serialiseError } from '@dpuse/dpuse-shared/errors';

// ── Local Framework
import { reportAppError } from '@/observability/errorTracking';
import { serviceLoadFailed } from '@/state/session';

// ── Types ────────────────────────────────────────────────────────────────────────────────────────────────────────────

// Which surface an error is displayed on. Deliberately app-local rather than a field on 'AppError', which is shared
// with the api and engine packages where display severity has no meaning.
//   'staleDeploy'  The running app is out of date and can no longer fetch its own chunks — only a refresh clears it.
//   'fatal'        Nothing is left that could sensibly render the error in place, so the app takes over the screen.
//   'recoverable'  Contained to one panel or operation, which can be retried without disturbing the rest of the app.
export type ErrorSeverity = 'fatal' | 'recoverable' | 'staleDeploy';

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

// Set as 'data.severity' on an 'AppError' to override the classification fallback, the way Nuxt's 'createError' takes
// a 'fatal' flag.
const SEVERITY_DATA_KEY = 'severity';

// Set as 'data.componentName' by every catch site that knows which component it was loading — 'lazyRoute' here and
// 'ComponentLoadFailure' for everything the router does not load — so the banner can name what went missing.
const COMPONENT_NAME_DATA_KEY = 'componentName';
const SEVERITIES = new Set(['fatal', 'recoverable', 'staleDeploy']);

// A stale-deploy failure surfaces as an ordinary module-load rejection, and the only thing distinguishing it is the
// message, which is worded differently by every engine. Matched lowercased against every message in the cause chain.
// Revisit when browsers change the wording; a miss degrades to an in-panel error rather than the refresh banner.
const STALE_DEPLOY_MESSAGE_PATTERNS = [
    'failed to fetch dynamically imported module', // Chromium
    'error loading dynamically imported module', // Firefox
    'importing a module script failed', // Safari
    'unable to preload css', // Vite's own preload helper
    'failed to load module script' // Served HTML in place of a deleted chunk, so the MIME type is wrong
];

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

// Fatal — the app-level takeover surface. 'fatalErrorWasReported' is undefined while the report is still in flight,
// so the display can say the reporting is pending rather than claiming it could not be confirmed.
export const fatalError = shallowRef<AppError | undefined>();
export const fatalErrorWasReported = ref<boolean | undefined>();

// Stale deploy — deliberately separate from 'serviceLoadFailed', which the service loaders also set: sharing it would
// silently drop the first stale-deploy report whenever a service failure happened to raise the banner first. Never
// reset, because the banner it raises is a dead end that only a reload clears.
const state = { staleDeployWasReported: false };

// What the banner needs beyond the flag itself. The name is recovered from the failure; the path is supplied by the
// router, the only place that knows which navigation was abandoned. Both stay undefined for a failure that has
// neither — a 'vite:preloadError' from a chunk no route asked for.
export const serviceFailureComponentName = shallowRef<string | undefined>();
export const serviceFailureRetryPath = shallowRef<string | undefined>();

// ── Actions ──────────────────────────────────────────────────────────────────────────────────────────────────────────

// 'fallback' is what the caller knows about its own context and cannot be inferred from the error: a boundary that
// caught an error has somewhere to render it, whereas an error reaching the global handler or the router does not.
// Both the stale-deploy evidence and a declared severity are looked for along the whole cause chain, outermost first,
// because catch sites wrap what they catch — reading the outermost error alone would see only the wrapper, which was
// built by code that knows nothing about the failure. Outermost still wins, so a wrapper can override its cause.
export function classifyError(error: unknown, fallback: ErrorSeverity): ErrorSeverity {
    const serialisedErrors = serialiseError(error);
    if (serialisedErrors.some((serialisedError) => hasStaleDeployMessage(serialisedError))) return 'staleDeploy';
    return serialisedErrors.map((serialisedError) => serialisedError.data?.[SEVERITY_DATA_KEY]).find(isErrorSeverity) ?? fallback;
}

export function clearFatalError(): void {
    fatalError.value = undefined;
    fatalErrorWasReported.value = undefined;
}

export function isStaleDeployError(error: unknown): boolean {
    return serialiseError(error).some((serialisedError) => hasStaleDeployMessage(serialisedError));
}

// For errors caught where nothing local can display them — the global handler and the router. The caller passes the
// error it will report, with whatever it caught as the cause; the classification reads through to that cause.
export function raiseAppLevelError(error: AppError, retryPath?: string): void {
    switch (classifyError(error, 'fatal')) {
        case 'staleDeploy':
            raiseStaleDeployFailure(error, retryPath);
            return;
        // Declared recoverable, so the region that owns it will show it; from here there is only the report to make.
        case 'recoverable':
            void reportAppError(error);
            return;
        default:
            void raiseFatalError(error);
    }
}

// Reports the error, then takes over the screen. The report is awaited only to record whether it was delivered — the
// error is displayed immediately either way.
export async function raiseFatalError(error: AppError): Promise<void> {
    fatalError.value = error;
    fatalErrorWasReported.value = undefined;
    fatalErrorWasReported.value = await reportAppError(error);
}

// Hands the failure to 'ServiceFailureBanner' via the same flag the service loaders use. Reporting is fire-and-forget:
// the banner's message is fixed, so there is no delivery status for it to show.
//
// Only the first failure is reported. One stale deployment reaches here by several routes at once — Vite's
// 'vite:preloadError' and the rejected import behind 'defineAsyncPanel' are the same chunk failing — and a bad deploy
// produces that for every chunk the session goes on to need, so reporting each one buries the first in duplicates.
export function raiseStaleDeployFailure(error: AppError, retryPath?: string): void {
    serviceLoadFailed.value = true; // Raised for every failure: the banner must show even when the report is skipped.

    // Only the first failure's details are kept, for the same reason only the first is reported: a stale deployment
    // goes on to fail every chunk the session asks for, and the last of those names nothing the user was waiting for.
    serviceFailureComponentName.value ??= findComponentName(error);
    serviceFailureRetryPath.value ??= retryPath;

    if (state.staleDeployWasReported) return;
    state.staleDeployWasReported = true;
    void reportAppError(error);
}

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

// Read from the chain rather than passed in, so it works wherever the name was recorded: the outermost error is built
// by a catch site that knows only that a navigation failed, while the name sits on the cause it wrapped.
function findComponentName(error: unknown): string | undefined {
    const name = serialiseError(error)
        .map((serialisedError) => serialisedError.data?.[COMPONENT_NAME_DATA_KEY])
        .find((value) => typeof value === 'string' && value.length > 0);
    return typeof name === 'string' ? name : undefined;
}

function hasStaleDeployMessage(serialisedError: SerialisedError): boolean {
    const message = serialisedError.message.toLowerCase();
    return STALE_DEPLOY_MESSAGE_PATTERNS.some((pattern) => message.includes(pattern));
}

function isErrorSeverity(value: unknown): value is ErrorSeverity {
    return typeof value === 'string' && SEVERITIES.has(value);
}
