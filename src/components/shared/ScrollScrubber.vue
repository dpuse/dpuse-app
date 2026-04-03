<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue';

const { scrollElement } = defineProps<{
    scrollElement: HTMLElement | null;
}>();

const trackReference = ref<HTMLElement | null>(null);
const thumbTop = ref(0);
const thumbHeight = ref(44);
const isScrollable = ref(false);
const isVisible = ref(false);

const MIN_THUMB_HEIGHT = 44;
const HIDE_DELAY_MS = 1200;

let resizeObserver: ResizeObserver | null = null;
let hideTimer: ReturnType<typeof setTimeout> | null = null;

function showScrubber(): void {
    isVisible.value = true;
    if (hideTimer !== null) clearTimeout(hideTimer);
    hideTimer = setTimeout(() => (isVisible.value = false), HIDE_DELAY_MS);
}

function cancelHide(): void {
    if (hideTimer !== null) {
        clearTimeout(hideTimer);
        hideTimer = null;
    }
    isVisible.value = true;
}

function resumeHide(): void {
    hideTimer = setTimeout(() => (isVisible.value = false), HIDE_DELAY_MS);
}

function getMetrics() {
    const element = scrollElement;
    const track = trackReference.value;
    if (!element || !track) return null;
    return {
        scrollTop: element.scrollTop,
        scrollHeight: element.scrollHeight,
        clientHeight: element.clientHeight,
        maxScroll: element.scrollHeight - element.clientHeight,
        trackHeight: element.clientHeight // track mirrors the scroll viewport height
    };
}

function updateThumb(): void {
    const metrics = getMetrics();
    if (!metrics) return;

    isScrollable.value = metrics.maxScroll > 0;
    showScrubber();
    if (!isScrollable.value) return;

    const natural = (metrics.clientHeight / metrics.scrollHeight) * metrics.trackHeight;
    const clamped = Math.max(MIN_THUMB_HEIGHT, natural);
    thumbHeight.value = clamped;

    const availableTrack = metrics.trackHeight - clamped;
    const ratio = Math.min(1, Math.max(0, metrics.scrollTop / metrics.maxScroll));
    thumbTop.value = ratio * availableTrack;
}

function scrollFromTouchY(clientY: number): void {
    const metrics = getMetrics();
    const track = trackReference.value;
    if (!metrics || !track) return;

    const trackRect = track.getBoundingClientRect();
    const availableTrack = metrics.trackHeight - thumbHeight.value;
    const relativeY = clientY - trackRect.top - thumbHeight.value / 2;
    const ratio = Math.min(1, Math.max(0, relativeY / availableTrack));
    scrollElement!.scrollTop = ratio * metrics.maxScroll;
    updateThumb();
}

function onTouchStart(event: TouchEvent): void {
    event.preventDefault();
    cancelHide();
    scrollFromTouchY(event.touches[0].clientY);
}

function onTouchMove(event: TouchEvent): void {
    event.preventDefault();
    scrollFromTouchY(event.touches[0].clientY);
}

function onTouchEnd(): void {
    resumeHide();
}

let mouseDown = false;

function onMouseDown(event: MouseEvent): void {
    event.preventDefault();
    mouseDown = true;
    cancelHide();
    scrollFromMouseY(event.clientY);
}

function onMouseMove(event: MouseEvent): void {
    if (!mouseDown) return;
    scrollFromMouseY(event.clientY);
}

function onMouseUp(): void {
    mouseDown = false;
    resumeHide();
}

function scrollFromMouseY(clientY: number): void {
    const metrics = getMetrics();
    const track = trackReference.value;
    if (!metrics || !track) return;
    const trackRect = track.getBoundingClientRect();
    const availableTrack = metrics.trackHeight - thumbHeight.value;
    const relativeY = clientY - trackRect.top - thumbHeight.value / 2;
    const ratio = Math.min(1, Math.max(0, relativeY / availableTrack));
    scrollElement!.scrollTop = ratio * metrics.maxScroll;
    updateThumb();
}

function teardownScrollListener(): void {
    scrollElement?.removeEventListener('scroll', updateThumb);
}

watch(
    () => scrollElement,
    (newElement, oldElement) => {
        oldElement?.removeEventListener('scroll', updateThumb);
        resizeObserver?.disconnect();

        if (!newElement) return;

        newElement.addEventListener('scroll', updateThumb, { passive: true });
        resizeObserver = new ResizeObserver(updateThumb);
        resizeObserver.observe(newElement);
        updateThumb();
    },
    { immediate: true }
);

onMounted(() => {
    updateThumb();
    const track = trackReference.value;
    if (!track) return;
    track.addEventListener('touchstart', onTouchStart, { passive: false });
    track.addEventListener('touchmove', onTouchMove, { passive: false });
    track.addEventListener('touchend', onTouchEnd, { passive: true });
    track.addEventListener('mousedown', onMouseDown);
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
});

onUnmounted(() => {
    teardownScrollListener();
    resizeObserver?.disconnect();
    const track = trackReference.value;
    if (!track) return;
    track.removeEventListener('touchstart', onTouchStart);
    track.removeEventListener('touchmove', onTouchMove);
    track.removeEventListener('touchend', onTouchEnd);
    track.removeEventListener('mousedown', onMouseDown);
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);
});
</script>

<template>
    <div v-show="isScrollable" ref="trackReference" class="scrubber-track" :class="{ 'scrubber-track--visible': isVisible }">
        <div class="scrubber-thumb" :style="{ top: thumbTop + 'px', height: thumbHeight + 'px' }">
            <div class="scrubber-grip">
                <span /><span /><span />
            </div>
        </div>
    </div>
</template>

<style scoped>
.scrubber-track {
    display: none;
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    width: 20px;
    z-index: 20;
    touch-action: none;
    background: transparent;
    transition: background 0.3s ease;
}

/* @media (pointer: coarse) { */
.scrubber-track {
    display: block;
}
/* } */

.scrubber-track--visible {
    background: rgba(0, 0, 0, 0.04);
}

.scrubber-thumb {
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
    width: 12px;
    border-radius: 6px;
    border: 1.5px solid rgba(120, 120, 120, 0.5);
    pointer-events: none;
    display: flex;
    align-items: center;
    justify-content: center;
}

.scrubber-grip {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 3px;
}

.scrubber-grip span {
    display: block;
    width: 6px;
    height: 1.5px;
    border-radius: 1px;
    background: rgba(120, 120, 120, 0.6);
}
</style>
