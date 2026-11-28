<script setup lang="ts">
// ── External Dependencies & Registrations
import { computed } from 'vue';
import { AsteriskIcon, EqualApproximatelyIcon, FingerprintPatternIcon, KeyRoundIcon, TagsIcon } from '@lucide/vue';

// ── Local Framework
import { assertDefined } from '@/utilities/index.ts';
import { isDerivedColumn } from '@/features/studio/dataViews/_state/dataViewColumns';
import type { ItemReading } from '@/features/studio/dataViews/_state/dataViewColumns';
import { TEXT } from './PreviewColumnTable_.json';
import { COLUMN_VALUE_SEGMENTS, type ColumnValueCounts, constructColumnFacts, constructColumnValueCounts, constructDecimalLengthParts } from './previewColumnRows';
import { constructMostCommonFormat, constructPreviewColumnHeaders, constructPreviewColumnIcons, constructPreviewColumnRows } from './previewColumnRows';
import { localeId, t } from '@/state/locale';
import { type PreviewColumnRow, THIN_SPACE } from './previewColumnRows';

// ── Static Components
import ScrollRegion from '@/components/ui/scroll/ScrollRegion.vue';

// ── Types ────────────────────────────────────────────────────────────────────────────────────────────────────────────

type ValueKindId = 'invalid' | 'missing' | 'valid';

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

// The facts after the values, in the order they are read: how many differ, then how the values are written.
const PROPERTY_KEYS: (keyof PreviewColumnRow)[] = ['distinctValueText', 'lengthText', 'notationText', 'formatText'];

// The kinds of value a bar shows, in its order. Blank, empty and null values are one kind, missing, because each loads
// as no value. Each takes the colour the column tab's bar gives it, and missing takes the colour of an empty value.
const VALUE_KINDS: { colorClass: string; countValues: (counts: ColumnValueCounts) => number; id: ValueKindId }[] = [
    { colorClass: findSegmentColorClass('validCount'), countValues: (counts) => counts.validCount, id: 'valid' },
    { colorClass: findSegmentColorClass('invalidCount'), countValues: (counts) => counts.invalidCount, id: 'invalid' },
    { colorClass: findSegmentColorClass('emptyCount'), countValues: (counts) => counts.blankCount + counts.emptyCount + counts.nullCount, id: 'missing' }
];

// The format bar's colours: the most common format in the green of a valid value, and every other in the grey of a
// missing one.
const MOST_COMMON_FORMAT_COLOR_CLASS = findSegmentColorClass('validCount');
const OTHER_FORMAT_COLOR_CLASS = findSegmentColorClass('emptyCount');

// ── Options, Props, Slots & Emits ────────────────────────────────────────────────────────────────────────────────────

const { isAuditComplete, isLabelShown, itemReading, rowLimit } = defineProps<{
    isAuditComplete?: boolean; // The whole item has been audited, so whether a column is a key, unique, mandatory or coded is settled.
    isLabelShown?: boolean; // Shows the table's title above it. Leave it off where a heading already names the table.
    itemReading: Pick<ItemReading, 'columnConfigs' | 'hasHeaders'>;
    rowLimit?: number; // The first rows to show. Every row when undefined.
}>();

// ── Derived State ────────────────────────────────────────────────────────────────────────────────────────────────────

const columnHeaders = computed(() => constructPreviewColumnHeaders());
const columnIcons = computed(() => constructPreviewColumnIcons(itemReading));
const numberFormat = computed(() => new Intl.NumberFormat(localeId.value));

