<script lang="ts">
// <script setup> can't itself contain named exports, so the one constant consumers need lives in this companion
// block — its top-level bindings are visible inside <script setup> below too.
const THUMB_THICKNESS = 6;
const THUMB_EDGE_INSET = 2;

// Pass as crossInsetEnd on a horizontal ScrollThumb when a perpendicular vertical one is also visible, so their
// tracks don't overlap at the corner. There's no equivalent for the vertical track — matching scrollbar convention,
// the vertical track owns the corner.
export const SCROLL_THUMB_CROSS_INSET = THUMB_THICKNESS + THUMB_EDGE_INSET;
</script>

<script setup lang="ts">
// ── External Dependencies & Registrations
import { onUnmounted, ref, useTemplateRef, watch } from 'vue';

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

const MIN_THUMB_LENGTH = 32;
const HIDE_DELAY_MS = 1500;

// ── Options, Props, Slots & Emits ────────────────────────────────────────────────────────────────────────────────────

type Orientation = 'vertical' | 'horizontal';
type Properties = {
    orientation: Orientation;
    scrollElement: HTMLElement | null; // The element this thumb measures and scrolls.
    crossScrollElement?: HTMLElement | null; // The perpendicular axis's element — wheeling this track also forwards the orthogonal delta, so a plain vertical mouse wheel still does something sensible over the horizontal track.
    crossInsetEnd?: number; // px to shrink this track by at its trailing edge — see SCROLL_THUMB_CROSS_INSET.
    alwaysVisible?: boolean;
};
const { orientation, scrollElement, crossScrollElement = null, crossInsetEnd = 0, alwaysVisible = false } = defineProps<Properties>();

const isVertical = orientation === 'vertical';

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

const track = useTemplateRef<HTMLElement>('track');
const thumbLength = ref(0);
const thumbOffset = ref(0);
const scrollPercent = ref(0);
const visible = ref(false);
const thumbsShown = ref(false);

const state: { hideTimer: ReturnType<typeof setTimeout> | null; resizeObserver: ResizeObserver; contentObserver: MutationObserver } = {
    hideTimer: null,
    resizeObserver: new ResizeObserver(updateThumb),
    contentObserver: new MutationObserver(() => {
        updateThumb();
        if (alwaysVisible) thumbsShown.value = true;
    })
};

defineExpose({ visible });

// ── Side Effects ─────────────────────────────────────────────────────────────────────────────────────────────────────

watch(
    () => scrollElement,
    (element, previousElement) => {
        previousElement?.removeEventListener('scroll', handleScroll);
        state.resizeObserver.disconnect();
        state.contentObserver.disconnect();
        if (!element) return;
        element.addEventListener('scroll', handleScroll, { passive: true });
        state.resizeObserver.observe(element);
        for (const child of element.children) state.resizeObserver.observe(child);
        state.contentObserver.observe(element, { childList: true, subtree: false });
        updateThumb();
        if (alwaysVisible) thumbsShown.value = true;
    },
    { immediate: true }
);

onUnmounted(() => {
    scrollElement?.removeEventListener('scroll', handleScroll);
    state.resizeObserver.disconnect();
    state.contentObserver.disconnect();
    if (state.hideTimer != null) clearTimeout(state.hideTimer);
});

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
    const pointerOffset = getPointerCoord(touchEvent.touches[0]!) - getTrackStart(trackElement);
    if (pointerOffset >= thumbOffset.value && pointerOffset <= thumbOffset.value + thumbLength.value) {
        startDrag(touchEvent);
    }
    handleShowThumbs();
}

function handleShowThumbs(): void {
    thumbsShown.value = true;
    if (alwaysVisible) return;
    if (state.hideTimer != null) clearTimeout(state.hideTimer);
    state.hideTimer = setTimeout(() => {
        thumbsShown.value = false;
    }, HIDE_DELAY_MS);
}

// ── Drag Helpers ─────────────────────────────────────────────────────────────────────────────────────────────────────

function getScrollOffsetFromPointer(pointerOffset: number, thumbLen: number, travel: number, scrollRange: number): number {
    return scrollRange === 0 || travel === 0 ? 0 : clamp((pointerOffset - thumbLen / 2) / travel, 0, 1) * scrollRange;
}

