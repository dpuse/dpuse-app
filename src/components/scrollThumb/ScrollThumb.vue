<script setup lang="ts">
// External Dependencies
import { onMounted, onUnmounted, ref, watch } from 'vue';

// Properties & Emits
const { scrollElement, rowCount = 0 } = defineProps<{ scrollElement: HTMLElement | null; rowCount?: number }>();

// Local State ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const currentRow = ref(1);
const isDragging = ref(false);
const isScrollable = ref(false);
let resizeObserver: ResizeObserver | null = null;
const trackReference = ref<HTMLElement | null>(null);
const thumbOffset = ref(0);
const thumbSize = ref(40);

// Side Effects ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

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

// UI Helpers ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

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

// Helpers ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

type Metrics = { scrollPos: number; scrollSize: number; clientSize: number; maxScroll: number; trackSize: number };
function getMetrics(): Metrics | null {
    const element = scrollElement;
    const track = trackReference.value;
    if (!element || !track) return null;
    return {
        scrollPos: element.scrollTop,
        scrollSize: element.scrollHeight,
        clientSize: element.clientHeight,
        maxScroll: element.scrollHeight - element.clientHeight,
        trackSize: element.clientHeight
    };
}

function updateThumb(): void {
    const metrics = getMetrics();
    if (!metrics) return;

    isScrollable.value = metrics.maxScroll > 0;
    if (!isScrollable.value) return;

    thumbSize.value = 40;

    const availableTrack = metrics.trackSize - 40;
    const ratio = Math.min(1, Math.max(0, metrics.scrollPos / metrics.maxScroll));
    thumbOffset.value = ratio * availableTrack;

    if (rowCount > 0) {
        currentRow.value = Math.max(1, Math.round(ratio * rowCount));
    }
}

function scrollFromY(clientY: number): void {
    const metrics = getMetrics();
    const track = trackReference.value;
    if (!metrics || !track) return;

    const trackRect = track.getBoundingClientRect();
    const availableTrack = metrics.trackSize - thumbSize.value;
    const relativePos = clientY - trackRect.top - thumbSize.value / 2;
    const ratio = Math.min(1, Math.max(0, relativePos / availableTrack));
    scrollElement!.scrollTop = ratio * metrics.maxScroll;
    updateThumb();
}
</script>

<template>
    <div v-show="isScrollable" ref="trackReference" class="scrubber-track">
        <div
            class="scrubber-label bg-zinc-800 text-zinc-50 dark:bg-zinc-200 dark:text-zinc-800"
            :class="{ 'scrubber-label--visible': isDragging && rowCount > 0 }"
            :style="{ top: thumbOffset + thumbSize / 2 + 'px' }"
        >
            {{ currentRow.toLocaleString() }}
        </div>
        <div class="scrubber-thumb border border-zinc-400/40 dark:border-zinc-400/70" :style="{ top: thumbOffset + 'px', height: thumbSize + 'px' }">
            <div class="scrubber-grip">
                <span class="scrubber-grip-line bg-zinc-400/50 dark:bg-zinc-400/80" />
                <span class="scrubber-grip-line bg-zinc-400/50 dark:bg-zinc-400/80" />
                <span class="scrubber-grip-line bg-zinc-400/50 dark:bg-zinc-400/80" />
            </div>
        </div>
    </div>
</template>

<style scoped>
.scrubber-track {
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    width: 20px;
    z-index: 20;
    touch-action: none;
}

.scrubber-label {
    position: absolute;
    right: 28px;
    transform: translateY(-50%);
    font-size: 14px;
    font-weight: 600;
    padding: 5px 12px;
    border-radius: 20px;
    white-space: nowrap;
    pointer-events: none;
    user-select: none;
    opacity: 0;
    transition: opacity 0.15s ease;
}

.scrubber-label--visible {
    opacity: 1;
}

.scrubber-thumb {
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
    width: 12px;
    border-radius: 6px;
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

.scrubber-grip-line {
    display: block;
    width: 6px;
    height: 1.5px;
    border-radius: 1px;
}
</style>
