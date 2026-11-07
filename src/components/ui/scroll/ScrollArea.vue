<script setup lang="ts">
// ── External Dependencies & Registrations
import { computed, onMounted, useId, useTemplateRef } from 'vue';

// ── Static Components
import ScrollThumb, { SCROLL_THUMB_CROSS_INSET } from './ScrollThumb.vue';

// ── Options, Props, Slots & Emits ────────────────────────────────────────────────────────────────────────────────────

interface Properties {
    horizontalScrollbarInsetStart?: number; // px the horizontal scroll bar starts in from the left, e.g. past a column that does not scroll sideways.
    scrollAreaPaddingBottom?: number | string;
    scrollAreaPaddingLeft?: number | string; // Inside the scrolling element, so the wheel scrolls over the padding too.
    scrollAreaPaddingRight?: number | string; // Overrides the default gutter — pass 0 where the content is narrower than the reserved 16px.
    scrollAreaPaddingTop?: number | string; // Clears a control floating above the content, the way the bottom padding clears one below it.
    scrollbarAlwaysVisible?: boolean;
}
const { horizontalScrollbarInsetStart, scrollAreaPaddingBottom, scrollAreaPaddingLeft, scrollAreaPaddingRight, scrollAreaPaddingTop, scrollbarAlwaysVisible } =
    defineProps<Properties>();

defineSlots<{
    default(): unknown;
    header?(): unknown; // Sits outside the content's side padding. Give it 'sticky' to hold it at the top.
}>();

const emit = defineEmits<{ initialised: [scrollElement: HTMLElement] }>();

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

// One element scrolls both ways, so the browser handles every wheel, trackpad and touch gesture itself. The scroll bars
// are drawn by 'ScrollThumb', because the browser's own are hidden.
const scrollElement = useTemplateRef<HTMLElement>('scrollElement');
const scrollElementId = useId();

const verticalThumb = useTemplateRef<InstanceType<typeof ScrollThumb>>('verticalThumb');
const horizontalThumb = useTemplateRef<InstanceType<typeof ScrollThumb>>('horizontalThumb');

// ── Derived State ────────────────────────────────────────────────────────────────────────────────────────────────────

const paddingBottom = computed(() => toLength(scrollAreaPaddingBottom));
const paddingLeft = computed(() => toLength(scrollAreaPaddingLeft));
const paddingRight = computed(() => toLength(scrollAreaPaddingRight));
const paddingTop = computed(() => toLength(scrollAreaPaddingTop));

// ── Side Effects ─────────────────────────────────────────────────────────────────────────────────────────────────────

onMounted(() => {
    if (scrollElement.value) emit('initialised', scrollElement.value);
});

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

function toLength(value: number | string | undefined): string | undefined {
    return typeof value === 'number' ? `${String(value)}px` : value;
}
</script>

<template>
    <div class="relative flex min-h-0 min-w-0 flex-col overflow-hidden" data-region="ScrollArea">
        <div
            :id="scrollElementId"
            ref="scrollElement"
            class="min-h-0 w-full flex-1 scrollbar-none overflow-scroll overscroll-none"
            :style="{ paddingBottom, paddingTop }"
        >
            <slot name="header" />
            <!-- Content ─ 'min-w-fit' lets the box grow to content wider than the view, so its right padding stays at
                 the end of the sideways scroll. Text narrower than the view still wraps. -->
            <div class="min-w-fit pr-page" :style="{ paddingLeft, paddingRight }">
                <slot />
            </div>
        </div>

        <ScrollThumb
            ref="verticalThumb"
            orientation="vertical"
            :scroll-element="scrollElement"
            :cross-inset-end="horizontalThumb?.visible ? SCROLL_THUMB_CROSS_INSET : 0"
            :always-visible="scrollbarAlwaysVisible"
        />
        <ScrollThumb
            ref="horizontalThumb"
            orientation="horizontal"
            :scroll-element="scrollElement"
            :cross-inset-end="verticalThumb?.visible ? SCROLL_THUMB_CROSS_INSET : 0"
            :inset-start="horizontalScrollbarInsetStart"
            :always-visible="scrollbarAlwaysVisible"
        />
    </div>
</template>
