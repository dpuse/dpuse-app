<script setup lang="ts">
// ── External Dependencies & Registrations
import { ArrowDownNarrowWideIcon, ArrowDownWideNarrowIcon, ChevronLeftIcon, ChevronRightIcon, TriangleAlertIcon } from '@lucide/vue';
import { computed, nextTick, ref, useTemplateRef } from 'vue';

// ── DPUse Framework
import type { ColumnAuditConfig, FormatIssueId } from '@dpuse/dpuse-shared';

// ── Local Framework
import { TEXT } from './ColumnDetailPanel_.json';
import {
    COLUMN_VALUE_SEGMENTS,
    constructColumnTypeLabel,
    constructPreviewColumnHeaders,
    constructPreviewColumnRows,
    countChosenTypeMisfits,
    formatYesNo,
    isColumnComplete,
    type PreviewColumnRow
} from '@/features/studio/dataViews/_previewColumnRows';
import { type ColumnType, constructColumnTypeId, type ItemReading } from '@/features/studio/dataViews/_dataViewColumns';
import { localeId, t } from '@/state/locale';

// ── Static Components
import ActionWrapper from '@/components/ui/action/ActionWrapper.vue';
import CloseButton from '@/components/ui/action/CloseButton.vue';
import CountBarList from './CountBarList.vue';
import type { CountBarRow } from './CountBarList.vue';
import SectionHeading from './SectionHeading.vue';
import SelectInput from '@/components/ui/SelectInput.vue';
import type { SelectOption } from '@/components/ui/SelectInput.vue';
import ValueHistogram from './ValueHistogram.vue';
import type { ValueHistogramBar } from './ValueHistogram.vue';

// ── Types ────────────────────────────────────────────────────────────────────────────────────────────────────────────

type DetailTabId = 'formats' | 'overview' | 'values';

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

const COUNTED_VALUE_LIMIT = 1000; // The most different values the engine counts in a column, as 'MAX_COUNTED_VALUE_COUNT' sets it there.
const MIN_SHOWN_SHARE = 0.001; // The smallest share the legend shows as a number, 0.1%, its one decimal place.
// A fifth of the colour reads clearly on a white card, but stays close to black on a dark one, so dark mode mixes in
// 30%. The bar's light text stays readable on it.
const VALID_BAR_COLOR_CLASS = 'bg-[color-mix(in_srgb,var(--color-accent)_20%,var(--color-card))] dark:bg-[color-mix(in_srgb,var(--color-accent)_30%,var(--color-card))]';
const INVALID_BAR_COLOR_CLASS =
    'bg-[color-mix(in_srgb,var(--color-danger-text)_20%,var(--color-card))] dark:bg-[color-mix(in_srgb,var(--color-danger-text)_30%,var(--color-card))]'; // The value bar's invalid colour, made pale.
const COMPACT_AXIS_MIN_WIDTH = 1000; // The narrowest range whose axis labels are shortened, such as '12K'.
const LOG_COMPACT_MIN = 1e-6; // A log range's edges from here up to 'LOG_COMPACT_MAX' read well in short form. Others are scientific.
const LOG_COMPACT_MAX = 1e15; // Short form ends at trillions, so a larger edge would read as '1,000T'.
const DAY_MILLISECONDS = 86_400_000;
const EDGE_VALUE_COUNT = 20; // Values listed at each end, all the engine keeps.
const VALUE_READERS: Partial<Record<string, (value: string) => number>> = { numeric: Number, temporal: Date.parse }; // How a valid value of each type is read for sorting.
const FORMAT_ROW_COUNT = 50; // Bars on the Formats tab. A rare format is often the one worth finding, so the list is long before the rest are summed.
const FORMAT_ISSUE_TEXT_KEYS: Record<FormatIssueId, keyof typeof TEXT> = {
    booleanPairMixed: 'formatIssue.booleanPairMixed.text',
    currencyMixed: 'formatIssue.currencyMixed.text',
    dateOrderMixed: 'formatIssue.dateOrderMixed.text',
    dateOrderUnproven: 'formatIssue.dateOrderUnproven.text',
    decimalSeparatorMixed: 'formatIssue.decimalSeparatorMixed.text',
    decimalSeparatorUnproven: 'formatIssue.decimalSeparatorUnproven.text',
    decimalSeparatorWeaklyProven: 'formatIssue.decimalSeparatorWeaklyProven.text',
    percentageMixed: 'formatIssue.percentageMixed.text',
    scientificNotationMixed: 'formatIssue.scientificNotationMixed.text'
};

// ── Options, Props, Slots & Emits ────────────────────────────────────────────────────────────────────────────────────

const {
    columnIndex,
    dateOrderOptions = [],
    dateOrderValue,
    decimalSeparatorOptions = [],
    decimalSeparatorValue,
    detectedColumnType,
    hasNextColumn,
    hasPreviousColumn,
    isAuditComplete,
    isDateOrderDisabled,
    isIgnored,
    isTypeDisabled,
    itemReading,
    nullWordReading,
    typeOptions,
    typeValue
} = defineProps<{
    columnIndex: number;
    dateOrderOptions?: SelectOption[]; // Only a column of dates or date-times has any.
    dateOrderValue?: string;
    decimalSeparatorOptions?: SelectOption[]; // Only a column of numbers has any.
    decimalSeparatorValue?: string;
    detectedColumnType: ColumnType | undefined;
    hasNextColumn?: boolean; // Whether Next has a column to move to, among those the panel's host shows.
    hasPreviousColumn?: boolean;
    isAuditComplete?: boolean; // Whether the audit read the whole item, so a column with no value missing is known to have none.
    isDateOrderDisabled?: boolean; // No date in the column could be read either way, so the order is shown but cannot be changed.
    isIgnored?: boolean;
    isTypeDisabled?: boolean;
    itemReading: ItemReading;
    nullWordReading?: 'empty' | 'text'; // How words such as 'NA' read. 'NULL' is always empty. Only a text column has the choice. Not a boolean, because Vue reads a missing boolean as false.
    typeOptions: SelectOption[];
    typeValue: string;
}>();
defineSlots<{
    'choices-end'?(): unknown; // Rendered after the column's choices, e.g. a link to where they can be changed when the host only shows them.
}>();
const emit = defineEmits<{
    close: [];
    step: [direction: -1 | 1];
    'update:dateOrderValue': [dateOrderValue: string];
    'update:decimalSeparatorValue': [decimalSeparatorValue: string];
    'update:isIgnored': [isIgnored: boolean];
    'update:nullWordsAreEmpty': [nullWordsAreEmpty: boolean];
    'update:typeValue': [typeValue: string];
}>();

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

