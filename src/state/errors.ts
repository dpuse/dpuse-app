// ── External Dependencies & Registrations
import { type ComponentPublicInstance, type Ref, ref, shallowRef } from 'vue';

// ── DPUse Framework
import { AppError, serialiseError } from '@dpuse/dpuse-shared';

// ── Local Framework
import { newAppVersionIsAvailable } from '@/state/appVersion';
import { hasReportedAppError, logError } from '@/observability/errorTracking';

// ── Types ────────────────────────────────────────────────────────────────────────────────────────────────────────────

// One failure, held for as long as it is on screen. Most catch sites produce one, and a few only report. There is no
// severity, because no failure is worth locking the running app for. The catch site decides where it shows, and
// 'needsReload' decides which action it offers.
export interface AppFailure {
    // Identifies what the user lost, used only to spot duplicates. The text on screen comes from the error. Set by the
    // catch site where it knows, otherwise read from the cause chain. Undefined when nothing identifiable was lost.
    capability: string | undefined;
    error: AppError;
    // False for a missing chunk once a newer version is known to be deployed: the user is simply on an old version,
    // which nobody can act on, so it is not reported and the display says nothing about reporting.
    isReportable: boolean;
    // A chunk the running deployment can no longer fetch. Only a reload can fetch it again, so the display says so.
    needsReload: boolean;
    // Where the user was heading when the failure abandoned the navigation. A route that cannot fetch its chunk
    // leaves the URL untouched, so without this a reload would return them to the screen they were leaving.
    reloadPath: string | undefined;
    // What to run if the user asks to try again, for failures shown at app level, where the display does not know what
    // was being attempted. Undefined for most failures: a service loaded once at startup has nothing to retry, and only
    // a reload recovers it.
    retry: (() => void) | undefined;
    // A ref rather than a plain field so the display can show delivery pending, then settled, without the holder of
    // this object having to be a deep reactive source.
    wasReported: Ref<boolean | undefined>;
}

// Local: nothing outside this module names the type, and both callers pass an object literal.
interface AppFailureOptions {
    capability?: string;
    reloadPath?: string;
    retry?: () => void;
}

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

// Set as 'data.componentName' wherever a catch site knows what it was loading: the router for route components, and
// 'LoadFailureNotice' for everything else. Lets a failure name what went missing without being told twice.
const COMPONENT_NAME_DATA_KEY = 'componentName';

// What Vue passes as 'info' for error code 13, 'async component loader'. It is worded in development and reduced to a
// documentation link in production, so both forms are matched. Revisit if Vue changes either. A miss costs a duplicate
// report rather than a lost one.
const COMPONENT_LOADER_ERROR_INFOS = new Set(['async component loader', 'https://vuejs.org/error-reference/#runtime-13']);

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

// Failures with no region of their own: an uncaught Vue error, a navigation that never reached a view, a service the
// app loads for itself. 'App.vue' shows them together in the app-level failure dialog, a modal that blocks the app
// until the user dismisses it.
export const appFailures = shallowRef<AppFailure[]>([]);

// What each failure in the app-level failure dialog matched on when it was raised, so a repeat can be recognised.
const appFailureKeys = new WeakMap<AppFailure, string>();

// One stale deployment fails every chunk the session goes on to need, so only the first is reported. Never reset,
// because a deployment does not become current again within a session.
const state = { staleDeployWasReported: false };

// Errors Vite has reported through 'vite:preloadError' as chunks this deployment can no longer fetch. The same error
// object reaches the catch site, so a failure is recognised by finding it in the cause chain.
const staleDeployErrors = new WeakSet<object>();

// Every error already reported, with its cause chain. One root cause is often raised several times, as each caller
// wraps and rethrows it, so this reports it only once. Only the report is suppressed: every region that lost something
// still shows the failure.
const reportedErrors = new WeakSet<object>();

// ── Actions ──────────────────────────────────────────────────────────────────────────────────────────────────────────

// Runs the retry of each app-level failure that offers one. Those failures are removed first, so a retry that fails
// again is raised rather than suppressed as a duplicate. Failures with nothing to retry stay listed.
export function retryAppFailures(): void {
    const retryableFailures = appFailures.value.filter((failure) => failure.retry != null);
    appFailures.value = appFailures.value.filter((failure) => failure.retry == null);
    for (const failure of retryableFailures) failure.retry?.();
}

