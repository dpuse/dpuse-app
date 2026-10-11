import { createAppRouter } from '@/router';
import { version } from '~/package.json';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { canReloadForNewAppVersion, liveAppVersion, newAppVersionIsAvailable } from '@/state/appVersion';

vi.mock('@/observability/errorTracking', () => ({ hasReportedAppError: vi.fn(() => Promise.resolve(true)) }));

const NEWER_APP_VERSION = '999.0.0';
const RELOADED_FOR_VERSION_KEY = 'dpuse-reloadedForVersion';

describe('newAppVersionIsAvailable', () => {
    afterEach(() => {
        liveAppVersion.value = undefined;
    });

    it('is false until the deployed version is known', () => {
        expect(newAppVersionIsAvailable.value).toBe(false);
    });

    it('is true only for a newer version, so a development build ahead of the deployed one is not stale', () => {
        liveAppVersion.value = version;
        expect(newAppVersionIsAvailable.value).toBe(false);

        liveAppVersion.value = '0.0.1';
        expect(newAppVersionIsAvailable.value).toBe(false);

        liveAppVersion.value = NEWER_APP_VERSION;
        expect(newAppVersionIsAvailable.value).toBe(true);
    });
});

describe('canReloadForNewAppVersion', () => {
    beforeEach(() => {
        sessionStorage.clear();
        liveAppVersion.value = NEWER_APP_VERSION;
    });

    afterEach(() => {
        liveAppVersion.value = undefined;
    });

    it('allows one reload per version, so a reload that still serves the old page cannot loop', () => {
        expect(canReloadForNewAppVersion()).toBe(true);

        sessionStorage.setItem(RELOADED_FOR_VERSION_KEY, NEWER_APP_VERSION);
        expect(canReloadForNewAppVersion()).toBe(false);
    });

    it('allows nothing while the running version is current', () => {
        liveAppVersion.value = version;
        expect(canReloadForNewAppVersion()).toBe(false);
    });
});

// The guard either reloads, which cancels the navigation, or lets it continue. A guard added after it stands in for the
// rest of the navigation, recording that it got through and stopping it before any screen has to load. jsdom cannot
// perform the reload itself and prints "Not implemented: navigation" when one is attempted.
describe('router guard', () => {
    const continued = vi.fn(() => false);

    beforeEach(() => {
        sessionStorage.clear();
        continued.mockClear();
        history.replaceState({}, '', '/');
    });

    afterEach(() => {
        liveAppVersion.value = undefined;
    });

    async function navigate(path: string): Promise<void> {
        const router = createAppRouter();
        router.beforeEach(continued);
        await router.push(path);
    }

    it('reloads into the new version on a move to another screen', async () => {
        liveAppVersion.value = NEWER_APP_VERSION;
        await navigate('/setup');

        expect(continued).not.toHaveBeenCalled();
        expect(sessionStorage.getItem(RELOADED_FOR_VERSION_KEY)).toBe(NEWER_APP_VERSION);
    });

    it('leaves a change to the query alone, such as opening a pane', async () => {
        liveAppVersion.value = NEWER_APP_VERSION;
        await navigate('/?assistant=1');

        expect(continued).toHaveBeenCalledOnce();
    });

    it('does not reload a second time for the same version', async () => {
        liveAppVersion.value = NEWER_APP_VERSION;
        sessionStorage.setItem(RELOADED_FOR_VERSION_KEY, NEWER_APP_VERSION);
        await navigate('/setup');

        expect(continued).toHaveBeenCalledOnce();
    });

    it('does nothing while the running version is current', async () => {
        await navigate('/setup');

        expect(continued).toHaveBeenCalledOnce();
    });
});
