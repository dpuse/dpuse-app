<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue';

const { scrollElement, axis = 'vertical', rowCount = 0 } = defineProps<{
    scrollElement: HTMLElement | null;
    axis?: 'vertical' | 'horizontal';
    rowCount?: number;
}>();

const trackReference = ref<HTMLElement | null>(null);
const thumbOffset = ref(0);
const thumbSize = ref(40);
const isScrollable = ref(false);
const isDragging = ref(false);
const currentRow = ref(1);

const MIN_THUMB_SIZE = 40;

let resizeObserver: ResizeObserver | null = null;

const isVertical = (): boolean => axis === 'vertical';

function getMetrics() {
    const element = scrollElement;
    const track = trackReference.value;
    if (!element || !track) return null;

    return isVertical()
        ? {
              scrollPos: element.scrollTop,
              scrollSize: element.scrollHeight,
              clientSize: element.clientHeight,
              maxScroll: element.scrollHeight - element.clientHeight,
              trackSize: element.clientHeight
          }
        : {
              scrollPos: element.scrollLeft,
              scrollSize: element.scrollWidth,
              clientSize: element.clientWidth,
              maxScroll: element.scrollWidth - element.clientWidth,
              trackSize: element.clientWidth
          };
}

function updateThumb(): void {
    const metrics = getMetrics();
    if (!metrics) return;

    isScrollable.value = metrics.maxScroll > 0;
    if (!isScrollable.value) return;

    const natural = (metrics.clientSize / metrics.scrollSize) * metrics.trackSize;
    const clamped = Math.max(MIN_THUMB_SIZE, natural);
    thumbSize.value = clamped;

    const availableTrack = metrics.trackSize - clamped;
    const ratio = Math.min(1, Math.max(0, metrics.scrollPos / metrics.maxScroll));
    thumbOffset.value = ratio * availableTrack;

    if (isVertical() && rowCount > 0) {
        currentRow.value = Math.max(1, Math.round(ratio * rowCount));
    }
}

function scrollFromPosition(clientPos: number): void {
    const metrics = getMetrics();
    const track = trackReference.value;
    if (!metrics || !track) return;

    const trackRect = track.getBoundingClientRect();
    const availableTrack = metrics.trackSize - thumbSize.value;

    if (isVertical()) {
        const relativePos = clientPos - trackRect.top - thumbSize.value / 2;
        const ratio = Math.min(1, Math.max(0, relativePos / availableTrack));
        scrollElement!.scrollTop = ratio * metrics.maxScroll;
    } else {
        const relativePos = clientPos - trackRect.left - thumbSize.value / 2;
        const ratio = Math.min(1, Math.max(0, relativePos / availableTrack));
        scrollElement!.scrollLeft = ratio * metrics.maxScroll;
    }

    updateThumb();
}

function onTouchStart(event: TouchEvent): void {
    event.preventDefault();
    isDragging.value = true;
    scrollFromPosition(isVertical() ? event.touches[0].clientY : event.touches[0].clientX);
}

function onTouchMove(event: TouchEvent): void {
    event.preventDefault();
    scrollFromPosition(isVertical() ? event.touches[0].clientY : event.touches[0].clientX);
}

function onTouchEnd(): void {
    isDragging.value = false;
}

let mouseDown = false;

function onMouseDown(event: MouseEvent): void {
    event.preventDefault();
    mouseDown = true;
    isDragging.value = true;
    scrollFromPosition(isVertical() ? event.clientY : event.clientX);
}

function onMouseMove(event: MouseEvent): void {
    if (!mouseDown) return;
    scrollFromPosition(isVertical() ? event.clientY : event.clientX);
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
    <div
        v-show="isScrollable"
        ref="trackReference"
        class="scrubber-track bg-black/4 dark:bg-white/6"
        :class="isVertical() ? 'scrubber-track--vertical' : 'scrubber-track--horizontal'"
    >
        <!-- Row label — vertical only -->
        <Transition name="label">
            <div
                v-if="isVertical() && isDragging && rowCount > 0"
                class="scrubber-label bg-zinc-800 text-zinc-50 dark:bg-zinc-200 dark:text-zinc-800"
                :style="{ top: thumbOffset + thumbSize / 2 + 'px' }"
            >
                {{ currentRow.toLocaleString() }}
            </div>
        </Transition>

        <!-- Vertical thumb -->
        <div
            v-if="isVertical()"
            class="scrubber-thumb scrubber-thumb--vertical border border-zinc-400/40 dark:border-zinc-400/70"
            :style="{ top: thumbOffset + 'px', height: thumbSize + 'px' }"
        >
            <div class="scrubber-grip scrubber-grip--vertical">
                <span class="scrubber-grip-line--horizontal bg-zinc-400/50 dark:bg-zinc-400/80" />
                <span class="scrubber-grip-line--horizontal bg-zinc-400/50 dark:bg-zinc-400/80" />
                <span class="scrubber-grip-line--horizontal bg-zinc-400/50 dark:bg-zinc-400/80" />
            </div>
        </div>

        <!-- Horizontal thumb -->
        <div
            v-else
            class="scrubber-thumb scrubber-thumb--horizontal border border-zinc-400/40 dark:border-zinc-400/70"
            :style="{ left: thumbOffset + 'px', width: thumbSize + 'px' }"
        >
            <div class="scrubber-grip scrubber-grip--horizontal">
                <span class="scrubber-grip-line--vertical bg-zinc-400/50 dark:bg-zinc-400/80" />
                <span class="scrubber-grip-line--vertical bg-zinc-400/50 dark:bg-zinc-400/80" />
                <span class="scrubber-grip-line--vertical bg-zinc-400/50 dark:bg-zinc-400/80" />
            </div>
        </div>
    </div>
</template>

<style scoped>
/* ── Track ───────────────────────────────────────────────────── */
.scrubber-track {
    position: absolute;
    z-index: 20;
    touch-action: none;
}

.scrubber-track--vertical {
    top: 0;
    right: 0;
    bottom: 0;
    width: 20px;
}

.scrubber-track--horizontal {
    left: 0;
    right: 20px; /* leave room for vertical scrubber corner */
    bottom: 0;
    height: 20px;
}

/* ── Label ───────────────────────────────────────────────────── */
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
}

.label-enter-active,
.label-leave-active {
    transition: opacity 0.15s ease;
}

.label-enter-from,
.label-leave-to {
    opacity: 0;
}

/* ── Vertical thumb ──────────────────────────────────────────── */
.scrubber-thumb--vertical {
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

.scrubber-grip--vertical {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 3px;
}

.scrubber-grip-line--horizontal {
    display: block;
    width: 6px;
    height: 1.5px;
    border-radius: 1px;
}

/* ── Horizontal thumb ────────────────────────────────────────── */
.scrubber-thumb--horizontal {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    height: 12px;
    border-radius: 6px;
    pointer-events: none;
    display: flex;
    align-items: center;
    justify-content: center;
}

.scrubber-grip--horizontal {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 3px;
}

.scrubber-grip-line--vertical {
    display: block;
    width: 1.5px;
    height: 6px;
    border-radius: 1px;
}
</style>
