<script setup lang="ts">
// ── External Dependencies & Registrations
import { computed, onMounted, onUnmounted, useId, useTemplateRef } from 'vue';

// ── Local Components - Static
import ScrollThumb, { SCROLL_THUMB_CROSS_INSET } from './ScrollThumb.vue';

// ── Options, Properties, Slots & Emits ───────────────────────────────────────────────────────────────────────────────

type Properties = { scrollAreaPaddingBottom?: number | string; scrollbarAlwaysVisible?: boolean };
const { scrollAreaPaddingBottom, scrollbarAlwaysVisible = false } = defineProps<Properties>();

const emit = defineEmits<{ initialised: [scrollElement: HTMLElement] }>();

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────
// Vertical scrolling happens on the outer element, horizontal on a nested inner element, so no single
// DOM node is ever scrollable on both axes — this is what keeps iOS from blending a diagonal swipe into
// simultaneous x/y scroll, since each element's native gesture handling only ever has one axis to resolve.
// Scrollbar visuals (track/thumb, drag, wheel, auto-hide) live in ScrollThumb, not here.

const scrollElement = useTemplateRef<HTMLElement>('scrollElement');
const scrollElementId = useId();
const innerScrollElement = useTemplateRef<HTMLElement>('innerScrollElement');
const innerScrollElementId = useId();

const verticalThumb = useTemplateRef<InstanceType<typeof ScrollThumb>>('verticalThumb');

// ── Derived State ────────────────────────────────────────────────────────────────────────────────────────────────────

const paddingBottom = computed(() => (typeof scrollAreaPaddingBottom === 'number' ? `${scrollAreaPaddingBottom}px` : scrollAreaPaddingBottom));

// ── Side Effects ─────────────────────────────────────────────────────────────────────────────────────────────────────

onMounted(() => {
    const element = scrollElement.value;
    const inner = innerScrollElement.value;
    if (!element || !inner) return;
    element.addEventListener('wheel', handleContentWheel, { passive: true });
    emit('initialised', element);
});

onUnmounted(() => {
    scrollElement.value?.removeEventListener('wheel', handleContentWheel);
});

// ── Wheel Handlers ───────────────────────────────────────────────────────────────────────────────────────────────────

// Wheeling over content hits the inner (horizontal-only) element first. Because it's a scroll container
// even with overflow-y: hidden, it claims the wheel event and drops the vertical component instead of
// letting it bubble to the outer scroller natively, so the vertical component is routed here explicitly.
function handleContentWheel(wheelEvent: WheelEvent): void {
    if (wheelEvent.deltaY === 0) return;
    scrollElement.value?.scrollBy({ top: wheelEvent.deltaY });
}
</script>

<template>
    <div class="dpuse-scroll-area-wrapper" data-region="ScrollArea">
        <div :id="scrollElementId" ref="scrollElement" class="dpuse-scroll-area-v" :style="{ paddingBottom }">
            <div :id="innerScrollElementId" ref="innerScrollElement" class="dpuse-scroll-area-h">
                <slot />
            </div>
        </div>

        <ScrollThumb
            ref="verticalThumb"
            orientation="vertical"
            :scroll-element="scrollElement"
            :cross-scroll-element="innerScrollElement"
            :always-visible="scrollbarAlwaysVisible"
        />
        <ScrollThumb
            orientation="horizontal"
            :scroll-element="innerScrollElement"
            :cross-scroll-element="scrollElement"
            :cross-inset-end="verticalThumb?.visible ? SCROLL_THUMB_CROSS_INSET : 0"
            :always-visible="scrollbarAlwaysVisible"
        />
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

.dpuse-scroll-area-v {
    width: 100%;
    flex: 1;
    min-height: 0;
    overflow-x: hidden;
    overflow-y: scroll;
    overscroll-behavior: none;
    scrollbar-width: none;
    padding-right: 16px;
}

.dpuse-scroll-area-v::-webkit-scrollbar {
    display: none;
}

.dpuse-scroll-area-h {
    width: 100%;
    overflow-x: scroll;
    overflow-y: hidden;
    overscroll-behavior: none;
    scrollbar-width: none;
}

.dpuse-scroll-area-h::-webkit-scrollbar {
    display: none;
}
</style>
