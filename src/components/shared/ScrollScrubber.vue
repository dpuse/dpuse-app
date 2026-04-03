<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue';

const props = defineProps<{
    scrollElement: HTMLElement | null;
}>();

const trackRef = ref<HTMLElement | null>(null);
const thumbTop = ref(0);
const thumbHeight = ref(44);
const isScrollable = ref(false);

const MIN_THUMB_HEIGHT = 44;

let resizeObserver: ResizeObserver | null = null;

function getMetrics() {
    const el = props.scrollElement;
    const track = trackRef.value;
    if (!el || !track) return null;
    return {
        scrollTop: el.scrollTop,
        scrollHeight: el.scrollHeight,
        clientHeight: el.clientHeight,
        maxScroll: el.scrollHeight - el.clientHeight,
        trackHeight: el.clientHeight, // track mirrors the scroll viewport height
    };
}

function updateThumb() {
    const m = getMetrics();
    if (!m) return;

    isScrollable.value = m.maxScroll > 0;
    if (!isScrollable.value) return;

    const natural = (m.clientHeight / m.scrollHeight) * m.trackHeight;
    const clamped = Math.max(MIN_THUMB_HEIGHT, natural);
    thumbHeight.value = clamped;

    const availableTrack = m.trackHeight - clamped;
    const ratio = Math.min(1, Math.max(0, m.scrollTop / m.maxScroll));
    thumbTop.value = ratio * availableTrack;
}

function scrollFromTouchY(clientY: number) {
    const m = getMetrics();
    const track = trackRef.value;
    if (!m || !track) return;

    const trackRect = track.getBoundingClientRect();
    const availableTrack = m.trackHeight - thumbHeight.value;
    const relativeY = clientY - trackRect.top - thumbHeight.value / 2;
    const ratio = Math.min(1, Math.max(0, relativeY / availableTrack));
    props.scrollElement!.scrollTop = ratio * m.maxScroll;
    updateThumb();
}

function onTouchStart(e: TouchEvent) {
    e.preventDefault();
    scrollFromTouchY(e.touches[0].clientY);
}

function onTouchMove(e: TouchEvent) {
    e.preventDefault();
    scrollFromTouchY(e.touches[0].clientY);
}

let mouseDown = false;

function onMouseDown(e: MouseEvent) {
    mouseDown = true;
    scrollFromMouseY(e.clientY);
}

function onMouseMove(e: MouseEvent) {
    if (!mouseDown) return;
    scrollFromMouseY(e.clientY);
}

function onMouseUp() {
    mouseDown = false;
}

function scrollFromMouseY(clientY: number) {
    const m = getMetrics();
    const track = trackRef.value;
    if (!m || !track) return;
    const trackRect = track.getBoundingClientRect();
    const availableTrack = m.trackHeight - thumbHeight.value;
    const relativeY = clientY - trackRect.top - thumbHeight.value / 2;
    const ratio = Math.min(1, Math.max(0, relativeY / availableTrack));
    props.scrollElement!.scrollTop = ratio * m.maxScroll;
    updateThumb();
}

function teardownScrollListener() {
    props.scrollElement?.removeEventListener('scroll', updateThumb);
}

watch(
    () => props.scrollElement,
    (newEl, oldEl) => {
        oldEl?.removeEventListener('scroll', updateThumb);
        resizeObserver?.disconnect();

        if (!newEl) return;

        newEl.addEventListener('scroll', updateThumb, { passive: true });
        resizeObserver = new ResizeObserver(updateThumb);
        resizeObserver.observe(newEl);
        updateThumb();
    },
    { immediate: true }
);

onMounted(() => {
    updateThumb();
    const track = trackRef.value;
    if (!track) return;
    track.addEventListener('touchstart', onTouchStart, { passive: false });
    track.addEventListener('touchmove', onTouchMove, { passive: false });
    track.addEventListener('mousedown', onMouseDown);
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
});

onUnmounted(() => {
    teardownScrollListener();
    resizeObserver?.disconnect();
    const track = trackRef.value;
    if (!track) return;
    track.removeEventListener('touchstart', onTouchStart);
    track.removeEventListener('touchmove', onTouchMove);
    track.removeEventListener('mousedown', onMouseDown);
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);
});
</script>

<template>
    <div v-show="isScrollable" ref="trackRef" class="scrubber-track">
        <div class="scrubber-thumb" :style="{ top: thumbTop + 'px', height: thumbHeight + 'px' }" />
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
    background: rgba(0, 0, 0, 0.04);
}

/* @media (pointer: coarse) { */
.scrubber-track {
    display: block;
}
/* } */

.scrubber-thumb {
    position: absolute;
    right: 4px;
    width: 4px;
    border-radius: 2px;
    background: rgba(120, 120, 120, 0.45);
    pointer-events: none;
}
</style>
