// ── External Dependencies & Registrations
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// ── DPUse Framework
import { AppError } from '@dpuse/dpuse-shared';

// ── Local Framework
import { liveAppVersion } from '@/state/appVersion';
import {
    appFailures,
    clearAppFailures,
    handleRaisePromiseRejection,
    handleRaiseScriptError,
    handleRaiseVueError,
    handleReportPreloadError,
    isComponentLoaderErrorInfo,
    isStaleDeployError,
    markStaleDeployError,
    raiseAppFailure,
    raiseFailure,
    reportStaleDeployFailure,
    retryAppFailures
} from '@/state/errors';
import { hasReportedAppError, logError } from '@/observability/errorTracking';

vi.mock('@/observability/errorTracking', () => import('~/tests/support/errorTracking'));

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

const NEWER_APP_VERSION = '999.0.0';

// ── Tests ────────────────────────────────────────────────────────────────────────────────────────────────────────────

// Vue notifies the app handler about a lazy component's load failure as well as showing the component's own failure,
// in either of two wordings. The handler skips both, so the failure is reported once, by the component.
describe('isComponentLoaderErrorInfo', () => {
    it('recognises the info Vue sends for a lazy component load failure, in both its wordings', () => {
        expect(isComponentLoaderErrorInfo('async component loader')).toBe(true); // Development.
        expect(isComponentLoaderErrorInfo('https://vuejs.org/error-reference/#runtime-13')).toBe(true); // Production.
        expect(isComponentLoaderErrorInfo('render function')).toBe(false);
    });
});

// Recognising a stale deployment is Vite's 'vite:preloadError' saying so, and nothing read from the error itself: its
// wording is not something browsers promise, and the imports that event does not cover cannot go stale at all.
describe('isStaleDeployError', () => {
    it('recognises only what Vite has marked, whatever the message says', () => {
        const preloadError = new Error('Whatever this browser calls an unfetchable chunk.');
        expect(isStaleDeployError(preloadError)).toBe(false);

        markStaleDeployError(preloadError);
        expect(isStaleDeployError(preloadError)).toBe(true);
    });

    it('recognises it through the wrapper a catch site builds around it', () => {
        const preloadError = new Error('Another wording entirely.');
        markStaleDeployError(preloadError);

        expect(isStaleDeployError(new AppError('Failed to load the Studio component.', 'test', undefined, { cause: preloadError }))).toBe(true);
    });

    it('does not recognise an ordinary failure', () => {
        expect(isStaleDeployError(new Error('Failed to render network diagram.'))).toBe(false);
    });
});

describe('raiseFailure', () => {
    beforeEach(() => {
        clearAppFailures();
        vi.mocked(hasReportedAppError).mockClear();
    });

    it('reports the error and records that the report was delivered', async () => {
        const error = new AppError('Failed to render.', 'test');
        const failure = raiseFailure(error);

        expect(failure.error).toBe(error);
        expect(failure.wasReported.value).toBeUndefined(); // Still in flight, so the display says pending rather than failed.
        await vi.waitFor(() => {
            expect(failure.wasReported.value).toBe(true);
        });
        expect(hasReportedAppError).toHaveBeenCalledWith(error);
    });

    it('records a failed delivery rather than claiming the error was logged', async () => {
        vi.mocked(hasReportedAppError).mockResolvedValueOnce(false);
        const failure = raiseFailure(new AppError('Failed to render.', 'test'));

        await vi.waitFor(() => {
            expect(failure.wasReported.value).toBe(false);
        });
    });

    it('reports one failure once, however many places catch it and wrap it', async () => {
        // What a dead service does: it reports its own failure and rethrows, and each caller that catches it adds
        // context of its own. Support needs telling once; every region that lost something still shows the user why.
        const serviceError = new AppError('Failed to load the engine.', 'test');
        const first = raiseFailure(serviceError);
        const second = raiseFailure(new AppError('Failed to retrieve data views.', 'test', undefined, { cause: serviceError }));

        await vi.waitFor(() => {
            expect(first.wasReported.value).toBe(true);
        });
        expect(hasReportedAppError).toHaveBeenCalledExactlyOnceWith(serviceError);
        expect(second.wasReported.value).toBe(true); // Delivered by the first report, so the display does not say otherwise.
    });

    it('offers a reload for a chunk this deployment can no longer fetch', () => {
        const cause = new Error('An unfetchable chunk.');
        markStaleDeployError(cause);
        expect(raiseFailure(new AppError('Failed to load a panel.', 'test', undefined, { cause })).needsReload).toBe(true);
    });

    it('offers a retry for an ordinary failure, which is the one case where retrying can work', () => {
        expect(raiseFailure(new AppError('Failed to render.', 'test')).needsReload).toBe(false);
    });

    it('names the capability from the cause chain, so a wrapping catch site need not repeat it', () => {
        const cause = new AppError('Failed to load the panel.', 'test', { componentName: 'SetupLayout' });
        expect(raiseFailure(new AppError('Navigation failed.', 'test', undefined, { cause })).capability).toBe('SetupLayout');
    });

    it('prefers a capability the caller states over one read from the chain', () => {
        const cause = new AppError('Failed to load.', 'test', { componentName: 'SetupLayout' });
        const failure = raiseFailure(new AppError('Failed to load the engine.', 'test', undefined, { cause }), { capability: 'engine' });
        expect(failure.capability).toBe('engine');
    });
});