const selectedTabId = ref<DetailTabId>('overview'); // Kept while the column changes, so the same detail can be compared across columns.
const tabListElement = useTemplateRef<HTMLDivElement>('tabList');

// ── Derived State ────────────────────────────────────────────────────────────────────────────────────────────────────

// ── Column
const columnConfig = computed((): ColumnAuditConfig | undefined => itemReading.columnConfigs[columnIndex]);
const columnRow = computed((): PreviewColumnRow | undefined => constructPreviewColumnRows(itemReading)[columnIndex]);
const headers = computed(() => constructPreviewColumnHeaders());

// The detected type, shown only when it differs from the type in use, so a choice that disagrees with the data is seen.
// Values that do not fit the chosen type load as empty, so then it is a warning that says how many. A source such as an
// application states its columns' types, so the wording says the type was stated rather than detected, and a column
// still of the stated type says so too.
const misfitCount = computed(() => countChosenTypeMisfits(itemReading, columnIndex, detectedColumnType));
const isTypeDeclared = computed(() => columnConfig.value?.isTypeDeclared === true);
const detectedTypeText = computed(() => {
    if (detectedColumnType == null || columnConfig.value == null || constructColumnTypeId(detectedColumnType) === constructColumnTypeId(columnConfig.value)) return;
    const type = constructColumnTypeLabel(detectedColumnType);
    const typeSource = isTypeDeclared.value ? 'declared' : 'detected';
    if (misfitCount.value === 0) return t(TEXT, `${typeSource}.text`, { type });
    const count = new Intl.NumberFormat(localeId.value).format(misfitCount.value);
    return t(TEXT, misfitCount.value === 1 ? `${typeSource}.misfit.one.text` : `${typeSource}.misfit.other.text`, { count, type });
});
const declaredTypeText = computed(() => (isTypeDeclared.value && detectedTypeText.value == null ? t(TEXT, 'declared.type.text') : undefined));

// ── Lists
const formatRows = computed(() => constructCountRows(columnConfig.value?.validFormats));
const invalidSamples = computed(() => Object.keys(columnConfig.value?.invalidValues ?? {}));

// ── Charts ─ Each a single measure, so one colour and no legend beyond its labels. The value chart's colours mean a kind of
// value, so its labels name each one and give its count, and colour is never the only cue.
const valueSegments = computed(() => {
    const config = columnConfig.value;
    if (config == null) return [];
    const counts = { blankCount: config.blankValueCount, invalidCount: config.invalidValueCount, missingCount: config.missingValueCount, validCount: config.validValueCount };
    const labels = {
        blankCount: headers.value.blankValueText,
        invalidCount: t(TEXT, 'legend.invalid.label'), // Shorter than the table's 'Invalid values', so the legend fits on one line.
        missingCount: headers.value.missingValueText,
        validCount: t(TEXT, 'legend.valid.label')
    };
    const numberFormat = new Intl.NumberFormat(localeId.value);
    const segmentCounts = COLUMN_VALUE_SEGMENTS.map((segment) => counts[segment.id] ?? 0);
    const totalCount = segmentCounts.reduce((total, count) => total + count, 0);
    const hasPercents = segmentCounts.filter((count) => count > 0).length > 1; // With only one kind of value, every share is 100% and says nothing.
    return COLUMN_VALUE_SEGMENTS.map((segment, index) => {
        const count = segmentCounts[index] ?? 0;
        return {
            ...segment,
            count,
            countText: numberFormat.format(count),
            label: labels[segment.id],
            percentText: hasPercents && count > 0 ? formatSharePercent(count, totalCount) : undefined
        };
    });
});
const shownValueSegments = computed(() => valueSegments.value.filter((segment) => segment.count > 0));
const formatChartRows = computed(() => constructChartRows(formatRows.value, FORMAT_ROW_COUNT));

// The formats past the Formats tab's limit, summed so every value is still accounted for.
const otherFormatsText = computed(() => {
    const otherRows = formatRows.value.slice(FORMAT_ROW_COUNT);
    if (otherRows.length === 0) return;
    const numberFormat = new Intl.NumberFormat(localeId.value);
    const valueCount = otherRows.reduce((total, row) => total + row.count, 0);
    const values = t(TEXT, valueCount === 1 ? 'valueCount.one.text' : 'valueCount.other.text', { count: numberFormat.format(valueCount) });
    const parameters = { count: numberFormat.format(otherRows.length), listed: numberFormat.format(FORMAT_ROW_COUNT), total: numberFormat.format(formatRows.value.length), values };
    return t(TEXT, otherRows.length === 1 ? 'otherFormats.one.text' : 'otherFormats.other.text', parameters);
});

// How long text is, from its shortest to its longest value, because formats past the limit, and text too long to have
// a format, are not shown.
const lengthText = computed(() => {
    const { dataTypeId, validMaxSize: maxSize, validMinSize: minSize } = columnConfig.value ?? {};
    if (dataTypeId !== 'string' || minSize == null || maxSize == null) return;
    const numberFormat = new Intl.NumberFormat(localeId.value);
    return minSize === maxSize
        ? t(TEXT, 'length.same.text', { length: numberFormat.format(minSize) })
        : t(TEXT, 'length.text', { maximum: numberFormat.format(maxSize), minimum: numberFormat.format(minSize) });
});

