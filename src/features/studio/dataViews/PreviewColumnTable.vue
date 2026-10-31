<script setup lang="ts">
// ── External Dependencies & Registrations
import { computed } from 'vue';

// ── DPUse Framework
import type { DataSubtypeId, DataTypeId, PreviewConfig } from '@dpuse/dpuse-shared';

// ── Local Framework
import { TEXT } from './PreviewColumnTable_.json';
import { localeId, t } from '@/state/locale';

// ── Static Components
import ScrollRegion from '@/components/ui/scroll/ScrollRegion.vue';

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

const DATA_TYPE_LABEL_KEYS: Record<DataTypeId, keyof typeof TEXT> = {
    boolean: 'dataType.boolean.label',
    numeric: 'dataType.numeric.label',
    string: 'dataType.string.label',
    temporal: 'dataType.temporal.label',
    unknown: 'dataType.unknown.label'
};

const DATA_SUBTYPE_LABEL_KEYS: Record<DataSubtypeId, keyof typeof TEXT> = {
    bigint: 'dataSubtype.bigint.label',
    date: 'dataSubtype.date.label',
    dateTime: 'dataSubtype.dateTime.label',
    decimal: 'dataSubtype.decimal.label',
    email: 'dataSubtype.email.label',
    integer: 'dataSubtype.integer.label',
    ipv4: 'dataSubtype.ipv4.label',
    ipv6: 'dataSubtype.ipv6.label',
    plain: 'dataSubtype.plain.label',
    time: 'dataSubtype.time.label',
    ulid: 'dataSubtype.ulid.label',
    url: 'dataSubtype.url.label',
    uuid: 'dataSubtype.uuid.label'
};

// ── Options, Props, Slots & Emits ────────────────────────────────────────────────────────────────────────────────────

const { isLabelShown, previewConfig, rowLimit } = defineProps<{
    isLabelShown?: boolean; // Shows the table's title above it. Leave it off where a heading already names the table.
    previewConfig: PreviewConfig;
    rowLimit?: number; // The first rows to show. Every row when undefined.
}>();

// ── Derived State ────────────────────────────────────────────────────────────────────────────────────────────────────

// The match is the share of sampled values, the header excluded, that fitted the column's type, as the engine counts it
// when it chooses.
const columnRows = computed(() => {
    const percentFormat = new Intl.NumberFormat(localeId.value, { style: 'percent', maximumFractionDigits: 0 });
    return previewConfig.columnConfigs.map((columnConfig, index) => {
        const sampleCounts = Object.entries(columnConfig.inferenceCounts).map(([inferenceTypeId, count]) => ({
            inferenceTypeId,
            count: previewConfig.hasHeaders === true ? count - (columnConfig.leadingInferenceCounts[inferenceTypeId] ?? 0) : count
        }));
        const total = sampleCounts.reduce((sum, sampleCount) => sum + sampleCount.count, 0);
        const count = countColumnMatches(columnConfig.dataTypeId, sampleCounts, total);
        return {
            label: columnConfig.label[localeId.value] ?? columnConfig.label.en ?? String(index + 1),
            dataTypeLabel: t(TEXT, DATA_TYPE_LABEL_KEYS[columnConfig.dataTypeId]),
            dataSubtypeLabel:
                columnConfig.dataSubtypeId === undefined || columnConfig.dataSubtypeId === 'plain' ? '' : t(TEXT, DATA_SUBTYPE_LABEL_KEYS[columnConfig.dataSubtypeId]), // Plain text has no special format, so it gets no subtype label and real subtypes stand out.
            matchText: formatMatchText(count, total, percentFormat)
        };
    });
});
const shownColumnRows = computed(() => (rowLimit == null ? columnRows.value : columnRows.value.slice(0, rowLimit)));

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

// A full match is just '100%'. The counts are only added below that, so a weak guess stands out.
// A column takes its main type, so every subtype of that type matches. Text fits any value.
function countColumnMatches(dataTypeId: DataTypeId, sampleCounts: { count: number; inferenceTypeId: string }[], total: number): number {
    if (dataTypeId === 'string') return total;
    let matchCount = 0;
    for (const { count, inferenceTypeId } of sampleCounts) if (inferenceTypeId === dataTypeId || inferenceTypeId.startsWith(`${dataTypeId}.`)) matchCount += count;
    return matchCount;
}

function formatMatchText(count: number, total: number, percentFormat: Intl.NumberFormat): string {
    if (total === 0) return '';
    const percent = percentFormat.format(count / total);
    return count === total ? percent : t(TEXT, 'column.match.text', { percent, count, total });
}
</script>

<template>
    <!-- Scrolls sideways on its own, so a wide item does not widen the document. A shown title sits above the region's frame,
         which a caption inside the table cannot, and names the table. -->
    <ScrollRegion v-slot="{ labelId }" :is-label-shown="isLabelShown" :label="t(TEXT, 'columnTable.title')">
        <table :aria-labelledby="labelId" class="text-sm whitespace-nowrap">
            <thead>
                <tr class="text-left">
                    <th class="py-1 pr-4 font-normal text-muted">{{ t(TEXT, 'column.label') }}</th>
                    <th class="py-1 pr-4 font-normal text-muted">{{ t(TEXT, 'column.dataType.label') }}</th>
                    <th class="py-1 pr-4 font-normal text-muted">{{ t(TEXT, 'column.dataSubtype.label') }}</th>
                    <th class="py-1 font-normal text-muted">{{ t(TEXT, 'column.match.label') }}</th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="(columnRow, index) in shownColumnRows" :key="index">
                    <td class="py-1 pr-4">{{ columnRow.label }}</td>
                    <td class="py-1 pr-4">{{ columnRow.dataTypeLabel }}</td>
                    <!-- A column with no subtype is left blank on screen, and screen readers hear 'None', because a blank cell
                         alone does not say why it is empty. 'relative' keeps the hidden text inside the scroller, or iOS
                         Safari scrolls the whole page sideways. -->
                    <td v-if="columnRow.dataSubtypeLabel" class="py-1 pr-4">{{ columnRow.dataSubtypeLabel }}</td>
                    <td v-else class="relative py-1 pr-4">
                        <span class="sr-only">{{ t(TEXT, 'column.dataSubtype.none.text') }}</span>
                    </td>
                    <td class="py-1">{{ columnRow.matchText }}</td>
                </tr>
            </tbody>
        </table>
    </ScrollRegion>
</template>
