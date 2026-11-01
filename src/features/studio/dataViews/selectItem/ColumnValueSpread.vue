<script setup lang="ts">
// ── External Dependencies & Registrations
import { computed } from 'vue';

// ── DPUse Framework
import type { ObjectColumnConfig } from '@dpuse/dpuse-shared';

// ── Local Framework
import { TEXT } from './ColumnValueSpread_.json';
import { localeId, t } from '@/state/locale';

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

const SHOWN_VALUE_COUNT = 5; // As many bars as fit beside the type select, and as many values as a tooltip can list.
const MIN_VALUE_COUNT = 2; // One bar says nothing about how the values are spread.

// ── Options, Props, Slots & Emits ────────────────────────────────────────────────────────────────────────────────────

const { columnConfig, columnLabel } = defineProps<{
    columnConfig: ObjectColumnConfig;
    columnLabel: string;
}>();

// ── Derived State ────────────────────────────────────────────────────────────────────────────────────────────────────

// The engine lists the values seen more than once, most frequent first, so a column of unique values has no bars.
const shownValues = computed(() => Object.entries(columnConfig.frequentValues ?? {}).slice(0, SHOWN_VALUE_COUNT));
const highestCount = computed(() => Math.max(...shownValues.value.map(([, count]) => count)));

const spreadText = computed(() => {
    const numberFormat = new Intl.NumberFormat(localeId.value);
    const values = shownValues.value.map(([value, count]) => t(TEXT, 'value.text', { count: numberFormat.format(count), value })).join(', ');
    return t(TEXT, 'spread.text', { label: columnLabel, values });
});
</script>

<template>
    <!-- Value Spread ─ One bar for each of the most common values, as tall as its share of the highest. -->
    <span v-if="shownValues.length >= MIN_VALUE_COUNT" :aria-label="spreadText" class="flex h-4 flex-none items-end gap-px" role="img" :title="spreadText">
        <span v-for="[value, count] in shownValues" :key="value" class="min-h-px w-1 rounded-t-xs bg-subtle" :style="{ height: `${(count / highestCount) * 100}%` }" />
    </span>
</template>