// How many whole digits and decimal places numbers have, which says more about how they are written than their length,
// because a sign or a thousands separator is not a digit. Dates have neither, because their formats already show it.
const digitsText = computed(() => {
    const { dataTypeId, validMaxDecimals: maxDecimals, validMaxWholeDigits: maxWholeDigits, validMinDecimals: minDecimals, validMinWholeDigits: minWholeDigits } = columnConfig.value ?? {};
    if (dataTypeId !== 'numeric' || minWholeDigits == null || maxWholeDigits == null || minDecimals == null || maxDecimals == null) return;
    const wholeDigits = constructDigitRangeText('wholeDigits', minWholeDigits, maxWholeDigits);
    const decimalPlaces = maxDecimals === 0 ? t(TEXT, 'decimalPlaces.none.text') : constructDigitRangeText('decimalPlaces', minDecimals, maxDecimals);
    return t(TEXT, 'digits.text', { decimalPlaces, wholeDigits });
});

// The notes above the formats, run together as one paragraph.
const formatNotesText = computed(() => [lengthText.value, digitsText.value, otherFormatsText.value].filter((text) => text != null).join(' '));

// Why the column's format is unclear. The engine checks only numbers, dates and yes/no values, and leaves the list
// unset for any other column, so only a checked column is said to be clear.
const formatIssues = computed(() => (columnConfig.value?.formatIssueIds ?? []).map((id) => ({ id, text: t(TEXT, FORMAT_ISSUE_TEXT_KEYS[id]) })));
const isFormatChecked = computed(() => columnConfig.value?.formatIssueIds != null);

// ── Values ─ Every column has the same three blocks: the invalid values, how the valid values are spread, and the
// lowest and highest valid values. The invalid and valid values share one bar scale, so how common an invalid value is
// shows beside the valid ones.
const valueCount = computed(() => (columnConfig.value?.validValueCount ?? 0) + (columnConfig.value?.invalidValueCount ?? 0));
const hasTooManyValues = computed(() => {
    const config = columnConfig.value;
    return config?.validFrequentValues != null && Object.keys(config.validFrequentValues).length === 0 && config.validDistinctValueCount == null && valueCount.value > 0;
});
const largestValueCount = computed(() =>
    Math.max(0, ...Object.values(columnConfig.value?.validFrequentValues ?? {}), ...Object.values(columnConfig.value?.invalidFrequentValues ?? {}))
);
const validDistinctValueCount = computed(() => columnConfig.value?.validDistinctValueCount);
const validChartRows = computed((): CountBarRow[] => {
    const config = columnConfig.value;
    return constructValueChartRows(
        config?.validFrequentValues,
        config?.validLeastFrequentValues,
        validDistinctValueCount.value ?? 0,
        config?.validValueCount ?? 0,
        largestValueCount.value,
        compareValidValues
    );
});
const invalidChartRows = computed((): CountBarRow[] => {
    const config = columnConfig.value;
    return constructValueChartRows(config?.invalidFrequentValues, undefined, config?.invalidDistinctValueCount ?? 0, config?.invalidValueCount ?? 0, largestValueCount.value);
});

// ── Distribution ─ Numbers and dates as a histogram, because most of their values are seen once and a list by
// frequency says little. Text as its most frequent values, then one line for the rest. Numbers that span many powers of
// ten come with one range for each power, a log scale. When a few values lie far from the rest, the ranges cover only
// the middle, and the far values have a paler bar at each end. Counts the engine estimated from a sample say 'about'.
const binsAreLogScale = computed(() => columnConfig.value?.validValueBinScaleId === 'log');
const histogramBars = computed((): ValueHistogramBar[] => {
    const numberFormat = new Intl.NumberFormat(localeId.value);
    const axisFormat = axisNumberFormat.value;
    const outliers = columnConfig.value?.validValueBinOutliers;
    const formatCount = (count: number): string =>
        outliers?.isEstimated === true ? t(TEXT, 'count.estimate.text', { count: numberFormat.format(count) }) : numberFormat.format(count);
    const bars = (columnConfig.value?.validValueBins ?? []).map(({ count, lowerValue, upperValue }): ValueHistogramBar => {
        const { endText, startText } = binsAreLogScale.value
            ? { endText: formatLogEdge(upperValue), startText: formatLogEdge(lowerValue) }
            : constructBinEnds(lowerValue, upperValue);
        return {
            count,
            countText: formatCount(count),
            endText: binsAreLogScale.value ? endText : (axisFormat?.format(Number(upperValue)) ?? endText),
            key: lowerValue,
            label: startText === endText ? startText : t(TEXT, 'bin.label', { lower: startText, upper: endText }),
            startText: binsAreLogScale.value ? startText : (axisFormat?.format(Number(lowerValue)) ?? startText)
        };
    });
    const firstBar = bars[0];
    const lastBar = bars.at(-1);
    if (outliers == null || firstBar == null || lastBar == null) return bars;
    const belowBars = outliers.belowCount > 0 ? [constructOutlierBar('below', outliers.belowCount, formatCount, firstBar.startText)] : [];
    const aboveBars = outliers.aboveCount > 0 ? [constructOutlierBar('above', outliers.aboveCount, formatCount, lastBar.endText)] : [];
    return [...belowBars, ...bars, ...aboveBars];
});

