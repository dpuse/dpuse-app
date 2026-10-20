<script setup lang="ts">
// ── External Dependencies & Registrations
import { computed, useId, useTemplateRef } from 'vue';
import { useResizeObserver, useScroll } from '@vueuse/core';

// ── Options, Props, Slots & Emits ────────────────────────────────────────────────────────────────────────────────────

// Holds content that can be wider than its space, such as a table, and scrolls it sideways. The frame stays fixed, so
// the edges of the scroll area are always visible. A fade inside the frame shows that a side has more to scroll to.
// It is flat, matching the background, because a darker shadow reads as depth and distracts. The region takes keyboard
// focus while it can scroll, so it can be scrolled with the arrow keys, and is named for screen readers.
const { isLabelShown, label } = defineProps<{
    isLabelShown?: boolean; // Shows the label as a title above the frame, where a table's own caption cannot go.
    label: string; // Names the region and its table for screen readers.
}>();

defineSlots<{
    default(properties: { labelId: string }): unknown; // 'labelId' names a table after the label, through 'aria-labelledby'.
}>();

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

const contentElement = useTemplateRef<HTMLDivElement>('content');
const labelId = useId();
const scrollElement = useTemplateRef<HTMLDivElement>('scroller');

// ── Composables ──────────────────────────────────────────────────────────────────────────────────────────────────────

const { arrivedState, measure } = useScroll(scrollElement);

// ── Derived State ────────────────────────────────────────────────────────────────────────────────────────────────────

const scrollElementCanScroll = computed(() => !arrivedState.left || !arrivedState.right);

// ── Side Effects ─────────────────────────────────────────────────────────────────────────────────────────────────────

useResizeObserver([scrollElement, contentElement], measure); // A narrower space or wider content hides more without a scroll.
</script>

<template>
    <div data-region="ScrollRegion">
        <!-- Label ─ Hidden from view, but still read, when something else on screen already names the content. A hidden
             caption inside a table would do the same, but it stops Chromium merging the borders under the header row. -->
        <div :id="labelId" :class="isLabelShown ? 'mb-2 text-sm font-medium text-emphasis' : 'sr-only'">{{ label }}</div>

        <!-- Frame ─ Only as wide as its content, up to the space it has. -->
        <div class="relative w-fit max-w-full border border-separator">
            <!-- 'overscroll-x-none' stops a swipe that reaches either end from moving the page, for example going back a
                 page. -->
            <div
                ref="scroller"
                :aria-labelledby="labelId"
                class="overflow-x-auto overscroll-x-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
                role="region"
                :tabindex="scrollElementCanScroll ? 0 : undefined"
            >
                <!-- A table keeps separate borders, and each cell draws only its right and bottom lines. Collapsed borders
                     are split between the two cells that share them, and WebKit rounds each half up, so on a high-density
                     screen such as an iPhone the inner lines come out thicker than the frame. The last column and last row
                     draw no outer line, because the frame draws it and the fades would cover it. -->
                <div
                    ref="content"
                    class="w-fit [&_table]:border-separate [&_table]:border-spacing-0 [&_tbody>tr:last-child>*]:border-b-0 [&_tr>*]:border-t-0 [&_tr>*]:border-l-0 [&_tr>*:last-child]:border-r-0"
                >
                    <slot :label-id="labelId" />
                </div>
            </div>

            <!-- Fades ─ Inside the frame's borders, so the borders always show. Outside the scroller, so they stay at its
                 edges while the content moves under them. -->
            <div v-if="!arrivedState.left" aria-hidden="true" class="pointer-events-none absolute inset-y-0 left-0 w-6 bg-linear-to-r from-surface to-transparent" />
            <div v-if="!arrivedState.right" aria-hidden="true" class="pointer-events-none absolute inset-y-0 right-0 w-6 bg-linear-to-l from-surface to-transparent" />
        </div>
    </div>
</template>
