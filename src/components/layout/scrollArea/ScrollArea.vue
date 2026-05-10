<script setup lang="ts">
import { onMounted, onUnmounted, ref, useTemplateRef } from 'vue';

// Options, Properties, Slots & Emits ──────────────────────────────────────────────────────────────────────────────────

type Properties = { autoHide?: string; autoHideSuspend?: boolean; rowCount?: number; scrollAreaInset?: 'embedded' | 'screen'; scrollbarAlwaysVisible?: boolean };
const { scrollAreaInset, scrollbarAlwaysVisible = false } = defineProps<Properties>();

const emit = defineEmits<{ initialised: [scrollElement: HTMLElement] }>();

// State ───────────────────────────────────────────────────────────────────────────────────────────────────────────────

const scrollElement = useTemplateRef<HTMLElement>('scrollElement');
const vThumb = useTemplateRef<HTMLElement>('vThumb');
const hThumb = useTemplateRef<HTMLElement>('hThumb');
const vTrack = useTemplateRef<HTMLElement>('vTrack');
const hTrack = useTemplateRef<HTMLElement>('hTrack');

const vVisible = ref(false);
const hVisible = ref(false);
const vThumbHeight = ref(0);
const hThumbWidth = ref(0);
const vThumbTop = ref(0);
const hThumbLeft = ref(0);

let hideTimer: ReturnType<typeof setTimeout> | null = null;

// Scrollbar calculations ──────────────────────────────────────────────────────────────────────────────────────────────

function updateThumbs(): void {
    const element = scrollElement.value;
    if (!element) return;
    const { scrollTop, scrollLeft, scrollHeight, scrollWidth, clientHeight, clientWidth } = element;

    const vRatio = clientHeight / scrollHeight;
    const hRatio = clientWidth / scrollWidth;

    vVisible.value = vRatio < 1;
    hVisible.value = hRatio < 1;

    vThumbHeight.value = Math.max(vRatio * clientHeight, 32);
    hThumbWidth.value = Math.max(hRatio * clientWidth, 32);

    const vTrackHeight = clientHeight - (hVisible.value ? 44 : 0);
    const hTrackWidth = clientWidth - (vVisible.value ? 44 : 0);

    vThumbTop.value = Math.max(0, Math.min((scrollTop / (scrollHeight - clientHeight)) * (vTrackHeight - vThumbHeight.value), vTrackHeight - vThumbHeight.value));
    hThumbLeft.value = Math.max(0, Math.min((scrollLeft / (scrollWidth - clientWidth)) * (hTrackWidth - hThumbWidth.value), hTrackWidth - hThumbWidth.value));
}

// Auto-hide ───────────────────────────────────────────────────────────────────────────────────────────────────────────

const thumbsShown = ref(false);

function showThumbs(): void {
    thumbsShown.value = true;
    if (scrollbarAlwaysVisible) return;
    if (hideTimer != null) clearTimeout(hideTimer);
    hideTimer = setTimeout(() => {
        thumbsShown.value = false;
    }, 1500);
}

// Scroll sync ─────────────────────────────────────────────────────────────────────────────────────────────────────────

function onScroll(): void {
    updateThumbs();
    showThumbs();
}

// Drag ────────────────────────────────────────────────────────────────────────────────────────────────────────────────

function startDrag(axis: 'v' | 'h', startEvent: PointerEvent | TouchEvent): void {
    const element = scrollElement.value;
    if (!element) return;

    const isTouch = startEvent instanceof TouchEvent;
    const startY = isTouch ? (startEvent as TouchEvent).touches[0].clientY : (startEvent as PointerEvent).clientY;
    const startX = isTouch ? (startEvent as TouchEvent).touches[0].clientX : (startEvent as PointerEvent).clientX;
    const startScrollTop = element.scrollTop;
    const startScrollLeft = element.scrollLeft;

    const { scrollHeight, scrollWidth, clientHeight, clientWidth } = element;
    const vTrackHeight = clientHeight - (hVisible.value ? 44 : 0);
    const hTrackWidth = clientWidth - (vVisible.value ? 44 : 0);
    const vScale = (scrollHeight - clientHeight) / (vTrackHeight - vThumbHeight.value);
    const hScale = (scrollWidth - clientWidth) / (hTrackWidth - hThumbWidth.value);

    function onMove(event: PointerEvent | TouchEvent): void {
        const clientY = event instanceof TouchEvent ? event.touches[0].clientY : event.clientY;
        const clientX = event instanceof TouchEvent ? event.touches[0].clientX : event.clientX;
        if (axis === 'v') element!.scrollTop = startScrollTop + (clientY - startY) * vScale;
        else element!.scrollLeft = startScrollLeft + (clientX - startX) * hScale;
    }

    function onEnd(): void {
        if (isTouch) {
            document.removeEventListener('touchmove', onMove as EventListener);
            document.removeEventListener('touchend', onEnd);
        } else {
            document.removeEventListener('pointermove', onMove as EventListener);
            document.removeEventListener('pointerup', onEnd);
        }
    }

    if (isTouch) {
        document.addEventListener('touchmove', onMove as EventListener, { passive: true });
        document.addEventListener('touchend', onEnd);
    } else {
        document.addEventListener('pointermove', onMove as EventListener);
        document.addEventListener('pointerup', onEnd);
    }
}