// Large numbers on the axis in short form, such as '1.5M', so the labels fit. Ranges narrower than a thousand keep full
// numbers, so years such as 1960 are not shortened to '2K'. The digits kept are enough to tell neighbouring edges apart,
// which a fixed number of decimal places is not. A short label is a whole edge, so it ends where the next range starts.
const axisNumberFormat = computed(() => {
    const bins = columnConfig.value?.validValueBins ?? [];
    if (bins.length === 0 || columnConfig.value?.dataTypeId !== 'numeric') return;
    const lowest = Number(bins[0].lowerValue);
    const highest = Number(bins.at(-1)?.upperValue);
    const width = Number(bins[0].upperValue) - lowest;
    if (!Number.isFinite(width) || width < COMPACT_AXIS_MIN_WIDTH) return;
    const largest = Math.max(Math.abs(lowest), Math.abs(highest));
    const largestPower = Math.floor(Math.log10(largest));
    const widthPower = Math.floor(Math.log10(width));
    const significantDigits = Math.min(21, Math.max(1, largestPower - widthPower + 1));
    return new Intl.NumberFormat(localeId.value, { maximumSignificantDigits: significantDigits, notation: 'compact' });
});
const hasValueBins = computed(() => histogramBars.value.length > 0);
// ── Edges ─ The lowest and highest valid values for every column, text in alphabetical order, which the engine keeps
// exactly however many values there are. When both lists hold the same values, the column has no more than either
// holds, so one list in ascending order shows them all.
const edgeChartLists = computed(() => {
    const config = columnConfig.value;
    const lowestValues = config?.validLowestValues?.slice(0, EDGE_VALUE_COUNT) ?? [];
    const highestValues = config?.validHighestValues?.slice(0, EDGE_VALUE_COUNT) ?? [];
    const lowestLabels = new Set(lowestValues.map(([value]) => value));
    const isEveryValue = lowestValues.length === highestValues.length && highestValues.every(([value]) => lowestLabels.has(value));
    const lists = isEveryValue
        ? [{ icon: ArrowDownNarrowWideIcon, id: 'all', label: t(TEXT, 'inOrder.title'), values: lowestValues }]
        : [
              { icon: ArrowDownNarrowWideIcon, id: 'lowest', label: t(TEXT, 'lowest.title'), values: lowestValues },
              { icon: ArrowDownWideNarrowIcon, id: 'highest', label: t(TEXT, 'highest.title'), values: highestValues }
          ];
    const largestCount = Math.max(0, ...lists.flatMap((list) => list.values.map(([, count]) => count)));
    const numberFormat = new Intl.NumberFormat(localeId.value);
    return lists
        .filter((list) => list.values.length > 0)
        .map(({ icon, id, label, values }) => ({
            countText: isEveryValue ? t(TEXT, 'edgeCount.all.text', { count: numberFormat.format(values.length) }) : constructEdgeCountText(values.length),
            icon,
            id,
            label,
            rows: values.map(([value, count]): CountBarRow => ({
                barPercent: (count / largestCount) * 100,
                count,
                countText: numberFormat.format(count),
                key: `value:${value}`,
                label: value
            }))
        }));
});

// The most frequent values, then one line summing the rest, the least frequent included. When every value is seen
// equally often the order by frequency says nothing, so a sentence says so in place of the list.
const frequencyRows = computed((): CountBarRow[] => {
    const rows = validChartRows.value;
    const otherIndex = rows.findIndex((row) => row.barPercent == null);
    if (otherIndex === -1) return rows;
    const mostFrequentRows = rows.slice(0, otherIndex);
    const numberFormat = new Intl.NumberFormat(localeId.value);
    const otherCount = (columnConfig.value?.validValueCount ?? 0) - mostFrequentRows.map((row): number => row.count).reduce((total, count) => total + count, 0);
    const otherDistinctCount = (validDistinctValueCount.value ?? 0) - mostFrequentRows.length;
    const label = t(TEXT, 'otherValues.text', { count: numberFormat.format(otherDistinctCount) });
    return [...mostFrequentRows, { barPercent: undefined, count: otherCount, countText: numberFormat.format(otherCount), key: 'other', label }];
});
const uniformCountText = computed(() => {
    const distinctCount = validDistinctValueCount.value;
    const listedRows = validChartRows.value.filter((row) => row.barPercent != null);
    const count = listedRows[0]?.count;
    const isUniform = count != null && distinctCount != null && distinctCount > 1 && listedRows.every((row) => row.count === count);
    if (!isUniform || (columnConfig.value?.validValueCount ?? 0) !== distinctCount * count) return;
    const numberFormat = new Intl.NumberFormat(localeId.value);
    return t(TEXT, count === 1 ? 'uniformCount.one.text' : 'uniformCount.other.text', { count: numberFormat.format(count), distinctCount: numberFormat.format(distinctCount) });
});

// How many values are seen only once, which tells names and ids, nearly all seen once, from categories. The engine
// counts them only up to its limit. Left out when none are, and when every value appearing once is already said.
const seenOnceText = computed(() => {
    const count = columnConfig.value?.validSingleValueCount;
    if (count == null || count === 0 || uniformCountText.value != null) return;
    return t(TEXT, count === 1 ? 'seenOnce.one.text' : 'seenOnce.other.text', { count: new Intl.NumberFormat(localeId.value).format(count) });
});

// ── Headings ─ Each section's title, with its counts apart on the right, in line with the counts of its rows. The
// distinct count beside the count shows whether the values are a few categories or mostly one-offs such as names. Past
// the limit the engine cannot count distinct values, so then only the count is given.
const validCountText = computed(() => constructValueCountText(columnConfig.value?.validValueCount ?? 0, validDistinctValueCount.value));
const invalidCountText = computed(() => constructValueCountText(columnConfig.value?.invalidValueCount ?? 0, columnConfig.value?.invalidDistinctValueCount));

// ── Overview ─ Every fact is always listed, as unknown when it cannot be settled. Complete is unknown until the whole
// item is read, because a value can be missing past the part audited.
const overviewFacts = computed(() => {
    const row = columnRow.value;
    if (row == null) return [];
    const labels = headers.value;
    return [
        { label: labels.uniqueText, value: row.uniqueText },
        { label: t(TEXT, 'complete.label'), value: formatYesNo(isAuditComplete ? isColumnComplete(itemReading, columnIndex, detectedColumnType) : undefined) }
    ];
});

