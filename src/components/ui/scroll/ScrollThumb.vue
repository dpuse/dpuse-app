<script lang="ts">
// <script setup> can't itself contain named exports, so the one constant consumers need lives in this companion
// block — its top-level bindings are visible inside <script setup> below too.
const THUMB_THICKNESS = 6;
const THUMB_EDGE_INSET = 2;

// Pass as crossInsetEnd on either ScrollThumb while the perpendicular one is also visible, so both tracks stop short of
// the corner they share and neither runs under the other. A track on its own runs the full length.
export const SCROLL_THUMB_CROSS_INSET = THUMB_THICKNESS + THUMB_EDGE_INSET;
</script>

<script setup lang="ts">
// ── External Dependencies & Registrations
import { ref, useTemplateRef, watch } from 'vue';
import { useEventListener, useMutationObserver, useResizeObserver, useTimeoutFn } from '@vueuse/core';

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

const MIN_THUMB_LENGTH = 32;
const HIDE_DELAY_MS = 1500;

// ── Options, Props, Slots & Emits ────────────────────────────────────────────────────────────────────────────────────

type Orientation = 'vertical' | 'horizontal';
interface Properties {
    orientation: Orientation;
    scrollElement: HTMLElement | null; // The element this thumb measures and scrolls.
    crossScrollElement?: HTMLElement | null; // The perpendicular axis's element — wheeling this track also forwards the orthogonal delta, so a plain vertical mouse wheel still does something sensible over the horizontal track.
    crossInsetEnd?: number; // px to shrink this track by at its trailing edge — see SCROLL_THUMB_CROSS_INSET.
    alwaysVisible?: boolean;
}
const { orientation, scrollElement, crossScrollElement = null, crossInsetEnd = 0, alwaysVisible } = defineProps<Properties>();

const isVertical = orientation === 'vertical';

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

const track = useTemplateRef<HTMLElement>('track');
const thumbLength = ref(0);
const thumbOffset = ref(0);
const scrollPercent = ref(0);
const visible = ref(false);
const thumbsShown = ref(false);

const { start: startHideTimer } = useTimeoutFn(
    () => {
        thumbsShown.value = false;
    },
    HIDE_DELAY_MS,
    { immediate: false }
);

defineExpose({ visible });

// ── Side Effects ─────────────────────────────────────────────────────────────────────────────────────────────────────

watch(
    () => scrollElement,
    (element) => {
        if (!element) return;
        updateThumb();
        if (alwaysVisible) thumbsShown.value = true;
    },
    { immediate: true }
);

// The children are watched as well as the element, because content growing inside it changes the scroll range without
// changing the element's own size.
useResizeObserver(() => (scrollElement ? [scrollElement, ...(scrollElement.children as HTMLCollectionOf<HTMLElement>)] : []), updateThumb);

// The track shortens when the other track appears, which changes how far the thumb can travel.
watch(() => crossInsetEnd, updateThumb, { flush: 'post' });

useMutationObserver(
    () => scrollElement,
    () => {
        updateThumb();
        if (alwaysVisible) thumbsShown.value = true;
    },
    { childList: true }
);

useEventListener(() => scrollElement, 'scroll', handleScroll, { passive: true });

// ── Drag Handlers ────────────────────────────────────────────────────────────────────────────────────────────────────

function handlePointerDown(pointerEvent: PointerEvent): void {
    const trackElement = track.value;
    if (!trackElement || !scrollElement) return;
    const pointerOffset = getPointerCoord(pointerEvent) - getTrackStart(trackElement);
    if (pointerOffset >= thumbOffset.value && pointerOffset <= thumbOffset.value + thumbLength.value) {
        pointerEvent.preventDefault();
        startDrag(pointerEvent);
    } else {
        const travel = getTrackTravel(getTrackLength(trackElement), thumbLength.value);
        const scrollRange = getScrollableRange(getScrollSize(scrollElement), getClientSize(scrollElement));
        setScrollOffset(scrollElement, getScrollOffsetFromPointer(pointerOffset, thumbLength.value, travel, scrollRange));
    }
    handleShowThumbs();
}

function handleTouchStart(touchEvent: TouchEvent): void {
    const trackElement = track.value;
    if (!trackElement) return;
    const pointerOffset = getPointerCoord(touchEvent.touches[0]) - getTrackStart(trackElement);
    if (pointerOffset >= thumbOffset.value && pointerOffset <= thumbOffset.value + thumbLength.value) {
        startDrag(touchEvent);
    }
    handleShowThumbs();
}

function handleShowThumbs(): void {
    thumbsShown.value = true;
    if (!alwaysVisible) startHideTimer();
}

// ── Drag Helpers ─────────────────────────────────────────────────────────────────────────────────────────────────────

function getScrollOffsetFromPointer(pointerOffset: number, thumbLen: number, travel: number, scrollRange: number): number {
    return scrollRange === 0 || travel === 0 ? 0 : clampFromZero((pointerOffset - thumbLen / 2) / travel, 1) * scrollRange;
}

