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
            typeOptions: [],
            typeValue: 'auto',
            ...properties
        }
    });
}

function findTabLabels(wrapper: VueWrapper): string[] {
    return wrapper.findAll('[role="tab"]').map((tab) => tab.text());
}

// Each heading's title and the counts beside it, apart, so the space between them in the layout does not matter.
function findHeadings(wrapper: VueWrapper): string[][] {
    return wrapper.findAll('[role="tabpanel"] h3').map((heading) => heading.findAll(':scope > span').map((part) => part.text()));
}

function findHeadingTitles(wrapper: VueWrapper): string[] {
    return findHeadings(wrapper).map(([title = '']) => title);
}

// A column of numbers with one value in each of the given ranges.
function buildBinnedColumn(bins: [string, string][]): ObjectColumnConfig {
    return buildColumn({
        dataSubtypeId: 'decimal',
        frequentValues: {},
        validValueCount: 5000,
        valueBins: bins.map(([lowerValue, upperValue]) => ({ count: 1, lowerValue, upperValue }))
    });
}

// The labels at the two ends of the histogram's axis.
function findAxisEnds(wrapper: VueWrapper): string[] {
    return wrapper.findAll('[data-region="ValueHistogram"] > div > span').map((label) => label.text());
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

        expect(findTabLabels(wrapper)).toStrictEqual([t(TEXT, 'tab.overview.label'), `${t(TEXT, 'tab.values.label')} ${t(TEXT, 'tab.invalidCount.label', { count: '312' })}`]);
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
        const wrapper = await openTab(mountPanel([column]), `${t(TEXT, 'tab.values.label')} ${t(TEXT, 'tab.invalidCount.label', { count: '1' })}`);

        expect(findHeadings(wrapper)).toStrictEqual([
            [t(TEXT, 'invalidValues.title'), t(TEXT, 'valueCount.one.text')],
            [`${t(TEXT, 'validValues.title')} – ${t(TEXT, 'distribution.title')}`, t(TEXT, 'valueCount.distinct.other.text', { count: '2', distinctCount: '2' })]
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
        const wrapper = await openTab(mountPanel([column]), `${t(TEXT, 'tab.values.label')} ${t(TEXT, 'tab.invalidCount.label', { count: '2' })}`);
        const lists = wrapper.findAll('[role="tabpanel"] ul');

        expect(findHeadings(wrapper)).toStrictEqual([
            [t(TEXT, 'invalidValues.title'), t(TEXT, 'valueCount.distinct.other.text', { count: '2', distinctCount: '2' })],
            [`${t(TEXT, 'validValues.title')} – ${t(TEXT, 'distribution.title')}`, t(TEXT, 'valueCount.distinct.other.text', { count: '18', distinctCount: '2' })]
        ]);
        expect(lists).toHaveLength(1); // The valid values are seen equally often, so a sentence says so in place of a list.
        expect(lists[0]?.findAll('li').map((row) => row.text())).toStrictEqual(['maybe1', 'pending1']);
    });

    it('heads the values as valid only, when none are invalid', async () => {
        const column = buildColumn({ distinctValueCount: 1, frequentValues: { '12': 2 }, validValueCount: 2 });
        const wrapper = await openTab(mountPanel([column]), t(TEXT, 'tab.values.label'));

        expect(findHeadings(wrapper)).toStrictEqual([
            [`${t(TEXT, 'validValues.title')} – ${t(TEXT, 'distribution.title')}`, t(TEXT, 'valueCount.distinct.other.text', { count: '2', distinctCount: '1' })]
        ]);
    });

    it('lists the most frequent text values, then one line for the rest', async () => {
        const frequentValues = Object.fromEntries(Array.from({ length: 10 }, (_value, index) => [`v${String(index)}`, 20 - index])); // 20 down to 11, 155 in all
        const column = buildColumn({ distinctValueCount: 15, frequentValues, leastFrequentValues: { x1: 1, x2: 1 }, validValueCount: 166 });
        const wrapper = await openTab(mountPanel([column]), t(TEXT, 'tab.values.label'));
        const rowTexts = wrapper.findAll('[role="tabpanel"] li').map((row) => row.text());

        expect(rowTexts).toHaveLength(11);
        expect(rowTexts.slice(9)).toStrictEqual(['v911', `${t(TEXT, 'otherValues.text', { count: '5' })}11`]);
        expect(findHeadingTitles(wrapper)).toStrictEqual([`${t(TEXT, 'validValues.title')} – ${t(TEXT, 'distribution.title')}`]);
    });

    it('shows one list when the most and least frequent values meet', async () => {
        const column = buildColumn({ distinctValueCount: 3, frequentValues: { a: 3, b: 2 }, leastFrequentValues: { c: 1 }, validValueCount: 6 });
        const wrapper = await openTab(mountPanel([column]), t(TEXT, 'tab.values.label'));

        expect(wrapper.findAll('[role="tabpanel"] li').map((row) => row.text())).toStrictEqual(['a3', 'b2', 'c1']);
    });

    it('shows the lowest and highest values on the Values tab for every column, not on the Overview', async () => {
        const column = buildColumn({
            dataTypeId: 'string',
            distinctValueCount: 3,
            frequentValues: { a: 3, b: 2, c: 1 },
            highestValues: [['c', 1]],
            lowestValues: [['a', 3]],
            maxValue: 'c',
            minValue: 'a',
            validValueCount: 6
        });
        const wrapper = mountPanel([column]);
        await openTab(wrapper, t(TEXT, 'tab.values.label'));
        expect(findHeadingTitles(wrapper)).toStrictEqual([
            `${t(TEXT, 'validValues.title')} – ${t(TEXT, 'distribution.title')}`,
            `${t(TEXT, 'validValues.title')} – ${t(TEXT, 'lowest.title')}`,
            `${t(TEXT, 'validValues.title')} – ${t(TEXT, 'highest.title')}`
        ]);
        expect(findHeadings(wrapper)[1]?.[1]).toBe(t(TEXT, 'edgeCount.text', { distinctCount: '3', shown: '1' }));
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
        expect(findHeadingTitles(wrapper)).toStrictEqual([
            `${t(TEXT, 'validValues.title')} – ${t(TEXT, 'distribution.title')}`,
            `${t(TEXT, 'validValues.title')} – ${t(TEXT, 'lowest.title')}`,
            `${t(TEXT, 'validValues.title')} – ${t(TEXT, 'highest.title')}`
        ]);
        expect(wrapper.findAll('[role="tabpanel"] li').map((row) => row.text())).toStrictEqual(['aa4', 'zz1', 'zy2']);
    });

    it('shows numbers as a histogram, then their lowest and highest values', async () => {
        const column = buildColumn({
            dataSubtypeId: 'decimal',
            distinctValueCount: 3,
            frequentValues: { '1': 1, '12.5': 1, '9.5': 1 },
            highestValues: [['12.5', 1]],
            lowestValues: [['1', 1]],
            validValueCount: 3,
            valueBins: [
                { count: 1, lowerValue: '0', upperValue: '5' },
                { count: 0, lowerValue: '5', upperValue: '10' },
                { count: 2, lowerValue: '10', upperValue: '15' }
            ]
        });
        const wrapper = await openTab(mountPanel([column]), t(TEXT, 'tab.values.label'));
        const histogramRows = wrapper.findAll('[data-region="ValueHistogram"] li').map((row) => row.find('.sr-only').text());

        expect(histogramRows[0]).toContain(t(TEXT, 'bin.label', { lower: '0', upper: '5' }));
        expect(histogramRows).toHaveLength(3);
        expect(findHeadingTitles(wrapper)).toStrictEqual([
            `${t(TEXT, 'validValues.title')} – ${t(TEXT, 'distribution.title')}`,
            `${t(TEXT, 'validValues.title')} – ${t(TEXT, 'lowest.title')}`,
            `${t(TEXT, 'validValues.title')} – ${t(TEXT, 'highest.title')}`
        ]);
        expect(wrapper.findAll('[role="tabpanel"] ul li').map((row) => row.text())).toStrictEqual(['11', '12.51']);
    });

    it('shows one list in ascending order when the lowest and highest hold the same values', async () => {
        const values: [string, number][] = [
            ['1', 2],
            ['5', 1],
            ['9', 3]
        ];
        const column = buildColumn({
            frequentValues: {},
            highestValues: values.toReversed(),
            lowestValues: values,
            validValueCount: 6,
            valueBins: [{ count: 6, lowerValue: '0', upperValue: '10' }]
        });
        const wrapper = await openTab(mountPanel([column]), t(TEXT, 'tab.values.label'));

        expect(findHeadingTitles(wrapper)).toStrictEqual([
            `${t(TEXT, 'validValues.title')} – ${t(TEXT, 'distribution.title')}`,
            `${t(TEXT, 'validValues.title')} – ${t(TEXT, 'inOrder.title')}`
        ]);
        expect(wrapper.findAll('[role="tabpanel"] section ul li').map((row) => row.text())).toStrictEqual(['12', '51', '93']);
        expect(findHeadings(wrapper)[1]?.[1]).toBe(t(TEXT, 'edgeCount.all.text', { count: '3' }));
    });

    it('shows the twenty lowest and highest values under the histogram when the list cannot hold every value', async () => {
        const values = Array.from({ length: 25 }, (_, index): [string, number] => [String(index), 1]);
        const column = buildColumn({
            dataSubtypeId: 'integer',
            frequentValues: {},
            highestValues: values.toReversed(),
            lowestValues: values,
            validValueCount: 5000,
            valueBins: [{ count: 5000, lowerValue: '0', upperValue: '25' }]
        });
        const wrapper = await openTab(mountPanel([column]), t(TEXT, 'tab.values.label'));

        expect(findHeadingTitles(wrapper)).toStrictEqual([
            `${t(TEXT, 'validValues.title')} – ${t(TEXT, 'distribution.title')}`,
            `${t(TEXT, 'validValues.title')} – ${t(TEXT, 'lowest.title')}`,
            `${t(TEXT, 'validValues.title')} – ${t(TEXT, 'highest.title')}`
        ]);
        expect(
            findHeadings(wrapper)
                .slice(1)
                .map(([, countText]) => countText)
        ).toStrictEqual([t(TEXT, 'edgeCount.shown.text', { shown: '20' }), t(TEXT, 'edgeCount.shown.text', { shown: '20' })]);
        const [lowestList, highestList] = wrapper.findAll('[role="tabpanel"] section ul');

        expect(lowestList.findAll('li').map((row) => row.text())).toStrictEqual(Array.from({ length: 20 }, (_, index) => `${String(index)}1`));
        expect(highestList.findAll('li').map((row) => row.text())).toStrictEqual(Array.from({ length: 20 }, (_, index) => `${String(24 - index)}1`));
        expect(wrapper.find('[data-region="ValueHistogram"] li .sr-only').text()).toContain(t(TEXT, 'bin.label', { lower: '0', upper: '24' }));
    });

    it('shortens large numbers on the histogram axis, and keeps small ones such as years in full', async () => {
        const largeWrapper = await openTab(
            mountPanel([
                buildBinnedColumn([
                    ['0', '1000000'],
                    ['1000000', '2000000']
                ])
            ]),
            t(TEXT, 'tab.values.label')
        );
        const yearWrapper = await openTab(
            mountPanel([
                buildBinnedColumn([
                    ['1960', '1970'],
                    ['1970', '1980']
                ])
            ]),
            t(TEXT, 'tab.values.label')
        );

        expect(findAxisEnds(largeWrapper)).toStrictEqual(['0', '2M']);
        expect(largeWrapper.find('[data-region="ValueHistogram"] li .sr-only').text()).toContain(t(TEXT, 'bin.label', { lower: '0', upper: '1,000,000' }));
        expect(findAxisEnds(yearWrapper)).toStrictEqual(['1,960', '1,980']);
    });

    it('names ranges of whole months and years as months and years', async () => {
        const column = buildColumn({
            dataSubtypeId: 'date',
            dataTypeId: 'temporal',
            frequentValues: {},
            validValueCount: 5000,
            valueBins: [
                { count: 3, lowerValue: '2024-01-01', upperValue: '2024-02-01' },
                { count: 2, lowerValue: '2024-02-01', upperValue: '2024-05-01' },
                { count: 1, lowerValue: '2020-01-01', upperValue: '2030-01-01' },
                { count: 1, lowerValue: '2024-01-05', upperValue: '2024-01-07' }
            ]
        });
        const wrapper = await openTab(mountPanel([column]), t(TEXT, 'tab.values.label'));
        const labels = wrapper.findAll('[data-region="ValueHistogram"] li').map((row) => row.find('.sr-only').text());

        expect(labels).toStrictEqual([
            expect.stringContaining('2024-01 · '),
            expect.stringContaining(`${t(TEXT, 'bin.label', { lower: '2024-02', upper: '2024-04' })} · `),
            expect.stringContaining(`${t(TEXT, 'bin.label', { lower: '2020', upper: '2029' })} · `),
            expect.stringContaining(`${t(TEXT, 'bin.label', { lower: '2024-01-05', upper: '2024-01-06' })} · `)
        ]);
    });

    it('says so in place of a list when every value is seen equally often', async () => {
        const column = buildColumn({
            dataTypeId: 'string',
            distinctValueCount: 4,
            frequentValues: { BEL: 5, ABW: 5 },
            leastFrequentValues: { AFG: 5 },
            validValueCount: 20
        });
        const wrapper = await openTab(mountPanel([column]), t(TEXT, 'tab.values.label'));

        expect(wrapper.find('[role="tabpanel"] p').text()).toBe(t(TEXT, 'uniformCount.other.text', { count: '5', distinctCount: '4' }));
        expect(findHeadingTitles(wrapper)).toStrictEqual([`${t(TEXT, 'validValues.title')} – ${t(TEXT, 'distribution.title')}`]);
        expect(wrapper.findAll('[role="tabpanel"] li')).toHaveLength(0);
    });

    it('sorts numbers seen equally often by size, and dates by when', async () => {
        const numberColumn = buildColumn({ distinctValueCount: 4, frequentValues: { '10': 2, '9': 2, '-5': 2, '3': 1 }, validValueCount: 7 });
        const dateColumn = buildColumn({
            dataTypeId: 'temporal',
            distinctValueCount: 3,
            frequentValues: { '2026-01-10': 2, '2025-12-31': 2, '2026-03-01': 1 },
            validValueCount: 5
        });

        const numberWrapper = await openTab(mountPanel([numberColumn]), t(TEXT, 'tab.values.label'));
        const dateWrapper = await openTab(mountPanel([dateColumn]), t(TEXT, 'tab.values.label'));

        expect(numberWrapper.findAll('[role="tabpanel"] li').map((row) => row.text())).toStrictEqual(['-52', '92', '102', '31']);
        expect(dateWrapper.findAll('[role="tabpanel"] li').map((row) => row.text())).toStrictEqual(['2025-12-312', '2026-01-102', '2026-03-011']);
    });

    it('gives the distinct count in the valid values heading, not on the Overview', async () => {
        const wrapper = mountPanel([buildColumn({ distinctValueCount: 1, frequentValues: { London: 2 }, validValueCount: 2 })]);

        expect(wrapper.find('[role="tabpanel"]').text()).not.toContain('London');
        await openTab(wrapper, t(TEXT, 'tab.values.label'));
        expect(findHeadings(wrapper)[0]).toStrictEqual([
            `${t(TEXT, 'validValues.title')} – ${t(TEXT, 'distribution.title')}`,
            t(TEXT, 'valueCount.distinct.other.text', { count: '2', distinctCount: '1' })
        ]);
        expect(wrapper.findAll('[role="tabpanel"] p')).toHaveLength(0);
    });

    it('gives the count only in the valid values heading when there are too many values to count', async () => {
        const wrapper = await openTab(mountPanel([buildColumn({ dataTypeId: 'string', frequentValues: {}, validValueCount: 5000 })]), t(TEXT, 'tab.values.label'));

        expect(findHeadings(wrapper)[0]).toStrictEqual([
            `${t(TEXT, 'validValues.title')} – ${t(TEXT, 'distribution.title')}`,
            t(TEXT, 'valueCount.other.text', { count: '5,000' })
        ]);
    });

    it('lists the formats as bars, most common first, without the type counts', async () => {
        const wrapper = mountPanel([buildColumn({ formats: { '9,9': 2, '9.9': 7 }, inferenceCounts: { 'numeric.decimal': 9 } })]);

        await wrapper.findAll('[role="tab"]')[1]?.trigger('click');

        expect(wrapper.findAll('[role="tabpanel"] li').map((row) => row.text())).toStrictEqual(['9.97', '9,92']);
        expect(wrapper.find('[role="tabpanel"]').text()).not.toContain('numeric.decimal');
    });

    it('notes the shortest and longest lengths under the formats, not on the Overview', async () => {
        const wrapper = mountPanel([buildColumn({ dataTypeId: 'string', formats: { Xxxx: 2 }, maxSize: 12, minSize: 3 })]);
        await wrapper.findAll('[role="tab"]')[1]?.trigger('click');
        expect(wrapper.findAll('[role="tabpanel"] p').at(-1)?.text()).toBe(t(TEXT, 'length.text', { maximum: '12', minimum: '3' }));
    });

    it('notes a single length when every value is as long as the others', async () => {
        const wrapper = mountPanel([buildColumn({ dataTypeId: 'string', formats: { XX: 2 }, maxSize: 2, minSize: 2 })]);

        await wrapper.findAll('[role="tab"]')[1]?.trigger('click');
        expect(wrapper.findAll('[role="tabpanel"] p').at(-1)?.text()).toBe(t(TEXT, 'length.same.text', { length: '2' }));
    });

    it('notes how many whole digits and decimal places numbers have, under Formats rather than the Overview', async () => {
        const rangeColumn = buildColumn({ formats: { '9.99': 2 }, maxDecimals: 2, maxSize: 7, maxWholeDigits: 4, minDecimals: 0, minSize: 1, minWholeDigits: 1 });
        const fixedColumn = buildColumn({ formats: { '9999': 2 }, maxDecimals: 0, maxWholeDigits: 4, minDecimals: 0, minWholeDigits: 4 });

        const rangeWrapper = mountPanel([rangeColumn]);
        await openTab(rangeWrapper, t(TEXT, 'tab.formats.label'));
        const fixedWrapper = await openTab(mountPanel([fixedColumn]), t(TEXT, 'tab.formats.label'));

        expect(rangeWrapper.find('[role="tabpanel"] p').text()).toBe(
            t(TEXT, 'digits.text', {
                decimalPlaces: t(TEXT, 'decimalPlaces.range.text', { maximum: '2', minimum: '0' }),
                wholeDigits: t(TEXT, 'wholeDigits.range.text', { maximum: '4', minimum: '1' })
            })
        );
        expect(fixedWrapper.find('[role="tabpanel"] p').text()).toBe(
            t(TEXT, 'digits.text', { decimalPlaces: t(TEXT, 'decimalPlaces.none.text'), wholeDigits: t(TEXT, 'wholeDigits.other.text', { count: '4' }) })
        );
    });

    it('sums the formats past fifty, after the length, in one note above the list', async () => {
        const formats = Object.fromEntries(Array.from({ length: 53 }, (_value, index) => [`format${String(index)}`, 60 - index]));
        const wrapper = mountPanel([buildColumn({ dataTypeId: 'string', formats, maxSize: 20, minSize: 8 })]);

        await wrapper.findAll('[role="tab"]')[1]?.trigger('click');

        const otherFormatsText = t(TEXT, 'otherFormats.other.text', { count: '3', listed: '50', total: '53', values: t(TEXT, 'valueCount.other.text', { count: '27' }) });
        expect(wrapper.findAll('[role="tabpanel"] li')).toHaveLength(50);
        expect(wrapper.findAll('[role="tabpanel"] p').map((note) => note.text())).toStrictEqual([`${t(TEXT, 'length.text', { maximum: '20', minimum: '8' })} ${otherFormatsText}`]);
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

    it('offers Previous and Next, disabled at either end', () => {
        const wrapper = mountPanel([buildColumn({})], { hasNextColumn: true });

        expect(wrapper.find(`[aria-label="${t(TEXT, 'next.aria')}"]`).attributes('disabled')).toBeUndefined();
        expect(wrapper.find(`[aria-label="${t(TEXT, 'previous.aria')}"]`).attributes('disabled')).toBeDefined();
    });
});