// Dismisses every app-level failure at once, which is what the one card holding them all offers. They stay reported;
// only the display goes.
export function clearAppFailures(): void {
    appFailures.value = [];
}

// True for a failure that a lazy component's own 'errorComponent' is already showing. Vue also passes these to every
// 'errorCaptured' hook and the app error handler, which must ignore them or the failure is reported and shown twice.
// 'defineLazyComponent' gives every lazy component an 'errorComponent', so none is missed.
export function isComponentLoaderErrorInfo(info: string): boolean {
    return COMPONENT_LOADER_ERROR_INFOS.has(info);
}

export function isStaleDeployError(error: unknown): boolean {
    return collectCauseChain(error).some((causeError) => staleDeployErrors.has(causeError));
}

export function markStaleDeployError(error: unknown): void {
    if (error instanceof Error) staleDeployErrors.add(error);
}

// Adds a failure to the app-level failure dialog unless it is already listed, because some failures repeat on every
// update or tick. A failure with a capability matches on that. Any other matches on its component name and deepest
// message, so two different errors in one component both show. A repeat is logged, not reported.
export function raiseAppFailure(error: AppError, options: AppFailureOptions = {}): AppFailure {
    const key = options.capability ?? `${findComponentName(error) ?? ''}|${findDeepestMessage(error)}`;
    const shownFailure = appFailures.value.find((candidate) => appFailureKeys.get(candidate) === key);
    if (shownFailure) {
        logError(error);
        return shownFailure; // The one already on screen, so a caller holding the result still has one.
    }

    const failure = raiseFailure(error, options);
    appFailureKeys.set(failure, key);
    appFailures.value = [...appFailures.value, failure];
    return failure;
}

// Builds the failure and starts its report. Returns synchronously so a component can render it immediately; the
// delivery result lands on 'wasReported' when it settles.
export function raiseFailure(error: AppError, options: AppFailureOptions = {}): AppFailure {
    const isStaleDeploy = isStaleDeployError(error);
    const failure: AppFailure = {
        capability: options.capability ?? findComponentName(error),
        error,
        isReportable: !(isStaleDeploy && newAppVersionIsAvailable.value),
        needsReload: isStaleDeploy,
        reloadPath: options.reloadPath,
        retry: options.retry,
        wasReported: ref<boolean | undefined>()
    };
    void deliverReport(failure);
    return failure;
}

// Reported but never shown. Vite preloads chunks for screens the user may never open, so a failed preload has cost
// the user nothing yet. If something later needs the chunk, the region that asked for it shows the failure. Not
// reported once a newer version is deployed, because the user is simply on an old one.
export function reportStaleDeployFailure(error: AppError): void {
    if (state.staleDeployWasReported || newAppVersionIsAvailable.value) return;
    state.staleDeployWasReported = true;
    void hasReportedAppError(error);
}

// Reports and shows errors that nothing else handled, such as those in timers or DOM listeners outside Vue. 'main.ts'
// installs it as the page's 'error' listener.
export function handleRaiseScriptError(event: ErrorEvent): void {
    // The app's own errors always include a file, so one with no file or error object came from outside the app, such
    // as a browser extension.
    if (event.error == null && !event.filename) {
        console.warn('[dpuse:app] Ignored an error from a script outside the app.', event.message);
        return;
    }

    // The location is recorded for every error, as it is the only location when a plain value such as a string is
    // thrown.
    const data = { colno: event.colno, filename: event.filename, lineno: event.lineno, originalMessage: event.message, typeId: 'unhandledRuntime' };

    // A thrown value that is not an Error is passed on as it is, so the report shows its contents.
    const cause: unknown = event.error ?? new Error(event.message || 'Unknown error.');
    raiseAppFailure(new AppError('Unhandled error.', 'dpuse-app.errors.handleRaiseScriptError', data, { cause }));

    // Stops the browser logging the error a second time, as the app has already logged it.
    event.preventDefault();
}