// ── Tabs ─ A tab with nothing to show is left out. The invalid count stays visible on Values, in the danger colour, so a
// problem is not hidden.
const detailTabs = computed(() => {
    const invalidCount = columnConfig.value?.invalidValueCount ?? 0;
    const invalidCountText = invalidCount > 0 ? t(TEXT, 'tab.invalidCount.label', { count: new Intl.NumberFormat(localeId.value).format(invalidCount) }) : undefined;
    return [
        { id: 'overview' as const, invalidCountText: undefined, isShown: true, label: t(TEXT, 'tab.overview.label') },
        { id: 'values' as const, invalidCountText, isShown: valueCount.value > 0, label: t(TEXT, 'tab.values.label') },
        {
            id: 'formats' as const,
            invalidCountText: undefined,
            isShown: formatRows.value.length > 0 || formatNotesText.value !== '' || formatIssues.value.length > 0,
            label: t(TEXT, 'tab.formats.label')
        }
    ].filter((tab) => tab.isShown);
});
const currentTabId = computed((): DetailTabId => (detailTabs.value.some((tab) => tab.id === selectedTabId.value) ? selectedTabId.value : 'overview'));

// ── Event Handlers ───────────────────────────────────────────────────────────────────────────────────────────────────

async function handleNavigateTabs(event: KeyboardEvent, tabIndex: number): Promise<void> {
    const tabCount = detailTabs.value.length;
    const targets: Partial<Record<string, number>> = { ArrowLeft: (tabIndex - 1 + tabCount) % tabCount, ArrowRight: (tabIndex + 1) % tabCount, End: tabCount - 1, Home: 0 };
    const targetIndex = targets[event.key];
    const targetTab = targetIndex == null ? undefined : detailTabs.value[targetIndex];
    if (targetTab == null) return;

    event.preventDefault();
    selectedTabId.value = targetTab.id;
    await nextTick();
    tabListElement.value?.querySelector<HTMLElement>('[aria-selected="true"]')?.focus();
}

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

// The first and last value a range holds. Whole numbers and dates end one short of where the next range starts, so
// '50 to 59' and '2024-01' rather than '50 to 60' and '2024-01-01 to 2024-02-01'. A range of whole months or years is
// written as months or years.
function constructBinEnds(lowerValue: string, upperValue: string): { endText: string; startText: string } {
    if (lowerValue === upperValue) return { endText: formatBinValue(lowerValue), startText: formatBinValue(lowerValue) };
    const lowerDate = readMidnightDate(lowerValue);
    const upperDate = readMidnightDate(upperValue);
    if (lowerDate != null && upperDate != null) {
        const lastDate = new Date(Date.parse(`${upperDate}T00:00:00Z`) - DAY_MILLISECONDS).toISOString().slice(0, 10);
        if (lowerDate.endsWith('-01-01') && upperDate.endsWith('-01-01')) return { endText: lastDate.slice(0, 4), startText: lowerDate.slice(0, 4) };
        if (lowerDate.endsWith('-01') && upperDate.endsWith('-01')) return { endText: lastDate.slice(0, 7), startText: lowerDate.slice(0, 7) };
        return { endText: lastDate, startText: lowerDate };
    }
    const isWholeNumber =
        ['bigint', 'integer'].includes(columnConfig.value?.dataSubtypeId ?? '') && Number.isSafeInteger(Number(lowerValue)) && Number.isSafeInteger(Number(upperValue));
    const endValue = isWholeNumber ? String(Number(upperValue) - 1) : upperValue;
    return { endText: formatBinValue(endValue), startText: formatBinValue(lowerValue) };
}

// The values beyond the ranges, as a bar at one end. It has no edge of its own on the axis, only the range's edge it meets.
function constructOutlierBar(endId: 'above' | 'below', count: number, formatCount: (count: number) => string, edgeText: string): ValueHistogramBar {
    return {
        count,
        countText: formatCount(count),
        endText: endId === 'below' ? edgeText : '',
        isOutlier: true,
        key: endId,
        label: t(TEXT, endId === 'below' ? 'outliers.below.label' : 'outliers.above.label', { value: edgeText }),
        startText: endId === 'below' ? '' : edgeText
    };
}

// A log range's edge, a power of ten, in short form: '0.01', '10K' or '1M', and '1E-8' or '1E18' beyond what short form reads well.
function formatLogEdge(value: string): string {
    const number = Number(value);
    const size = Math.abs(number);
    const isCompact = number === 0 || (size >= LOG_COMPACT_MIN && size < LOG_COMPACT_MAX);
    return new Intl.NumberFormat(localeId.value, { maximumSignificantDigits: 2, notation: isCompact ? 'compact' : 'scientific' }).format(number);
}

// A date, or a date and time at midnight, as its date alone.
function readMidnightDate(value: string): string | undefined {
    const date = value.slice(0, 10);
    return /^\d{4}-\d{2}-\d{2}$/u.test(date) && ['', 'T00:00:00.000Z', 'T00:00:00Z'].includes(value.slice(10)) ? date : undefined;
}

// Numbers in full, because the engine puts the ranges' edges on round values. Dates and times as written, without the
// parts of a second and the time zone mark.
function formatBinValue(value: string): string {
    if (/^\d{4}-\d{2}-\d{2}T/u.test(value)) return value.slice(0, 16).replace('T', ' ');
    if (/^\d{2}:\d{2}/u.test(value)) return value.slice(0, 8);
    const number = Number(value);
    return Number.isNaN(number) || /^\d{4}-\d{2}-\d{2}$/u.test(value) ? value : new Intl.NumberFormat(localeId.value, { maximumSignificantDigits: 12 }).format(number);
}

// How many of the values a lowest or highest list shows: of how many distinct ones, or just how many when there were
// too many to count.
function constructEdgeCountText(shownCount: number): string {
    const numberFormat = new Intl.NumberFormat(localeId.value);
    const distinctCount = validDistinctValueCount.value;
    const shown = numberFormat.format(shownCount);
    return distinctCount == null ? t(TEXT, 'edgeCount.shown.text', { shown }) : t(TEXT, 'edgeCount.text', { distinctCount: numberFormat.format(distinctCount), shown });
}

