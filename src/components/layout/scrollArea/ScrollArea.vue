<script setup lang="ts">
// External Dependencies
import { onMounted, onUnmounted, ref, useTemplateRef } from 'vue';

// Options, Properties, Slots & Emits ──────────────────────────────────────────────────────────────────────────────────

type Properties = { scrollAreaInset?: 'embedded' | 'screen'; scrollbarAlwaysVisible?: boolean };
const { scrollAreaInset, scrollbarAlwaysVisible = false } = defineProps<Properties>();

const emit = defineEmits<{ initialised: [scrollElement: HTMLElement] }>();

// State ───────────────────────────────────────────────────────────────────────────────────────────────────────────────

const scrollElement = useTemplateRef<HTMLElement>('scrollElement');
const vTrack = useTemplateRef<HTMLElement>('vTrack');
const hTrack = useTemplateRef<HTMLElement>('hTrack');

const vVisible = ref(false);
const hVisible = ref(false);
const vThumbHeight = ref(0);
const hThumbWidth = ref(0);
const vThumbTop = ref(0);
const hThumbLeft = ref(0);

const verticalThumbWidth = 6;
const verticalThumbRightInset = 2;
const verticalThumbRightOffset = verticalThumbWidth + verticalThumbRightInset;

let hideTimer: ReturnType<typeof setTimeout> | null = null;

const thumbsShown = ref(false);

const resizeObserver = new ResizeObserver(updateThumbs);
const contentObserver = new MutationObserver(() => {
    updateThumbs();
    if (scrollbarAlwaysVisible) thumbsShown.value = true;
});

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

// Scrollbar calculations ──────────────────────────────────────────────────────────────────────────────────────────────

function updateThumbs(): void {
    const element = scrollElement.value;
    if (!element) return;
    const { scrollTop, scrollLeft, scrollHeight, scrollWidth, clientHeight, clientWidth } = element;
    const verticalBottomInset = getVerticalBottomInset(element);

    const vRatio = clientHeight / scrollHeight;
    const hRatio = clientWidth / scrollWidth;

    vVisible.value = vRatio < 1;
    hVisible.value = hRatio < 1;

    vThumbHeight.value = Math.max(vRatio * clientHeight, 32);
    hThumbWidth.value = Math.max(hRatio * clientWidth, 32);

    const vTrackHeight = Math.max(0, clientHeight - verticalBottomInset);
    const hTrackRightInset = vVisible.value ? verticalThumbRightOffset : 0;
    const hTrackWidth = Math.max(0, clientWidth - hTrackRightInset);
    const vTravel = getTrackTravel(vTrackHeight, vThumbHeight.value);
    const hTravel = getTrackTravel(hTrackWidth, hThumbWidth.value);
    const vScrollRange = getScrollableRange(scrollHeight, clientHeight);
    const hScrollRange = getScrollableRange(scrollWidth, clientWidth);

    vThumbTop.value = getThumbPosition(scrollTop, vScrollRange, vTravel);
    hThumbLeft.value = getThumbPosition(scrollLeft, hScrollRange, hTravel);
}

function getThumbPosition(scrollOffset: number, scrollRange: number, travel: number): number {
    return scrollRange === 0 || travel === 0 ? 0 : clamp((scrollOffset / scrollRange) * travel, 0, travel);
}

// Auto-hide ───────────────────────────────────────────────────────────────────────────────────────────────────────────

function showThumbs(): void {
    thumbsShown.value = true;
    if (scrollbarAlwaysVisible) return;
    if (hideTimer != null) clearTimeout(hideTimer);
    hideTimer = setTimeout(() => {
        thumbsShown.value = false;
    }, 1500);
}

// Scroll sync ─────────────────────────────────────────────────────────────────────────────────────────────────────────

function handleScroll(): void {
    updateThumbs();
    showThumbs();
}