// Reports and shows promise failures that nothing else handled. 'main.ts' installs it as the page's
// 'unhandledrejection' listener. A promise can fail with a value that is not an Error, so that value is passed on as it
// is and the report shows its contents.
export function handleRaisePromiseRejection(event: PromiseRejectionEvent): void {
    const data = { typeId: 'unhandledPromiseRejection' };
    const cause: unknown = event.reason ?? new Error('Unknown promise rejection error.');
    raiseAppFailure(new AppError('Unhandled promise rejection.', 'dpuse-app.errors.handleRaisePromiseRejection', data, { cause }));

    // Stops the browser logging the failure a second time, as the app has already logged it.
    event.preventDefault();
}

// A new deployment deletes the old version's code files (chunks). A user still running the old version then fails to
// load one, and Vite raises 'vite:preloadError', which 'main.ts' passes here. Nothing is shown, because the user may
// never open the screen that needs the chunk. That screen shows its own reload message. The failure is reported only if
// no newer version is known, because only then is it a fault rather than an out-of-date page.
//
// No 'preventDefault', so Vite passes the error on to the screen that asked for the chunk.
export function handleReportPreloadError(event: VitePreloadErrorEvent): void {
    // Marks the error so the screen offers a refresh, not a retry. Each browser words the error message differently,
    // so the message cannot be used to recognise this error.
    markStaleDeployError(event.payload);

    const data = { typeId: 'vitePreloadError' };
    reportStaleDeployFailure(new AppError('Failed to load part of the app.', 'dpuse-app.errors.handleReportPreloadError', data, { cause: event.payload }));
}

// Reports and shows any Vue error that no 'ErrorBoundary' caught, in the app-level failure dialog. 'main.ts' installs
// it as 'app.config.errorHandler'.
export function handleRaiseVueError(error: unknown, instance: ComponentPublicInstance | null, info: string): void {
    // Panels loaded on demand show and report their own load failures, so those are skipped here.
    if (isComponentLoaderErrorInfo(info)) return;

    // A thrown value that is not an Error is passed on as it is, so the report shows its contents.
    const data = { componentName: instance?.$.type.name ?? instance?.$.type.__name, info, typeId: 'unhandledVueRuntime' };
    raiseAppFailure(new AppError('Unhandled Vue error.', 'dpuse-app.errors.handleRaiseVueError', data, { cause: error }));
}

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

async function deliverReport(failure: AppFailure): Promise<void> {
    if (!failure.isReportable) return;

    if (failure.needsReload) {
        // Reported as delivered rather than left pending: the first failure of this deployment carried the same
        // evidence, so support has it, and telling the user otherwise would be inviting them to report it again.
        if (state.staleDeployWasReported) {
            failure.wasReported.value = true;
            return;
        }
        state.staleDeployWasReported = true;
    }

    // A failure whose cause was already reported is marked as reported, so the display does not suggest nobody was
    // told.
    const causeChain = collectCauseChain(failure.error);
    if (causeChain.some((error) => reportedErrors.has(error))) {
        failure.wasReported.value = true;
        return;
    }
    for (const error of causeChain) reportedErrors.add(error);

    failure.wasReported.value = await hasReportedAppError(failure.error);
}

// Outermost first, stopping on a cycle the way 'serialiseError' does. Walks the real error objects rather than the
// serialised copies, since identity is the whole point.
function collectCauseChain(error: unknown): Error[] {
    const chain: Error[] = [];
    const seen = new Set<unknown>();
    let current: unknown = error;
    while (current instanceof Error && !seen.has(current)) {
        seen.add(current);
        chain.push(current);
        current = current.cause;
    }
    return chain;
}

// Read from the chain rather than passed in, so it works wherever the name was recorded: the outermost error is built
// by a catch site that knows only that a navigation failed, while the name sits on the cause it wrapped.
function findComponentName(error: unknown): string | undefined {
    const name = serialiseError(error)
        .map((serialisedError) => serialisedError.data?.[COMPONENT_NAME_DATA_KEY])
        .find((value) => typeof value === 'string' && value.length > 0);
    return typeof name === 'string' ? name : undefined;
}

// The message of the error at the end of the cause chain, which is the one that says what actually went wrong.
function findDeepestMessage(error: AppError): string {
    return serialiseError(error).at(-1)?.message ?? error.message;
}
