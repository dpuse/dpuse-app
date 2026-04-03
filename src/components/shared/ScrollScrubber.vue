<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue';

const { scrollElement, rowCount } = defineProps<{
    scrollElement: HTMLElement | null;
    rowCount: number;
}>();

const trackReference = ref<HTMLElement | null>(null);
const thumbTop = ref(0);
const thumbHeight = ref(40);
const isScrollable = ref(false);
const isDragging = ref(false);
const currentRow = ref(1);

const MIN_THUMB_HEIGHT = 40;

let resizeObserver: ResizeObserver | null = null;

function getMetrics() {
    const element = scrollElement;
    const track = trackReference.value;
    if (!element || !track) return null;
    return {
        scrollTop: element.scrollTop,
        scrollHeight: element.scrollHeight,
        clientHeight: element.clientHeight,
        maxScroll: element.scrollHeight - element.clientHeight,
        trackHeight: element.clientHeight
    };
}

function updateThumb(): void {
    const metrics = getMetrics();
    if (!metrics) return;

    isScrollable.value = metrics.maxScroll > 0;
    if (!isScrollable.value) return;

    const natural = (metrics.clientHeight / metrics.scrollHeight) * metrics.trackHeight;
    const clamped = Math.max(MIN_THUMB_HEIGHT, natural);
    thumbHeight.value = clamped;

    const availableTrack = metrics.trackHeight - clamped;
    const ratio = Math.min(1, Math.max(0, metrics.scrollTop / metrics.maxScroll));
    thumbTop.value = ratio * availableTrack;
    currentRow.value = Math.max(1, Math.round(ratio * rowCount));
}

function scrollFromY(clientY: number): void {
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
    isDragging.value = true;
    scrollFromY(event.touches[0].clientY);
}

function onTouchMove(event: TouchEvent): void {
    event.preventDefault();
    scrollFromY(event.touches[0].clientY);
}

function onTouchEnd(): void {
    isDragging.value = false;
}

let mouseDown = false;

function onMouseDown(event: MouseEvent): void {
    event.preventDefault();
    mouseDown = true;
    isDragging.value = true;
    scrollFromY(event.clientY);
}

function onMouseMove(event: MouseEvent): void {
    if (!mouseDown) return;
    scrollFromY(event.clientY);
}

function onMouseUp(): void {
    mouseDown = false;
    isDragging.value = false;
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
    scrollElement?.removeEventListener('scroll', updateThumb);
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
    <div v-show="isScrollable" ref="trackReference" class="scrubber-track">
        <Transition name="label">
            <div v-if="isDragging" class="scrubber-label" :style="{ top: thumbTop + thumbHeight / 2 + 'px' }">
                {{ currentRow.toLocaleString() }}
            </div>
        </Transition>
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
}

/* @media (pointer: coarse) { */
.scrubber-track {
    display: block;
}
/* } */

.scrubber-label {
    position: absolute;
    right: 28px;
    transform: translateY(-50%);
    background: rgba(0, 0, 0, 0.75);
    color: #fff;
    font-size: 18px;
    font-weight: 600;
    padding: 6px 14px;
    border-radius: 20px;
    white-space: nowrap;
    pointer-events: none;
    user-select: none;
}

.label-enter-active,
.label-leave-active {
    transition: opacity 0.15s ease;
}

.label-enter-from,
.label-leave-to {
    opacity: 0;
}

.scrubber-thumb {
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
    width: 12px;
    border-radius: 6px;
    border: 1.5px solid rgba(120, 120, 120, 0.3);
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
    background: rgba(120, 120, 120, 0.35);
}
</style>
