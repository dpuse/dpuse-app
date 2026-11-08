// ── External Dependencies & Registrations
import { CircleXIcon } from '@lucide/vue';
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

// ── Local Framework
import PillSegment from '@/components/ui/action/PillSegment.vue';

// ── Tests ────────────────────────────────────────────────────────────────────────────────────────────────────────────

describe('PillSegment', () => {
    it('shows its label as the tooltip while enabled', () => {
        const wrapper = mount(PillSegment, { props: { disabledReason: 'No changes to discard', icon: CircleXIcon, label: 'Discard' } });

        expect(wrapper.get('button').attributes('title')).toBe('Discard');
    });

    it('shows why it is disabled as the tooltip, and keeps its name for screen readers', () => {
        const wrapper = mount(PillSegment, { props: { disabled: true, disabledReason: 'No changes to discard', icon: CircleXIcon, label: 'Discard' } });

        expect(wrapper.get('button').attributes('disabled')).toBeDefined();
        expect(wrapper.get('button').attributes('title')).toBe('No changes to discard');
        expect(wrapper.get('button').attributes('aria-label')).toBe('Discard');
    });
});
