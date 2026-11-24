<script setup lang="ts">
// ── Static Components
import Tooltip from '@/components/ui/Tooltip.vue';

// ── Types ────────────────────────────────────────────────────────────────────────────────────────────────────────────

export interface CountBarRow {
    barPercent: number | undefined; // The bar's length as a share of the longest. Undefined for a line that sums many values, which has no bar.
    count: number;
    countText: string;
    key: string; // Not the label itself, because a summing line needs a key no value can take.
    label: string;
}

// ── Options, Props, Slots & Emits ────────────────────────────────────────────────────────────────────────────────────

const { barColorClass, label, rows } = defineProps<{
    barColorClass: string; // A pale fill, so the label stays readable on it.
    label?: string;
    rows: CountBarRow[];
}>();
</script>

<template>
    <!-- Each bar starts at the left with its label over it, so the label, bar and count share one line however narrow the
         panel. -->
    <ul :aria-label="label" class="m-0 flex list-none flex-col gap-y-1 p-0">
        <li v-for="row in rows" :key="row.key" class="flex items-center gap-x-2" :class="{ 'text-muted': row.barPercent == null }">
            <span class="relative min-w-0 flex-1 py-0.5">
                <span
                    v-if="row.barPercent != null"
                    aria-hidden="true"
                    class="absolute inset-y-0 left-0 rounded-r"
                    :class="barColorClass"
                    :style="{ width: `${row.barPercent}%` }"
                />
                <Tooltip :text="row.label">
                    <span class="relative block truncate px-1.5 tabular-nums">{{ row.label }}</span>
                </Tooltip>
            </span>
            <span class="flex-none text-right tabular-nums">{{ row.countText }}</span>
        </li>
    </ul>
</template>