// One row per column of the item: its name, its type and marks, its values, then its other facts. A derived column,
// such as a column of units, only holds values for another column, so it gets no row.
const columnRows = computed(() => {
    const rows = constructPreviewColumnRows(itemReading);
    const valueCounts = constructColumnValueCounts(itemReading);
    const itemColumnRows = rows.map((row, index) => {
        const facts = constructColumnFacts(itemReading, index, undefined, isAuditComplete);
        const counts = valueCounts.at(index);
        const columnConfig = itemReading.columnConfigs.at(index);
        const segments = counts == null ? [] : VALUE_KINDS.map((kind) => ({ ...kind, count: kind.countValues(counts) })); // Every kind, a count of none included, so no count is ever hidden.
        return {
            ...row,
            icon: columnIcons.value[index]?.dataSubtypeIcon ?? columnIcons.value[index]?.dataTypeIcon,
            decimalLengthParts: columnConfig == null ? undefined : constructDecimalLengthParts(columnConfig),
            mostCommonFormat: constructMostCommonFormat(columnConfig?.validFormats),
            isDistinctEstimated: columnConfig?.validCountsAreEstimated === true, // The engine stops counting exactly once a column holds too many distinct values.
            isCoded: isAuditComplete && columnConfig?.isCoded === true, // The engine marks a column of codes and leaves any other unmarked.
            isKey: facts.isKey === true,
            isMandatory: facts.isMandatory === true,
            isUnique: facts.isUnique === true,
            segments,
            typeText: row.dataSubtypeLabel === '' ? row.dataTypeLabel : row.dataSubtypeLabel, // The subtype says more, such as 'Integer' for a number, so it stands for the type when there is one.
            valuesText: new Intl.ListFormat(localeId.value, { style: 'short', type: 'unit' }).format(
                segments.map((segment) => t(TEXT, 'values.part.text', { count: numberFormat.value.format(segment.count), label: constructValueKindLabel(segment.id) }))
            )
        };
    });
    return itemColumnRows.filter((_row, index) => !isDerivedColumn(assertDefined(itemReading.columnConfigs[index])));
});
const shownColumnRows = computed(() => (rowLimit == null ? columnRows.value : columnRows.value.slice(0, rowLimit)));
const legendSegments = computed(() => VALUE_KINDS.map((kind) => ({ ...kind, label: constructValueKindLabel(kind.id) })));
// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

function findSegmentColorClass(segmentId: keyof ColumnValueCounts): string {
    return assertDefined(COLUMN_VALUE_SEGMENTS.find((segment) => segment.id === segmentId)).colorClass;
}

function constructValueKindLabel(valueKindId: ValueKindId): string {
    if (valueKindId === 'valid') return columnHeaders.value.validValueText;
    if (valueKindId === 'invalid') return columnHeaders.value.invalidValueText;
    return t(TEXT, 'values.missing.label');
}
</script>

