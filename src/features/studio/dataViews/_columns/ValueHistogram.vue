<script setup lang="ts">
// ── External Dependencies & Registrations
import { useElementSize } from '@vueuse/core';
import { computed, useTemplateRef } from 'vue';

// ── Local Framework
import { t } from '@/state/locale';
import { TEXT } from './ValueHistogram_.json';

// ── Static Components
import Tooltip from '@/components/ui/Tooltip.vue';

// ── Types ────────────────────────────────────────────────────────────────────────────────────────────────────────────

export interface ValueHistogramBar {
    count: number;
    countText: string;
    endText: string; // The last value in the range, or where it ends, as the axis shows it.
    isOutlier?: boolean; // Counts the values beyond the other ranges, drawn paler, because its width does not match the values it holds.
    key: string;
    label: string; // The whole range, such as '50 to 59'.
    startText: string;
}

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

const AXIS_CHARACTER_PX = 7; // About the width of a character of the axis's small figures, to judge how many labels fit.
const AXIS_LABEL_GAP_PX = 24; // The space allowed between axis labels when judging how many fit.
const AXIS_END_GAP_PX = 12; // The least space between a label and the first or last label, smaller because the widths are estimates that run wide.

// ── Options, Props, Slots & Emits ────────────────────────────────────────────────────────────────────────────────────

const { barColorClass, bars, label } = defineProps<{
    barColorClass: string;
    bars: ValueHistogramBar[];
    label: string;
}>();

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

const chartElement = useTemplateRef<HTMLDivElement>('chart');
const { width: chartWidth } = useElementSize(chartElement);

// ── Derived State ────────────────────────────────────────────────────────────────────────────────────────────────────

const largestCount = computed(() => Math.max(0, ...bars.map((bar) => bar.count)));
const startText = computed(() => bars[0]?.startText ?? '');
const endText = computed(() => bars.at(-1)?.endText ?? '');

// ── Axis ─ Labels where bars start, every bar or every few, as many as fit the chart's width with room between them, so a
// narrow panel shows fewer. Each sits centred under the edge it names. The first and last labels are always shown, set
// against the chart's ends, so a label that would come too close to either is left out.
const axisTicks = computed(() => {
    const width = chartWidth.value;
    const longestLength = Math.max(0, ...bars.map((bar) => Math.max(bar.startText.length, bar.endText.length)));
    const labelCount = Math.max(2, Math.floor(width / (estimateLabelWidth(longestLength) + AXIS_LABEL_GAP_PX)));
    const step = Math.ceil(bars.length / (labelCount - 1));
    const leftLimit = estimateLabelWidth(startText.value.length) + AXIS_END_GAP_PX;
    const rightLimit = width - estimateLabelWidth(endText.value.length) - AXIS_END_GAP_PX;
    return bars
        .map((bar, index) => ({ index, key: bar.key, position: (index / bars.length) * width, text: bar.startText }))
        .filter(({ index, position, text }) => {
            const halfWidth = estimateLabelWidth(text.length) / 2;
            return index > 0 && index % step === 0 && position - halfWidth >= leftLimit && position + halfWidth <= rightLimit;
        });
});

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

function estimateLabelWidth(characterCount: number): number {
    return characterCount * AXIS_CHARACTER_PX;
}

// The range, then its count with the word 'values', so the count cannot be read as part of the range's last number.
function constructBarText({ count, countText, label }: ValueHistogramBar): string {
    return t(TEXT, count === 1 ? 'bar.one.label' : 'bar.other.label', { count: countText, label });
}
</script>

<template>
    <div ref="chart" data-region="ValueHistogram">
        <!-- Bars ─ Columns from a shared baseline, so the shape of the values reads at a glance. A range with no values
             keeps its place, because a gap is part of the shape. Each column names its range and count for screen
             readers, and in a tooltip on hover. -->
        <ol :aria-label="label" class="m-0 flex h-24 list-none items-end gap-x-px border-b border-separator p-0">
            <li v-for="bar in bars" :key="bar.key" class="relative flex h-full min-w-0 flex-1">
                <Tooltip>
                    <span class="flex size-full flex-col justify-end">
                        <span
                            v-if="bar.count > 0"
                            aria-hidden="true"
                            class="block min-h-px rounded-t-sm"
                            :class="[barColorClass, { 'opacity-50': bar.isOutlier }]"
                            :style="{ height: `${(bar.count / largestCount) * 100}%` }"
                        />
                    </span>
                    <template #content>
                        <span class="block font-medium">{{ bar.label }}</span>
                        <span class="block text-muted">{{ t(TEXT, bar.count === 1 ? 'count.one.label' : 'count.other.label', { count: bar.countText }) }}</span>
                    </template>
                </Tooltip>
                <span class="sr-only">{{ constructBarText(bar) }}</span>
            </li>
        </ol>
        <!-- Axis ─ Hidden from screen readers, because each bar already names its range. -->
        <div aria-hidden="true" class="relative mt-1 h-4 text-xs whitespace-nowrap text-muted tabular-nums">
            <span class="absolute left-0">{{ startText }}</span>
            <span v-for="tick in axisTicks" :key="tick.key" class="absolute -translate-x-1/2" :style="{ left: `${tick.position}px` }">{{ tick.text }}</span>
            <span v-if="endText !== startText" class="absolute right-0">{{ endText }}</span>
        </div>
    </div>
</template>