describe('raiseAppFailure', () => {
    beforeEach(() => {
        clearAppFailures();
        vi.mocked(hasReportedAppError).mockClear();
    });

    it('shows a failure that has no region of its own', () => {
        const failure = raiseAppFailure(new AppError('Unhandled Vue error.', 'test'));
        expect(appFailures.value).toStrictEqual([failure]);
    });

    it('shows one failure per capability, however many routes report the same loss', () => {
        raiseAppFailure(new AppError('Failed to load the engine.', 'test'), { capability: 'engine' });
        raiseAppFailure(new AppError('Failed to load engine v2.', 'test'), { capability: 'engine' });

        expect(appFailures.value).toHaveLength(1);
    });

    it('keeps failures of different capabilities apart, since each is a separate loss', () => {
        raiseAppFailure(new AppError('Failed to load the engine.', 'test'), { capability: 'engine' });
        raiseAppFailure(new AppError('Failed to load the authentication service.', 'test'), { capability: 'authentication' });

        expect(appFailures.value).toHaveLength(2);
    });

    it('falls back to the message when nothing names a capability, so unrelated failures still both show', () => {
        raiseAppFailure(new AppError('Unhandled Vue error.', 'test'));
        raiseAppFailure(new AppError('Unhandled Vue error.', 'test'));
        raiseAppFailure(new AppError('Navigation failed.', 'test'));

        expect(appFailures.value).toHaveLength(2);
    });

    it('matches on the deepest error, so different errors behind the same generic message all show', () => {
        raiseAppFailure(new AppError('Unhandled error.', 'test', undefined, { cause: new Error('First failure.') }));
        raiseAppFailure(new AppError('Unhandled error.', 'test', undefined, { cause: new Error('Second failure.') }));

        expect(appFailures.value).toHaveLength(2);
    });

    it('shows different errors in the same component, but not a repeat of one', () => {
        const data = { componentName: 'ChatPanel' };
        raiseAppFailure(new AppError('Unhandled Vue error.', 'test', data, { cause: new Error('First failure.') }));
        raiseAppFailure(new AppError('Unhandled Vue error.', 'test', data, { cause: new Error('Second failure.') }));
        raiseAppFailure(new AppError('Unhandled Vue error.', 'test', data, { cause: new Error('Second failure.') }));

        expect(appFailures.value).toHaveLength(2);
    });

    it('logs a repeat but neither shows nor reports it again', () => {
        vi.mocked(logError).mockClear();
        raiseAppFailure(new AppError('Unhandled error.', 'test', undefined, { cause: new Error('Same failure.') }));
        raiseAppFailure(new AppError('Unhandled error.', 'test', undefined, { cause: new Error('Same failure.') }));

        expect(appFailures.value).toHaveLength(1);
        expect(hasReportedAppError).toHaveBeenCalledOnce();
        expect(logError).toHaveBeenCalledOnce();
    });

    it('carries the abandoned destination, so a reload finishes the journey rather than fetching the page being left', () => {
        const failure = raiseAppFailure(new AppError('Navigation failed.', 'test'), { reloadPath: '/studio/config' });
        expect(failure.reloadPath).toBe('/studio/config');
    });

    it('runs what a retryable failure offered, and clears only that one so a second attempt can raise again', () => {
        const retry = vi.fn();
        raiseAppFailure(new AppError('Failed to load 2 of 5 presenters.', 'test'), { capability: 'presenters', retry });
        raiseAppFailure(new AppError('Failed to load the engine.', 'test'), { capability: 'engine' });

        retryAppFailures();

        expect(retry).toHaveBeenCalledOnce();
        // The engine had nothing to run again, so the modal stays open for it.
        expect(appFailures.value.map((failure) => failure.capability)).toStrictEqual(['engine']);
    });

    it('removes every failure the user has acknowledged, which is what one card holding them all can offer', () => {
        raiseAppFailure(new AppError('Unhandled Vue error.', 'test'));
        raiseAppFailure(new AppError('Failed to load the engine.', 'test'), { capability: 'engine' });
        clearAppFailures();

        expect(appFailures.value).toStrictEqual([]);
    });
});