// '4 whole digits', '1 decimal place' or '0 to 2 decimal places'.
function constructDigitRangeText(subject: 'decimalPlaces' | 'wholeDigits', minimum: number, maximum: number): string {
    const numberFormat = new Intl.NumberFormat(localeId.value);
    if (minimum !== maximum) return t(TEXT, `${subject}.range.text`, { maximum: numberFormat.format(maximum), minimum: numberFormat.format(minimum) });
    return t(TEXT, maximum === 1 ? `${subject}.one.text` : `${subject}.other.text`, { count: numberFormat.format(maximum) });
}

function constructValueCountText(count: number, distinctCount: number | undefined): string {
    const numberFormat = new Intl.NumberFormat(localeId.value);
    const values = { count: numberFormat.format(count), distinctCount: numberFormat.format(distinctCount ?? 0) };
    if (distinctCount == null) return t(TEXT, count === 1 ? 'valueCount.one.text' : 'valueCount.other.text', values);
    return t(TEXT, count === 1 ? 'valueCount.distinct.one.text' : 'valueCount.distinct.other.text', values);
}

function compareText(left: string, right: string): number {
    return left.localeCompare(right, localeId.value);
}

// Valid values by what they are: numbers by size, and dates and times by when, so '9' comes before '10'. Dates are
// usually stored in ISO form, but a value the engine could not read, or one from an older audit, can be as written, so a
// date that does not parse falls back to text, as does anything else.
function compareValidValues(left: string, right: string): number {
    const readValue = VALUE_READERS[columnConfig.value?.dataTypeId ?? ''];
    const leftValue = readValue?.(left) ?? NaN;
    const rightValue = readValue?.(right) ?? NaN;
    return Number.isNaN(leftValue) || Number.isNaN(rightValue) ? compareText(left, right) : leftValue - rightValue;
}

// Most frequent first. Equal counts in the order 'compareIds' gives, so the order never shifts between visits. Text by
// default, which suits formats and invalid values.
function constructCountRows(
    counts: Record<string, number> | undefined,
    compareIds: (left: string, right: string) => number = compareText
): { count: number; countText: string; id: string }[] {
    const numberFormat = new Intl.NumberFormat(localeId.value);
    return Object.entries(counts ?? {})
        .toSorted((left, right) => right[1] - left[1] || compareIds(left[0], right[0]))
        .map(([id, count]) => ({ count, countText: numberFormat.format(count), id }));
}

// A share of all values, to one decimal place. A share that would round to 0% or 100% says '<0.1%' or '>99.9%'
// instead, so a few bad values among many never read as none, and many never read as all.
function formatSharePercent(count: number, totalCount: number): string {
    const percentFormat = new Intl.NumberFormat(localeId.value, { maximumFractionDigits: 1, style: 'percent' });
    const share = count / totalCount;
    if (share < MIN_SHOWN_SHARE) return t(TEXT, 'legend.percent.below.text', { percent: percentFormat.format(MIN_SHOWN_SHARE) });
    if (share > 1 - MIN_SHOWN_SHARE) return t(TEXT, 'legend.percent.above.text', { percent: percentFormat.format(1 - MIN_SHOWN_SHARE) });
    return percentFormat.format(share);
}

// The first rows of a list, longest first, each with its bar's length as a share of the longest.
function constructChartRows(rows: { count: number; countText: string; id: string }[], rowCount: number): CountBarRow[] {
    const shownRows = rows.slice(0, rowCount);
    const largestCount = shownRows[0]?.count ?? 0;
    return shownRows.map(({ count, countText, id }) => ({ barPercent: largestCount === 0 ? 0 : (count / largestCount) * 100, count, countText, key: id, label: id }));
}

// The most frequent values, then a line for the values neither list shows, then the least frequent, each bar's length a
// share of the largest count. Values too long to list are counted by a hash, so they are among the values the line
// sums.
function constructValueChartRows(
    frequentValues: Record<string, number> | undefined,
    leastFrequentValues: Record<string, number> | undefined,
    distinctCount: number,
    totalCount: number,
    largestCount: number,
    compareIds?: (left: string, right: string) => number
): CountBarRow[] {
    const constructBarRow = ({ count, countText, id }: { count: number; countText: string; id: string }): CountBarRow => ({
        barPercent: largestCount === 0 ? 0 : (count / largestCount) * 100,
        count,
        countText,
        key: `value:${id}`,
        label: id
    });
    const frequentRows = constructCountRows(frequentValues, compareIds);
    const leastRows = constructCountRows(leastFrequentValues, compareIds);
    const listedRows = [...frequentRows, ...leastRows];
    const otherDistinctCount = distinctCount - listedRows.length;
    if (otherDistinctCount <= 0) return listedRows.map((row) => constructBarRow(row));
    const numberFormat = new Intl.NumberFormat(localeId.value);
    const otherCount = totalCount - listedRows.reduce((total, row) => total + row.count, 0);
    const otherRow = {
        barPercent: undefined,
        count: otherCount,
        countText: numberFormat.format(otherCount),
        key: 'other',
        label: t(TEXT, 'otherValues.text', { count: numberFormat.format(otherDistinctCount) })
    };
    return [...frequentRows.map((row) => constructBarRow(row)), otherRow, ...leastRows.map((row) => constructBarRow(row))];
}
</script>

