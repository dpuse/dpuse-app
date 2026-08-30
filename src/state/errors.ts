// ── External Dependencies & Registrations
import { type Ref, ref, shallowRef } from 'vue';

// ── DPUse Framework
import { type AppError, serialiseError } from '@dpuse/dpuse-shared/errors';

// ── Local Framework
import { reportAppError } from '@/observability/errorTracking';

// ── Types ────────────────────────────────────────────────────────────────────────────────────────────────────────────

// One failure, held for as long as it is on screen. Every catch site in the app produces one of these and nothing else:
// there is no severity and no second surface, because once the app is running no failure is worth locking it for. The
// only thing left for a failure to decide is where it renders, which the catch site already knows, and which action to
// offer, which 'needsReload' answers.
export interface AppFailure {
    // Identifies what the user lost, for de-duplication only — the text on screen comes from the error itself. Set by
    // the catch site where it knows, otherwise read from the cause chain. Undefined when nothing identifiable was lost.
    capability: string | undefined;
    error: AppError;
    // A chunk the running deployment can no longer fetch. Nothing but a fresh document will produce a working copy of
    // it, which is why the display says so in words and why only the first of these is reported: one stale deployment
    // fails every chunk the session goes on to need.
    needsReload: boolean;
    // Where the user was heading when the failure abandoned the navigation. A route that cannot fetch its chunk
    // leaves the URL untouched, so without this a reload would return them to the screen they were leaving.
    reloadPath: string | undefined;
    // What to run if the user asks to try again, for the failures shown at app level — where the display has no idea
    // what was being attempted. Undefined where nothing can be retried, which is most of them: a service loaded once
    // at startup has no second attempt to offer, and a fresh document is the only recovery.
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
// 'PanelLoadFailure' for everything else. Lets a failure name what went missing without being told twice.
const COMPONENT_NAME_DATA_KEY = 'componentName';

// What Vue passes as 'info' for error code 13, 'async component loader'. It is worded in development and reduced to a
// documentation link in production, so both forms are matched. Revisit if Vue changes either; a miss costs a duplicate
// report rather than a lost one.
const COMPONENT_LOADER_ERROR_INFOS = new Set(['async component loader', 'https://vuejs.org/error-reference/#runtime-13']);

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

// Failures with no region of their own: an uncaught Vue error, a navigation that never reached a view, a service the
// app loads for itself. Rendered by 'App.vue' as a strip, which is a placement and not a takeover — the rest of the
// app stays live underneath, because none of these is worth denying the user the screen they already have.
export const appFailures = shallowRef<AppFailure[]>([]);

// One stale deployment fails every chunk the session goes on to need, so the first report stands for all of them and
// the rest would only bury it. Never reset: a deployment does not become current again within a session.
const state = { staleDeployWasReported: false };

// Errors Vite itself has told us are a chunk this deployment can no longer fetch. Its 'vite:preloadError' event
// carries the very error object that then propagates to whoever awaited the import, so marking it here and reading it
// back through the cause chain recognises the failure without inspecting anything about it.
//
// The only signal there is. Reading the browser's wording was tried and dropped: it was a guess against text nobody
// promises, and in a production build it could only ever reach the imports carrying '@vite-ignore' — the engine and
// the presenters — which cannot go stale, since their version is read from configuration at run time.
const staleDeployErrors = new WeakSet<object>();

// Every error already delivered, and every error in its cause chain. A single failure is routinely raised more than
// once — a service reports its own failure and rethrows, and each caller that catches it wraps it with context of its
// own — so without this the same root cause arrives in Axiom several times over, and the first, most specific report
// is the one buried. Weakly held, so nothing here keeps an error alive.
//
// Only the report is suppressed. Each failure still displays wherever it was raised: two regions that both lost
// something to one dead service both have something worth saying to the user, even though support needs telling once.
const reportedErrors = new WeakSet<object>();

// ── Actions ──────────────────────────────────────────────────────────────────────────────────────────────────────────

// Runs whatever the retryable app-level failures offered, and removes them first: a second attempt that fails again
// has to be able to raise, and de-duplication would suppress it while the first is still listed. Failures with nothing
// to retry are left where they are — the modal stays open for them.
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

// True for a failure that a lazy component's own 'errorComponent' is already showing. Vue notifies every ancestor
// 'errorCaptured' hook and the app handler about these *in addition to* rendering that component, so anything that
// catches errors has to stand back or the one failure is reported twice and displayed twice — once precisely, in the
// space the component would have occupied, and once as a generic message over a region that is otherwise fine.
//
// Assumes every lazy component in the app supplies an 'errorComponent', which 'defineAsyncPanel' guarantees. One that
// did not would go unreported; the router does not use 'defineAsyncComponent', so its failures are unaffected.
export function isComponentLoaderErrorInfo(info: string): boolean {
    return COMPONENT_LOADER_ERROR_INFOS.has(info);
}

export function isStaleDeployError(error: unknown): boolean {
    return collectCauseChain(error).some((causeError) => staleDeployErrors.has(causeError));
}

// Records what 'vite:preloadError' handed us. The same object reaches the catch site, so a failure that wraps it as a
// cause is recognised without reading a single message.
export function markStaleDeployError(error: unknown): void {
    if (error instanceof Error) staleDeployErrors.add(error);
}

// Adds a failure to the app-level strip. De-duplicated because the same loss reaches here by several routes at once —
// Vite's 'vite:preloadError' and the rejected import behind it are one chunk failing — and repeating it tells the user
// nothing they are not already looking at.
//
// The check runs before the failure is raised, so a repeat is not reported either. The alternative was reporting a
// second engine failure that nothing on screen would ever mention, which is a report nobody can act on: whoever reads
// it cannot tell what the user was shown.
export function raiseAppFailure(error: AppError, options: AppFailureOptions = {}): AppFailure {
    const key = options.capability ?? findComponentName(error) ?? error.message;
    const shownFailure = appFailures.value.find((candidate) => (candidate.capability ?? candidate.error.message) === key);
    if (shownFailure) return shownFailure; // The one already on screen, so a caller holding the result still has one.

    const failure = raiseFailure(error, options);
    appFailures.value = [...appFailures.value, failure];
    return failure;
}

// Builds the failure and starts its report. Returns synchronously so a component can render it immediately; the
// delivery result lands on 'wasReported' when it settles.
export function raiseFailure(error: AppError, options: AppFailureOptions = {}): AppFailure {
    const failure: AppFailure = {
        capability: options.capability ?? findComponentName(error),
        error,
        needsReload: isStaleDeployError(error),
        reloadPath: options.reloadPath,
        retry: options.retry,
        wasReported: ref<boolean | undefined>()
    };
    void deliverReport(failure);
    return failure;
}

// Reported but never displayed. Vite preloads chunks for screens the user may never open, so a preload that fails has
// lost the user nothing yet — there is no capability to name and no action to offer. It surfaces if and when something
// actually needs that chunk, through the region that asked for it.
export function reportStaleDeployFailure(error: AppError): void {
    if (state.staleDeployWasReported) return;
    state.staleDeployWasReported = true;
    void reportAppError(error);
}

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

async function deliverReport(failure: AppFailure): Promise<void> {
    if (failure.needsReload) {
        // Reported as delivered rather than left pending: the first failure of this deployment carried the same
        // evidence, so support has it, and telling the user otherwise would be inviting them to report it again.
        if (state.staleDeployWasReported) {
            failure.wasReported.value = true;
            return;
        }
        state.staleDeployWasReported = true;
    }

    // Same reasoning for a failure whose cause has already been delivered: support has the evidence, so the display
    // says so rather than leaving the user thinking nobody has been told.
    const causeChain = collectCauseChain(failure.error);
    if (causeChain.some((error) => reportedErrors.has(error))) {
        failure.wasReported.value = true;
        return;
    }
    for (const error of causeChain) reportedErrors.add(error);

    failure.wasReported.value = await reportAppError(failure.error);
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

