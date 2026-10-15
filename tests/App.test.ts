// ── External Dependencies & Registrations
import type { Router } from 'vue-router';
import { VueQueryPlugin } from '@tanstack/vue-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { enableAutoUnmount, flushPromises, mount, type VueWrapper } from '@vue/test-utils';
import { type Ref, ref } from 'vue';

// ── Local Framework
import App from '@/App.vue';
import { createAppRouter } from '@/router';
import { queryClient } from '@/services/queryClient';
import { resetAppPanes } from '@/state/appPanes';
import { settle } from '~/tests/support/settle';
import { viewportIsWide } from '@/state/device';
import { clearAppFailures, handleRaiseVueError } from '@/state/errors';

// Unmounts after each test, so a test that fails still leaves an empty page for the next.
enableAutoUnmount(afterEach);

// 'App' starts the Hanko session check on mount, which calls the real sign-in service. These tests are about the app
// frame and routing, so the check is left out rather than failing against the network and logging an error.
vi.mock('@/observability/errorTracking', () => import('~/tests/support/errorTracking'));

// Every media query reads false in tests, so the viewport width is a ref each test can set.
vi.mock('@/state/device', async (importOriginal) => ({
    // eslint-disable-next-line @typescript-eslint/consistent-type-imports -- Vitest's documented pattern for typing 'importOriginal'.
    ...(await importOriginal<typeof import('@/state/device')>()),
    viewportIsWide: ref(false)
}));

vi.mock('@/state/session', async (importOriginal) => ({
    // eslint-disable-next-line @typescript-eslint/consistent-type-imports -- Vitest's documented pattern for typing 'importOriginal'.
    ...(await importOriginal<typeof import('@/state/session')>()),
    initialiseServices: vi.fn()
}));

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

const viewportIsWideMock = viewportIsWide as unknown as Ref<boolean>; // Writable, because the mock replaces it with a plain ref.

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

// Registered as 'main.ts' does. A rejected first navigation is left for the caller to assert on. Vue errors are
// collected from the start of the mount, so a caller can check none was raised. 'prepareRouter' runs before the first
// navigation, so a caller can add a guard to it.
async function mountApp(entryUrl: string, prepareRouter?: (router: Router) => void): Promise<{ errors: unknown[]; router: Router; wrapper: VueWrapper }> {
    const router = createAppRouter();
    prepareRouter?.(router);
    try {
        await router.push(entryUrl);
        await router.isReady();
    } catch {
        // The landing is asserted by the caller.
    }

    const errors: unknown[] = [];
    const errorHandler = (error: unknown): void => {
        errors.push(error);
    };
    const wrapper = mount(App, { attachTo: document.body, global: { config: { errorHandler }, plugins: [router, [VueQueryPlugin, { queryClient }]] } });
    await settle();
    return { errors, router, wrapper };
}

// ── Tests ────────────────────────────────────────────────────────────────────────────────────────────────────────────

