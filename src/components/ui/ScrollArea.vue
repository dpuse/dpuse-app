<script setup lang="ts">
// External Dependencies
import { onMounted, onUnmounted, ref, useId, useTemplateRef } from 'vue';

// Constants ───────────────────────────────────────────────────────────────────────────────────────────────────────────

const VERTICAL_THUMB_RIGHT_INSET = 2;
const VERTICAL_THUMB_WIDTH = 6;

// Options, Properties, Slots & Emits ──────────────────────────────────────────────────────────────────────────────────

export type ScrollAreaPadding = 'embedded' | 'none' | 'screen';
type Properties = { scrollAreaPadding?: ScrollAreaPadding; scrollbarAlwaysVisible?: boolean };
const { scrollAreaPadding, scrollbarAlwaysVisible = false } = defineProps<Properties>();

const emit = defineEmits<{ initialised: [scrollElement: HTMLElement] }>();

// State ───────────────────────────────────────────────────────────────────────────────────────────────────────────────

const scrollElement = useTemplateRef<HTMLElement>('scrollElement');
const scrollElementId = useId();

let hideTimer: ReturnType<typeof setTimeout> | null = null;

const horizontalScrollPercent = ref(0);
const horizontalThumbLeft = ref(0);
const horizontalThumbWidth = ref(0);
const horizontalTrack = useTemplateRef<HTMLElement>('horizontalTrack');
const horizontalVisible = ref(false);

const resizeObserver = new ResizeObserver(updateThumbs);
const contentObserver = new MutationObserver(() => {
    updateThumbs();
    if (scrollbarAlwaysVisible) thumbsShown.value = true;
});

const thumbsShown = ref(false);

const verticalScrollPercent = ref(0);
const verticalThumbHeight = ref(0);
const verticalThumbRightOffset = VERTICAL_THUMB_WIDTH + VERTICAL_THUMB_RIGHT_INSET;
const verticalThumbTop = ref(0);
const verticalTrack = useTemplateRef<HTMLElement>('verticalTrack');
const verticalVisible = ref(false);

// Side Effects ────────────────────────────────────────────────────────────────────────────────────────────────────────

onMounted(() => {
    const element = scrollElement.value;
    if (!element) return;
    element.addEventListener('scroll', handleScroll, { passive: true });
    resizeObserver.observe(element);
    for (const child of element.children) resizeObserver.observe(child);
    contentObserver.observe(element, { childList: true, subtree: false });
    updateThumbs();
    if (scrollbarAlwaysVisible) thumbsShown.value = true;
    emit('initialised', element);
});

onUnmounted(() => {
    scrollElement.value?.removeEventListener('scroll', handleScroll);
    resizeObserver.disconnect();
    contentObserver.disconnect();
    if (hideTimer != null) clearTimeout(hideTimer);
});

// Drag Handlers ───────────────────────────────────────────────────────────────────────────────────────────────────────

function handleVerticalTrackPointerDown(pointerEvent: PointerEvent): void {
    const track = verticalTrack.value;
    const element = scrollElement.value;
    if (!track || !element) return;
    const y = pointerEvent.clientY - track.getBoundingClientRect().top;
    if (y >= verticalThumbTop.value && y <= verticalThumbTop.value + verticalThumbHeight.value) {
        pointerEvent.preventDefault();
        startDrag('v', pointerEvent);
    } else {
        const travel = getTrackTravel(track.getBoundingClientRect().height, verticalThumbHeight.value);
        const scrollRange = getScrollableRange(element.scrollHeight, element.clientHeight);
        element.scrollTop = getScrollOffsetFromPointer(y, verticalThumbHeight.value, travel, scrollRange);
    }
    handleShowThumbs();
}

function handleHorizontalTrackPointerDown(pointerEvent: PointerEvent): void {
    const track = horizontalTrack.value;
    const element = scrollElement.value;
    if (!track || !element) return;
    const x = pointerEvent.clientX - track.getBoundingClientRect().left;
    if (x >= horizontalThumbLeft.value && x <= horizontalThumbLeft.value + horizontalThumbWidth.value) {
        pointerEvent.preventDefault();
        startDrag('h', pointerEvent);
    } else {
        const travel = getTrackTravel(track.getBoundingClientRect().width, horizontalThumbWidth.value);
        const scrollRange = getScrollableRange(element.scrollWidth, element.clientWidth);
        element.scrollLeft = getScrollOffsetFromPointer(x, horizontalThumbWidth.value, travel, scrollRange);
    }
    handleShowThumbs();
}

function handleVerticalTrackTouchStart(touchEvent: TouchEvent): void {
    const track = verticalTrack.value;
    if (!track) return;
    const y = touchEvent.touches[0].clientY - track.getBoundingClientRect().top;
    if (y >= verticalThumbTop.value && y <= verticalThumbTop.value + verticalThumbHeight.value) {
        startDrag('v', touchEvent);
    }
    handleShowThumbs();
}

