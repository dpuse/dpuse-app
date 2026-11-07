// ── External Dependencies & Registrations
import { describe, expect, it } from 'vitest';
import { mount, type VueWrapper } from '@vue/test-utils';

// ── DPUse Framework
import type { ObjectColumnConfig } from '@dpuse/dpuse-shared';

// ── Local Framework
import ColumnDetailPanel from '@/features/studio/dataViews/selectItem/ColumnDetailPanel.vue';
import type { ItemReading } from '@/features/studio/dataViews/_dataViewColumns';
import { t } from '@/state/locale';
import { TEXT } from '@/features/studio/dataViews/selectItem/ColumnDetailPanel_.json';

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

function buildColumn(overrides: Partial<ObjectColumnConfig>): ObjectColumnConfig {
    return {
        dataTypeId: 'numeric',
        formats: {},
        frequentValues: {},
        inferenceCounts: {},
        invalidValues: {},
        label: { en: 'Amount' },
        leadingInferenceCounts: {},
        validValues: {},
        ...overrides
    } as ObjectColumnConfig;
}

function mountPanel(columnConfigs: ObjectColumnConfig[], properties: object = {}): VueWrapper {
    return mount(ColumnDetailPanel, {
        global: { stubs: { SelectInput: true } },
        props: {
            columnIndex: 0,
            detectedColumnType: { dataSubtypeId: undefined, dataTypeId: 'numeric' },
            itemReading: { columnConfigs, hasHeaders: true } as unknown as ItemReading,
            sourceText: 'All records',
            typeOptions: [],
            typeValue: 'auto',
            ...properties
        }
    });
}

function findTabLabels(wrapper: VueWrapper): string[] {
    return wrapper.findAll('[role="tab"]').map((tab) => tab.text());
}

// ── Tests ────────────────────────────────────────────────────────────────────────────────────────────────────────────

