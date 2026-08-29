import { AppError } from '@dpuse/dpuse-shared/errors';
import { reportAppError } from '@/observability/errorTracking';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { appFailures, clearAppFailures, dismissAppFailure, isStaleDeployError, raiseAppFailure, raiseFailure, reportStaleDeployFailure } from '@/state/errors';

vi.mock('@/observability/errorTracking', () => ({ reportAppError: vi.fn(() => Promise.resolve(true)) }));

// The wording of a stale-deploy failure is the only thing identifying it, and it differs by engine.
const STALE_DEPLOY_MESSAGES = [
    'Failed to fetch dynamically imported module: https://app.dpuse.com/assets/Studio-a1b2c3.js',
    'error loading dynamically imported module',
    'Importing a module script failed.',
    'Unable to preload CSS for /assets/Studio-a1b2c3.css',
    "Failed to load module script: Expected a JavaScript module script but the server responded with a MIME type of 'text/html'."
];

describe('isStaleDeployError', () => {
    it.each(STALE_DEPLOY_MESSAGES)('recognises %s', (message) => {
        expect(isStaleDeployError(new Error(message))).toBe(true);
    });

    it('recognises a stale-deploy failure wrapped as the cause of an app error', () => {
        const cause = new Error(STALE_DEPLOY_MESSAGES[0]);
        expect(isStaleDeployError(new AppError('Failed to load the Studio component.', 'test', undefined, { cause }))).toBe(true);
    });

    it('does not recognise an ordinary failure', () => {
        expect(isStaleDeployError(new Error('Failed to render network diagram.'))).toBe(false);
    });
});

describe('raiseFailure', () => {
    beforeEach(() => {
        clearAppFailures();
        vi.mocked(reportAppError).mockClear();
    });

    it('reports the error and records that the report was delivered', async () => {
        const error = new AppError('Failed to render.', 'test');
        const failure = raiseFailure(error);

        expect(failure.error).toBe(error);
        expect(failure.wasReported.value).toBeUndefined(); // Still in flight, so the display says pending rather than failed.
        await vi.waitFor(() => {
            expect(failure.wasReported.value).toBe(true);
        });
        expect(reportAppError).toHaveBeenCalledWith(error);
    });

    it('records a failed delivery rather than claiming the error was logged', async () => {
        vi.mocked(reportAppError).mockResolvedValueOnce(false);
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
        expect(reportAppError).toHaveBeenCalledExactlyOnceWith(serviceError);
        expect(second.wasReported.value).toBe(true); // Delivered by the first report, so the display does not say otherwise.
    });

    it('offers a reload for a chunk this deployment can no longer fetch', () => {
        const cause = new Error(STALE_DEPLOY_MESSAGES[0]);
        expect(raiseFailure(new AppError('Failed to load a panel.', 'test', undefined, { cause })).needsReload).toBe(true);
    });

    it('offers a retry for an ordinary failure, which is the one case where retrying can work', () => {
        expect(raiseFailure(new AppError('Failed to render.', 'test')).needsReload).toBe(false);
    });

    it('names the capability from the cause chain, so a wrapping catch site need not repeat it', () => {
        const cause = new AppError('Failed to load the panel.', 'test', { componentName: 'ConfigLayout' });
        expect(raiseFailure(new AppError('Navigation failed.', 'test', undefined, { cause })).capability).toBe('ConfigLayout');
    });

    it('prefers a capability the caller states over one read from the chain', () => {
        const cause = new AppError('Failed to load.', 'test', { componentName: 'ConfigLayout' });
        const failure = raiseFailure(new AppError('Failed to load the engine.', 'test', undefined, { cause }), { capability: 'engine' });
        expect(failure.capability).toBe('engine');
    });
});

describe('raiseAppFailure', () => {
    beforeEach(() => {
        clearAppFailures();
        vi.mocked(reportAppError).mockClear();
    });

    it('shows a failure that has no region of its own', () => {
        const failure = raiseAppFailure(new AppError('Unhandled Vue error.', 'test'));
        expect(appFailures.value).toStrictEqual([failure]);
    });

    it('shows one strip per capability, however many routes report the same loss', () => {
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

    it('carries the abandoned destination, so a refresh finishes the journey rather than reloading the page being left', () => {
        const failure = raiseAppFailure(new AppError('Navigation failed.', 'test'), { retryPath: '/studio/config' });
        expect(failure.retryPath).toBe('/studio/config');
    });

    it('removes a failure the user has acknowledged', () => {
        const failure = raiseAppFailure(new AppError('Unhandled Vue error.', 'test'));
        dismissAppFailure(failure);

        expect(appFailures.value).toStrictEqual([]);
    });
});

describe('reportStaleDeployFailure', () => {
    it('reports once, however many chunks one bad deployment goes on to fail', () => {
        // Order-independent: the module-level guard may already be set by an earlier case, so this compares the
        // second call against the first rather than assuming a clean slate.
        reportStaleDeployFailure(new AppError('Failed to load part of the app.', 'test'));
        vi.mocked(reportAppError).mockClear();
        reportStaleDeployFailure(new AppError('Failed to load another part of the app.', 'test'));

        expect(reportAppError).not.toHaveBeenCalled();
    });

    it('shows nothing: a preload nobody asked for has cost the user no capability yet', () => {
        clearAppFailures();
        reportStaleDeployFailure(new AppError('Failed to load part of the app.', 'test'));

        expect(appFailures.value).toStrictEqual([]);
    });
});
