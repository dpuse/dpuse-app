// ── External Dependencies & Registrations
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

// ── Local Framework
import ColumnValueBar from '@/features/studio/dataViews/selectItem/ColumnValueBar.vue';

// ── Tests ────────────────────────────────────────────────────────────────────────────────────────────────────────────

describe('ColumnValueBar', () => {
    const columnValueCounts = { blankCount: 1, emptyCount: 0, invalidCount: 2, nullCount: 3, validCount: 1500 };

    it('names every count and how many records they cover, for hover and screen readers', () => {
        const button = mount(ColumnValueBar, { props: { columnLabel: 'Age', columnValueCounts } }).get('button');

        const expected = 'Age: 1,500 valid, 2 invalid, 3 null, 1 blank and 0 empty, of 1,506 audited records. Show details';
        expect(button.attributes('title')).toBe(expected);
        expect(button.attributes('aria-label')).toBe(expected);
    });

    it('sizes a segment by its count and leaves out what the column does not have', () => {
        const wrapper = mount(ColumnValueBar, { props: { columnLabel: 'Age', columnValueCounts } });

        const segments = wrapper.findAll('span span');

        expect(segments.map((segment) => (segment.element as HTMLElement).style.flexGrow)).toEqual(['1500', '2', '3', '1']);
    });

    it('passes a click on, to open the column', async () => {
        const wrapper = mount(ColumnValueBar, { props: { columnLabel: 'Age', columnValueCounts } });

        await wrapper.get('button').trigger('click');

        expect(wrapper.emitted('click')).toHaveLength(1);
    });
});
