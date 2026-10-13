// ── DPUse Framework
import { AppError } from '@dpuse/dpuse-shared';

// ── Local Framework
import { markStaleDeployError } from '@/state/errors';

// ── Types ────────────────────────────────────────────────────────────────────────────────────────────────────────────

// Every failure the app can produce, named so one can be asked for from the URL. Grouped by where it is caught, since
// that is what decides the surface: a region shows its own, everything else goes to the app-level failure dialog.
//   Region        'panel' | 'panel-stale'                     'LoadFailureNotice' → 'ErrorNotice' in the region.
//                 'config-socket'                             Each list that needs the configuration shows it.
//   App dialog    'route' | 'route-stale' | 'vue'             Nothing owns these, so 'App.vue' shows them.
//                 'account' | 'auth' | 'config' | 'engine'
//   Neither       'preload'                                   Reported only — proves nothing appears on screen.
//   Pre-mount     'bootstrap' | 'browser'                     The plain DOM message, before Vue exists.
//   Modifier      'report-failure'                            Makes delivery fail, so every body says so.
//   Not a failure 'new-version' | 'module-update'             Fakes a new app or module version, to show the notice.
//
// The four that name a component — the panel and route pairs — accept a target: '?fault=panel:ChatPanel' fails that
// one and lets everything else load. Without a target they fail every panel or route at once, which cannot reach a
// panel nested inside another: the outer one fails first and the inner one never loads.
export type FaultId =
    | 'account'
    | 'auth'
    | 'bootstrap'
    | 'browser'
    | 'config'
    | 'config-socket'
    | 'engine'
    | 'module-update'
    | 'new-version'
    | 'panel'
    | 'panel-stale'
    | 'preload'
    | 'report-failure'
    | 'route'
    | 'route-stale'
    | 'vue';

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

// Worded like Chromium's message for a chunk that can no longer be fetched, for whoever reads the console. The app
// treats the error as a stale deployment only because 'throwOnStaleFault' marks it.
const STALE_DEPLOY_MESSAGE = 'Failed to fetch dynamically imported module: simulated stale deployment.';

// ── Actions ──────────────────────────────────────────────────────────────────────────────────────────────────────────

// True when '?fault=<id>' names this fault. Several may be listed, comma separated, so a modifier such as
// 'report-failure' can be combined with the failure it modifies.
//
// 'target' is the component the caller is loading, supplied wherever the same fault applies to many call sites. An
// entry that names no target matches all of them; one that does matches only its own.
//
// Every call site guards the call itself with 'if (import.meta.env.DEV)' rather than relying on a check in here. A
// check in here is read at run time, so the bundler keeps the call and the id string it is passed; a check around it
// is replaced with 'false' at build time and the whole statement is dropped, which is what keeps this out of what
// users download.
export function hasFault(id: FaultId, target?: string): boolean {
    const requested = new URLSearchParams(location.search).get('fault');
    if (requested == null) return false;

    return requested.split(',').some((entry) => {
        // Split by hand rather than destructuring: an entry with no ':' has to mean 'every call site', which a
        // destructured second element cannot express — the types say it is always a string.
        const separatorIndex = entry.indexOf(':');
        return separatorIndex === -1 ? entry === id : entry.slice(0, separatorIndex) === id && entry.slice(separatorIndex + 1) === target;
    });
}

// Throws when the named fault is requested, for a call site that has no failure of its own to borrow. Drop it inside
// any 'try', or at the top of a component's setup to make its 'ErrorBoundary' catch a render failure — behind an
// 'import.meta.env.DEV' guard, so the build drops the call.
export function throwOnFault(id: FaultId, target?: string, message = `Simulated '${id}' failure.`): void {
    if (!hasFault(id, target)) return;
    throw new AppError(message, 'dpuse-app.faultInjection.throwOnFault', { faultId: id, target, typeId: 'simulated' });
}

// Throws when the named fault is requested, as a chunk the running deployment can no longer fetch. The error is marked
// as a stale deployment, because the app recognises one only by that mark, never by the browser's message. The
// message is worded like the real one for whoever reads the console.
export function throwOnStaleFault(id: FaultId, target?: string): void {
    if (!hasFault(id, target)) return;
    const error = new TypeError(STALE_DEPLOY_MESSAGE);
    markStaleDeployError(error);
    throw error;
}
