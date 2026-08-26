import { AppError } from '@dpuse/dpuse-shared/errors';
import { reportAppError } from '@/observability/errorTracking';
import { serviceLoadFailed } from '@/state/session';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { classifyError, clearFatalError, fatalError, isStaleDeployError, raiseAppLevelError, raiseStaleDeployFailure } from '@/state/errors';

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

describe('classifyError', () => {
    it('returns the caller fallback when the error declares nothing', () => {
        expect(classifyError(new Error('Failed to render.'), 'recoverable')).toBe('recoverable');
        expect(classifyError(new Error('Failed to render.'), 'fatal')).toBe('fatal');
    });

    it('honours a severity declared on the error over the fallback', () => {
        const error = new AppError('Failed to render.', 'test', { severity: 'recoverable' });
        expect(classifyError(error, 'fatal')).toBe('recoverable');
    });

    it('ignores an unrecognised declared severity', () => {
        const error = new AppError('Failed to render.', 'test', { severity: 'catastrophic' });
        expect(classifyError(error, 'fatal')).toBe('fatal');
    });

    it('finds a severity declared by a cause, so wrapping an error at a catch site does not hide it', () => {
        const cause = new AppError('Failed to render.', 'test', { severity: 'recoverable' });
        const error = new AppError('Unhandled Vue error.', 'test', undefined, { cause });
        expect(classifyError(error, 'fatal')).toBe('recoverable');
    });

    it('lets the outermost declaration override one made by its cause', () => {
        const cause = new AppError('Failed to render.', 'test', { severity: 'recoverable' });
        const error = new AppError('Unhandled Vue error.', 'test', { severity: 'fatal' }, { cause });
        expect(classifyError(error, 'recoverable')).toBe('fatal');
    });

    it('treats a stale deployment as such whatever the error declares', () => {
        const error = new AppError('Failed to load the Studio component.', 'test', { severity: 'recoverable' }, { cause: new Error(STALE_DEPLOY_MESSAGES[0]) });
        expect(classifyError(error, 'fatal')).toBe('staleDeploy');
    });
});

describe('raiseAppLevelError', () => {
    beforeEach(() => {
        clearFatalError();
        serviceLoadFailed.value = false;
        vi.mocked(reportAppError).mockClear();
    });

    it('takes over the screen when nothing local can display the error', () => {
        const cause = new Error('Failed to render.');
        const error = new AppError('Unhandled Vue error.', 'test', undefined, { cause });
        raiseAppLevelError(error);

        expect(fatalError.value).toBe(error);
        expect(serviceLoadFailed.value).toBe(false);
    });

    it('hands a stale deployment to the refresh banner rather than the fatal surface', () => {
        const cause = new Error(STALE_DEPLOY_MESSAGES[0]);
        const error = new AppError('Navigation failed.', 'test', undefined, { cause });
        raiseAppLevelError(error);

        expect(serviceLoadFailed.value).toBe(true);
        expect(fatalError.value).toBeUndefined();
    });

    it('reports a stale deployment once, however many routes report the same bad deploy', () => {
        // Order-independent: the module-level guard may already be set by an earlier case, so this compares the
        // second call against the first rather than assuming a clean slate.
        raiseStaleDeployFailure(new AppError('Failed to load part of the app.', 'test'));
        vi.mocked(reportAppError).mockClear();
        raiseStaleDeployFailure(new AppError('Failed to load a panel.', 'test'));

        expect(reportAppError).not.toHaveBeenCalled();
        expect(serviceLoadFailed.value).toBe(true); // Still raised, so the banner shows for every failure.
    });

    it('only reports an error the owning region will display itself', () => {
        const cause = new AppError('Failed to render.', 'test', { severity: 'recoverable' });
        raiseAppLevelError(new AppError('Unhandled Vue error.', 'test', undefined, { cause }));

        expect(fatalError.value).toBeUndefined();
        expect(serviceLoadFailed.value).toBe(false);
        expect(reportAppError).toHaveBeenCalledOnce();
    });
});
