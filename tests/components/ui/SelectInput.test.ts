// ── External Dependencies & Registrations
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

// ── Local Framework
import SelectInput from '@/components/ui/SelectInput.vue';

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

function getValueClasses(tone?: 'info' | 'warning', isCompact = true): string[] {
    const wrapper = mount(SelectInput, { props: { isCompact, label: 'Encoding', modelValue: 'a', options: [{ id: 'a', label: 'A' }], tone } });
    return isCompact ? wrapper.get('span[aria-hidden="true"]').classes() : wrapper.get('select').classes();
}

// ── Tests ────────────────────────────────────────────────────────────────────────────────────────────────────────────

describe('SelectInput', () => {
    it('stays untinted without a tone', () => {
        expect(getValueClasses()).toContain('border-transparent');
        expect(getValueClasses(undefined, false)).toEqual(expect.arrayContaining(['border-boundary', 'bg-surface']));
    });

    it('tints a compact select by its tone', () => {
        expect(getValueClasses('info')).toEqual(expect.arrayContaining(['border-info-border', 'bg-info']));
        expect(getValueClasses('warning')).toEqual(expect.arrayContaining(['border-warning-border', 'bg-warning']));
    });

    it('tints a full size select in place of its own border and fill', () => {
        const classes = getValueClasses('info', false);

        expect(classes).toEqual(expect.arrayContaining(['border-info-border', 'bg-info']));
        expect(classes).not.toContain('bg-surface');
    });
});