describe('ColumnDetailPanel', () => {
    it('leaves out the tabs that have nothing to show', () => {
        const wrapper = mountPanel([buildColumn({})]);

        expect(findTabLabels(wrapper)).toStrictEqual([t(TEXT, 'tab.overview.label')]);
    });

    it('keeps the invalid count in view on the Samples tab', () => {
        const wrapper = mountPanel([buildColumn({ invalidValueCount: 312, invalidValues: { 'n/a': 'string' } })]);

        expect(findTabLabels(wrapper)).toContain(t(TEXT, 'tab.samples.count.label', { count: '312' }));
    });

    it('keeps the same tab open when the column changes, to compare columns', async () => {
        const columns = [buildColumn({ formats: { '9.9': 4 } }), buildColumn({ formats: { '9,9': 2 }, label: { en: 'Tax' } })];
        const wrapper = mountPanel(columns);

        await wrapper.findAll('[role="tab"]')[1]?.trigger('click');
        await wrapper.setProps({ columnIndex: 1 });

        expect(wrapper.find('[role="tabpanel"]').text()).toContain('9,9');
        expect(wrapper.find('h2').text()).toBe('Tax');
    });

    it('falls back to Overview when the open tab has nothing for the next column', async () => {
        const wrapper = mountPanel([buildColumn({ formats: { '9.9': 4 } }), buildColumn({})]);

        await wrapper.findAll('[role="tab"]')[1]?.trigger('click');
        await wrapper.setProps({ columnIndex: 1 });

        expect(wrapper.find('[aria-selected="true"]').text()).toBe(t(TEXT, 'tab.overview.label'));
    });

    it('moves between tabs with the arrow keys', async () => {
        const wrapper = mountPanel([buildColumn({ formats: { '9.9': 4 } })]);

        await wrapper.find('[aria-selected="true"]').trigger('keydown', { key: 'ArrowRight' });

        expect(wrapper.find('[aria-selected="true"]').text()).toBe(t(TEXT, 'tab.formats.label'));
    });

    it('shows the detected subtype when another subtype of its type is in use', () => {
        expect(mountPanel([buildColumn({ dataSubtypeId: 'decimal' })]).find('[role="status"]').exists()).toBe(true);
    });

    it('shows the detected type only when it differs from the type in use', () => {
        expect(mountPanel([buildColumn({})]).text()).not.toContain('Detected');
        expect(
            mountPanel([buildColumn({ dataTypeId: 'string' })])
                .find('[role="status"]')
                .exists()
        ).toBe(true);
    });

    it('warns how many values a chosen type will load as empty', () => {
        const column = buildColumn({ dataSubtypeId: 'integer', inferenceCounts: { 'numeric.integer': 9, 'string.plain': 4 }, leadingInferenceCounts: { 'string.plain': 1 } });
        const wrapper = mountPanel([column], { detectedColumnType: { dataSubtypeId: 'plain', dataTypeId: 'string' } });

        expect(wrapper.find('[role="status"]').text()).toBe(t(TEXT, 'detected.misfit.other.text', { count: '3', type: 'Plain text' }));
    });

    it('shows the first ten of a long list, then the rest when asked', async () => {
        const frequentValues = Object.fromEntries(Array.from({ length: 12 }, (_value, index) => [`value${String(index)}`, 12 - index]));
        const wrapper = mountPanel([buildColumn({ frequentValues })]);

        await wrapper.findAll('[role="tab"]')[1]?.trigger('click');
        expect(wrapper.findAll('tbody tr')).toHaveLength(10);

        await wrapper.find('[aria-expanded="false"]').trigger('click');
        expect(wrapper.findAll('tbody tr')).toHaveLength(12);
    });

    it('offers a decimal separator only when it is given choices', () => {
        const separatorOptions = [{ id: 'auto', label: 'Auto' }];

        expect(mountPanel([buildColumn({})]).findAll('select-input-stub')).toHaveLength(1);
        expect(mountPanel([buildColumn({})], { decimalSeparatorOptions: separatorOptions, decimalSeparatorValue: 'auto' }).findAll('select-input-stub')).toHaveLength(2);
    });

    it('offers to read null words as empty only when given the choice', async () => {
        expect(
            mountPanel([buildColumn({ dataTypeId: 'string', nullWordValueCount: 3 })])
                .find('input[type="checkbox"]')
                .exists()
        ).toBe(false);
        const wrapper = mountPanel([buildColumn({ dataTypeId: 'string', nullWordValueCount: 3 })], { nullWordReading: 'text' });
        const checkbox = wrapper.get('input[type="checkbox"]');

        expect(checkbox.element.parentElement?.textContent).toContain('3');
        await checkbox.setValue(true);
        expect(wrapper.emitted('update:nullWordsAreEmpty')).toEqual([[true]]);
    });

    it('offers Previous and Next only when the detail fills the space', () => {
        expect(
            mountPanel([buildColumn({})])
                .find(`[aria-label="${t(TEXT, 'next.aria')}"]`)
                .exists()
        ).toBe(false);
        expect(
            mountPanel([buildColumn({})], { canStepColumns: true })
                .find(`[aria-label="${t(TEXT, 'next.aria')}"]`)
                .exists()
        ).toBe(true);
    });

    it('opens the column chosen in the search between Previous and Next', async () => {
        const columnSearchOptions = [
            { id: '0', label: 'Amount', needsAttention: false },
            { id: '2', label: 'City', needsAttention: true }
        ];
        const wrapper = mountPanel([buildColumn({})], { canStepColumns: true, columnSearchOptions });
        const input = wrapper.get(`input[aria-label="${t(TEXT, 'columnSearch.aria')}"]`);

        await input.setValue('cit');
        expect(wrapper.find(`[role="option"] [aria-label="${t(TEXT, 'columnAttention.aria')}"]`).exists()).toBe(true);
        await input.trigger('keydown', { key: 'Enter' });

        expect(wrapper.emitted('select')).toStrictEqual([[2]]);
    });
});
