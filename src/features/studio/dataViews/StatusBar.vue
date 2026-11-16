<script setup lang="ts">
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
    end?(): unknown; // What is shown, on the right.
}>();
</script>

<template>
    <!-- Status Bar ─ In the safe area along the bottom of a device that has one, and 24px high in the page where there is
         none, so a sideways scroll bar always sits above the safe area. It only shows what is read, never a button,
         because a phone's own swipes start at its bottom edge. -->
    <div
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
             the trimmed box. -->
        <p class="min-w-0 overflow-x-clip text-ellipsis whitespace-nowrap [text-box:trim-both_cap_alphabetic]">
            <slot />
        </p>
        <p class="flex-none whitespace-nowrap [text-box:trim-both_cap_alphabetic]">
            <slot name="end" />
        </p>
    </div>
</template>