describe('reportStaleDeployFailure', () => {
    it('reports once, however many chunks one bad deployment goes on to fail', () => {
        // Order-independent: the module-level guard may already be set by an earlier case, so this compares the
        // second call against the first rather than assuming a clean slate.
        reportStaleDeployFailure(new AppError('Failed to load part of the app.', 'test'));
        vi.mocked(hasReportedAppError).mockClear();
        reportStaleDeployFailure(new AppError('Failed to load another part of the app.', 'test'));

        expect(hasReportedAppError).not.toHaveBeenCalled();
    });

    it('shows nothing: a preload nobody asked for has cost the user no capability yet', () => {
        clearAppFailures();
        reportStaleDeployFailure(new AppError('Failed to load part of the app.', 'test'));

        expect(appFailures.value).toStrictEqual([]);
    });
});

// Once a newer version is known to be deployed, a missing chunk only means the user is on an old version, which
// nobody can act on. Without one, the running version is current and a missing chunk is a fault worth reporting.
describe('a missing chunk once a newer version is deployed', () => {
    beforeEach(() => {
        vi.mocked(hasReportedAppError).mockClear();
        liveAppVersion.value = NEWER_APP_VERSION;
    });

    afterEach(() => {
        liveAppVersion.value = undefined;
    });

    it('still offers a reload, but is not reported and says nothing about reporting', async () => {
        const cause = new Error('An unfetchable chunk.');
        markStaleDeployError(cause);
        const failure = raiseFailure(new AppError('Failed to load a panel.', 'test', undefined, { cause }));
        await Promise.resolve();

        expect(failure.needsReload).toBe(true);
        expect(failure.isReportable).toBe(false);
        expect(failure.wasReported.value).toBeUndefined();
        expect(hasReportedAppError).not.toHaveBeenCalled();
    });

    it('still reports an ordinary failure', async () => {
        const failure = raiseFailure(new AppError('Failed to render.', 'test'));

        expect(failure.isReportable).toBe(true);
        await vi.waitFor(() => {
            expect(hasReportedAppError).toHaveBeenCalledOnce();
        });
    });

    it('does not report a failed preload either', async () => {
        // Fresh modules, because the once-per-session guard is likely set by an earlier case and would hide the result.
        vi.resetModules();
        const errorTracking = await import('@/observability/errorTracking');
        const appVersion = await import('@/state/appVersion');
        const errors = await import('@/state/errors');

        appVersion.liveAppVersion.value = NEWER_APP_VERSION;
        errors.reportStaleDeployFailure(new AppError('Failed to load part of the app.', 'test'));
        expect(errorTracking.hasReportedAppError).not.toHaveBeenCalled();

        appVersion.liveAppVersion.value = undefined;
        errors.reportStaleDeployFailure(new AppError('Failed to load part of the app.', 'test'));
        expect(errorTracking.hasReportedAppError).toHaveBeenCalledOnce();
    });
});

