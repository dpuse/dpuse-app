// ── External Dependencies & Registrations
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// ── Local Framework
import { version } from '~/package.json';
import { canReloadForNewAppVersion, liveAppVersion, newAppVersionIsAvailable } from '@/state/appVersion';

vi.mock('@/observability/errorTracking', () => import('~/tests/support/errorTracking'));

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

const NEWER_APP_VERSION = '999.0.0';
const RELOADED_FOR_VERSION_KEY = 'dpuse-reloadedForVersion';

// ── Tests ────────────────────────────────────────────────────────────────────────────────────────────────────────────

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