function startDrag(dragStartEvent: PointerEvent | TouchEvent): void {
    const element = scrollElement;
    if (!element) return;

    const isTouch = dragStartEvent instanceof TouchEvent;
    const startCoord = getPointerCoord(isTouch ? dragStartEvent.touches[0]! : dragStartEvent);
    const startScrollOffset = getScrollOffset(element);

    const trackElement = track.value;
    const trackLength = trackElement ? getTrackLength(trackElement) : getClientSize(element);
    const scrollRange = getScrollableRange(getScrollSize(element), getClientSize(element));
    const travel = getTrackTravel(trackLength, thumbLength.value);
    if (travel === 0 || scrollRange === 0) return;
    const scale = scrollRange / travel;

    function handleDragMove(dragMoveEvent: PointerEvent | TouchEvent): void {
        const coord = getPointerCoord(dragMoveEvent instanceof TouchEvent ? dragMoveEvent.touches[0]! : dragMoveEvent);
        setScrollOffset(element!, startScrollOffset + (coord - startCoord) * scale);
    }

    function handleDragEnd(): void {
        if (isTouch) {
            document.removeEventListener('touchmove', handleDragMove as EventListener);
            document.removeEventListener('touchend', handleDragEnd);
        } else {
            document.removeEventListener('pointermove', handleDragMove as EventListener);
            document.removeEventListener('pointerup', handleDragEnd);
        }
    }

    if (isTouch) {
        document.addEventListener('touchmove', handleDragMove as EventListener, { passive: true });
        document.addEventListener('touchend', handleDragEnd);
    } else {
        document.addEventListener('pointermove', handleDragMove as EventListener);
        document.addEventListener('pointerup', handleDragEnd);
    }
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
    scrollPercent.value = scrollRange === 0 ? 0 : clamp((scrollOffset / scrollRange) * 100, 0, 100);
}

function getThumbPosition(scrollOffset: number, scrollRange: number, travel: number): number {
    return scrollRange === 0 || travel === 0 ? 0 : clamp((scrollOffset / scrollRange) * travel, 0, travel);
}

function getTrackTravel(trackLength: number, thumbLen: number): number {
    return Math.max(0, trackLength - thumbLen);
}

function getScrollableRange(scrollSize: number, clientSize: number): number {
    return Math.max(0, scrollSize - clientSize);
}

function clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(value, max));
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
        class="dpuse-scrollbar-track"
        :class="[isVertical ? 'dpuse-scrollbar-track-v' : 'dpuse-scrollbar-track-h', { 'dpuse-scrollbar-visible': thumbsShown }]"
        :style="!isVertical ? { right: crossInsetEnd + 'px' } : undefined"
        @pointerdown="handlePointerDown"
        @touchstart.passive="handleTouchStart"
        @mouseenter="handleShowThumbs"
        @focusin="handleShowThumbs"
        @wheel.passive="handleWheel"
    >
        <div
            class="dpuse-scrollbar-thumb"
            :style="
                isVertical ? { height: thumbLength + 'px', transform: `translateY(${thumbOffset}px)` } : { width: thumbLength + 'px', transform: `translateX(${thumbOffset}px)` }
            "
        />
    </div>
</template>

<style scoped>
.dpuse-scrollbar-track {
    position: absolute;
    border-radius: 0;
    opacity: 0;
    transition: opacity 0.2s ease;
    pointer-events: auto;
}

.dpuse-scrollbar-track.dpuse-scrollbar-visible {
    opacity: 1;
}

.dpuse-scrollbar-track-v {
    top: 0;
    right: 0;
    width: 24px;
    bottom: 0;
    cursor: pointer;
}

.dpuse-scrollbar-track-h {
    bottom: 0;
    left: 0;
    right: 0;
    height: 24px;
    cursor: pointer;
}

.dpuse-scrollbar-thumb {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    border-radius: 9999px;
    background-color: var(--subtle, rgba(0, 0, 0, 0.35));
    cursor: pointer;
    transition:
        background-color 0.15s ease,
        width 0.15s ease,
        height 0.15s ease,
        right 0.15s ease,
        bottom 0.15s ease;
}

.dpuse-scrollbar-track-v .dpuse-scrollbar-thumb {
    width: 6px;
    left: auto;
    right: 2px;
}

.dpuse-scrollbar-track-h .dpuse-scrollbar-thumb {
    width: auto;
    height: 6px;
    top: auto;
    bottom: 2px;
}

.dpuse-scrollbar-track-v:hover .dpuse-scrollbar-thumb {
    width: 10px;
    right: 1px;
}

.dpuse-scrollbar-track-h:hover .dpuse-scrollbar-thumb {
    height: 10px;
    bottom: 1px;
}

.dpuse-scrollbar-thumb:hover,
.dpuse-scrollbar-thumb:active {
    background-color: var(--muted, rgba(0, 0, 0, 0.5));
}
</style>
