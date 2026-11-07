<script setup lang="ts">
// ── External Dependencies & Registrations
import { ChevronLeftIcon, ChevronRightIcon, TriangleAlertIcon } from '@lucide/vue';
import { computed, nextTick, ref, useTemplateRef } from 'vue';

// ── DPUse Framework
import type { ObjectColumnConfig } from '@dpuse/dpuse-shared';

// ── Local Framework
import { TEXT } from './ColumnDetailPanel_.json';
import {
    COLUMN_VALUE_SEGMENTS,
    constructColumnTypeLabel,
    constructPreviewColumnHeaders,
    constructPreviewColumnRows,
    countChosenTypeMisfits,
    type PreviewColumnRow
} from '@/features/studio/dataViews/_previewColumnRows';
import { type ColumnType, constructColumnTypeId, type ItemReading } from '@/features/studio/dataViews/_dataViewColumns';
import { localeId, t } from '@/state/locale';

// ── Static Components
import ActionWrapper from '@/components/ui/action/ActionWrapper.vue';
import CloseButton from '@/components/ui/action/CloseButton.vue';
import ComboboxInput from '@/components/ui/ComboboxInput.vue';
import CountBarList from './CountBarList.vue';
import type { CountBarRow } from './CountBarList.vue';
import SelectInput from '@/components/ui/SelectInput.vue';
import type { SelectOption } from '@/components/ui/SelectInput.vue';

// ── Types ────────────────────────────────────────────────────────────────────────────────────────────────────────────

type DetailTabId = 'formats' | 'overview' | 'values';

export interface ColumnSearchOption {
    id: string; // The column's position in the item, as text.
    label: string;
    needsAttention: boolean; // Has invalid values or an ambiguous number format, so the list marks it as the table does.
}

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

const COUNTED_VALUE_LIMIT = 1000; // The most different values the engine counts in a column, as 'MAX_COUNTED_VALUE_COUNT' sets it there.
const MIN_SHOWN_SHARE = 0.001; // The smallest share the legend shows as a number, 0.1%, its one decimal place.
const VALID_BAR_COLOR_CLASS = 'bg-[color-mix(in_srgb,var(--color-accent)_20%,var(--color-card))]';
const INVALID_BAR_COLOR_CLASS = 'bg-[color-mix(in_srgb,var(--color-danger-text)_20%,var(--color-card))]'; // The value bar's invalid colour, made pale.
const FORMAT_ROW_COUNT = 50; // Bars on the Formats tab. A rare format is often the one worth finding, so the list is long before the rest are summed.

// ── Options, Props, Slots & Emits ────────────────────────────────────────────────────────────────────────────────────

const {
    canStepColumns,
    columnIndex,
    columnSearchOptions = [],
    decimalSeparatorOptions = [],
    decimalSeparatorValue,
    detectedColumnType,
    hasNextColumn,
    hasPreviousColumn,
    isTypeDisabled,
    itemReading,
    nullWordReading,
    typeOptions,
    typeValue
} = defineProps<{
    canStepColumns?: boolean; // Filling the space hides the table, so Previous and Next take its place.
    columnIndex: number;
    columnSearchOptions?: ColumnSearchOption[]; // The columns the search between Previous and Next can open.
    decimalSeparatorOptions?: SelectOption[]; // Only a column of numbers has any.
    decimalSeparatorValue?: string;
    detectedColumnType: ColumnType | undefined;
    hasNextColumn?: boolean; // Whether Next has a column to move to, among those the panel's host shows.
    hasPreviousColumn?: boolean;
    isTypeDisabled?: boolean;
    itemReading: ItemReading;
    nullWordReading?: 'empty' | 'text'; // How words such as 'NA' read. 'NULL' is always empty. Only a text column has the choice. Not a boolean, because Vue reads a missing boolean as false.
    typeOptions: SelectOption[];
    typeValue: string;
}>();
const emit = defineEmits<{
    close: [];
    select: [columnIndex: number];
    step: [direction: -1 | 1];
    'update:decimalSeparatorValue': [decimalSeparatorValue: string];
    'update:nullWordsAreEmpty': [nullWordsAreEmpty: boolean];
    'update:typeValue': [typeValue: string];
}>();

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

const selectedTabId = ref<DetailTabId>('overview'); // Kept while the column changes, so the same detail can be compared across columns.
const tabListElement = useTemplateRef<HTMLDivElement>('tabList');