function startDrag(dragStartEvent: PointerEvent | TouchEvent): void {
    const element = scrollElement;
    if (!element) return;

    const isTouch = dragStartEvent instanceof TouchEvent;
    const startCoord = getPointerCoord(isTouch ? dragStartEvent.touches[0] : dragStartEvent);
    const startScrollOffset = getScrollOffset(element);

    const trackElement = track.value;
    const trackLength = trackElement ? getTrackLength(trackElement) : getClientSize(element);
    const scrollRange = getScrollableRange(getScrollSize(element), getClientSize(element));
    const travel = getTrackTravel(trackLength, thumbLength.value);
    if (travel === 0 || scrollRange === 0) return;
    const scale = scrollRange / travel;

    function handleDragMove(dragMoveEvent: PointerEvent | TouchEvent): void {
        if (!element) return;
        const coord = getPointerCoord(dragMoveEvent instanceof TouchEvent ? dragMoveEvent.touches[0] : dragMoveEvent);
        setScrollOffset(element, startScrollOffset + (coord - startCoord) * scale);
    }

    function handleDragEnd(): void {
        for (const stopListener of stopListeners) stopListener();
    }

    const stopListeners = isTouch
        ? [useEventListener(document, 'touchmove', handleDragMove, { passive: true }), useEventListener(document, 'touchend', handleDragEnd)]
        : [useEventListener(document, 'pointermove', handleDragMove), useEventListener(document, 'pointerup', handleDragEnd)];
}

// ── Scroll Handlers ──────────────────────────────────────────────────────────────────────────────────────────────────

function handleScroll(): void {
    updateThumb();
    handleShowThumbs();
}

// ── Wheel Handlers ───────────────────────────────────────────────────────────────────────────────────────────────────

function handleWheel(wheelEvent: WheelEvent): void {
    scrollElement?.scrollBy(isVertical ? { top: wheelEvent.deltaY } : { left: wheelEvent.deltaX });
    crossScrollElement?.scrollBy(isVertical ? { left: wheelEvent.deltaX } : { top: wheelEvent.deltaY });
}

// ── Orientation Helpers ──────────────────────────────────────────────────────────────────────────────────────────────
// Reads whichever DOM axis this instance cares about, so the geometry logic below stays orientation-agnostic.

function getScrollOffset(element: HTMLElement): number {
    return isVertical ? element.scrollTop : element.scrollLeft;
}

function setScrollOffset(element: HTMLElement, value: number): void {
    if (isVertical) element.scrollTop = value;
    else element.scrollLeft = value;
}

function getScrollSize(element: HTMLElement): number {
    return isVertical ? element.scrollHeight : element.scrollWidth;
}

function getClientSize(element: HTMLElement): number {
    return isVertical ? element.clientHeight : element.clientWidth;
}

function getTrackLength(trackElement: HTMLElement): number {
    const rect = trackElement.getBoundingClientRect();
    return isVertical ? rect.height : rect.width;
}

function getTrackStart(trackElement: HTMLElement): number {
    const rect = trackElement.getBoundingClientRect();
    return isVertical ? rect.top : rect.left;
}

function getPointerCoord(point: { clientX: number; clientY: number }): number {
    return isVertical ? point.clientY : point.clientX;
}

// ── Shared Geometry Helpers ──────────────────────────────────────────────────────────────────────────────────────────

function updateThumb(): void {
    if (!scrollElement) return;
    const scrollOffset = getScrollOffset(scrollElement);
    const scrollSize = getScrollSize(scrollElement);
    const clientSize = getClientSize(scrollElement);

    const ratio = scrollSize === 0 ? 1 : clientSize / scrollSize;
    visible.value = ratio < 1;

    const trackElement = track.value;
    const trackLength = trackElement ? getTrackLength(trackElement) : Math.max(0, clientSize);

    thumbLength.value = Math.max(ratio * trackLength, MIN_THUMB_LENGTH);
    const travel = getTrackTravel(trackLength, thumbLength.value);
    const scrollRange = getScrollableRange(scrollSize, clientSize);

    thumbOffset.value = getThumbPosition(scrollOffset, scrollRange, travel);
    scrollPercent.value = scrollRange === 0 ? 0 : clampFromZero((scrollOffset / scrollRange) * 100, 100);
}

function getThumbPosition(scrollOffset: number, scrollRange: number, travel: number): number {
    return scrollRange === 0 || travel === 0 ? 0 : clampFromZero((scrollOffset / scrollRange) * travel, travel);
}

function getTrackTravel(trackLength: number, thumbLen: number): number {
    return Math.max(0, trackLength - thumbLen);
}

function getScrollableRange(scrollSize: number, clientSize: number): number {
    return Math.max(0, scrollSize - clientSize);
}

function clampFromZero(value: number, max: number): number {
    return Math.max(0, Math.min(value, max));
}
</script>

<template>
    <div
        v-if="visible"
        ref="track"
        role="scrollbar"
        tabindex="0"
        :aria-orientation="orientation"
        :aria-controls="scrollElement?.id"
        :aria-valuenow="Math.round(scrollPercent)"
        aria-valuemin="0"
        aria-valuemax="100"
        class="group pointer-events-auto absolute cursor-pointer transition-opacity duration-200 ease-[ease]"
        :class="[isVertical ? 'inset-y-0 right-0 w-6' : 'inset-x-0 bottom-0 h-6', thumbsShown ? 'opacity-100' : 'opacity-0']"
        :style="isVertical ? { bottom: crossInsetEnd + 'px' } : { right: crossInsetEnd + 'px' }"
        @pointerdown="handlePointerDown"
        @touchstart.passive="handleTouchStart"
        @mouseenter="handleShowThumbs"
        @focusin="handleShowThumbs"
        @wheel.passive="handleWheel"
    >
        <div
            class="absolute cursor-pointer rounded-full bg-subtle transition-[background-color,width,height,right,bottom] duration-150 ease-[ease] hover:bg-muted active:bg-muted"
            :class="isVertical ? 'top-0 right-0.5 w-1.5 group-hover:right-px group-hover:w-2.5' : 'bottom-0.5 left-0 h-1.5 group-hover:bottom-px group-hover:h-2.5'"
            :style="
                isVertical ? { height: thumbLength + 'px', transform: `translateY(${thumbOffset}px)` } : { width: thumbLength + 'px', transform: `translateX(${thumbOffset}px)` }
            "
        />
    </div>
</template>