<template>
    <section class="@container flex min-h-0 min-w-0 flex-col" :aria-label="columnRow?.label" data-region="ColumnDetailPanel">
        <!-- Header ─ Stays in place, so only the tab's content scrolls. One row, with the tabs on the left and the
             column controls on the right, so the panel's chrome takes as little height as it can. -->
        <header class="flex h-10 flex-none items-stretch gap-x-4 border-b border-separator px-4">
            <div ref="tabList" :aria-label="t(TEXT, 'tabs.aria')" class="-mb-px flex min-w-0 flex-1 gap-x-3 overflow-x-auto overscroll-none" role="tablist">
                <ActionWrapper
                    v-for="(tab, tabIndex) in detailTabs"
                    :key="tab.id"
                    :aria-selected="tab.id === currentTabId"
                    class="flex flex-none items-center border-y-2 border-t-transparent text-sm whitespace-nowrap"
                    :class="tab.id === currentTabId ? 'border-b-content text-emphasis' : 'border-b-transparent text-muted'"
                    role="tab"
                    :tabindex="tab.id === currentTabId ? 0 : -1"
                    @click="selectedTabId = tab.id"
                    @keydown="handleNavigateTabs($event, tabIndex)"
                >
                    {{ tab.label }}
                    <span v-if="tab.invalidCountText" class="ml-1 text-danger-text">{{ tab.invalidCountText }}</span>
                </ActionWrapper>
            </div>

            <div class="flex flex-none items-center gap-x-2">
                <ActionWrapper
                    :aria-label="t(TEXT, 'previous.aria')"
                    class="rounded-md p-1 enabled:hover:state-hover"
                    :disabled="!hasPreviousColumn"
                    @click="emit('step', -1)"
                >
                    <ChevronLeftIcon aria-hidden="true" class="size-5" :stroke-width="1.5" />
                </ActionWrapper>
                <ActionWrapper :aria-label="t(TEXT, 'next.aria')" class="rounded-md p-1 enabled:hover:state-hover" :disabled="!hasNextColumn" @click="emit('step', 1)">
                    <ChevronRightIcon aria-hidden="true" class="size-5" :stroke-width="1.5" />
                </ActionWrapper>
                <!-- '-mr-1.75' cancels the button's padding, so its icon lines up with the page edge as the toolbar's
                     icons do. -->
                <CloseButton :accessible-label="t(TEXT, 'close.aria')" class="-mr-1.75" @click="emit('close')" />
            </div>
        </header>

        <div
            class="min-h-0 flex-1 overflow-y-auto overscroll-none px-4 pt-3 pb-[calc(var(--vertical-scroll-bottom-screen-inset)-var(--status-bar-height))] text-sm"
            role="tabpanel"
        >
            <!-- Overview ─ The value bar first, as what people most often want, then the choices, then the figures. The
                 blocks flow into columns when the panel is wide, as it is over the table. -->
            <div v-if="currentTabId === 'overview'" class="grid items-start gap-x-8 gap-y-4 @3xl:grid-cols-2 @6xl:grid-cols-3">
                <!-- Values ─ The audit's counts, labelled with their numbers, so colour is never the only cue. -->
                <div v-if="shownValueSegments.length > 0">
                    <h3 class="m-0 text-sm font-medium">{{ t(TEXT, 'valueChart.label') }}</h3>
                    <span aria-hidden="true" class="mt-1.5 flex h-2 w-full gap-0.5 overflow-hidden rounded-full">
                        <span v-for="segment in shownValueSegments" :key="segment.id" class="min-w-1 basis-0" :class="segment.colorClass" :style="{ flexGrow: segment.count }" />
                    </span>
                    <!-- Legend ─ One line, wrapping only when the panel is too narrow for it. The shares are left out
                         of a narrow panel, because the counts say everything and the bar shows the proportions. -->
                    <ul class="mt-1.5 flex list-none flex-wrap gap-x-4 gap-y-1 p-0">
                        <li v-for="segment in valueSegments" :key="segment.id" class="flex items-center gap-x-1.5">
                            <span aria-hidden="true" class="size-2 rounded-full" :class="segment.colorClass" />
                            <span class="text-muted">{{ segment.label }}</span>
                            <span class="tabular-nums">{{ segment.countText }}</span>
                            <span v-if="segment.percentText" class="hidden text-muted tabular-nums @md:inline"><span aria-hidden="true">· </span>{{ segment.percentText }}</span>
                        </li>
                    </ul>
                </div>

                <!-- Choices -->
                <div>
                    <SelectInput
                        :disabled="isTypeDisabled"
                        :label="t(TEXT, 'type.label')"
                        :model-value="typeValue"
                        :options="typeOptions"
                        @update:model-value="emit('update:typeValue', $event)"
                    />
                    <p v-if="detectedTypeText" class="mt-1 mb-0 flex items-start gap-x-1.5" :class="misfitCount > 0 ? 'text-warning-text' : 'text-muted'" role="status">
                        <TriangleAlertIcon v-if="misfitCount > 0" aria-hidden="true" class="mt-0.5 size-4 flex-none" :stroke-width="1.5" />
                        {{ detectedTypeText }}
                    </p>
                    <p v-else-if="declaredTypeText" class="mt-1 mb-0 text-muted">{{ declaredTypeText }}</p>
                    <SelectInput
                        v-if="decimalSeparatorOptions.length > 0 && decimalSeparatorValue != null"
                        class="mt-2"
                        :disabled="isTypeDisabled"
                        :label="t(TEXT, 'decimalSeparator.label')"
                        :model-value="decimalSeparatorValue"
                        :options="decimalSeparatorOptions"
                        @update:model-value="emit('update:decimalSeparatorValue', $event)"
                    />
                    <SelectInput
                        v-if="dateOrderOptions.length > 0 && dateOrderValue != null"
                        class="mt-2"
                        :disabled="isTypeDisabled || isDateOrderDisabled"
                        :label="t(TEXT, 'dateOrder.label')"
                        :model-value="dateOrderValue"
                        :options="dateOrderOptions"
                        @update:model-value="emit('update:dateOrderValue', $event)"
                    />
                    <!-- Null Words ─ Off by default, because in a text column 'NA' can be data, such as Namibia's country
                         code. -->
                    <label v-if="nullWordReading != null" class="mt-2 flex items-center gap-x-1.5">
                        <input
                            class="size-3.5 rounded accent-accent"
                            :checked="nullWordReading === 'empty'"
                            :disabled="isTypeDisabled"
                            type="checkbox"
                            @change="emit('update:nullWordsAreEmpty', ($event.target as HTMLInputElement).checked)"
                        />
                        {{ t(TEXT, 'nullWords.label', { count: new Intl.NumberFormat(localeId).format(columnConfig?.nullWordValueCount ?? 0) }) }}
                    </label>
                    <!-- Ignore ─ The column stays in the preview, so it can still be checked, but a load leaves it out. -->
                    <label class="mt-2 flex items-center gap-x-1.5">
                        <input
                            class="size-3.5 rounded accent-accent"
                            :checked="isIgnored"
                            :disabled="isTypeDisabled"
                            type="checkbox"
                            @change="emit('update:isIgnored', ($event.target as HTMLInputElement).checked)"
                        />
                        {{ t(TEXT, 'ignore.label') }}
                    </label>
                    <slot name="choices-end" />
                </div>

                <!-- Facts -->
                <dl v-if="overviewFacts.length > 0" class="m-0 grid grid-cols-[minmax(7.5rem,max-content)_1fr] *:border-b *:border-separator *:py-1 [&>dt]:pr-4">
                    <template v-for="fact in overviewFacts" :key="fact.label">
                        <dt class="text-muted">{{ fact.label }}</dt>
                        <dd class="m-0 min-w-0 wrap-break-word">{{ fact.value }}</dd>
                    </template>
                </dl>
            </div>

            <!-- Values ─ Invalid values first, because they are the ones to act on, then the valid values. Each block has
                 one heading that says what it shows, and a line above it, so no block needs a second level of heading. -->
            <div v-else-if="currentTabId === 'values'" class="flex flex-col divide-y divide-separator *:py-3 *:first:pt-0 *:last:pb-0">
                <section v-if="(columnConfig?.invalidValueCount ?? 0) > 0">
                    <SectionHeading :count-text="invalidCountText" :title="t(TEXT, 'invalidValues.title')" />
                    <!-- The examples stand in for the bars when the engine has no counts for the invalid values: an
                         audit from before it kept them, or a column with too many values to count. -->
                    <CountBarList v-if="invalidChartRows.length > 0" :bar-color-class="INVALID_BAR_COLOR_CLASS" class="mt-1.5" :rows="invalidChartRows" />
                    <ul v-else class="mt-1 mb-0 list-none p-0">
                        <li v-for="sample in invalidSamples" :key="sample" class="border-b border-separator py-1 wrap-anywhere">{{ sample }}</li>
                    </ul>
                </section>

                <section>
                    <SectionHeading
                        :count-text="validCountText"
                        :subtitle="t(TEXT, binsAreLogScale ? 'distribution.log.title' : 'distribution.title')"
                        :title="t(TEXT, 'validValues.title')"
                    />
                    <ValueHistogram v-if="hasValueBins" :bar-color-class="VALID_BAR_COLOR_CLASS" :bars="histogramBars" class="mt-2" :label="t(TEXT, 'histogram.aria')" />
                    <p v-else-if="hasTooManyValues" class="mt-1 mb-0 text-muted">
                        {{ t(TEXT, 'tooManyValues.text', { limit: new Intl.NumberFormat(localeId).format(COUNTED_VALUE_LIMIT) }) }}
                    </p>
                    <p v-else-if="uniformCountText" class="mt-1 mb-0 text-muted">{{ uniformCountText }}</p>
                    <CountBarList v-else :bar-color-class="VALID_BAR_COLOR_CLASS" class="mt-1.5" :rows="frequencyRows" />
                    <p v-if="seenOnceText" class="mt-1.5 mb-0 text-muted">{{ seenOnceText }}</p>
                </section>

                <!-- Edges ─ Side by side when the panel is wide, because each list is short. Stacked, the second list has
                     the same line and space above it as every other block. -->
                <div v-if="edgeChartLists.length > 0" class="grid grid-cols-1 gap-x-8 gap-y-3" :class="{ '@xl:grid-cols-2': edgeChartLists.length > 1 }">
                    <section
                        v-for="list in edgeChartLists"
                        :key="list.id"
                        class="not-first:border-t not-first:border-separator not-first:pt-3 @xl:not-first:border-t-0 @xl:not-first:pt-0"
                    >
                        <SectionHeading :count-text="list.countText" :icon="list.icon" :subtitle="list.label" :title="t(TEXT, 'validValues.title')" />
                        <CountBarList :bar-color-class="VALID_BAR_COLOR_CLASS" class="mt-1.5" :rows="list.rows" />
                    </section>
                </div>
            </div>

            <!-- Formats ─ Every format up to the limit, most common first, as bars like the Values tab's. A note above
                 them, as on the Values tab, says how long text is or how many digits numbers have, and sums the formats
                 past the limit. Above that, why the format is unclear, or that it is clear. -->
            <template v-else-if="currentTabId === 'formats'">
                <ul v-if="formatIssues.length > 0" class="mt-0 mb-1.5 list-none p-0 text-warning-text">
                    <li v-for="formatIssue in formatIssues" :key="formatIssue.id" class="flex items-start gap-x-1.5">
                        <TriangleAlertIcon aria-hidden="true" class="mt-0.5 size-4 flex-none" :stroke-width="1.5" />
                        {{ formatIssue.text }}
                    </li>
                </ul>
                <p v-else-if="isFormatChecked" class="mt-0 mb-1.5 text-muted">{{ t(TEXT, 'formatIssue.none.text') }}</p>
                <p v-if="formatNotesText" class="mt-0 mb-1.5 text-muted">{{ formatNotesText }}</p>
                <CountBarList :bar-color-class="VALID_BAR_COLOR_CLASS" :label="headers.formatText" :rows="formatChartRows" />
            </template>
        </div>
    </section>
</template>
