<script setup lang="ts">
// ── External Dependencies & Registrations
import { computed } from 'vue';

// ── Local Framework
import { TEXT } from './ColumnValueBar_.json';
import { COLUMN_VALUE_SEGMENTS, type ColumnValueCounts } from '@/features/studio/dataViews/_previewColumnRows';
import { localeId, t } from '@/state/locale';

// ── Static Components
import ActionWrapper from '@/components/ui/action/ActionWrapper.vue';

// ── Options, Props, Slots & Emits ────────────────────────────────────────────────────────────────────────────────────

const { columnLabel, columnValueCounts, isEmphasised } = defineProps<{
    columnLabel: string;
    columnValueCounts: ColumnValueCounts;
    isEmphasised?: boolean; // While a column's detail is open, when the bars underline the headers as tabs. Lighter over the records, where they only summarise.
}>();

// ── Derived State ────────────────────────────────────────────────────────────────────────────────────────────────────

const shownSegments = computed(() => COLUMN_VALUE_SEGMENTS.filter((segment) => columnValueCounts[segment.id] > 0).map((segment) => ({ ...segment, count: columnValueCounts[segment.id] })));

// The rows below show only the preview, so the text says how many records the counts cover.
const countsText = computed(() => {
    const { blankCount, invalidCount, missingCount, validCount } = columnValueCounts;
    const numberFormat = new Intl.NumberFormat(localeId.value);
    const recordCount = validCount + invalidCount + blankCount + missingCount;
    return t(TEXT, 'counts.text', {
        blank: numberFormat.format(blankCount),
        invalid: numberFormat.format(invalidCount),
        label: columnLabel,
        missing: numberFormat.format(missingCount),
        records: t(TEXT, recordCount === 1 ? 'record.one.text' : 'record.other.text', { count: numberFormat.format(recordCount) }),
        valid: numberFormat.format(validCount)
    });
});
</script>

<template>
    <!-- Value Bar ─ Along the bottom of the header, positioned on the header cell. A button, because the counts in its title
         only show on hover, and it opens the column's detail for touch and keyboard. Each segment keeps a minimum width, so
         a few bad values in a large item are still visible. 'inset-x-0.5' is the inset of the tint on an invalid cell and of
         a tabbed header, so the bar is as wide as the tints in its column and sits on the tab's bottom edge. -->
    <ActionWrapper :aria-label="countsText" class="absolute inset-x-0.5 bottom-0 flex pt-1" :title="countsText">
        <span aria-hidden="true" class="flex h-1 w-full gap-px overflow-hidden rounded-full" :class="{ 'opacity-50': !isEmphasised }">
            <span v-for="segment in shownSegments" :key="segment.id" class="min-w-0.5 basis-0" :class="segment.colorClass" :style="{ flexGrow: segment.count }" />
        </span>
    </ActionWrapper>
</template>