// ── Derived State ────────────────────────────────────────────────────────────────────────────────────────────────────

// ── Column
const columnConfig = computed((): ObjectColumnConfig | undefined => itemReading.columnConfigs[columnIndex]);
const columnRow = computed((): PreviewColumnRow | undefined => constructPreviewColumnRows(itemReading)[columnIndex]);
const headers = computed(() => constructPreviewColumnHeaders());

// The detected type, shown only when it differs from the type in use, so a choice that disagrees with the data is seen.
// Values that do not fit the chosen type load as empty, so then it is a warning that says how many.
const misfitCount = computed(() => countChosenTypeMisfits(itemReading, columnIndex, detectedColumnType));
const detectedTypeText = computed(() => {
    if (detectedColumnType == null || columnConfig.value == null || constructColumnTypeId(detectedColumnType) === constructColumnTypeId(columnConfig.value)) return;
    const type = constructColumnTypeLabel(detectedColumnType);
    if (misfitCount.value === 0) return t(TEXT, 'detected.text', { type });
    const count = new Intl.NumberFormat(localeId.value).format(misfitCount.value);
    return t(TEXT, misfitCount.value === 1 ? 'detected.misfit.one.text' : 'detected.misfit.other.text', { count, type });
});

// ── Lists
const formatRows = computed(() => constructCountRows(columnConfig.value?.formats));
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

// The formats past the Formats tab's limit, summed into one line so every value is still accounted for.
const otherFormatsText = computed(() => {
    const otherRows = formatRows.value.slice(FORMAT_ROW_COUNT);
    if (otherRows.length === 0) return;
    const numberFormat = new Intl.NumberFormat(localeId.value);
    const valueCount = otherRows.reduce((total, row) => total + row.count, 0);
    return t(TEXT, 'otherFormats.text', { count: numberFormat.format(otherRows.length), valueCount: numberFormat.format(valueCount) });
});

// ── Values ─ The valid and invalid values are listed apart, each as the most frequent values, then one line for the
// values the lists do not show, then the least frequent. With few distinct values the lists meet and there is no line
// between them. Both share one bar scale, so how common an invalid value is shows beside the valid ones.
const valueCount = computed(() => (columnConfig.value?.validValueCount ?? 0) + (columnConfig.value?.invalidValueCount ?? 0));
const hasTooManyValues = computed(() => {
    const config = columnConfig.value;
    return config?.frequentValues != null && Object.keys(config.frequentValues).length === 0 && config.distinctValueCount == null && valueCount.value > 0;
});
const largestValueCount = computed(() =>
    Math.max(0, ...Object.values(columnConfig.value?.frequentValues ?? {}), ...Object.values(columnConfig.value?.invalidFrequentValues ?? {}))
);
const validDistinctValueCount = computed(() => {
    const config = columnConfig.value;
    return config?.distinctValueCount == null ? undefined : config.distinctValueCount - (config.invalidDistinctValueCount ?? 0);
});
const validChartRows = computed((): CountBarRow[] => {
    const config = columnConfig.value;
    return constructValueChartRows(config?.frequentValues, config?.leastFrequentValues, validDistinctValueCount.value ?? 0, config?.validValueCount ?? 0, largestValueCount.value);
});
const invalidChartRows = computed((): CountBarRow[] => {
    const config = columnConfig.value;
    return constructValueChartRows(config?.invalidFrequentValues, undefined, config?.invalidDistinctValueCount ?? 0, config?.invalidValueCount ?? 0, largestValueCount.value);
});

