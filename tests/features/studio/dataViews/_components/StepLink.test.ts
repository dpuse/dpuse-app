// ── External Dependencies & Registrations
import { describe, expect, it } from 'vitest';
import { mount, RouterLinkStub } from '@vue/test-utils';

// ── Local Framework
import StepLink from '@/features/studio/dataViews/_components/StepLink.vue';

// ── Tests ────────────────────────────────────────────────────────────────────────────────────────────────────────────

describe('StepLink', () => {
    it('shows the step’s number in a circle with a long arrow, and names the link for screen readers and on hover', () => {
        const wrapper = mount(StepLink, {
            global: { stubs: { RouterLink: RouterLinkStub } },
            props: { label: 'Change the connection in step 1', stepNumber: 1, to: { name: 'connection' } }
        });
        const link = wrapper.getComponent(RouterLinkStub);

        expect(link.text()).toBe('1');
        expect(link.attributes('aria-label')).toBe('Change the connection in step 1');
        expect(link.attributes('title')).toBe('Change the connection in step 1');
        expect(link.props('to')).toEqual({ name: 'connection' });
        expect(link.find('.lucide-move-right-icon, .lucide-move-right').exists()).toBe(true);
    });

    it('stays in place, disabled and going nowhere, for a step that cannot be opened', () => {
        const wrapper = mount(StepLink, {
            global: { stubs: { RouterLink: RouterLinkStub } },
            props: { label: 'Change the item in step 2', stepNumber: 2 }
        });
        const link = wrapper.get('[data-region="StepLink"]');

        expect(wrapper.findComponent(RouterLinkStub).exists()).toBe(false);
        expect(link.text()).toBe('2');
        expect(link.attributes('aria-disabled')).toBe('true');
        expect(link.attributes('aria-label')).toBe('Change the item in step 2');
        expect(link.attributes('href')).toBeUndefined();
    });
});
