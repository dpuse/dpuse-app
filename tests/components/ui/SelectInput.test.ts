// ── External Dependencies & Registrations
import { h } from 'vue';
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

// ── Local Framework
import SelectInput from '@/components/ui/SelectInput.vue';

// ── Tests ────────────────────────────────────────────────────────────────────────────────────────────────────────────

describe('SelectInput', () => {
    it('stays untinted without a tone', () => {
        expect(getValueClasses()).toContain('border-transparent');
        expect(getValueClasses(undefined, false)).toEqual(expect.arrayContaining(['border-boundary', 'bg-surface']));
    });

    it('marks a compact select with a dot by its tone, not a tint', () => {
        expect(getDotClasses('info')).toContain('bg-muted');
        expect(getDotClasses('warning')).toContain('bg-warning-mark');
        expect(getDotClasses()).toBeUndefined();
        expect(getValueClasses('info')).toContain('border-transparent');
        expect(getValueClasses('info')).not.toContain('bg-info');
    });

    it('tints a full size select in place of its own border and fill', () => {
        const classes = getValueClasses('info', false);

        expect(classes).toEqual(expect.arrayContaining(['border-info-border', 'bg-info']));
        expect(classes).not.toContain('bg-surface');
    });

    it('draws an icon before each option label, leaving the label as its text', () => {
        const wrapper = mount(SelectInput, {
            props: {
                label: 'Format',
                modelValue: 'a',
                options: [
                    { id: 'a', label: 'A' },
                    { groupLabel: 'Group', id: 'b', label: 'B' }
                ]
            },
            slots: { 'option-icon': ({ option }: { option: { id: string } }) => h('img', { alt: '', 'data-option-id': option.id }) }
        });
        const options = wrapper.findAll('option');

        expect(options.map((option) => option.find('img').attributes('data-option-id'))).toEqual(['a', 'b']);
        expect(options.map((option) => option.text())).toEqual(['A', 'B']);
    });
});

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

function getValueClasses(tone?: 'info' | 'warning', isCompact = true): string[] {
    const wrapper = mount(SelectInput, { props: { isCompact, label: 'Encoding', modelValue: 'a', options: [{ id: 'a', label: 'A' }], tone } });
    return isCompact ? wrapper.get('span[aria-hidden="true"]').classes() : wrapper.get('select').classes();
}

function getDotClasses(tone?: 'info' | 'warning'): string[] | undefined {
    const wrapper = mount(SelectInput, { props: { isCompact: true, label: 'Encoding', modelValue: 'a', options: [{ id: 'a', label: 'A' }], tone } });
    const dot = wrapper.find('span.rounded-full');
    return dot.exists() ? dot.classes() : undefined;
}