// ── Distribution ─ Numbers and dates are shown as how many fall in each range, with their lowest and highest values,
// because most of their values are seen once and a list by frequency says little. Text past the limit has no counts, so
// it shows only its lowest and highest values, which the engine keeps exactly however many there are.
const binChartRows = computed((): CountBarRow[] => {
    const bins = columnConfig.value?.valueBins ?? [];
    const largestCount = Math.max(0, ...bins.map((bin) => bin.count));
    const numberFormat = new Intl.NumberFormat(localeId.value);
    return bins.map(({ count, lowerValue, upperValue }) => ({
        barPercent: largestCount === 0 ? 0 : (count / largestCount) * 100,
        count,
        countText: numberFormat.format(count),
        key: lowerValue,
        label: t(TEXT, 'bin.label', { lower: formatBinValue(lowerValue), upper: formatBinValue(upperValue) })
    }));
});
const hasValueBins = computed(() => binChartRows.value.length > 0);
const edgeChartLists = computed(() => {
    const config = columnConfig.value;
    const lists = [
        { id: 'lowest', label: t(TEXT, 'lowestValues.label'), values: config?.lowestValues ?? [] },
        { id: 'highest', label: t(TEXT, 'highestValues.label'), values: config?.highestValues ?? [] }
    ];
    const largestCount = Math.max(0, ...lists.flatMap((list) => list.values.map(([, count]) => count)));
    const numberFormat = new Intl.NumberFormat(localeId.value);
    return lists
        .filter((list) => list.values.length > 0)
        .map(({ id, label, values }) => ({
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

// ── Headings ─ The valid values' distinct count beside their count, because together they show whether the values are
// a few categories or mostly one-offs such as names. Past the limit the engine cannot count distinct values, so the
// heading gives the count only.
const validValuesLabel = computed(() => {
    const numberFormat = new Intl.NumberFormat(localeId.value);
    const count = numberFormat.format(columnConfig.value?.validValueCount ?? 0);
    return validDistinctValueCount.value == null
        ? t(TEXT, 'validValues.label', { count })
        : t(TEXT, 'validValues.distinct.label', { count, distinctCount: numberFormat.format(validDistinctValueCount.value) });
});
const invalidValuesLabel = computed(() => t(TEXT, 'invalidValues.label', { count: new Intl.NumberFormat(localeId.value).format(columnConfig.value?.invalidValueCount ?? 0) }));

// Values seen once all have the same count, so the list can show only some of them. This says how many there are.
const singleValuesText = computed(() => {
    const singleValueCount = columnConfig.value?.singleValueCount ?? 0;
    const listedSingleCount = validChartRows.value.filter((row) => row.barPercent != null && row.count === 1).length;
    if (listedSingleCount === 0 || singleValueCount <= listedSingleCount) return;
    const numberFormat = new Intl.NumberFormat(localeId.value);
    return t(TEXT, 'singleValues.text', { count: numberFormat.format(singleValueCount), listed: numberFormat.format(listedSingleCount) });
});

// ── Overview
const overviewGroups = computed(() => {
    const row = columnRow.value;
    if (row == null) return [];
    const labels = headers.value;
    return [
        {
            id: 'type',
            rows: [
                { label: labels.readingText, value: row.readingText },
                { label: labels.storageTypeLabel, value: row.storageTypeLabel }
            ]
        },
        {
            id: 'values',
            rows: [
                { label: labels.uniqueText, value: row.uniqueText },
                { label: labels.quotedValueText, value: row.quotedValueText },
                { label: labels.paddedValueText, value: row.paddedValueText }
            ]
        },
        {
            id: 'range',
            rows: [
                { label: labels.minValueText, value: row.minValueText },
                { label: labels.maxValueText, value: row.maxValueText },
                { label: labels.wholeDigitText, value: row.wholeDigitText },
                { label: labels.decimalText, value: row.decimalText }
            ]
        }
    ]
        .map((group) => ({ ...group, rows: group.rows.filter((groupRow) => groupRow.value !== '') }))
        .filter((group) => group.rows.length > 0);
});

// ── Tabs ─ A tab with nothing to show is left out. The invalid count stays visible on Values, so a problem is not
// hidden.
const detailTabs = computed(() => {
    const invalidCount = columnConfig.value?.invalidValueCount ?? 0;
    return [
        { id: 'overview' as const, isShown: true, label: t(TEXT, 'tab.overview.label') },
        {
            id: 'values' as const,
            isShown: valueCount.value > 0,
            label: invalidCount > 0 ? t(TEXT, 'tab.values.count.label', { count: new Intl.NumberFormat(localeId.value).format(invalidCount) }) : t(TEXT, 'tab.values.label')
        },
        { id: 'formats' as const, isShown: formatRows.value.length > 0 || (columnRow.value?.sizeText ?? '') !== '', label: t(TEXT, 'tab.formats.label') }
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

// Numbers to four significant figures, because the ranges' edges fall wherever the values' spread puts them. Dates and
// times as written, without the parts of a second and the time zone mark.
function formatBinValue(value: string): string {
    if (/^\d{4}-\d{2}-\d{2}T/u.test(value)) return value.slice(0, 16).replace('T', ' ');
    if (/^\d{2}:\d{2}/u.test(value)) return value.slice(0, 8);
    const number = Number(value);
    return Number.isNaN(number) || /^\d{4}-\d{2}-\d{2}$/u.test(value) ? value : new Intl.NumberFormat(localeId.value, { maximumSignificantDigits: 4 }).format(number);
}

function constructCountRows(counts: Record<string, number> | undefined): { count: number; countText: string; id: string }[] {
    const numberFormat = new Intl.NumberFormat(localeId.value);
    return Object.entries(counts ?? {})
        .toSorted((left, right) => right[1] - left[1] || left[0].localeCompare(right[0], localeId.value)) // Equal counts in sort order, so the order never shifts between visits.
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
    largestCount: number
): CountBarRow[] {
    const constructBarRow = ({ count, countText, id }: { count: number; countText: string; id: string }): CountBarRow => ({
        barPercent: largestCount === 0 ? 0 : (count / largestCount) * 100,
        count,
        countText,
        key: `value:${id}`,
        label: id
    });
    const frequentRows = constructCountRows(frequentValues);
    const leastRows = constructCountRows(leastFrequentValues);
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
        <!-- Header ─ Stays in place, so only the tab's content scrolls. -->
        <!-- Navigation comes first because in a panel narrower than '@2xl' it is the top row, with the tabs under it,
             and its search stretches so the row spans the panel. From '@2xl' the two share one row, with the tabs on the
             left. The panel's own width decides, not the screen's, because it can sit beside the column list on any
             screen. -->
        <header class="flex flex-none flex-col border-b border-separator px-4 pt-2 @2xl:flex-row @2xl:items-end @2xl:gap-x-4">
            <div class="flex items-center justify-end gap-x-2 @2xl:order-2 @2xl:flex-none @2xl:pb-1">
                <template v-if="canStepColumns">
                    <!-- '-ml-1' cancels the button's padding, so in a narrow panel, where it starts the row, its icon
                         lines up with the page edge as the toolbar's icons do. -->
                    <ActionWrapper
                        :aria-label="t(TEXT, 'previous.aria')"
                        class="-ml-1 rounded-md p-1 enabled:hover:state-hover @2xl:ml-0"
                        :disabled="!hasPreviousColumn"
                        @click="emit('step', -1)"
                    >
                        <ChevronLeftIcon aria-hidden="true" class="size-5" :stroke-width="1.5" />
                    </ActionWrapper>
                    <ComboboxInput
                        v-if="columnSearchOptions.length > 1"
                        class="min-w-0 flex-1 @2xl:w-40 @2xl:flex-none"
                        :empty-text="t(TEXT, 'columnSearch.empty.text')"
                        :label="t(TEXT, 'columnSearch.aria')"
                        :options="columnSearchOptions"
                        :placeholder="t(TEXT, 'columnSearch.placeholder')"
                        @select="emit('select', Number($event.id))"
                    >
                        <template #option-icon="{ option }">
                            <TriangleAlertIcon
                                v-if="option.needsAttention"
                                :aria-label="t(TEXT, 'columnAttention.aria')"
                                class="size-4 flex-none text-warning-text"
                                role="img"
                                :stroke-width="1.5"
                            />
                        </template>
                    </ComboboxInput>
                    <ActionWrapper :aria-label="t(TEXT, 'next.aria')" class="rounded-md p-1 enabled:hover:state-hover" :disabled="!hasNextColumn" @click="emit('step', 1)">
                        <ChevronRightIcon aria-hidden="true" class="size-5" :stroke-width="1.5" />
                    </ActionWrapper>
                </template>
                <!-- '-mr-1.75' cancels the button's padding, so its icon lines up with the page edge as the toolbar's
                     icons do. -->
                <CloseButton :accessible-label="t(TEXT, 'close.aria')" class="-mr-1.75" @click="emit('close')" />
            </div>

            <div ref="tabList" :aria-label="t(TEXT, 'tabs.aria')" class="mt-1 -mb-px flex min-w-0 gap-x-3 overflow-x-auto @2xl:order-1 @2xl:mt-0 @2xl:flex-1" role="tablist">
                <ActionWrapper
                    v-for="(tab, tabIndex) in detailTabs"
                    :key="tab.id"
                    :aria-selected="tab.id === currentTabId"
                    class="flex-none border-b-2 py-1 text-sm whitespace-nowrap"
                    :class="tab.id === currentTabId ? 'border-b-content text-emphasis' : 'border-b-transparent text-muted'"
                    role="tab"
                    :tabindex="tab.id === currentTabId ? 0 : -1"
                    @click="selectedTabId = tab.id"
                    @keydown="handleNavigateTabs($event, tabIndex)"
                >
                    {{ tab.label }}
                </ActionWrapper>
            </div>
        </header>

        <div class="min-h-0 flex-1 overflow-y-auto px-4 pt-3 pb-[calc(var(--vertical-scroll-bottom-screen-inset)-var(--status-bar-height))] text-sm" role="tabpanel">
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
                    <SelectInput
                        v-if="decimalSeparatorOptions.length > 0 && decimalSeparatorValue != null"
                        class="mt-2"
                        :disabled="isTypeDisabled"
                        :label="t(TEXT, 'decimalSeparator.label')"
                        :model-value="decimalSeparatorValue"
                        :options="decimalSeparatorOptions"
                        @update:model-value="emit('update:decimalSeparatorValue', $event)"
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
                </div>

                <!-- Figures -->
                <dl v-for="group in overviewGroups" :key="group.id" class="m-0 grid grid-cols-[minmax(7.5rem,max-content)_1fr] *:border-b *:border-separator *:py-1 [&>dt]:pr-4">
                    <template v-for="groupRow in group.rows" :key="groupRow.label">
                        <dt class="text-muted">{{ groupRow.label }}</dt>
                        <dd class="m-0 min-w-0 wrap-break-word">{{ groupRow.value }}</dd>
                    </template>
                </dl>
            </div>

            <!-- Values ─ Invalid values first, because they are the ones to act on, then the valid values. -->
            <template v-else-if="currentTabId === 'values'">
                <template v-if="(columnConfig?.invalidValueCount ?? 0) > 0">
                    <h3 class="m-0 text-sm font-medium">
                        {{ invalidValuesLabel }}
                    </h3>
                    <!-- The examples stand in for the bars when the engine has no counts for the invalid values: an
                         audit from before it kept them, or a column with too many values to count. -->
                    <CountBarList v-if="invalidChartRows.length > 0" :bar-color-class="INVALID_BAR_COLOR_CLASS" class="mt-1.5" :rows="invalidChartRows" />
                    <ul v-else class="mt-1 mb-0 list-none p-0">
                        <li v-for="sample in invalidSamples" :key="sample" class="border-b border-separator py-1 wrap-anywhere">{{ sample }}</li>
                    </ul>
                </template>
                <h3 class="mb-0 text-sm font-medium" :class="(columnConfig?.invalidValueCount ?? 0) > 0 ? 'mt-4' : 'mt-0'">
                    {{ validValuesLabel }}
                </h3>
                <CountBarList v-if="hasValueBins" :bar-color-class="VALID_BAR_COLOR_CLASS" class="mt-1.5" :rows="binChartRows" />
                <p v-else-if="hasTooManyValues" class="mt-1 mb-0 text-muted">
                    {{ t(TEXT, 'tooManyValues.text', { limit: new Intl.NumberFormat(localeId).format(COUNTED_VALUE_LIMIT) }) }}
                </p>
                <template v-else>
                    <CountBarList :bar-color-class="VALID_BAR_COLOR_CLASS" class="mt-1.5" :rows="validChartRows" />
                    <p v-if="singleValuesText" class="mt-2 mb-0 text-muted">{{ singleValuesText }}</p>
                </template>
                <template v-if="hasValueBins || hasTooManyValues">
                    <template v-for="list in edgeChartLists" :key="list.id">
                        <h4 class="mt-3 mb-0 text-sm font-normal text-muted">{{ list.label }}</h4>
                        <CountBarList :bar-color-class="VALID_BAR_COLOR_CLASS" class="mt-1" :rows="list.rows" />
                    </template>
                </template>
            </template>

            <!-- Formats ─ Every format up to the limit, most common first, as bars like the Values tab's. A note under
                 them gives the shortest and longest values, because a run of four or more letters is written with its
                 count ('x(5)'), so the formats do not show every length. -->
            <template v-else-if="currentTabId === 'formats'">
                <CountBarList :bar-color-class="VALID_BAR_COLOR_CLASS" :label="headers.formatText" :rows="formatChartRows" />
                <p v-if="otherFormatsText" class="mt-2 mb-0 text-muted">{{ otherFormatsText }}</p>
                <p v-if="columnRow?.sizeText" class="mt-2 mb-0 text-muted">{{ t(TEXT, 'length.text', { range: columnRow.sizeText }) }}</p>
            </template>
        </div>
    </section>
</template>