function handleHorizontalTrackTouchStart(touchEvent: TouchEvent): void {
    const track = horizontalTrack.value;
    if (!track) return;
    const x = touchEvent.touches[0].clientX - track.getBoundingClientRect().left;
    if (x >= horizontalThumbLeft.value && x <= horizontalThumbLeft.value + horizontalThumbWidth.value) {
        startDrag('h', touchEvent);
    }
    handleShowThumbs();
}

function handleShowThumbs(): void {
    thumbsShown.value = true;
    if (scrollbarAlwaysVisible) return;
    if (hideTimer != null) clearTimeout(hideTimer);
    hideTimer = setTimeout(() => {
        thumbsShown.value = false;
    }, 1500);
}

// Drag Helpers ────────────────────────────────────────────────────────────────────────────────────────────────────────

function getScrollOffsetFromPointer(pointerOffset: number, thumbLength: number, travel: number, scrollRange: number): number {
    return scrollRange === 0 || travel === 0 ? 0 : clamp((pointerOffset - thumbLength / 2) / travel, 0, 1) * scrollRange;
}

function startDrag(axis: 'v' | 'h', dragStartEvent: PointerEvent | TouchEvent): void {
    const element = scrollElement.value;
    if (!element) return;

    const isTouch = dragStartEvent instanceof TouchEvent;
    const startY = isTouch ? dragStartEvent.touches[0].clientY : dragStartEvent.clientY;
    const startX = isTouch ? dragStartEvent.touches[0].clientX : dragStartEvent.clientX;
    const startScrollTop = element.scrollTop;
    const startScrollLeft = element.scrollLeft;

    const { scrollHeight, scrollWidth, clientHeight, clientWidth } = element;
    const verticalBottomInset = getVerticalBottomInset(element);
    const verticalTrackHeight = Math.max(0, clientHeight - verticalBottomInset);
    const horizontalTrackRightInset = verticalVisible.value ? verticalThumbRightOffset : 0;
    const horizontalTrackWidth = Math.max(0, clientWidth - horizontalTrackRightInset);
    const verticalScrollRange = getScrollableRange(scrollHeight, clientHeight);
    const horizontalScrollRange = getScrollableRange(scrollWidth, clientWidth);
    const verticalTravel = getTrackTravel(verticalTrackHeight, verticalThumbHeight.value);
    const horizontalTravel = getTrackTravel(horizontalTrackWidth, horizontalThumbWidth.value);

    if (axis === 'v' && (verticalTravel === 0 || verticalScrollRange === 0)) return;
    if (axis === 'h' && (horizontalTravel === 0 || horizontalScrollRange === 0)) return;

    const verticalScale = verticalTravel === 0 ? 0 : verticalScrollRange / verticalTravel;
    const horizontalScale = horizontalTravel === 0 ? 0 : horizontalScrollRange / horizontalTravel;

    function handleDragMove(dragMoveEvent: PointerEvent | TouchEvent): void {
        const clientY = dragMoveEvent instanceof TouchEvent ? dragMoveEvent.touches[0].clientY : dragMoveEvent.clientY;
        const clientX = dragMoveEvent instanceof TouchEvent ? dragMoveEvent.touches[0].clientX : dragMoveEvent.clientX;
        if (axis === 'v') element!.scrollTop = startScrollTop + (clientY - startY) * verticalScale;
        else element!.scrollLeft = startScrollLeft + (clientX - startX) * horizontalScale;
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

// Scroll Handlers ─────────────────────────────────────────────────────────────────────────────────────────────────────

function handleScroll(): void {
    updateThumbs();
    handleShowThumbs();
}

// Wheel Handlers ──────────────────────────────────────────────────────────────────────────────────────────────────────

function handleTrackWheel(wheelEvent: WheelEvent): void {
    const element = scrollElement.value;
    if (!element) return;
    wheelEvent.preventDefault();
    element.scrollBy({ left: wheelEvent.deltaX, top: wheelEvent.deltaY });
}

// Shared Geometry Helpers ─────────────────────────────────────────────────────────────────────────────────────────────

function updateThumbs(): void {
    const element = scrollElement.value;
    if (!element) return;
    const { scrollTop, scrollLeft, scrollHeight, scrollWidth, clientHeight, clientWidth } = element;
    const verticalBottomInset = getVerticalBottomInset(element);

    const verticalRatio = clientHeight / scrollHeight;
    const horizontalRatio = clientWidth / scrollWidth;

    verticalVisible.value = verticalRatio < 1;
    horizontalVisible.value = horizontalRatio < 1;

    const verticalTrackHeight = Math.max(0, clientHeight - verticalBottomInset);
    const horizontalTrackRightInset = verticalVisible.value ? verticalThumbRightOffset : 0;
    const horizontalTrackWidth = Math.max(0, clientWidth - horizontalTrackRightInset);

    verticalThumbHeight.value = Math.max(verticalRatio * verticalTrackHeight, 32);
    horizontalThumbWidth.value = Math.max(horizontalRatio * horizontalTrackWidth, 32);
    const verticalTravel = getTrackTravel(verticalTrackHeight, verticalThumbHeight.value);
    const horizontalTravel = getTrackTravel(horizontalTrackWidth, horizontalThumbWidth.value);
    const verticalScrollRange = getScrollableRange(scrollHeight, clientHeight);
    const horizontalScrollRange = getScrollableRange(scrollWidth, clientWidth);

    verticalThumbTop.value = getThumbPosition(scrollTop, verticalScrollRange, verticalTravel);
    horizontalThumbLeft.value = getThumbPosition(scrollLeft, horizontalScrollRange, horizontalTravel);

    verticalScrollPercent.value = verticalScrollRange === 0 ? 0 : clamp((scrollTop / verticalScrollRange) * 100, 0, 100);
    horizontalScrollPercent.value = horizontalScrollRange === 0 ? 0 : clamp((scrollLeft / horizontalScrollRange) * 100, 0, 100);
}

function getThumbPosition(scrollOffset: number, scrollRange: number, travel: number): number {
    return scrollRange === 0 || travel === 0 ? 0 : clamp((scrollOffset / scrollRange) * travel, 0, travel);
}

function getVerticalBottomInset(element: HTMLElement): number {
    const inset = Number.parseFloat(getComputedStyle(element).paddingBottom);
    return Number.isFinite(inset) ? inset : 0;
}

function getTrackTravel(trackLength: number, thumbLength: number): number {
    return Math.max(0, trackLength - thumbLength);
}

function getScrollableRange(scrollSize: number, clientSize: number): number {
    return Math.max(0, scrollSize - clientSize);
}

function clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(value, max));
}
</script>

