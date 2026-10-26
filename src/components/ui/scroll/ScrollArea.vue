<script setup lang="ts">
// ── External Dependencies & Registrations
import { useEventListener } from '@vueuse/core';
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
    header?(): unknown; // Sits in the vertical scroller itself, not the horizontal one inside it, so 'sticky' holds it against vertical scrolling.
}>();

const emit = defineEmits<{ initialised: [scrollElement: HTMLElement] }>();

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────
// Vertical scrolling happens on the outer element, horizontal on a nested inner element, so no single
// DOM node is ever scrollable on both axes — this is what keeps iOS from blending a diagonal swipe into
// simultaneous x/y scroll, since each element's native gesture handling only ever has one axis to resolve.
// Scrollbar visuals (track/thumb, drag, wheel, auto-hide) live in ScrollThumb, not here.

const scrollElement = useTemplateRef<HTMLElement>('scrollElement');
const scrollElementId = useId();
const innerScrollElement = useTemplateRef<HTMLElement>('innerScrollElement');
const innerScrollElementId = useId();

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

useEventListener(scrollElement, 'wheel', handleContentWheel, { passive: false });

// ── Wheel Handlers ───────────────────────────────────────────────────────────────────────────────────────────────────

// Browsers keep a wheel or trackpad gesture on the element it started scrolling, momentum included, so a swipe that
// turns from vertical to sideways did nothing until the gesture ended. Each event is routed here instead, to the
// element for whichever axis it moves along most, so the direction can change at once but never scrolls diagonally.
function handleContentWheel(wheelEvent: WheelEvent): void {
    if (wheelEvent.ctrlKey) return; // A trackpad pinch-zoom arrives as a wheel event with 'ctrlKey' set.
    const isHorizontal = Math.abs(wheelEvent.deltaX) > Math.abs(wheelEvent.deltaY);
    const delta = isHorizontal ? wheelEvent.deltaX : wheelEvent.deltaY;
    if (delta === 0) return;
    if (wheelEvent.target instanceof Element && canNestedElementScroll(wheelEvent.target, isHorizontal, delta)) return;
    wheelEvent.preventDefault();
    if (isHorizontal) innerScrollElement.value?.scrollBy({ left: delta });
    else scrollElement.value?.scrollBy({ top: delta });
}

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

// Content can hold its own scrollers, such as a 'ScrollRow'. A wheel event one of them can still take in its direction
// is left to the browser, so it scrolls that element rather than the whole area.
function canNestedElementScroll(target: Element, isHorizontal: boolean, delta: number): boolean {
    const areaElements = new Set<Element | null>([innerScrollElement.value, scrollElement.value]);
    for (let element: Element | null = target; element && !areaElements.has(element); element = element.parentElement) {
        const style = getComputedStyle(element);
        if (!['auto', 'overlay', 'scroll'].includes(isHorizontal ? style.overflowX : style.overflowY)) continue;
        const offset = isHorizontal ? element.scrollLeft : element.scrollTop;
        const range = isHorizontal ? element.scrollWidth - element.clientWidth : element.scrollHeight - element.clientHeight;
        if (delta < 0 ? offset > 0 : offset < range - 1) return true;
    }
    return false;
}

function toLength(value: number | string | undefined): string | undefined {
    return typeof value === 'number' ? `${String(value)}px` : value;
}
</script>

<template>
    <div class="relative flex min-h-0 min-w-0 flex-col overflow-hidden" data-region="ScrollArea">
        <div
            :id="scrollElementId"
            ref="scrollElement"
            class="min-h-0 w-full flex-1 scrollbar-none overflow-x-hidden overflow-y-scroll overscroll-none"
            :style="{ paddingBottom, paddingTop }"
        >
            <slot name="header" />
            <!-- The side padding sits on the horizontal scroller, not the vertical one, so wide content scrolls under the
                 vertical scroll bar to the edge, as it already scrolls under the horizontal one. -->
            <div
                :id="innerScrollElementId"
                ref="innerScrollElement"
                class="w-full scrollbar-none overflow-x-scroll overflow-y-hidden overscroll-none pr-page"
                :style="{ paddingLeft, paddingRight }"
            >
                <slot />
            </div>
        </div>

        <ScrollThumb
            ref="verticalThumb"
            orientation="vertical"
            :scroll-element="scrollElement"
            :cross-scroll-element="innerScrollElement"
            :cross-inset-end="horizontalThumb?.visible ? SCROLL_THUMB_CROSS_INSET : 0"
            :always-visible="scrollbarAlwaysVisible"
        />
        <ScrollThumb
            ref="horizontalThumb"
            orientation="horizontal"
            :scroll-element="innerScrollElement"
            :cross-scroll-element="scrollElement"
            :cross-inset-end="verticalThumb?.visible ? SCROLL_THUMB_CROSS_INSET : 0"
            :inset-start="horizontalScrollbarInsetStart"
            :always-visible="scrollbarAlwaysVisible"
        />
    </div>
</template>
