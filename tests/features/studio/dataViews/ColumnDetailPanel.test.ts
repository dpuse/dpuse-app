// ── External Dependencies & Registrations
import { describe, expect, it } from 'vitest';
import { mount, type VueWrapper } from '@vue/test-utils';

// ── DPUse Framework
import type { ColumnAuditConfig } from '@dpuse/dpuse-shared';

// ── Local Framework
import ColumnDetailPanel from '@/features/studio/dataViews/ColumnDetailPanel.vue';
import type { ItemReading } from '@/features/studio/dataViews/_dataViewColumns';
import { TEXT as ROW_TEXT } from '@/features/studio/dataViews/_previewColumnRows_.json';
import { t } from '@/state/locale';
import { TEXT } from '@/features/studio/dataViews/ColumnDetailPanel_.json';

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
        const columns = [buildColumn({ validFormats: { '9.9': 4 } }), buildColumn({ validFormats: { '9,9': 2 }, label: { en: 'Tax' } })];
        const wrapper = mountPanel(columns);

        await wrapper.findAll('[role="tab"]')[1]?.trigger('click');
        await wrapper.setProps({ columnIndex: 1 });

        expect(wrapper.find('[role="tabpanel"]').text()).toContain('9,9');
        expect(wrapper.find('section').attributes('aria-label')).toBe('Tax');
    });

    it('falls back to Overview when the open tab has nothing for the next column', async () => {
        const wrapper = mountPanel([buildColumn({ validFormats: { '9.9': 4 } }), buildColumn({})]);

        await wrapper.findAll('[role="tab"]')[1]?.trigger('click');
        await wrapper.setProps({ columnIndex: 1 });

        expect(wrapper.find('[aria-selected="true"]').text()).toBe(t(TEXT, 'tab.overview.label'));
    });

    it('moves between tabs with the arrow keys', async () => {
        const wrapper = mountPanel([buildColumn({ validFormats: { '9.9': 4 } })]);

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

    it('says the source stated the type, for a column still of that type', () => {
        const wrapper = mountPanel([buildColumn({ isTypeDeclared: true })]);

        expect(wrapper.text()).toContain(t(TEXT, 'declared.type.text'));
        expect(wrapper.find('[role="status"]').exists()).toBe(false);
    });

    it('names the stated type rather than a detected one when the user chooses another', () => {
        const wrapper = mountPanel([buildColumn({ dataTypeId: 'string', isTypeDeclared: true })]);

        expect(wrapper.find('[role="status"]').text()).toContain(t(TEXT, 'declared.text', { type: '' }).trim());
        expect(wrapper.text()).not.toContain(t(TEXT, 'declared.type.text'));
    });

    it('lists the invalid examples before the values', async () => {
        const column = buildColumn({ validDistinctValueCount: 2, validFrequentValues: { '12': 2, 'n/a': 1 }, invalidValueCount: 1, invalidValues: { 'n/a': 'string' }, validValueCount: 2 });
        const wrapper = await openTab(mountPanel([column]), `${t(TEXT, 'tab.values.label')} ${t(TEXT, 'tab.invalidCount.label', { count: '1' })}`);

        expect(findHeadings(wrapper)).toStrictEqual([
            [t(TEXT, 'invalidValues.title'), t(TEXT, 'valueCount.one.text')],
            [`${t(TEXT, 'validValues.title')} – ${t(TEXT, 'distribution.title')}`, t(TEXT, 'valueCount.distinct.other.text', { count: '2', distinctCount: '2' })]
        ]);
        expect(wrapper.find('[role="tabpanel"] li').text()).toBe('n/a');
    });

    it('shows the invalid values as bars with their counts, kept out of the valid values', async () => {
        const column = buildColumn({
            validDistinctValueCount: 2,
            validFrequentValues: { false: 9, true: 9 },
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
        const column = buildColumn({ validDistinctValueCount: 1, validFrequentValues: { '12': 2 }, validValueCount: 2 });
        const wrapper = await openTab(mountPanel([column]), t(TEXT, 'tab.values.label'));

        expect(findHeadings(wrapper)).toStrictEqual([
            [`${t(TEXT, 'validValues.title')} – ${t(TEXT, 'distribution.title')}`, t(TEXT, 'valueCount.distinct.other.text', { count: '2', distinctCount: '1' })]
        ]);
    });

    it('lists the most frequent text values, then one line for the rest', async () => {
        const validFrequentValues = Object.fromEntries(Array.from({ length: 10 }, (_value, index) => [`v${String(index)}`, 20 - index])); // 20 down to 11, 155 in all
        const column = buildColumn({ validDistinctValueCount: 15, validFrequentValues, validLeastFrequentValues: { x1: 1, x2: 1 }, validValueCount: 166 });
        const wrapper = await openTab(mountPanel([column]), t(TEXT, 'tab.values.label'));
        const rowTexts = wrapper.findAll('[role="tabpanel"] li').map((row) => row.text());

        expect(rowTexts).toHaveLength(11);
        expect(rowTexts.slice(9)).toStrictEqual(['v911', `${t(TEXT, 'otherValues.text', { count: '5' })}11`]);
        expect(findHeadingTitles(wrapper)).toStrictEqual([`${t(TEXT, 'validValues.title')} – ${t(TEXT, 'distribution.title')}`]);
    });

    it('shows one list when the most and least frequent values meet', async () => {
        const column = buildColumn({ validDistinctValueCount: 3, validFrequentValues: { a: 3, b: 2 }, validLeastFrequentValues: { c: 1 }, validValueCount: 6 });
        const wrapper = await openTab(mountPanel([column]), t(TEXT, 'tab.values.label'));

        expect(wrapper.findAll('[role="tabpanel"] li').map((row) => row.text())).toStrictEqual(['a3', 'b2', 'c1']);
    });

    it('shows the lowest and highest values on the Values tab for every column, not on the Overview', async () => {
        const column = buildColumn({
            dataTypeId: 'string',
            validDistinctValueCount: 3,
            validFrequentValues: { a: 3, b: 2, c: 1 },
            validHighestValues: [['c', 1]],
            validLowestValues: [['a', 3]],
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
            validFrequentValues: {},
            validHighestValues: [
                ['zz', 1],
                ['zy', 2]
            ],
            validLowestValues: [['aa', 4]],
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
            validDistinctValueCount: 3,
            validFrequentValues: { '1': 1, '12.5': 1, '9.5': 1 },
            validHighestValues: [['12.5', 1]],
            validLowestValues: [['1', 1]],
            validValueCount: 3,
            validValueBins: [
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

    it('labels a log scale’s ranges by powers of ten, with zero as its own range', async () => {
        const column = buildColumn({
            dataSubtypeId: 'decimal',
            validFrequentValues: {},
            validValueCount: 5000,
            validValueBinScaleId: 'log',
            validValueBins: [
                { count: 2, lowerValue: '-100', upperValue: '-10' },
                { count: 1, lowerValue: '0', upperValue: '0' },
                { count: 5, lowerValue: '0.0001', upperValue: '0.01' },
                { count: 3, lowerValue: '1000', upperValue: '10000' },
                { count: 4, lowerValue: '1e+15', upperValue: '1e+16' }
            ]
        });
        const wrapper = await openTab(mountPanel([column]), t(TEXT, 'tab.values.label'));
        const histogramRows = wrapper.findAll('[data-region="ValueHistogram"] li').map((row) => row.find('.sr-only').text());

        expect(findHeadingTitles(wrapper)[0]).toBe(`${t(TEXT, 'validValues.title')} – ${t(TEXT, 'distribution.log.title')}`);
        expect(histogramRows[0]).toContain(t(TEXT, 'bin.label', { lower: '-100', upper: '-10' }));
        expect(histogramRows[1]).toMatch(/^0 /u);
        expect(histogramRows[2]).toContain(t(TEXT, 'bin.label', { lower: '0.0001', upper: '0.01' })); // Decimals, not '1E-4', so they match their neighbours.
        expect(histogramRows[3]).toContain(t(TEXT, 'bin.label', { lower: '1K', upper: '10K' }));
        expect(histogramRows[4]).toContain(t(TEXT, 'bin.label', { lower: '1E15', upper: '1E16' })); // Past trillions, short form would read '1,000T'.
    });

    it('adds a paler bar at each end for the values beyond the ranges, with estimated counts marked', async () => {
        const column = buildColumn({
            dataSubtypeId: 'decimal',
            validFrequentValues: {},
            validValueCount: 5000,
            validValueBinOutliers: { aboveCount: 3, belowCount: 2, isEstimated: true },
            validValueBins: [
                { count: 5, lowerValue: '0', upperValue: '10' },
                { count: 4, lowerValue: '10', upperValue: '20' }
            ]
        });
        const wrapper = await openTab(mountPanel([column]), t(TEXT, 'tab.values.label'));
        const bars = wrapper.findAll('[data-region="ValueHistogram"] li');
        const histogramRows = bars.map((row) => row.find('.sr-only').text());

        expect(histogramRows).toHaveLength(4);
        expect(histogramRows[0]).toContain(t(TEXT, 'outliers.below.label', { value: '0' }));
        expect(histogramRows[0]).toContain(t(TEXT, 'count.estimate.text', { count: '2' }));
        expect(histogramRows[3]).toContain(t(TEXT, 'outliers.above.label', { value: '20' }));
        expect(histogramRows[1]).toContain(t(TEXT, 'count.estimate.text', { count: '5' })); // The ranges' own counts come from the same sample.
        expect(bars.map((bar) => bar.find('[aria-hidden="true"]').classes('opacity-50'))).toStrictEqual([true, false, false, true]);
    });

    it('shows one list in ascending order when the lowest and highest hold the same values', async () => {
        const values: [string, number][] = [
            ['1', 2],
            ['5', 1],
            ['9', 3]
        ];
        const column = buildColumn({
            validFrequentValues: {},
            validHighestValues: values.toReversed(),
            validLowestValues: values,
            validValueCount: 6,
            validValueBins: [{ count: 6, lowerValue: '0', upperValue: '10' }]
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
            validFrequentValues: {},
            validHighestValues: values.toReversed(),
            validLowestValues: values,
            validValueCount: 5000,
            validValueBins: [{ count: 5000, lowerValue: '0', upperValue: '25' }]
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
            validFrequentValues: {},
            validValueCount: 5000,
            validValueBins: [
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
            validDistinctValueCount: 4,
            validFrequentValues: { BEL: 5, ABW: 5 },
            validLeastFrequentValues: { AFG: 5 },
            validValueCount: 20
        });
        const wrapper = await openTab(mountPanel([column]), t(TEXT, 'tab.values.label'));

        expect(wrapper.find('[role="tabpanel"] p').text()).toBe(t(TEXT, 'uniformCount.other.text', { count: '5', distinctCount: '4' }));
        expect(findHeadingTitles(wrapper)).toStrictEqual([`${t(TEXT, 'validValues.title')} – ${t(TEXT, 'distribution.title')}`]);
        expect(wrapper.findAll('[role="tabpanel"] li')).toHaveLength(0);
    });

    it('sorts numbers seen equally often by size, and dates by when', async () => {
        const numberColumn = buildColumn({ validDistinctValueCount: 4, validFrequentValues: { '10': 2, '9': 2, '-5': 2, '3': 1 }, validValueCount: 7 });
        const dateColumn = buildColumn({
            dataTypeId: 'temporal',
            validDistinctValueCount: 3,
            validFrequentValues: { '2026-01-10': 2, '2025-12-31': 2, '2026-03-01': 1 },
            validValueCount: 5
        });

        const numberWrapper = await openTab(mountPanel([numberColumn]), t(TEXT, 'tab.values.label'));
        const dateWrapper = await openTab(mountPanel([dateColumn]), t(TEXT, 'tab.values.label'));

        expect(numberWrapper.findAll('[role="tabpanel"] li').map((row) => row.text())).toStrictEqual(['-52', '92', '102', '31']);
        expect(dateWrapper.findAll('[role="tabpanel"] li').map((row) => row.text())).toStrictEqual(['2025-12-312', '2026-01-102', '2026-03-011']);
    });

    it('gives the distinct count in the valid values heading, not on the Overview', async () => {
        const wrapper = mountPanel([buildColumn({ validDistinctValueCount: 1, validFrequentValues: { London: 2 }, validValueCount: 2 })]);

        expect(wrapper.find('[role="tabpanel"]').text()).not.toContain('London');
        await openTab(wrapper, t(TEXT, 'tab.values.label'));
        expect(findHeadings(wrapper)[0]).toStrictEqual([
            `${t(TEXT, 'validValues.title')} – ${t(TEXT, 'distribution.title')}`,
            t(TEXT, 'valueCount.distinct.other.text', { count: '2', distinctCount: '1' })
        ]);
        expect(wrapper.findAll('[role="tabpanel"] p')).toHaveLength(0);
    });

    it('gives the count only in the valid values heading when there are too many values to count', async () => {
        const wrapper = await openTab(mountPanel([buildColumn({ dataTypeId: 'string', validFrequentValues: {}, validValueCount: 5000 })]), t(TEXT, 'tab.values.label'));

        expect(findHeadings(wrapper)[0]).toStrictEqual([
            `${t(TEXT, 'validValues.title')} – ${t(TEXT, 'distribution.title')}`,
            t(TEXT, 'valueCount.other.text', { count: '5,000' })
        ]);
    });

    it('lists the formats as bars, most common first, without the type counts', async () => {
        const wrapper = mountPanel([buildColumn({ validFormats: { '9,9': 2, '9.9': 7 }, inferenceCounts: { 'numeric.decimal': 9 } })]);

        await wrapper.findAll('[role="tab"]')[1]?.trigger('click');

        expect(wrapper.findAll('[role="tabpanel"] li').map((row) => row.text())).toStrictEqual(['9.97', '9,92']);
        expect(wrapper.find('[role="tabpanel"]').text()).not.toContain('numeric.decimal');
    });

    it('notes the shortest and longest lengths under the formats, not on the Overview', async () => {
        const wrapper = mountPanel([buildColumn({ dataTypeId: 'string', validFormats: { Xxxx: 2 }, validMaxSize: 12, validMinSize: 3 })]);
        await wrapper.findAll('[role="tab"]')[1]?.trigger('click');
        expect(wrapper.findAll('[role="tabpanel"] p').at(-1)?.text()).toBe(t(TEXT, 'length.text', { maximum: '12', minimum: '3' }));
    });

    it('notes a single length when every value is as long as the others', async () => {
        const wrapper = mountPanel([buildColumn({ dataTypeId: 'string', validFormats: { XX: 2 }, validMaxSize: 2, validMinSize: 2 })]);

        await wrapper.findAll('[role="tab"]')[1]?.trigger('click');
        expect(wrapper.findAll('[role="tabpanel"] p').at(-1)?.text()).toBe(t(TEXT, 'length.same.text', { length: '2' }));
    });

    it('notes how many whole digits and decimal places numbers have, under Formats rather than the Overview', async () => {
        const rangeColumn = buildColumn({ validFormats: { '9.99': 2 }, validMaxDecimals: 2, validMaxSize: 7, validMaxWholeDigits: 4, validMinDecimals: 0, validMinSize: 1, validMinWholeDigits: 1 });
        const fixedColumn = buildColumn({ validFormats: { '9999': 2 }, validMaxDecimals: 0, validMaxWholeDigits: 4, validMinDecimals: 0, validMinWholeDigits: 4 });

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
        const wrapper = mountPanel([buildColumn({ dataTypeId: 'string', validFormats: formats, validMaxSize: 20, validMinSize: 8 })]);

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

    it('offers a date order only when it is given choices', () => {
        const orderOptions = [{ id: 'auto', label: 'Auto' }];
        const wrapper = mountPanel([buildColumn({ dataTypeId: 'temporal' })], { dateOrderOptions: orderOptions, dateOrderValue: 'auto' });

        expect(mountPanel([buildColumn({ dataTypeId: 'temporal' })]).findAll('select-input-stub')).toHaveLength(1);
        expect(wrapper.findAll('select-input-stub').map((select) => select.attributes('label'))).toEqual([t(TEXT, 'type.label'), t(TEXT, 'dateOrder.label')]);
    });

    it('shows a date order that cannot change as disabled', () => {
        const properties = { dateOrderOptions: [{ id: 'auto', label: 'Auto' }], dateOrderValue: 'auto' };

        expect(mountPanel([buildColumn({ dataTypeId: 'temporal' })], properties).findAll('select-input-stub')[1]?.attributes('disabled')).toBe('false');
        expect(mountPanel([buildColumn({ dataTypeId: 'temporal' })], { ...properties, isDateOrderDisabled: true }).findAll('select-input-stub')[1]?.attributes('disabled')).toBe('true');
    });

    it('lists whether the column appears to be unique, and to be mandatory, as unknown until the whole item is read', () => {
        const columnConfig = buildColumn({ hasMissingValues: false, validIsUnique: true });
        const partialText = mountPanel([columnConfig]).get('dl').text();
        const completeText = mountPanel([columnConfig], { isAuditComplete: true }).get('dl').text();
        const unsettledColumnConfig = buildColumn({});
        const unsettledText = mountPanel([unsettledColumnConfig]).get('dl').text();
        const missingColumnConfig = buildColumn({ hasMissingValues: true });
        const missingText = mountPanel([missingColumnConfig], { isAuditComplete: true }).get('dl').text();
        const unknownText = t(ROW_TEXT, 'answer.unknown.label');

        expect(partialText).toContain(`${t(ROW_TEXT, 'column.unique.label')}${unknownText}`);
        expect(completeText).toContain(`${t(ROW_TEXT, 'column.unique.label')}${t(ROW_TEXT, 'answer.yes.label')}`);
        expect(partialText).toContain(`${t(TEXT, 'mandatory.label')}${unknownText}`);
        expect(completeText).toContain(`${t(TEXT, 'mandatory.label')}${t(ROW_TEXT, 'answer.yes.label')}`);
        expect(missingText).toContain(`${t(TEXT, 'mandatory.label')}${t(ROW_TEXT, 'answer.no.label')}`);
        expect(unsettledText).toContain(`${t(ROW_TEXT, 'column.unique.label')}${unknownText}`);
    });

    it('lists whether the column appears to be a key, which needs it unique with a value that loads in every record', () => {
        const keyColumnConfig = buildColumn({ hasMissingValues: false, inferenceCounts: { 'numeric.integer': 2 }, validIsUnique: true });
        const uniqueColumnConfig = buildColumn({ hasMissingValues: true, inferenceCounts: { 'numeric.integer': 2 }, validIsUnique: true });
        const keyText = mountPanel([keyColumnConfig], { isAuditComplete: true }).get('dl').text();
        const uniqueText = mountPanel([uniqueColumnConfig], { isAuditComplete: true }).get('dl').text();
        const partialText = mountPanel([keyColumnConfig]).get('dl').text();

        expect(keyText).toContain(`${t(TEXT, 'key.label')}${t(ROW_TEXT, 'answer.yes.label')}`);
        expect(uniqueText).toContain(`${t(TEXT, 'key.label')}${t(ROW_TEXT, 'answer.no.label')}`);
        expect(partialText).toContain(`${t(TEXT, 'key.label')}${t(ROW_TEXT, 'answer.unknown.label')}`);
    });

    it('notes under the valid values how many are seen once, only when the engine counted some', async () => {
        const values = { validDistinctValueCount: 3, validFrequentValues: { a: 2, b: 1, c: 1 }, validValueCount: 4 };
        const countedWrapper = await openTab(mountPanel([buildColumn({ ...values, validSingleValueCount: 2 })]), t(TEXT, 'tab.values.label'));
        const noneWrapper = await openTab(mountPanel([buildColumn({ ...values, validSingleValueCount: 0 })]), t(TEXT, 'tab.values.label'));
        const uncountedWrapper = await openTab(mountPanel([buildColumn(values)]), t(TEXT, 'tab.values.label'));

        expect(countedWrapper.find('[role="tabpanel"]').text()).toContain(t(TEXT, 'seenOnce.other.text', { count: '2' }));
        expect(noneWrapper.find('[role="tabpanel"]').text()).not.toContain(t(TEXT, 'seenOnce.other.text', { count: '0' }));
        expect(uncountedWrapper.find('[role="tabpanel"]').text()).toBe(noneWrapper.find('[role="tabpanel"]').text()); // Neither has the note.
    });

    it('leaves out the seen once note when every value appearing once is already said', async () => {
        const column = buildColumn({ validDistinctValueCount: 2, validFrequentValues: { a: 1, b: 1 }, validSingleValueCount: 2, validValueCount: 2 });
        const wrapper = await openTab(mountPanel([column]), t(TEXT, 'tab.values.label'));

        expect(wrapper.find('[role="tabpanel"]').text()).toContain(t(TEXT, 'uniformCount.one.text'));
        expect(wrapper.find('[role="tabpanel"]').text()).not.toContain(t(TEXT, 'seenOnce.other.text', { count: '2' }));
    });

    it('says on the Formats tab why the format is unclear, one note for each issue', async () => {
        const wrapper = await openTab(
            mountPanel([buildColumn({ formatIssueIds: ['decimalSeparatorMixed', 'currencyMixed'], validFormats: { '9.9': 2 } })]),
            t(TEXT, 'tab.formats.label')
        );
        const noteList = wrapper.get('[role="tabpanel"] ul'); // The first list, above the format bars.
        const notes = noteList.findAll('li').map((note) => note.text());

        expect(notes).toStrictEqual([t(TEXT, 'formatIssue.decimalSeparatorMixed.text'), t(TEXT, 'formatIssue.currencyMixed.text')]);
        expect(wrapper.text()).not.toContain(t(TEXT, 'formatIssue.none.text'));
    });

    it('says the format is clear only when the engine checked it', async () => {
        const checkedWrapper = await openTab(mountPanel([buildColumn({ formatIssueIds: [], validFormats: { '9.9': 2 } })]), t(TEXT, 'tab.formats.label'));
        const uncheckedWrapper = await openTab(mountPanel([buildColumn({ dataTypeId: 'string', validFormats: { Xx: 2 } })]), t(TEXT, 'tab.formats.label'));

        expect(checkedWrapper.find('[role="tabpanel"]').text()).toContain(t(TEXT, 'formatIssue.none.text'));
        expect(uncheckedWrapper.find('[role="tabpanel"]').text()).not.toContain(t(TEXT, 'formatIssue.none.text'));
    });

    it('shows the Formats tab for an unclear format even with no formats to list', () => {
        const wrapper = mountPanel([buildColumn({ formatIssueIds: ['currencyMixed'] })]);
        const tabLabels = wrapper.findAll('[role="tab"]').map((tab) => tab.text());

        expect(tabLabels).toContain(t(TEXT, 'tab.formats.label'));
    });

    it('leaves whether the format is unclear off the Overview', () => {
        const wrapper = mountPanel([buildColumn({ formatIssueIds: ['currencyMixed'] })]);

        expect(wrapper.get('[role="tabpanel"]').text()).not.toContain(t(TEXT, 'formatIssue.currencyMixed.text'));
    });

    it('offers to read null words as empty only when given the choice', async () => {
        expect(mountPanel([buildColumn({ dataTypeId: 'string', nullWordValueCount: 3 })]).findAll('input[type="checkbox"]')).toHaveLength(1); // Only the ignore choice.
        const wrapper = mountPanel([buildColumn({ dataTypeId: 'string', nullWordValueCount: 3 })], { nullWordReading: 'text' });
        const checkbox = wrapper.get('input[type="checkbox"]');

        expect(checkbox.element.parentElement?.textContent).toContain('3');
        await checkbox.setValue(true);
        expect(wrapper.emitted('update:nullWordsAreEmpty')).toEqual([[true]]);
    });

    it('offers to ignore the column when loading', async () => {
        const wrapper = mountPanel([buildColumn({})], { isIgnored: true });
        const checkbox = wrapper.get('input[type="checkbox"]');

        expect(checkbox.element.parentElement?.textContent).toContain(t(TEXT, 'ignore.label'));
        expect((checkbox.element as HTMLInputElement).checked).toBe(true);
        await checkbox.setValue(false);
        expect(wrapper.emitted('update:isIgnored')).toEqual([[false]]);
    });

    it('offers Previous and Next, disabled at either end', () => {
        const wrapper = mountPanel([buildColumn({})], { hasNextColumn: true });

        expect(wrapper.find(`[aria-label="${t(TEXT, 'next.aria')}"]`).attributes('disabled')).toBeUndefined();
        expect(wrapper.find(`[aria-label="${t(TEXT, 'previous.aria')}"]`).attributes('disabled')).toBeDefined();
    });
});

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

function buildColumn(overrides: Partial<ColumnAuditConfig>): ColumnAuditConfig {
    return {
        dataTypeId: 'numeric',
        validFormats: {},
        validFrequentValues: {},
        inferenceCounts: {},
        invalidValues: {},
        label: { en: 'Amount' },
        leadingInferenceCounts: {},
        ...overrides
    } as ColumnAuditConfig;
}

function mountPanel(columnConfigs: ColumnAuditConfig[], properties: object = {}): VueWrapper {
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
function buildBinnedColumn(bins: [string, string][]): ColumnAuditConfig {
    return buildColumn({
        dataSubtypeId: 'decimal',
        validFrequentValues: {},
        validValueCount: 5000,
        validValueBins: bins.map(([lowerValue, upperValue]) => ({ count: 1, lowerValue, upperValue }))
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