describe('App', () => {
    beforeEach(() => {
        resetAppPanes();
        viewportIsWideMock.value = false;
    });

    it('renders both pane toggles', async () => {
        const { wrapper } = await mountApp('/');

        expect(wrapper.find('button[aria-label="Toggle studio panel"]').exists()).toBe(true);
        expect(wrapper.find('button[aria-label="Toggle assistant panel"]').exists()).toBe(true);
    });

    // The screen a user lands on with no path. The studio pane opens by itself, because the URL does not ask for only
    // the assistant.
    // No 'ErrorBoundary' wraps the app's root, so a Vue error nothing else caught reaches 'handleRaiseVueError', which
    // 'main.ts' installs as the app's error handler.
    it('shows a Vue error that nothing else caught in the app-level failure dialog', async () => {
        const { wrapper } = await mountApp('/');

        handleRaiseVueError(new Error('Failed to render.'), null, 'render function');
        await settle();

        expect(wrapper.find('[data-region="ErrorNotice"]').text()).toContain('Unhandled Vue error.');
        clearAppFailures();
    });

    describe('studio home', () => {
        it('opens the studio pane on the home page, with no errors', async () => {
            const { errors, router, wrapper } = await mountApp('/');

            expect(wrapper.find('[data-region="StudioPane"]').attributes('hidden')).toBeUndefined();
            expect(wrapper.find('[data-region="AssistantPane"]').exists()).toBe(false);
            expect(wrapper.find('h1').text()).toBe('Studio');
            expect(wrapper.find('[data-region="ErrorNotice"]').exists()).toBe(false);
            expect(errors).toStrictEqual([]);
            expect(router.currentRoute.value.query).toStrictEqual({ studio: '1' }); // Written back, so a reload or shared link keeps the pane open.
        });

        it('labels each section by its heading', async () => {
            const { wrapper } = await mountApp('/');

            const sections = wrapper.findAll('section').map((section) => {
                const heading = section.find('h2');
                return [heading.text(), section.attributes('aria-labelledby') === heading.attributes('id')];
            });
            expect(sections).toStrictEqual([
                ['Workflow', true],
                ['Build Data Apps', true],
                ['Configuration', true]
            ]);
        });

        it('numbers only the workflow cards, and links each card to its screen with the query kept', async () => {
            const { wrapper } = await mountApp('/?studio=1');

            const cardLinks = wrapper.findAll('[data-region="ConfigCard"] a').map((link) => [link.attributes('aria-label'), link.attributes('href')]);
            expect(cardLinks).toStrictEqual([
                ['Step 1: Establish Data Views', '/dataViews?studio=1'],
                ['Step 2: Contextualise Data', '/eventQueries?studio=1'],
                ['Step 3: Explore Presentations', '/presentations?studio=1'],
                ['Build Data Apps', '/dataApps?studio=1'],
                ['Manage Configuration', '/setup?studio=1']
            ]);
        });
    });

    // The panes are set from the URL once, after the first navigation. A narrow display shows only the pane in front.
    describe('panes from the URL', () => {
        it('opens only the assistant pane when the URL asks for only that', async () => {
            const { wrapper } = await mountApp('/?assistant=1');

            expect(wrapper.find('[data-region="StudioPane"]').exists()).toBe(false);
            expect(wrapper.find('[data-region="AssistantPane"]').attributes('hidden')).toBeUndefined();
        });

        it('opens both panes and puts the one the URL names in front', async () => {
            const { wrapper } = await mountApp('/?studio=1&assistant=1&pane=assistant');

            expect(wrapper.find('[data-region="StudioPane"]').attributes('hidden')).toBeDefined();
            expect(wrapper.find('[data-region="AssistantPane"]').attributes('hidden')).toBeUndefined();
        });

        // The URL cannot be trusted when the router fails to start, so the app falls back to the studio alone.
        it('opens only the studio pane when the first navigation fails, whatever the URL asks for', async () => {
            const { wrapper } = await mountApp('/?assistant=1', (router) => {
                router.beforeEach(() => {
                    throw new Error('Navigation guard failed.');
                });
            });

            expect(wrapper.find('[data-region="StudioPane"]').attributes('hidden')).toBeUndefined();
            expect(wrapper.find('[data-region="AssistantPane"]').exists()).toBe(false);
            clearAppFailures();
        });
    });

    // A wide display shows every open pane side by side. A pane that is the only one showing stays open, so the app is
    // never left empty.
    describe('wide display', () => {
        beforeEach(() => {
            viewportIsWideMock.value = true;
        });

        it('shows the option bar beside the studio content', async () => {
            const { wrapper } = await mountApp('/');

            expect(wrapper.find('[data-region="StudioPane"]').classes()).toContain('grid-cols-[65px_1fr]');
        });

        it('opens the assistant beside the studio, then closes the studio but never the last pane showing', async () => {
            const { wrapper } = await mountApp('/');
            const studioPane = (): ReturnType<VueWrapper['find']> => wrapper.find('[data-region="StudioPane"]');
            const assistantPane = (): ReturnType<VueWrapper['find']> => wrapper.find('[data-region="AssistantPane"]');

            await wrapper.find('button[aria-label="Toggle assistant panel"]').trigger('click');
            await settle();
            expect(studioPane().attributes('hidden')).toBeUndefined();
            expect(assistantPane().attributes('hidden')).toBeUndefined();

            await wrapper.find('button[aria-label="Toggle studio panel"]').trigger('click');
            await settle();
            expect(studioPane().attributes('hidden')).toBeDefined();

            await wrapper.find('button[aria-label="Toggle assistant panel"]').trigger('click');
            await settle();
            expect(assistantPane().attributes('hidden')).toBeUndefined();
        });
    });

    // Clicking the studio toggle re-enters the current screen, so whatever the URL asks for is resolved a second time.
    // Each URL here must survive that: one the user can reach, one carrying a record id, and one naming a view that no
    // longer exists.
    describe('studio toggle', () => {
        it.each([
            ['a plain screen', '/dataViews'],
            ['a screen that needs an id', '/dataViews/abc123/items?sView=items'],
            ['a view name that no longer exists', '/dataViews?sView=rubbish']
        ])('leaves the URL alone and raises nothing: %s', async (_description, entryUrl) => {
            const { errors, router, wrapper } = await mountApp(entryUrl);
            const landedAt = router.currentRoute.value.fullPath;

            await wrapper.find('button[aria-label="Toggle studio panel"]').trigger('click');
            await flushPromises();

            expect(errors).toStrictEqual([]);
            expect(router.currentRoute.value.fullPath).toBe(landedAt);
        });
    });
});
