<script setup lang="ts">
// ── External Dependencies & Registrations
import { useResizeObserver } from '@vueuse/core';
import { nextTick, ref, useTemplateRef } from 'vue';

// ── Types ────────────────────────────────────────────────────────────────────────────────────────────────────────────

// How much of the item has been read, as a share of its size. Only for an item whose size is known.
export interface StatusBarProgress {
    isComplete: boolean; // The whole item was read.
    isRunning: boolean;
    label: string; // What is measured, for screen readers.
    percentage: number;
    valueText: string; // The figures in words, for screen readers.
}

// ── Options, Props, Slots & Emits ────────────────────────────────────────────────────────────────────────────────────

const { progress } = defineProps<{
    progress?: StatusBarProgress;
}>();

defineSlots<{
    default?(): unknown; // What was read, on the left.
    end?(properties: { isShort: boolean }): unknown; // What is shown, on the right. 'isShort' asks for a shorter form when the full one does not fit.
}>();

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

const containerElement = useTemplateRef<HTMLDivElement>('container');
const startElement = useTemplateRef<HTMLParagraphElement>('start');
const endElement = useTemplateRef<HTMLParagraphElement>('end');
const endIsShort = ref(false);
const endFitId = ref(0); // Lets a newer fit stop an older one that is still waiting to measure.

// ── Side Effects ─────────────────────────────────────────────────────────────────────────────────────────────────────

// The bar and both sides are watched, so the fit is checked again when the bar is resized or either text changes length.
useResizeObserver([containerElement, startElement, endElement], () => void fitEnd());

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

// Shows the right-hand text in full when both sides fit, and asks for its short form when they do not. The full form is
// laid out and measured before the browser paints, so it never shows when it does not fit.
async function fitEnd(): Promise<void> {
    const start = startElement.value;
    const end = endElement.value;
    if (start == null || end == null) return;
    const fitId = ++endFitId.value;
    endIsShort.value = false;
    await nextTick();
    if (fitId !== endFitId.value) return;
    endIsShort.value = start.scrollWidth > start.clientWidth || end.scrollWidth > end.clientWidth;
}
</script>

<template>
    <!-- Status Bar ─ In the safe area along the bottom of a device that has one, and 24px high in the page where there is
         none, so a sideways scroll bar always sits above the safe area. It only shows what is read, never a button,
         because a phone's own swipes start at its bottom edge. -->
    <div
        ref="container"
        class="relative mt-auto flex h-(--status-bar-height) w-full flex-none items-center justify-between gap-x-4 overflow-hidden border-t border-separator bg-card px-page pt-0.75 text-xs text-muted"
        data-region="StatusBar"
    >
        <!-- Progress Bar ─ Along the top edge. Green when the whole item was read, the same green as valid values in the
             column headers' value bars, and blue in the same strength for part of it. The grey track shows how much was
             not. Any amount keeps a minimum width, so a sliver of a large item is still visible rather than looking like
             nothing. A progress bar while reading, and otherwise a meter, because it then shows a settled amount. -->
        <div
            v-if="progress"
            :aria-label="progress.label"
            aria-valuemax="100"
            aria-valuemin="0"
            :aria-valuenow="Math.round(progress.percentage)"
            :aria-valuetext="progress.valueText"
            class="absolute inset-x-0 top-0 h-0.75 bg-separator/50"
            :role="progress.isRunning ? 'progressbar' : 'meter'"
        >
            <div
                class="h-full"
                :class="[
                    progress.isComplete
                        ? 'bg-[color-mix(in_srgb,var(--color-success-text)_40%,var(--color-card))]'
                        : 'bg-[color-mix(in_srgb,var(--color-accent)_40%,var(--color-card))]',
                    { 'min-w-0.75': progress.percentage > 0 }
                ]"
                :style="{ width: `${progress.percentage}%` }"
            />
        </div>
        <!-- Centred in the space below the progress bar ('pt-0.75' clears its 3px), and trimmed to its letters so it is
             centred on them rather than sitting high in its line box. Long text is cut off sideways only
             ('overflow-x: clip'), because hiding overflow on both axes would clip the tails of letters like 'g' below
             the trimmed box. The left-hand text matters more, so the right-hand text gives up its room first: its
             far larger shrink factor takes almost all the shortfall until it is gone. -->
        <p ref="start" class="min-w-0 overflow-x-clip text-ellipsis whitespace-nowrap [text-box:trim-both_cap_alphabetic]">
            <slot />
        </p>
        <p ref="end" class="min-w-0 shrink-100000 overflow-x-clip text-ellipsis whitespace-nowrap [text-box:trim-both_cap_alphabetic]">
            <slot name="end" :is-short="endIsShort" />
        </p>
    </div>
</template>
