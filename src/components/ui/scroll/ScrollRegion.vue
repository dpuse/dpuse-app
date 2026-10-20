<script setup lang="ts">
// ── External Dependencies & Registrations
import { computed, useTemplateRef } from 'vue';
import { useResizeObserver, useScroll } from '@vueuse/core';

// ── Options, Props, Slots & Emits ────────────────────────────────────────────────────────────────────────────────────

// Holds content that can be wider than its space, such as a table, and scrolls it sideways. A fade shows on each side
// that has more to scroll to. A border at the edge cannot show that, because a cut-off column looks like the last one.
// The region takes keyboard focus while it can scroll, so it can be scrolled with the arrow keys, and is named for
// screen readers.
const { label } = defineProps<{ label: string }>(); // Names the region for screen readers, usually the content's caption or heading.

defineSlots<{ default(): unknown }>();

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

const contentElement = useTemplateRef<HTMLDivElement>('content');
const scrollElement = useTemplateRef<HTMLDivElement>('scroller');

// ── Composables ──────────────────────────────────────────────────────────────────────────────────────────────────────

const { arrivedState, measure } = useScroll(scrollElement);

// ── Derived State ────────────────────────────────────────────────────────────────────────────────────────────────────

const scrollElementCanScroll = computed(() => !arrivedState.left || !arrivedState.right);

// ── Side Effects ─────────────────────────────────────────────────────────────────────────────────────────────────────

useResizeObserver([scrollElement, contentElement], measure); // A narrower space or wider content hides more without a scroll.
</script>

<template>
    <div class="relative w-fit max-w-full" data-region="ScrollRegion">
        <!-- 'overscroll-x-none' stops a swipe that reaches either end from moving the page, for example going back a page. -->
        <div
            ref="scroller"
            :aria-label="label"
            class="overflow-x-auto overscroll-x-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
            role="region"
            :tabindex="scrollElementCanScroll ? 0 : undefined"
        >
            <!-- 'p-px' keeps a collapsed table border inside the scroller. Half of it sits outside the table, where the
                 scroller would clip it. 'relative' keeps absolutely positioned content, such as an 'sr-only' caption,
                 inside the scroller. Otherwise iOS Safari scrolls the whole page sideways. -->
            <div ref="content" class="relative w-fit p-px">
                <slot />
            </div>
        </div>

        <!-- Fades ─ Outside the scroller, so they stay at its edges while the content moves under them. -->
        <div v-if="!arrivedState.left" aria-hidden="true" class="pointer-events-none absolute inset-y-0 left-0 w-6 bg-linear-to-r from-surface to-transparent" />
        <div v-if="!arrivedState.right" aria-hidden="true" class="pointer-events-none absolute inset-y-0 right-0 w-6 bg-linear-to-l from-surface to-transparent" />
    </div>
</template>
