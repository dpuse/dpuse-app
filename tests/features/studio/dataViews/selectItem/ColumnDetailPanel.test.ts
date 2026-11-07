// ── External Dependencies & Registrations
import { describe, expect, it } from 'vitest';
import { mount, type VueWrapper } from '@vue/test-utils';

// ── DPUse Framework
import type { ObjectColumnConfig } from '@dpuse/dpuse-shared';

// ── Local Framework
import ColumnDetailPanel from '@/features/studio/dataViews/selectItem/ColumnDetailPanel.vue';
import { constructPreviewColumnHeaders } from '@/features/studio/dataViews/_previewColumnRows';
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
            typeOptions: [],
            typeValue: 'auto',
            ...properties
        }
    });
}

function findTabLabels(wrapper: VueWrapper): string[] {
    return wrapper.findAll('[role="tab"]').map((tab) => tab.text());
}

async function openTab(wrapper: VueWrapper, label: string): Promise<VueWrapper> {
    await wrapper
        .findAll('[role="tab"]')
        .find((tab) => tab.text() === label)
        ?.trigger('click');
    return wrapper;
}

// ── Tests ────────────────────────────────────────────────────────────────────────────────────────────────────────────

describe('ColumnDetailPanel', () => {
    it('leaves out the tabs that have nothing to show', () => {
        const wrapper = mountPanel([buildColumn({})]);

        expect(findTabLabels(wrapper)).toStrictEqual([t(TEXT, 'tab.overview.label')]);
    });

    it('keeps the invalid count in view on the Values tab', () => {
        const wrapper = mountPanel([buildColumn({ invalidValueCount: 312, invalidValues: { 'n/a': 'string' }, validValueCount: 10 })]);

        expect(findTabLabels(wrapper)).toStrictEqual([t(TEXT, 'tab.overview.label'), t(TEXT, 'tab.values.count.label', { count: '312' })]);
    });

    it('keeps the same tab open when the column changes, to compare columns', async () => {
        const columns = [buildColumn({ formats: { '9.9': 4 } }), buildColumn({ formats: { '9,9': 2 }, label: { en: 'Tax' } })];
        const wrapper = mountPanel(columns);

        await wrapper.findAll('[role="tab"]')[1]?.trigger('click');
        await wrapper.setProps({ columnIndex: 1 });

        expect(wrapper.find('[role="tabpanel"]').text()).toContain('9,9');
        expect(wrapper.find('section').attributes('aria-label')).toBe('Tax');
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
        expect(
            mountPanel([buildColumn({ dataSubtypeId: 'decimal' })])
                .find('[role="status"]')
                .exists()
        ).toBe(true);
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

    it('lists the invalid examples before the values', async () => {
        const column = buildColumn({ distinctValueCount: 2, frequentValues: { '12': 2, 'n/a': 1 }, invalidValueCount: 1, invalidValues: { 'n/a': 'string' }, validValueCount: 2 });
        const wrapper = await openTab(mountPanel([column]), t(TEXT, 'tab.values.count.label', { count: '1' }));

        expect(wrapper.findAll('[role="tabpanel"] h3').map((heading) => heading.text())).toStrictEqual([
            t(TEXT, 'invalidValues.label', { count: '1' }),
            t(TEXT, 'validValues.distinct.label', { count: '2', distinctCount: '2' })
        ]);
        expect(wrapper.find('[role="tabpanel"] li').text()).toBe('n/a');
    });

    it('shows the invalid values as bars with their counts, kept out of the valid values', async () => {
        const column = buildColumn({
            distinctValueCount: 4,
            frequentValues: { false: 9, true: 9 },
            invalidDistinctValueCount: 2,
            invalidFrequentValues: { maybe: 1, pending: 1 },
            invalidValueCount: 2,
            validValueCount: 18
        });
        const wrapper = await openTab(mountPanel([column]), t(TEXT, 'tab.values.count.label', { count: '2' }));
        const [invalidList, validList] = wrapper.findAll('[role="tabpanel"] ul');

        expect(wrapper.findAll('[role="tabpanel"] h3').map((heading) => heading.text())).toStrictEqual([
            t(TEXT, 'invalidValues.label', { count: '2' }),
            t(TEXT, 'validValues.distinct.label', { count: '18', distinctCount: '2' })
        ]);
        expect(invalidList.findAll('li').map((row) => row.text())).toStrictEqual(['maybe1', 'pending1']);
        expect(validList.findAll('li').map((row) => row.text())).toStrictEqual(['false9', 'true9']);
    });

    it('heads the values as valid only, when none are invalid', async () => {
        const column = buildColumn({ distinctValueCount: 1, frequentValues: { '12': 2 }, validValueCount: 2 });
        const wrapper = await openTab(mountPanel([column]), t(TEXT, 'tab.values.label'));

        expect(wrapper.findAll('[role="tabpanel"] h3').map((heading) => heading.text())).toStrictEqual([t(TEXT, 'validValues.distinct.label', { count: '2', distinctCount: '1' })]);
    });

    it('lists the most frequent values, then one line for the rest, then the least frequent', async () => {
        const frequentValues = Object.fromEntries(Array.from({ length: 10 }, (_value, index) => [`v${String(index)}`, 20 - index])); // 20 down to 11, 155 in all
        const column = buildColumn({ distinctValueCount: 15, frequentValues, leastFrequentValues: { x1: 1, x2: 1 }, validValueCount: 166 });
        const wrapper = await openTab(mountPanel([column]), t(TEXT, 'tab.values.label'));
        const rowTexts = wrapper.findAll('[role="tabpanel"] li').map((row) => row.text());

        expect(rowTexts).toHaveLength(13);
        expect(rowTexts.slice(9)).toStrictEqual(['v911', `${t(TEXT, 'otherValues.text', { count: '3' })}9`, 'x11', 'x21']);
    });

    it('shows one list when the most and least frequent values meet', async () => {
        const column = buildColumn({ distinctValueCount: 3, frequentValues: { a: 3, b: 2 }, leastFrequentValues: { c: 1 }, validValueCount: 6 });
        const wrapper = await openTab(mountPanel([column]), t(TEXT, 'tab.values.label'));

        expect(wrapper.findAll('[role="tabpanel"] li').map((row) => row.text())).toStrictEqual(['a3', 'b2', 'c1']);
    });

    it('says how many values seen once there are when only some are listed', async () => {
        const column = buildColumn({ distinctValueCount: 3, frequentValues: { a: 3 }, leastFrequentValues: { b: 1, c: 1 }, singleValueCount: 845, validValueCount: 5 });
        const wrapper = await openTab(mountPanel([column]), t(TEXT, 'tab.values.label'));

        expect(wrapper.find('[role="tabpanel"] p').text()).toBe(t(TEXT, 'singleValues.text', { count: '845', listed: '2' }));
    });

    it('lists only the lowest and highest text values when there are too many to count', async () => {
        const column = buildColumn({
            dataTypeId: 'string',
            frequentValues: {},
            highestValues: [
                ['zz', 1],
                ['zy', 2]
            ],
            lowestValues: [['aa', 4]],
            validValueCount: 5000
        });
        const wrapper = await openTab(mountPanel([column]), t(TEXT, 'tab.values.label'));

        expect(wrapper.find('[role="tabpanel"] p').text()).toBe(t(TEXT, 'tooManyValues.text', { limit: '1,000' }));
        expect(wrapper.findAll('[role="tabpanel"] h4').map((heading) => heading.text())).toStrictEqual([t(TEXT, 'lowestValues.label'), t(TEXT, 'highestValues.label')]);
        expect(wrapper.findAll('[role="tabpanel"] li').map((row) => row.text())).toStrictEqual(['aa4', 'zz1', 'zy2']);
    });

    it('shows numbers as how many fall in each range, then their lowest and highest values', async () => {
        const column = buildColumn({
            distinctValueCount: 3,
            frequentValues: { '1': 1, '2': 1, '9.5': 1 },
            highestValues: [['9.5', 1]],
            lowestValues: [['1', 1]],
            validValueCount: 3,
            valueBins: [
                { count: 2, lowerValue: '1', upperValue: '5.123456' },
                { count: 1, lowerValue: '5.123456', upperValue: '9.75' }
            ]
        });
        const wrapper = await openTab(mountPanel([column]), t(TEXT, 'tab.values.label'));
        const rowTexts = wrapper.findAll('[role="tabpanel"] li').map((row) => row.text());

        expect(rowTexts).toStrictEqual([`${t(TEXT, 'bin.label', { lower: '1', upper: '5.123' })}2`, `${t(TEXT, 'bin.label', { lower: '5.123', upper: '9.75' })}1`, '11', '9.51']);
    });

    it('gives the distinct count in the valid values heading, not on the Overview', async () => {
        const wrapper = mountPanel([buildColumn({ distinctValueCount: 1, frequentValues: { London: 2 }, validValueCount: 2 })]);

        expect(wrapper.find('[role="tabpanel"]').text()).not.toContain('London');
        expect(wrapper.find('[role="tabpanel"]').text()).not.toContain(constructPreviewColumnHeaders().distinctValueText);
        await openTab(wrapper, t(TEXT, 'tab.values.label'));
        expect(wrapper.find('[role="tabpanel"] h3').text()).toBe(t(TEXT, 'validValues.distinct.label', { count: '2', distinctCount: '1' }));
        expect(wrapper.findAll('[role="tabpanel"] p')).toHaveLength(0);
    });

    it('gives the count only in the valid values heading when there are too many values to count', async () => {
        const wrapper = await openTab(mountPanel([buildColumn({ dataTypeId: 'string', frequentValues: {}, validValueCount: 5000 })]), t(TEXT, 'tab.values.label'));

        expect(wrapper.find('[role="tabpanel"] h3').text()).toBe(t(TEXT, 'validValues.label', { count: '5,000' }));
    });

    it('lists the formats as bars, most common first, without the type counts', async () => {
        const wrapper = mountPanel([buildColumn({ formats: { '9,9': 2, '9.9': 7 }, inferenceCounts: { 'numeric.decimal': 9 } })]);

        await wrapper.findAll('[role="tab"]')[1]?.trigger('click');

        expect(wrapper.findAll('[role="tabpanel"] li').map((row) => row.text())).toStrictEqual(['9.97', '9,92']);
        expect(wrapper.find('[role="tabpanel"]').text()).not.toContain('numeric.decimal');
    });

    it('notes the shortest and longest lengths under the formats, not on the Overview', async () => {
        const wrapper = mountPanel([buildColumn({ formats: { 'Xx(4)': 2 }, maxSize: 12, minSize: 3 })]);

        expect(wrapper.find('[role="tabpanel"]').text()).not.toContain(constructPreviewColumnHeaders().sizeText);
        await wrapper.findAll('[role="tab"]')[1]?.trigger('click');
        expect(wrapper.findAll('[role="tabpanel"] p').at(-1)?.text()).toBe(t(TEXT, 'length.text', { range: '3 to 12' }));
    });

    it('sums the formats past fifty into one line', async () => {
        const formats = Object.fromEntries(Array.from({ length: 53 }, (_value, index) => [`format${String(index)}`, 60 - index]));
        const wrapper = mountPanel([buildColumn({ formats })]);

        await wrapper.findAll('[role="tab"]')[1]?.trigger('click');

        expect(wrapper.findAll('[role="tabpanel"] li')).toHaveLength(50);
        expect(wrapper.find('[role="tabpanel"] p').text()).toBe(t(TEXT, 'otherFormats.text', { count: '3', valueCount: '27' }));
    });

    it('shows each kind of value’s share only when there is more than one kind', () => {
        expect(mountPanel([buildColumn({ validValueCount: 20 })]).text()).not.toContain('%');
        expect(mountPanel([buildColumn({ invalidValueCount: 5, validValueCount: 15 })]).text()).toContain('25%');
    });

    it('never shows a share as none or all when it rounds that way', () => {
        const text = mountPanel([buildColumn({ invalidValueCount: 1, validValueCount: 9999 })]).text();

        expect(text).toContain(t(TEXT, 'legend.percent.below.text', { percent: '0.1%' }));
        expect(text).toContain(t(TEXT, 'legend.percent.above.text', { percent: '99.9%' }));
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