// The page-wide listeners 'main.ts' installs, called here with events built the way the browser would build them.
describe('handleRaiseScriptError', () => {
    beforeEach(() => {
        clearAppFailures();
    });

    it('ignores an error with no file and no error object, which came from outside the app', () => {
        vi.spyOn(console, 'warn').mockImplementationOnce(() => {
            // Expected, so kept out of the test output.
        });
        const event = new ErrorEvent('error', { cancelable: true, message: 'Script error.' });
        handleRaiseScriptError(event);

        expect(appFailures.value).toStrictEqual([]);
        expect(event.defaultPrevented).toBe(false);
    });

    it('shows an app error with where it happened, and stops the browser logging it again', () => {
        const error = new Error('Failed in a timer.');
        const event = new ErrorEvent('error', { cancelable: true, colno: 7, error, filename: 'https://localhost/app.js', lineno: 3, message: error.message });
        handleRaiseScriptError(event);

        expect(appFailures.value[0]?.error.data).toStrictEqual({ colno: 7, filename: 'https://localhost/app.js', lineno: 3, originalMessage: 'Failed in a timer.', typeId: 'unhandledRuntime' });
        expect(appFailures.value[0]?.error.cause).toBe(error);
        expect(event.defaultPrevented).toBe(true);
    });

    it('builds an Error from the message when a plain value with no error object was thrown', () => {
        handleRaiseScriptError(new ErrorEvent('error', { filename: 'https://localhost/app.js', message: 'Uncaught a string.' }));

        expect(appFailures.value[0]?.error.cause).toStrictEqual(new Error('Uncaught a string.'));
    });
});

describe('handleRaisePromiseRejection', () => {
    beforeEach(() => {
        clearAppFailures();
    });

    it('shows the reason as it is, and stops the browser logging it again', () => {
        const event = Object.assign(new Event('unhandledrejection', { cancelable: true }), { promise: Promise.resolve(), reason: 'A plain string.' });
        handleRaisePromiseRejection(event);

        expect(appFailures.value[0]?.error.cause).toBe('A plain string.');
        expect(appFailures.value[0]?.error.data).toStrictEqual({ typeId: 'unhandledPromiseRejection' });
        expect(event.defaultPrevented).toBe(true);
    });

    it('builds an Error when the promise failed with no reason', () => {
        handleRaisePromiseRejection(Object.assign(new Event('unhandledrejection'), { promise: Promise.resolve(), reason: undefined }));

        expect(appFailures.value[0]?.error.cause).toStrictEqual(new Error('Unknown promise rejection error.'));
    });
});

describe('handleReportPreloadError', () => {
    it('marks the chunk as stale and shows nothing, leaving the error for the screen that needs the chunk', () => {
        clearAppFailures();
        const payload = new TypeError('Failed to fetch dynamically imported module.');
        const event = Object.assign(new Event('vite:preloadError', { cancelable: true }), { payload });
        handleReportPreloadError(event);

        expect(isStaleDeployError(payload)).toBe(true);
        expect(appFailures.value).toStrictEqual([]);
        expect(event.defaultPrevented).toBe(false);
    });

    it('reports the failure', async () => {
        // Fresh modules, because the once-per-session guard is likely set by an earlier case and would hide the result.
        vi.resetModules();
        const errorTracking = await import('@/observability/errorTracking');
        const errors = await import('@/state/errors');

        errors.handleReportPreloadError(Object.assign(new Event('vite:preloadError'), { payload: new TypeError('Failed to fetch.') }));

        expect(errorTracking.hasReportedAppError).toHaveBeenCalledOnce();
    });
});

describe('handleRaiseVueError', () => {
    beforeEach(() => {
        clearAppFailures();
    });

    it('skips a lazy component load failure, which the component shows and reports itself', () => {
        handleRaiseVueError(new Error('Failed to load.'), null, 'async component loader');

        expect(appFailures.value).toStrictEqual([]);
    });

    it('shows any other Vue error', () => {
        const error = new Error('Failed to render.');
        handleRaiseVueError(error, null, 'render function');

        expect(appFailures.value[0]?.error.data).toStrictEqual({ componentName: undefined, info: 'render function', typeId: 'unhandledVueRuntime' });
        expect(appFailures.value[0]?.error.cause).toBe(error);
    });
});
