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
    type PreviewColumnRow
} from '@/features/studio/dataViews/_previewColumnRows';
import { type ColumnType, constructColumnTypeId, type ItemReading } from '@/features/studio/dataViews/_dataViewColumns';
import { localeId, t } from '@/state/locale';

// ── Static Components
import ActionWrapper from '@/components/ui/action/ActionWrapper.vue';
import CloseButton from '@/components/ui/action/CloseButton.vue';
import ComboboxInput from '@/components/ui/ComboboxInput.vue';
import SelectInput from '@/components/ui/SelectInput.vue';
import type { SelectOption } from '@/components/ui/SelectInput.vue';

// ── Types ────────────────────────────────────────────────────────────────────────────────────────────────────────────

type DetailTabId = 'formats' | 'frequent' | 'overview' | 'samples';

export interface ColumnSearchOption {
    id: string; // The column's position in the item, as text.
    label: string;
    needsAttention: boolean; // Has invalid values or an ambiguous number format, so the list marks it as the table does.
}

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

const COLLAPSED_LIST_ROW_COUNT = 10; // Rows a long list shows until the user asks for the rest.
const CHART_ROW_COUNT = 5; // Bars in each Overview chart. The Frequent and Formats tabs list them all.

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
    sourceText,
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
    sourceText: string; // What the figures describe: how much of the item was audited.
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
const listsAreExpanded = ref(false);
const tabListElement = useTemplateRef<HTMLDivElement>('tabList');

// ── Derived State ────────────────────────────────────────────────────────────────────────────────────────────────────

// ── Column
const columnConfig = computed((): ObjectColumnConfig | undefined => itemReading.columnConfigs[columnIndex]);
const columnRow = computed((): PreviewColumnRow | undefined => constructPreviewColumnRows(itemReading)[columnIndex]);
const headers = computed(() => constructPreviewColumnHeaders());
const summaryText = computed(() => [columnRow.value?.dataTypeLabel, columnRow.value?.dataSubtypeLabel, sourceText].filter(Boolean).join(' · '));

// The detected type, shown only when it differs from the type in use, so a choice that disagrees with the data is seen.
const detectedTypeText = computed(() => {
    if (detectedColumnType == null || columnConfig.value == null || constructColumnTypeId(detectedColumnType) === constructColumnTypeId(columnConfig.value)) return;
    return t(TEXT, 'detected.text', { type: constructColumnTypeLabel(detectedColumnType) });
});

// ── Lists
const formatRows = computed(() => constructCountRows(columnConfig.value?.formats));
const typeCountRows = computed(() => constructCountRows(columnConfig.value?.inferenceCounts));
const frequentRows = computed(() => constructCountRows(columnConfig.value?.frequentValues));
const invalidSamples = computed(() => Object.keys(columnConfig.value?.invalidValues ?? {}));
const validSamples = computed(() => Object.keys(columnConfig.value?.validValues ?? {}));
const shownFrequentRows = computed(() => (listsAreExpanded.value ? frequentRows.value : frequentRows.value.slice(0, COLLAPSED_LIST_ROW_COUNT)));
const shownInvalidSamples = computed(() => (listsAreExpanded.value ? invalidSamples.value : invalidSamples.value.slice(0, COLLAPSED_LIST_ROW_COUNT)));
const shownValidSamples = computed(() => (listsAreExpanded.value ? validSamples.value : validSamples.value.slice(0, COLLAPSED_LIST_ROW_COUNT)));
const listsCanExpand = computed(() => [frequentRows.value, invalidSamples.value, validSamples.value].some((list) => list.length > COLLAPSED_LIST_ROW_COUNT));

// ── Charts ─ Each a single measure, so one colour and no legend beyond its labels. The value chart's colours mean a kind of
// value, so its labels name each one and give its count, and colour is never the only cue.
const valueSegments = computed(() => {
    const config = columnConfig.value;
    if (config == null) return [];
    const counts = { blankCount: config.blankValueCount, invalidCount: config.invalidValueCount, missingCount: config.missingValueCount, validCount: config.validValueCount };
    const labels = {
        blankCount: headers.value.blankValueText,
        invalidCount: headers.value.invalidValueText,
        missingCount: headers.value.missingValueText,
        validCount: headers.value.validValueText
    };
    const numberFormat = new Intl.NumberFormat(localeId.value);
    return COLUMN_VALUE_SEGMENTS.map((segment) => ({
        ...segment,
        count: counts[segment.id] ?? 0,
        countText: numberFormat.format(counts[segment.id] ?? 0),
        label: labels[segment.id]
    }));
});
const shownValueSegments = computed(() => valueSegments.value.filter((segment) => segment.count > 0));
const frequentChartRows = computed(() => constructChartRows(frequentRows.value));
const formatChartRows = computed(() => constructChartRows(formatRows.value));