<template>
    <div class="dpuse-scroll-area-wrapper" data-region="ScrollArea">
        <div :id="scrollElementId" ref="scrollElement" :class="['dpuse-scroll-area', scrollAreaPadding]">
            <slot />
        </div>

        <div
            v-if="verticalVisible"
            ref="verticalTrack"
            role="scrollbar"
            tabindex="0"
            aria-orientation="vertical"
            :aria-controls="scrollElementId"
            :aria-valuenow="Math.round(verticalScrollPercent)"
            aria-valuemin="0"
            aria-valuemax="100"
            class="dpuse-scrollbar-track dpuse-scrollbar-track-v"
            :class="{ 'dpuse-scrollbar-visible': thumbsShown }"
            :style="{
                bottom:
                    scrollAreaPadding === 'embedded'
                        ? 'var(--vertical-scroll-bottom-embedded-inset)'
                        : scrollAreaPadding === 'screen'
                          ? 'var(--vertical-scroll-bottom-screen-inset)'
                          : '0px'
            }"
            @pointerdown="handleVerticalTrackPointerDown"
            @touchstart.passive="handleVerticalTrackTouchStart"
            @mouseenter="handleShowThumbs"
            @focusin="handleShowThumbs"
            @wheel="handleTrackWheel"
        >
            <div class="dpuse-scrollbar-thumb" :style="{ height: verticalThumbHeight + 'px', transform: `translateY(${verticalThumbTop}px)` }" />
        </div>

        <div
            v-if="horizontalVisible"
            ref="horizontalTrack"
            role="scrollbar"
            tabindex="0"
            aria-orientation="horizontal"
            :aria-controls="scrollElementId"
            :aria-valuenow="Math.round(horizontalScrollPercent)"
            aria-valuemin="0"
            aria-valuemax="100"
            class="dpuse-scrollbar-track dpuse-scrollbar-track-h"
            :class="{ 'dpuse-scrollbar-visible': thumbsShown }"
            :style="{ right: verticalVisible ? verticalThumbRightOffset + 'px' : '0' }"
            @pointerdown="handleHorizontalTrackPointerDown"
            @touchstart.passive="handleHorizontalTrackTouchStart"
            @mouseenter="handleShowThumbs"
            @focusin="handleShowThumbs"
            @wheel="handleTrackWheel"
        >
            <div class="dpuse-scrollbar-thumb" :style="{ width: horizontalThumbWidth + 'px', transform: `translateX(${horizontalThumbLeft}px)` }" />
        </div>
    </div>
</template>

<style scoped>
.dpuse-scroll-area-wrapper {
    position: relative;
    display: flex;
    flex-direction: column;
    min-height: 0;
    min-width: 0;
    overflow: hidden;
}

.dpuse-scroll-area {
    width: 100%;
    flex: 1;
    min-height: 0;
    overflow: scroll;
    overscroll-behavior: none;
    scrollbar-width: none;
}

.dpuse-scroll-area::-webkit-scrollbar {
    display: none;
}

.embedded {
    padding-bottom: var(--vertical-scroll-bottom-embedded-inset);
    padding-right: 16px;
}

.none {
    padding-bottom: 0px;
    padding-right: 16px;
}

.screen {
    padding-bottom: var(--vertical-scroll-bottom-screen-inset);
    padding-right: 16px;
}

/* Tracks */
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

/* Thumbs */
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