<template>
    <div data-region="PreviewColumnTable">
        <!-- Scrolls sideways on its own, so a wide item does not widen the document. A shown title sits above the region's
             frame, which a caption inside the table cannot, and names the table. -->
        <ScrollRegion v-slot="{ labelId }" :is-label-shown="isLabelShown" :label="t(TEXT, 'columnTable.title')">
            <table :aria-labelledby="labelId" class="text-sm whitespace-nowrap">
                <!-- Header ─ The Values and Format headers carry the legend of their bars under their titles, so the colours
                     are named where they are read. The legends are hidden from screen readers, because each cell
                     already names its counts in words. Every title sits at the top, so the titles line up across the row
                     whether or not a legend is under them. -->
                <thead>
                    <tr class="text-left align-top">
                        <th class="py-1 pr-4 font-normal text-muted">{{ columnHeaders.label }}</th>
                        <th class="py-1 pr-4 font-normal text-muted">{{ t(TEXT, 'type.label') }}</th>
                        <th class="py-1 pr-4 font-normal text-muted">
                            {{ t(TEXT, 'values.label') }}
                            <span aria-hidden="true" class="mt-0.5 flex gap-x-2 text-xs">
                                <span v-for="segment in legendSegments" :key="segment.id" class="flex items-center gap-x-1">
                                    <span class="size-2 rounded-full" :class="segment.colorClass" />
                                    {{ segment.label }}
                                </span>
                            </span>
                        </th>
                        <th v-for="key in PROPERTY_KEYS" :key="key" class="py-1 pr-4 font-normal text-muted" :class="{ 'text-right': key === 'distinctValueText' }">
                            {{ columnHeaders[key] }}
                            <!-- Length Key ─ A length is a range, shortest to longest, and a number with decimal places shows
                                 two. The key is written as such a cell is, with the separator in extra bold and the decimal
                                 places in italics, so it says which range is which. -->
                            <span v-if="key === 'lengthText'" aria-hidden="true" class="mt-0.5 block text-xs"
                                >{{ t(TEXT, 'length.range.label') }}{{ THIN_SPACE }}<span class="font-extrabold">.</span>{{ THIN_SPACE
                                }}<span class="italic">{{ t(TEXT, 'length.decimals.label') }}</span></span
                            >
                            <span v-if="key === 'formatText'" aria-hidden="true" class="mt-0.5 flex gap-x-2 text-xs">
                                <span class="flex items-center gap-x-1">
                                    <span class="size-2 rounded-full" :class="MOST_COMMON_FORMAT_COLOR_CLASS" />
                                    {{ t(TEXT, 'format.mostCommon.label') }}
                                </span>
                                <span class="flex items-center gap-x-1">
                                    <span class="size-2 rounded-full" :class="OTHER_FORMAT_COLOR_CLASS" />
                                    {{ t(TEXT, 'format.other.label') }}
                                </span>
                            </span>
                        </th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="(columnRow, index) in shownColumnRows" :key="index">
                        <td class="py-1 pr-4">{{ columnRow.label }}</td>
                        <!-- Type ─ With the marks the column's tab shows, at the end of the cell so the types line up. A mark
                             shows only what the audit has settled. A key shows in place of the fingerprint, because a key
                             is unique too. -->
                        <td class="py-1 pr-4">
                            <span class="flex items-center gap-x-1.5">
                                <component :is="columnRow.icon" aria-hidden="true" class="size-4 flex-none text-muted" :stroke-width="1.75" />
                                <span>{{ columnRow.typeText }}</span>
                                <span class="ml-auto flex items-center gap-x-0.5 pl-2 text-muted">
                                    <span v-if="columnRow.isKey" :aria-label="t(TEXT, 'key.aria')" role="img" :title="t(TEXT, 'key.aria')">
                                        <KeyRoundIcon aria-hidden="true" class="size-3.5" :stroke-width="2" />
                                    </span>
                                    <span v-else-if="columnRow.isUnique" :aria-label="t(TEXT, 'unique.aria')" role="img" :title="t(TEXT, 'unique.aria')">
                                        <FingerprintPatternIcon aria-hidden="true" class="size-3.5" :stroke-width="2" />
                                    </span>
                                    <span v-if="columnRow.isMandatory" :aria-label="t(TEXT, 'mandatory.aria')" role="img" :title="t(TEXT, 'mandatory.aria')">
                                        <AsteriskIcon aria-hidden="true" class="size-3.5" :stroke-width="2" />
                                    </span>
                                    <span v-if="columnRow.isCoded" :aria-label="t(TEXT, 'coded.aria')" role="img" :title="t(TEXT, 'coded.aria')">
                                        <TagsIcon aria-hidden="true" class="size-3.5" :stroke-width="2" />
                                    </span>
                                </span>
                            </span>
                        </td>
                        <!-- Values ─ A bar of each kind of value in the colours of the column tab's bar, every bar the same
                             width so the rows compare, with each kind's count under it. Screen readers hear each count
                             named, because the colours alone do not say what they are. 'relative' keeps the hidden text
                             inside the scroller, or iOS Safari scrolls the whole page sideways. -->
                        <td class="relative py-1 pr-4">
                            <template v-if="columnRow.segments.some((segment) => segment.count > 0)">
                                <span aria-hidden="true" class="flex h-2 w-40 gap-px overflow-hidden rounded-full">
                                    <span
                                        v-for="segment in columnRow.segments.filter(({ count }) => count > 0)"
                                        :key="segment.id"
                                        class="min-w-0.5 basis-0"
                                        :class="segment.colorClass"
                                        :style="{ flexGrow: segment.count }"
                                    />
                                </span>
                                <span aria-hidden="true" class="mt-0.5 flex gap-x-2 text-xs text-muted tabular-nums">
                                    <span v-for="segment in columnRow.segments" :key="segment.id" class="flex items-center gap-x-1">
                                        <span class="size-2 rounded-full" :class="segment.colorClass" />
                                        {{ numberFormat.format(segment.count) }}
                                    </span>
                                </span>
                                <span class="sr-only">{{ columnRow.valuesText }}</span>
                            </template>
                        </td>
                        <td
                            v-for="key in PROPERTY_KEYS"
                            :key="key"
                            class="relative py-1 pr-4"
                            :class="{ 'text-right': key === 'distinctValueText', 'tabular-nums': key === 'distinctValueText' || key === 'lengthText' }"
                        >
                            <!-- An estimated count is marked with ≈ before it, named for screen readers and on hover. -->
                            <span v-if="key === 'distinctValueText' && columnRow.isDistinctEstimated" class="inline-flex items-center">
                                <span :aria-label="t(TEXT, 'distinct.estimated.aria')" class="text-muted" role="img" :title="t(TEXT, 'distinct.estimated.aria')">
                                    <EqualApproximatelyIcon aria-hidden="true" class="size-3.5" :stroke-width="2" />
                                </span>
                                {{ columnRow[key] }}
                            </span>
                            <!-- A number's separator is extra bold, because a dot is too small to see otherwise, and its decimal
                                 places are italic, so the two ranges read apart. -->
                            <span v-else-if="key === 'lengthText' && columnRow.decimalLengthParts"
                                >{{ columnRow.decimalLengthParts.wholeDigitsText }}{{ THIN_SPACE }}<span class="font-extrabold">{{
                                    columnRow.decimalLengthParts.separator
                                }}</span
                                >{{ THIN_SPACE }}<span class="italic">{{ columnRow.decimalLengthParts.decimalsText }}</span></span
                            >
                            <!-- Format ─ The most common format, with a bar of how many values have it, in green, against how
                                 many have any other format, in grey, and their counts beside it. Screen readers hear the
                                 counts in words. 'relative' on the cell keeps the hidden text inside the scroller. -->
                            <span v-else-if="key === 'formatText' && columnRow.mostCommonFormat" class="block">
                                {{ columnRow.mostCommonFormat.format }}
                                <span aria-hidden="true" class="mt-0.5 flex items-center gap-x-2 text-xs text-muted tabular-nums">
                                    <span class="flex h-1.5 w-16 gap-px overflow-hidden rounded-full">
                                        <span class="min-w-0.5 basis-0" :class="MOST_COMMON_FORMAT_COLOR_CLASS" :style="{ flexGrow: columnRow.mostCommonFormat.count }" />
                                        <span
                                            v-if="columnRow.mostCommonFormat.otherCount > 0"
                                            class="min-w-0.5 basis-0"
                                            :class="OTHER_FORMAT_COLOR_CLASS"
                                            :style="{ flexGrow: columnRow.mostCommonFormat.otherCount }"
                                        />
                                    </span>
                                    <span class="flex items-center gap-x-1">
                                        <span class="size-2 rounded-full" :class="MOST_COMMON_FORMAT_COLOR_CLASS" />
                                        {{ numberFormat.format(columnRow.mostCommonFormat.count) }}
                                    </span>
                                    <span class="flex items-center gap-x-1">
                                        <span class="size-2 rounded-full" :class="OTHER_FORMAT_COLOR_CLASS" />
                                        {{ numberFormat.format(columnRow.mostCommonFormat.otherCount) }}
                                    </span>
                                </span>
                                <span class="sr-only">{{
                                    t(TEXT, 'format.counts.text', {
                                        count: numberFormat.format(columnRow.mostCommonFormat.count),
                                        other: numberFormat.format(columnRow.mostCommonFormat.otherCount)
                                    })
                                }}</span>
                            </span>
                            <template v-else>{{ columnRow[key] }}</template>
                        </td>
                    </tr>
                </tbody>
            </table>
        </ScrollRegion>
    </div>
</template>
