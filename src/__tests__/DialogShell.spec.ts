import DialogShell from '@/components/ui/dialog/DialogShell.vue';
import { createMemoryHistory, createRouter, type Router } from 'vue-router';
import { describe, expect, it } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

async function buildRouter(query = ''): Promise<Router> {
    const router = createRouter({ history: createMemoryHistory(), routes: [{ path: '/', component: { template: '<div />' } }] });
    await router.push(`/${query}`);
    await router.isReady();
    return router;
}

// ── Tests ────────────────────────────────────────────────────────────────────────────────────────────────────────────

describe('DialogShell', () => {
    it('opens on mount when it is mounted already open', async () => {
        const router = await buildRouter();
        const wrapper = mount(DialogShell, { attachTo: document.body, global: { plugins: [router] }, props: { isOpen: true }, slots: { default: '<p>Body.</p>' } });

        expect(wrapper.find('dialog').element.hasAttribute('open')).toBe(true);
    });

    it('follows "isOpen" when the caller does control it', async () => {
        const router = await buildRouter();
        const wrapper = mount(DialogShell, { attachTo: document.body, global: { plugins: [router] }, props: { isOpen: false }, slots: { default: '<p>Body.</p>' } });
        expect(wrapper.find('dialog').element.hasAttribute('open')).toBe(false);

        await wrapper.setProps({ isOpen: true });
        expect(wrapper.find('dialog').element.hasAttribute('open')).toBe(true);

        await wrapper.setProps({ isOpen: false });
        expect(wrapper.find('dialog').element.hasAttribute('open')).toBe(false);
    });

    it('clears the "dlg" parameter when a URL-driven dialog closes', async () => {
        const router = await buildRouter('?dlg=account&keep=1');
        const wrapper = mount(DialogShell, { attachTo: document.body, global: { plugins: [router] }, props: { isOpen: true }, slots: { default: '<p>Body.</p>' } });

        (wrapper.find('dialog').element as HTMLDialogElement).close(); // As Escape and the close button both do.
        await flushPromises(); // The close handler navigates, which settles a tick later than the event.

        expect(router.currentRoute.value.query.dlg).toBeUndefined();
        expect(router.currentRoute.value.query.keep).toBe('1'); // Only 'dlg' is cleared.
    });
});
