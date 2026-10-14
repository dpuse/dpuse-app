import Dialog from '@/components/ui/dialog/Dialog.vue';
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

// ── Tests ────────────────────────────────────────────────────────────────────────────────────────────────────────────

describe('Dialog', () => {
    it('opens on mount when it is mounted already open', () => {
        const wrapper = mount(Dialog, { attachTo: document.body, props: { isOpen: true }, slots: { default: '<p>Body.</p>' } });

        expect(wrapper.find('dialog').element.hasAttribute('open')).toBe(true);
    });

    it('follows "isOpen" when the caller does control it', async () => {
        const wrapper = mount(Dialog, { attachTo: document.body, props: { isOpen: false }, slots: { default: '<p>Body.</p>' } });
        expect(wrapper.find('dialog').element.hasAttribute('open')).toBe(false);

        await wrapper.setProps({ isOpen: true });
        expect(wrapper.find('dialog').element.hasAttribute('open')).toBe(true);

        await wrapper.setProps({ isOpen: false });
        expect(wrapper.find('dialog').element.hasAttribute('open')).toBe(false);
    });

    // What dismissal means is the caller's; the frame only reports it. See 'dialogs.spec.ts' for the URL side.
    it('emits "close" however the dialog was dismissed', () => {
        const wrapper = mount(Dialog, { attachTo: document.body, props: { isOpen: true }, slots: { default: '<p>Body.</p>' } });

        (wrapper.find('dialog').element as HTMLDialogElement).close(); // As Escape and the close button both do.

        expect(wrapper.emitted('close')).toHaveLength(1);
    });
});
