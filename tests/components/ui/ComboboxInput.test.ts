// ── External Dependencies & Registrations
import { describe, expect, it } from 'vitest';
import { mount, type VueWrapper } from '@vue/test-utils';

// ── Local Framework
import ComboboxInput from '@/components/ui/ComboboxInput.vue';

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

const OPTIONS = [
    { id: '0', label: 'Name' },
    { id: '1', label: 'Résumé' },
    { id: '2', label: 'City' }
];

function mountCombobox(): VueWrapper {
    return mount(ComboboxInput, { attachTo: document.body, props: { emptyText: 'No columns match', label: 'Find a column', options: OPTIONS } });
}

function findOptionLabels(wrapper: VueWrapper): string[] {
    return wrapper.findAll('[role="option"]').map((option) => option.text());
}

// ── Tests ────────────────────────────────────────────────────────────────────────────────────────────────────────────

describe('ComboboxInput', () => {
    it('lists the options that match anywhere, ignoring case and accents', async () => {
        const wrapper = mountCombobox();

        await wrapper.get('input').setValue('SUM');

        expect(findOptionLabels(wrapper)).toStrictEqual(['Résumé']);
        expect(wrapper.get('input').attributes('aria-expanded')).toBe('true');
    });

    it('says so when nothing matches', async () => {
        const wrapper = mountCombobox();

        await wrapper.get('input').setValue('zzz');

        expect(findOptionLabels(wrapper)).toStrictEqual([]);
        expect(wrapper.text()).toContain('No columns match');
    });

    it('chooses the first match with Enter, then clears and closes', async () => {
        const wrapper = mountCombobox();
        const input = wrapper.get('input');

        await input.setValue('c');
        await input.trigger('keydown', { key: 'Enter' });

        expect(wrapper.emitted('select')).toStrictEqual([[OPTIONS[2]]]);
        expect((input.element as HTMLInputElement).value).toBe('');
        expect(input.attributes('aria-expanded')).toBe('false');
    });

    it('moves through the list with the arrow keys, wrapping at either end', async () => {
        const wrapper = mountCombobox();
        const input = wrapper.get('input');

        await input.trigger('keydown', { key: 'ArrowUp' });
        expect(input.attributes('aria-activedescendant')).toBe(wrapper.findAll('[role="option"]')[2]?.attributes('id'));

        await input.trigger('keydown', { key: 'ArrowDown' });
        expect(input.attributes('aria-activedescendant')).toBe(wrapper.findAll('[role="option"]')[0]?.attributes('id'));
    });

    it('closes the list with Escape, then clears the search', async () => {
        const wrapper = mountCombobox();
        const input = wrapper.get('input');

        await input.setValue('na');
        await input.trigger('keydown', { key: 'Escape' });
        expect(input.attributes('aria-expanded')).toBe('false');
        expect((input.element as HTMLInputElement).value).toBe('na');

        await input.trigger('keydown', { key: 'Escape' });
        expect((input.element as HTMLInputElement).value).toBe('');
    });

    it('chooses an option when clicked', async () => {
        const wrapper = mountCombobox();

        await wrapper.get('input').trigger('click');
        await wrapper.findAll('[role="option"]')[1]?.trigger('click');

        expect(wrapper.emitted('select')).toStrictEqual([[OPTIONS[1]]]);
    });
});