function onVTrackPointerDown(event: PointerEvent): void {
    const track = vTrack.value;
    const element = scrollElement.value;
    if (!track || !element) return;
    const y = event.clientY - track.getBoundingClientRect().top;
    if (y >= vThumbTop.value && y <= vThumbTop.value + vThumbHeight.value) {
        event.preventDefault();
        startDrag('v', event);
    } else {
        const ratio = (y - vThumbHeight.value / 2) / (track.getBoundingClientRect().height - vThumbHeight.value);
        element.scrollTop = Math.max(0, Math.min(ratio, 1)) * (element.scrollHeight - element.clientHeight);
    }
    showThumbs();
}

function onHTrackPointerDown(event: PointerEvent): void {
    const track = hTrack.value;
    const element = scrollElement.value;
    if (!track || !element) return;
    const x = event.clientX - track.getBoundingClientRect().left;
    if (x >= hThumbLeft.value && x <= hThumbLeft.value + hThumbWidth.value) {
        event.preventDefault();
        startDrag('h', event);
    } else {
        const ratio = (x - hThumbWidth.value / 2) / (track.getBoundingClientRect().width - hThumbWidth.value);
        element.scrollLeft = Math.max(0, Math.min(ratio, 1)) * (element.scrollWidth - element.clientWidth);
    }
    showThumbs();
}

function onVTrackTouchStart(event: TouchEvent): void {
    const track = vTrack.value;
    if (!track) return;
    const y = event.touches[0].clientY - track.getBoundingClientRect().top;
    if (y >= vThumbTop.value && y <= vThumbTop.value + vThumbHeight.value) {
        startDrag('v', event);
    }
    showThumbs();
}

function onHTrackTouchStart(event: TouchEvent): void {
    const track = hTrack.value;
    if (!track) return;
    const x = event.touches[0].clientX - track.getBoundingClientRect().left;
    if (x >= hThumbLeft.value && x <= hThumbLeft.value + hThumbWidth.value) {
        startDrag('h', event);
    }
    showThumbs();
}

// Wheel forwarding ────────────────────────────────────────────────────────────────────────────────────────────────────

function onTrackWheel(event: WheelEvent): void {
    const element = scrollElement.value;
    if (!element) return;
    event.preventDefault();
    element.scrollBy({ left: event.deltaX, top: event.deltaY });
}

// Resize observer ─────────────────────────────────────────────────────────────────────────────────────────────────────

const resizeObserver = new ResizeObserver(updateThumbs);
const contentObserver = new MutationObserver(() => {
    updateThumbs();
    if (scrollbarAlwaysVisible) thumbsShown.value = true;
});

// Lifecycle ───────────────────────────────────────────────────────────────────────────────────────────────────────────

onMounted(() => {
    const element = scrollElement.value;
    if (!element) return;
    element.addEventListener('scroll', onScroll, { passive: true });
    resizeObserver.observe(element);
    for (const child of element.children) resizeObserver.observe(child);
    contentObserver.observe(element, { childList: true, subtree: false });
    updateThumbs();
    if (scrollbarAlwaysVisible) thumbsShown.value = true;
    emit('initialised', element);
});

onUnmounted(() => {
    scrollElement.value?.removeEventListener('scroll', onScroll);
    resizeObserver.disconnect();
    contentObserver.disconnect();
    if (hideTimer != null) clearTimeout(hideTimer);
});

// Exposed API ─────────────────────────────────────────────────────────────────────────────────────────────────────────

function refresh(): void {
    updateThumbs();
}

defineExpose({ refresh });
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
            :style="{ bottom: hVisible ? '44px' : '0' }"
            @pointerdown="onVTrackPointerDown"
            @touchstart="onVTrackTouchStart"
            @mouseenter="showThumbs"
            @wheel="onTrackWheel"
        >
            <div ref="vThumb" class="scrollbar-thumb" :style="{ height: vThumbHeight + 'px', transform: `translateY(${vThumbTop}px)` }" />
        </div>

        <!-- eslint-disable-next-line vuejs-accessibility/mouse-events-have-key-events, vuejs-accessibility/no-static-element-interactions -->
        <div
            v-if="hVisible"
            ref="hTrack"
            class="scrollbar-track scrollbar-track-h"
            :class="{ 'scrollbar-visible': thumbsShown }"
            :style="{ right: vVisible ? '44px' : '0' }"
            @pointerdown="onHTrackPointerDown"
            @touchstart="onHTrackTouchStart"
            @mouseenter="showThumbs"
            @wheel="onTrackWheel"
        >
            <div ref="hThumb" class="scrollbar-thumb" :style="{ width: hThumbWidth + 'px', transform: `translateX(${hThumbLeft}px)` }" />
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
    /* background: blue; */
    top: 0;
    right: 0;
    width: 44px;
    bottom: 0;
    cursor: pointer;
}

.scrollbar-track-h {
    /* background: red; */
    bottom: 0;
    left: 0;
    right: 0;
    height: 44px;
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