// ── Overview
const overviewGroups = computed(() => {
    const row = columnRow.value;
    if (row == null) return [];
    const labels = headers.value;
    return [
        {
            id: 'type',
            rows: [
                { label: labels.matchText, value: row.matchText },
                { label: labels.readingText, value: row.readingText },
                { label: labels.storageTypeLabel, value: row.storageTypeLabel }
            ]
        },
        {
            id: 'values',
            rows: [
                { label: labels.distinctValueText, value: row.distinctValueText }, // The counts of each kind of value are in the value chart.
                { label: labels.requiredText, value: row.requiredText },
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
                { label: labels.sizeText, value: row.sizeText },
                { label: labels.wholeDigitText, value: row.wholeDigitText },
                { label: labels.decimalText, value: row.decimalText }
            ]
        }
    ]
        .map((group) => ({ ...group, rows: group.rows.filter((groupRow) => groupRow.value !== '') }))
        .filter((group) => group.rows.length > 0);
});

// ── Tabs ─ A tab with nothing to show is left out. The invalid count stays visible on Samples, so a problem is not hidden.
const detailTabs = computed(() => {
    const invalidCount = columnConfig.value?.invalidValueCount ?? 0;
    return [
        { id: 'overview' as const, isShown: true, label: t(TEXT, 'tab.overview.label') },
        { id: 'formats' as const, isShown: formatRows.value.length > 0 || typeCountRows.value.length > 0, label: t(TEXT, 'tab.formats.label') },
        { id: 'frequent' as const, isShown: frequentRows.value.length > 0, label: t(TEXT, 'tab.frequent.label') },
        {
            id: 'samples' as const,
            isShown: invalidSamples.value.length > 0 || validSamples.value.length > 0,
            label: invalidCount > 0 ? t(TEXT, 'tab.samples.count.label', { count: new Intl.NumberFormat(localeId.value).format(invalidCount) }) : t(TEXT, 'tab.samples.label')
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

function constructCountRows(counts: Record<string, number> | undefined): { count: number; countText: string; id: string }[] {
    const numberFormat = new Intl.NumberFormat(localeId.value);
    return Object.entries(counts ?? {})
        .toSorted((left, right) => right[1] - left[1])
        .map(([id, count]) => ({ count, countText: numberFormat.format(count), id }));
}

// The first rows of a list, longest first, each with its bar's length as a share of the longest.
function constructChartRows(rows: { count: number; countText: string; id: string }[]): { barPercent: number; countText: string; id: string }[] {
    const shownRows = rows.slice(0, CHART_ROW_COUNT);
    const largestCount = shownRows[0]?.count ?? 0;
    return shownRows.map((row) => ({ barPercent: largestCount === 0 ? 0 : (row.count / largestCount) * 100, countText: row.countText, id: row.id }));
}
</script>

<template>
    <section class="@container flex min-h-0 min-w-0 flex-col" :aria-label="columnRow?.label" data-region="ColumnDetailPanel">
        <!-- Header ─ Stays in place, so only the tab's content scrolls. -->
        <header class="flex-none border-b border-separator px-4 pt-2">
            <div class="flex items-center gap-x-2">
                <h2 class="m-0 min-w-0 flex-1 truncate border-0 p-0 text-base">{{ columnRow?.label }}</h2>
                <template v-if="canStepColumns">
                    <ActionWrapper :aria-label="t(TEXT, 'previous.aria')" class="rounded-md p-1 enabled:hover:state-hover" :disabled="!hasPreviousColumn" @click="emit('step', -1)">
                        <ChevronLeftIcon aria-hidden="true" class="size-5" :stroke-width="1.5" />
                    </ActionWrapper>
                    <ComboboxInput
                        v-if="columnSearchOptions.length > 1"
                        class="w-40 min-w-0 flex-none"
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
                <CloseButton :accessible-label="t(TEXT, 'close.aria')" @click="emit('close')" />
            </div>
            <p class="m-0 truncate text-sm text-muted">{{ summaryText }}</p>

            <div ref="tabList" :aria-label="t(TEXT, 'tabs.aria')" class="mt-1 -mb-px flex gap-x-3 overflow-x-auto" role="tablist">
                <ActionWrapper
                    v-for="(tab, tabIndex) in detailTabs"
                    :key="tab.id"
                    :aria-selected="tab.id === currentTabId"
                    class="flex-none border-b-2 py-1 text-sm whitespace-nowrap"
                    :class="tab.id === currentTabId ? 'border-b-accent text-accent' : 'border-b-transparent text-muted'"
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
            <!-- Overview ─ The charts first, as what people most often want, then the choices, then the figures. The
                 blocks flow into columns when the panel is wide, as it is over the table. -->
            <div v-if="currentTabId === 'overview'" class="grid items-start gap-x-8 gap-y-4 @3xl:grid-cols-2 @6xl:grid-cols-3">
                <!-- Values ─ The audit's counts, labelled with their numbers, so colour is never the only cue. -->
                <div v-if="shownValueSegments.length > 0">
                    <h3 class="m-0 text-sm font-medium">{{ t(TEXT, 'valueChart.label') }}</h3>
                    <span aria-hidden="true" class="mt-1.5 flex h-2 w-full gap-0.5 overflow-hidden rounded-full">
                        <span v-for="segment in shownValueSegments" :key="segment.id" class="min-w-1 basis-0" :class="segment.colorClass" :style="{ flexGrow: segment.count }" />
                    </span>
                    <ul class="mt-1.5 grid list-none grid-cols-[auto_1fr_auto] items-center gap-x-1.5 p-0">
                        <li v-for="segment in valueSegments" :key="segment.id" class="contents">
                            <span aria-hidden="true" class="size-2 rounded-full" :class="segment.colorClass" />
                            <span class="text-muted">{{ segment.label }}</span>
                            <span class="text-right tabular-nums">{{ segment.countText }}</span>
                        </li>
                    </ul>
                </div>

                <!-- Most Frequent and Formats ─ Five bars each. Their tabs list every one. -->
                <div
                    v-for="chart in [
                        { id: 'frequent', label: t(TEXT, 'frequentChart.label'), rows: frequentChartRows },
                        { id: 'formats', label: t(TEXT, 'formatChart.label'), rows: formatChartRows }
                    ].filter((candidate) => candidate.rows.length > 0)"
                    :key="chart.id"
                >
                    <h3 class="m-0 text-sm font-medium">{{ chart.label }}</h3>
                    <ul class="mt-1.5 grid list-none grid-cols-[minmax(0,10rem)_1fr_auto] items-center gap-x-2 gap-y-1 p-0">
                        <li v-for="row in chart.rows" :key="row.id" class="contents">
                            <span class="truncate" :title="row.id">{{ row.id }}</span>
                            <span aria-hidden="true" class="h-2" :title="row.countText">
                                <span class="block h-full rounded-r bg-[color-mix(in_srgb,var(--color-accent)_45%,var(--color-card))]" :style="{ width: `${row.barPercent}%` }" />
                            </span>
                            <span class="text-right tabular-nums">{{ row.countText }}</span>
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
                    <p v-if="detectedTypeText" class="mt-1 mb-0 text-muted" role="status">{{ detectedTypeText }}</p>
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

            <!-- Formats -->
            <template v-else-if="currentTabId === 'formats'">
                <template
                    v-for="list in [
                        { id: 'formats', rows: formatRows, title: headers.formatText },
                        { id: 'types', rows: typeCountRows, title: headers.typeCountText }
                    ]"
                    :key="list.id"
                >
                    <table v-if="list.rows.length > 0" class="mb-4 w-full">
                        <caption class="text-left font-medium">
                            {{
                                list.title
                            }}
                        </caption>
                        <tbody>
                            <tr v-for="row in list.rows" :key="row.id" class="border-b border-separator">
                                <td class="py-1 pr-4 wrap-anywhere">{{ row.id }}</td>
                                <td class="py-1 text-right">{{ row.countText }}</td>
                            </tr>
                        </tbody>
                    </table>
                </template>
            </template>

            <!-- Frequent Values -->
            <table v-else-if="currentTabId === 'frequent'" class="w-full">
                <caption class="text-left font-medium">
                    {{
                        headers.frequentValueText
                    }}
                </caption>
                <tbody>
                    <tr v-for="row in shownFrequentRows" :key="row.id" class="border-b border-separator">
                        <td class="py-1 pr-4 wrap-anywhere">{{ row.id }}</td>
                        <td class="py-1 text-right">{{ row.countText }}</td>
                    </tr>
                </tbody>
            </table>

            <!-- Samples ─ Invalid first, as the more useful of the two. -->
            <template v-else>
                <template
                    v-for="list in [
                        { id: 'invalid', samples: shownInvalidSamples, title: headers.invalidSampleText },
                        { id: 'valid', samples: shownValidSamples, title: headers.validSampleText }
                    ]"
                    :key="list.id"
                >
                    <template v-if="list.samples.length > 0">
                        <h3 class="m-0 text-sm font-medium">{{ list.title }}</h3>
                        <ul class="mb-4 list-none p-0">
                            <li v-for="sample in list.samples" :key="sample" class="border-b border-separator py-1 wrap-anywhere">{{ sample }}</li>
                        </ul>
                    </template>
                </template>
            </template>

            <ActionWrapper
                v-if="listsCanExpand && (currentTabId === 'frequent' || currentTabId === 'samples')"
                :aria-expanded="listsAreExpanded"
                class="mt-2 text-accent hover:underline"
                @click="listsAreExpanded = !listsAreExpanded"
            >
                {{ t(TEXT, listsAreExpanded ? 'showFewer.label' : 'showAll.label') }}
            </ActionWrapper>
        </div>
    </section>
</template>