// Drag: Helpers ───────────────────────────────────────────────────────────────────────────────────────────────────────

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
    const vTrackHeight = Math.max(0, clientHeight - verticalBottomInset);
    const hTrackRightInset = vVisible.value ? verticalThumbRightOffset : 0;
    const hTrackWidth = Math.max(0, clientWidth - hTrackRightInset);
    const vScrollRange = getScrollableRange(scrollHeight, clientHeight);
    const hScrollRange = getScrollableRange(scrollWidth, clientWidth);
    const vTravel = getTrackTravel(vTrackHeight, vThumbHeight.value);
    const hTravel = getTrackTravel(hTrackWidth, hThumbWidth.value);

    if (axis === 'v' && (vTravel === 0 || vScrollRange === 0)) return;
    if (axis === 'h' && (hTravel === 0 || hScrollRange === 0)) return;

    const vScale = vTravel === 0 ? 0 : vScrollRange / vTravel;
    const hScale = hTravel === 0 ? 0 : hScrollRange / hTravel;

    function handleDragMove(dragMoveEvent: PointerEvent | TouchEvent): void {
        const clientY = dragMoveEvent instanceof TouchEvent ? dragMoveEvent.touches[0].clientY : dragMoveEvent.clientY;
        const clientX = dragMoveEvent instanceof TouchEvent ? dragMoveEvent.touches[0].clientX : dragMoveEvent.clientX;
        if (axis === 'v') element!.scrollTop = startScrollTop + (clientY - startY) * vScale;
        else element!.scrollLeft = startScrollLeft + (clientX - startX) * hScale;
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

// Drag: UI Helpers ────────────────────────────────────────────────────────────────────────────────────────────────────

function handleVTrackPointerDown(pointerEvent: PointerEvent): void {
    const track = vTrack.value;
    const element = scrollElement.value;
    if (!track || !element) return;
    const y = pointerEvent.clientY - track.getBoundingClientRect().top;
    if (y >= vThumbTop.value && y <= vThumbTop.value + vThumbHeight.value) {
        pointerEvent.preventDefault();
        startDrag('v', pointerEvent);
    } else {
        const travel = getTrackTravel(track.getBoundingClientRect().height, vThumbHeight.value);
        const scrollRange = getScrollableRange(element.scrollHeight, element.clientHeight);
        element.scrollTop = getScrollOffsetFromPointer(y, vThumbHeight.value, travel, scrollRange);
    }
    showThumbs();
}

function handleHTrackPointerDown(pointerEvent: PointerEvent): void {
    const track = hTrack.value;
    const element = scrollElement.value;
    if (!track || !element) return;
    const x = pointerEvent.clientX - track.getBoundingClientRect().left;
    if (x >= hThumbLeft.value && x <= hThumbLeft.value + hThumbWidth.value) {
        pointerEvent.preventDefault();
        startDrag('h', pointerEvent);
    } else {
        const travel = getTrackTravel(track.getBoundingClientRect().width, hThumbWidth.value);
        const scrollRange = getScrollableRange(element.scrollWidth, element.clientWidth);
        element.scrollLeft = getScrollOffsetFromPointer(x, hThumbWidth.value, travel, scrollRange);
    }
    showThumbs();
}

function handleVTrackTouchStart(touchEvent: TouchEvent): void {
    const track = vTrack.value;
    if (!track) return;
    const y = touchEvent.touches[0].clientY - track.getBoundingClientRect().top;
    if (y >= vThumbTop.value && y <= vThumbTop.value + vThumbHeight.value) {
        startDrag('v', touchEvent);
    }
    showThumbs();
}

function handleHTrackTouchStart(touchEvent: TouchEvent): void {
    const track = hTrack.value;
    if (!track) return;
    const x = touchEvent.touches[0].clientX - track.getBoundingClientRect().left;
    if (x >= hThumbLeft.value && x <= hThumbLeft.value + hThumbWidth.value) {
        startDrag('h', touchEvent);
    }
    showThumbs();
}

function getScrollOffsetFromPointer(pointerOffset: number, thumbLength: number, travel: number, scrollRange: number): number {
    return scrollRange === 0 || travel === 0 ? 0 : clamp((pointerOffset - thumbLength / 2) / travel, 0, 1) * scrollRange;
}

// UI Helpers: Wheel forwarding ────────────────────────────────────────────────────────────────────────────────────────

function handleTrackWheel(wheelEvent: WheelEvent): void {
    const element = scrollElement.value;
    if (!element) return;
    wheelEvent.preventDefault();
    element.scrollBy({ left: wheelEvent.deltaX, top: wheelEvent.deltaY });
}

// Helpers ─────────────────────────────────────────────────────────────────────────────────────────────────────────────

function clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(value, max));
}

