import App from '@/App.vue';
import { createAppRouter } from '@/router';
import { queryClient } from '@/services/queryClient';
import { VueQueryPlugin } from '@tanstack/vue-query';
import { describe, expect, it, vi } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';

// 'App' starts the Hanko session check on mount, which calls the real sign-in service. These tests are about routing,
// so the check is left out rather than failing against the network and logging an error.
vi.mock('@/state/session', async (importOriginal) => ({
    // eslint-disable-next-line @typescript-eslint/consistent-type-imports -- Vitest's documented pattern for typing 'importOriginal'.
    ...(await importOriginal<typeof import('@/state/session')>()),
    initialiseServices: vi.fn()
}));

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

// Clicking the studio toggle re-enters the current screen, so it exercises whatever the URL asks for a second time.
// These cover the URLs that used to be suspected of breaking it: one carrying a record id, and one naming a view that
// no longer exists. Neither does — the errors that once made this file pass were 'ResizeObserver is not defined',
// which jsdom lacks and 'setup.ts' now stubs, surfacing as a navigation failure that looked like an app fault.
async function clickStudioToggle(entryUrl: string): Promise<{ endedAt: string; error: Error | undefined; landedAt: string }> {
    const router = createAppRouter();
    try {
        await router.push(entryUrl);
    } catch {
        // The landing is asserted below; a rejected push is one of the outcomes under test.
    }
    await router.isReady();

    const wrapper = mount(App, { attachTo: document.body, global: { plugins: [router, [VueQueryPlugin, { queryClient }]] } }); // Registered as 'main.ts' does.
    await flushPromises();

    const landedAt = router.currentRoute.value.fullPath;

    const errors: unknown[] = [];
    wrapper.vm.$.appContext.config.errorHandler = (error): void => {
        errors.push(error);
    };

    await wrapper.find('button[aria-label="Toggle studio panel"]').trigger('click');
    await flushPromises();

    return { endedAt: router.currentRoute.value.fullPath, error: errors[0] as Error | undefined, landedAt };
}

// ── Tests ────────────────────────────────────────────────────────────────────────────────────────────────────────────

describe('studio toggle', () => {
    it.each([
        ['the URL the user actually tried', '/dataViews'],
        ['a screen that needs an id', '/dataViews/abc123/items?sView=items'],
        ['a route name that no longer exists', '/dataViews?sView=rubbish']
    ])('leaves the URL alone and raises nothing: %s', async (_description, entryUrl) => {
        const { endedAt, error, landedAt } = await clickStudioToggle(entryUrl);

        expect(error).toBeUndefined();
        expect(endedAt).toBe(landedAt);
    });
});
