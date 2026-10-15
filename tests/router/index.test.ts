// ── External Dependencies & Registrations
import { defineComponent } from 'vue';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';

// ── Local Framework
import { buildMemoryRouter } from '~/tests/support/router';
import { handleRaiseVueError } from '@/state/errors';
import { hasReportedAppError } from '@/observability/errorTracking';
import { liveAppVersion } from '@/state/appVersion';
import { settle } from '~/tests/support/settle';
import { createAppRouter, replaceRouteQuery } from '@/router';

vi.mock('@/observability/errorTracking', () => import('~/tests/support/errorTracking'));

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

const NEWER_APP_VERSION = '999.0.0';
const RELOADED_FOR_VERSION_KEY = 'dpuse-reloadedForVersion';

// ── Tests ────────────────────────────────────────────────────────────────────────────────────────────────────────────

describe('replaceRouteQuery', () => {
    it('keeps both changes made in the same tick', async () => {
        const router = await buildMemoryRouter('?keep=1');

        void replaceRouteQuery(router, { dlg: 'account' });
        void replaceRouteQuery(router, { studio: '1' });
        await flushPromises();

        expect(router.currentRoute.value.query).toStrictEqual({ dlg: 'account', keep: '1', studio: '1' });
    });

    it('keeps an earlier change when a later one is made before the first write finishes', async () => {
        const router = await buildMemoryRouter();

        const first = replaceRouteQuery(router, { dlg: 'account' });
        await Promise.resolve(); // The first write has started but not finished.
        const second = replaceRouteQuery(router, { lState: '1' });
        await Promise.all([first, second]);

        expect(router.currentRoute.value.query).toStrictEqual({ dlg: 'account', lState: '1' });
    });

    it('removes a parameter set to undefined', async () => {
        const router = await buildMemoryRouter('?dlg=account&keep=1');

        await replaceRouteQuery(router, { dlg: undefined });

        expect(router.currentRoute.value.query).toStrictEqual({ keep: '1' });
    });
});

describe('createAppRouter', () => {
    // The new-version guard either reloads, which cancels the navigation, or lets it continue. A guard added after it
    // stands in for the rest of the navigation, recording that it got through and stopping it before any screen has to
    // load. jsdom cannot perform the reload itself and prints "Not implemented: navigation" when one is attempted.
    describe('new app version guard', () => {
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

    describe('navigation failure', () => {
        it('reports a failed navigation once', async () => {
            vi.mocked(hasReportedAppError).mockClear();
            history.replaceState({}, '', '/?fault=route');
            const router = createAppRouter();
            mount(defineComponent({ template: '<RouterView />' }), { global: { plugins: [router], config: { errorHandler: handleRaiseVueError } } });
            // The navigation fails, which is the point; the router still reports it through 'onError'.
            try {
                await router.isReady();
            } catch {
                // Asserted through the reports below.
            }
            await settle();

            expect(vi.mocked(hasReportedAppError).mock.calls.map((call) => call[0].message)).toStrictEqual(['Navigation failed.']);
        });
    });
});