function getScrollableRange(scrollSize: number, clientSize: number): number {
    return Math.max(0, scrollSize - clientSize);
}

function getTrackTravel(trackLength: number, thumbLength: number): number {
    return Math.max(0, trackLength - thumbLength);
}

function getVerticalBottomInset(element: HTMLElement): number {
    const inset = Number.parseFloat(getComputedStyle(element).paddingBottom);
    return Number.isFinite(inset) ? inset : 0;
}
</script>

<template>
    <div class="scroll-area-wrapper">
        <div ref="scrollElement" :class="['scroll-area', scrollAreaInset]">
            <slot />
        </div>

        <!-- eslint-disable-next-line vuejs-accessibility/mouse-events-have-key-events, vuejs-accessibility/no-static-element-interactions -->
        <div
            v-if="vVisible"
            ref="vTrack"
            class="scrollbar-track scrollbar-track-v"
            :class="{ 'scrollbar-visible': thumbsShown }"
            :style="{
                bottom:
                    scrollAreaInset === 'embedded'
                        ? 'var(--vertical-scroll-bottom-embedded-inset)'
                        : scrollAreaInset === 'screen'
                          ? 'var(--vertical-scroll-bottom-screen-inset)'
                          : '0px'
            }"
            @pointerdown="handleVTrackPointerDown"
            @touchstart="handleVTrackTouchStart"
            @mouseenter="showThumbs"
            @wheel="handleTrackWheel"
        >
            <div class="scrollbar-thumb" :style="{ height: vThumbHeight + 'px', transform: `translateY(${vThumbTop}px)` }" />
        </div>

        <!-- eslint-disable-next-line vuejs-accessibility/mouse-events-have-key-events, vuejs-accessibility/no-static-element-interactions -->
        <div
            v-if="hVisible"
            ref="hTrack"
            class="scrollbar-track scrollbar-track-h"
            :class="{ 'scrollbar-visible': thumbsShown }"
            :style="{ right: vVisible ? verticalThumbRightOffset + 'px' : '0' }"
            @pointerdown="handleHTrackPointerDown"
            @touchstart="handleHTrackTouchStart"
            @mouseenter="showThumbs"
            @wheel="handleTrackWheel"
        >
            <div class="scrollbar-thumb" :style="{ width: hThumbWidth + 'px', transform: `translateX(${hThumbLeft}px)` }" />
        </div>
    </div>
</template>

<style scoped>
.scroll-area-wrapper {
    position: relative;
    min-height: 0;
    min-width: 0;
    overflow: hidden;
}

.scroll-area {
    width: 100%;
    height: 100%;
    overflow: scroll;
    overscroll-behavior: none;
    scrollbar-width: none;
}

.scroll-area::-webkit-scrollbar {
    display: none;
}

.embedded {
    padding-bottom: var(--vertical-scroll-bottom-embedded-inset);
    padding-right: 16px;
}

.screen {
    padding-bottom: var(--vertical-scroll-bottom-screen-inset);
    padding-right: 16px;
}

/* Tracks */
.scrollbar-track {
    position: absolute;
    border-radius: 0;
    opacity: 0;
    transition: opacity 0.2s ease;
    pointer-events: auto;
}

.scrollbar-track.scrollbar-visible {
    opacity: 1;
}

.scrollbar-track-v {
    top: 0;
    right: 0;
    width: 24px;
    bottom: 0;
    cursor: pointer;
}

.scrollbar-track-h {
    bottom: 0;
    left: 0;
    right: 0;
    height: 24px;
    cursor: pointer;
}

/* Thumbs */
.scrollbar-thumb {
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

.scrollbar-track-v .scrollbar-thumb {
    width: 6px;
    left: auto;
    right: 2px;
}

.scrollbar-track-h .scrollbar-thumb {
    width: auto;
    height: 6px;
    top: auto;
    bottom: 2px;
}

.scrollbar-track-v:hover .scrollbar-thumb {
    width: 10px;
    right: 1px;
}

.scrollbar-track-h:hover .scrollbar-thumb {
    height: 10px;
    bottom: 1px;
}

.scrollbar-thumb:hover,
.scrollbar-thumb:active {
    background-color: var(--muted, rgba(0, 0, 0, 0.5));
}
</style>
