<script setup lang="ts">
// ── External Dependencies & Registrations
import { ChevronLeftIcon, ChevronRightIcon } from '@lucide/vue';
import { computed, nextTick, ref, useTemplateRef } from 'vue';

// ── DPUse Framework
import type { ObjectColumnConfig } from '@dpuse/dpuse-shared';

// ── Local Framework
import { TEXT } from './ColumnDetailPanel_.json';
import { type ColumnType, constructColumnTypeId, type ItemReading } from '@/features/studio/dataViews/_dataViewColumns';
import { constructColumnTypeLabel, constructPreviewColumnHeaders, constructPreviewColumnRows, type PreviewColumnRow } from '@/features/studio/dataViews/_previewColumnRows';
import { localeId, t } from '@/state/locale';

// ── Static Components
import ActionWrapper from '@/components/ui/action/ActionWrapper.vue';
import CloseButton from '@/components/ui/action/CloseButton.vue';
import SelectInput from '@/components/ui/SelectInput.vue';
import type { SelectOption } from '@/components/ui/SelectInput.vue';

// ── Types ────────────────────────────────────────────────────────────────────────────────────────────────────────────

type DetailTabId = 'formats' | 'frequent' | 'overview' | 'samples';

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

const COLLAPSED_LIST_ROW_COUNT = 10; // Rows a long list shows until the user asks for the rest.

// ── Options, Props, Slots & Emits ────────────────────────────────────────────────────────────────────────────────────

const { canStepColumns, columnIndex, detectedColumnType, isTypeDisabled, itemReading, sourceText, typeOptions, typeValue } = defineProps<{
    canStepColumns?: boolean; // Filling the space hides the table, so Previous and Next take its place.
    columnIndex: number;
    detectedColumnType: ColumnType | undefined;
    isTypeDisabled?: boolean;
    itemReading: ItemReading;
    sourceText: string; // What the figures describe: how much of the item was audited.
    typeOptions: SelectOption[];
    typeValue: string;
}>();
const emit = defineEmits<{ close: []; step: [columnIndex: number]; 'update:typeValue': [typeValue: string] }>();

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
                { label: labels.validValueText, value: row.validValueText },
                { label: labels.invalidValueText, value: row.invalidValueText },
                { label: labels.blankValueText, value: row.blankValueText },
                { label: labels.missingValueText, value: row.missingValueText },
                { label: labels.distinctValueText, value: row.distinctValueText },
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

function constructCountRows(counts: Record<string, number> | undefined): { countText: string; id: string }[] {
    const numberFormat = new Intl.NumberFormat(localeId.value);
    return Object.entries(counts ?? {})
        .toSorted((left, right) => right[1] - left[1])
        .map(([id, count]) => ({ countText: numberFormat.format(count), id }));
}
</script>

<template>
    <section class="flex min-h-0 min-w-0 flex-col" :aria-label="columnRow?.label" data-region="ColumnDetailPanel">
        <!-- Header ─ Stays in place, so only the tab's content scrolls. -->
        <header class="flex-none border-b border-separator px-4 pt-2">
            <div class="flex items-center gap-x-2">
                <h2 class="m-0 min-w-0 flex-1 truncate border-0 p-0 text-base">{{ columnRow?.label }}</h2>
                <template v-if="canStepColumns">
                    <ActionWrapper
                        :aria-label="t(TEXT, 'previous.aria')"
                        class="rounded-md p-1 enabled:hover:state-hover"
                        :disabled="columnIndex === 0"
                        @click="emit('step', columnIndex - 1)"
                    >
                        <ChevronLeftIcon aria-hidden="true" class="size-5" :stroke-width="1.5" />
                    </ActionWrapper>
                    <ActionWrapper
                        :aria-label="t(TEXT, 'next.aria')"
                        class="rounded-md p-1 enabled:hover:state-hover"
                        :disabled="columnIndex === itemReading.columnConfigs.length - 1"
                        @click="emit('step', columnIndex + 1)"
                    >
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

        <div class="min-h-0 flex-1 overflow-y-auto px-4 pt-3 pb-(--vertical-scroll-bottom-screen-inset) text-sm" role="tabpanel">
            <!-- Overview -->
            <template v-if="currentTabId === 'overview'">
                <SelectInput
                    :disabled="isTypeDisabled"
                    :label="t(TEXT, 'type.label')"
                    :model-value="typeValue"
                    :options="typeOptions"
                    @update:model-value="emit('update:typeValue', $event)"
                />
                <p v-if="detectedTypeText" class="mt-1 mb-0 text-muted" role="status">{{ detectedTypeText }}</p>
                <dl v-for="group in overviewGroups" :key="group.id" class="mt-3 grid grid-cols-[minmax(7.5rem,max-content)_1fr] *:border-b *:border-separator *:py-1 [&>dt]:pr-4">
                    <template v-for="groupRow in group.rows" :key="groupRow.label">
                        <dt class="text-muted">{{ groupRow.label }}</dt>
                        <dd class="m-0 min-w-0 wrap-break-word">{{ groupRow.value }}</dd>
                    </template>
                </dl>
            </template>

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
