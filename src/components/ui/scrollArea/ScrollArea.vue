<script setup lang="ts">
// External Dependencies
import 'overlayscrollbars/overlayscrollbars.css';
import type { OverlayScrollbars } from 'overlayscrollbars';
import { OverlayScrollbarsComponent } from 'overlayscrollbars-vue';
import { onUnmounted, ref } from 'vue';

// Properties, Slots & Emits ───────────────────────────────────────────────────────────────────────────────────────────

const { rowCount = 0 } = defineProps<{ rowCount?: number }>();

const emit = defineEmits<{ initialised: [ScrollbarElements: HTMLElement] }>();

// State ───────────────────────────────────────────────────────────────────────────────────────────────────────────────

let scrollElement: HTMLElement | null = null;
let osHandleElement: Element | null = null;
const isDragging = ref(false);
const currentRow = ref(1);
const labelOffsetY = ref(0);

// Side Effects ────────────────────────────────────────────────────────────────────────────────────────────────────────

onUnmounted(() => {
    osHandleElement?.removeEventListener('pointerdown', onHandlePointerDown);
    document.removeEventListener('pointerup', onDocumentPointerUp);
    scrollElement?.removeEventListener('scroll', onViewportScroll);
});

// UI Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

function handleInitialised(instance: OverlayScrollbars): void {
    const { viewport, scrollbarVertical } = instance.elements();
    scrollElement = viewport;
    osHandleElement = scrollbarVertical.handle;
    osHandleElement.addEventListener('pointerdown', onHandlePointerDown);
    document.addEventListener('pointerup', onDocumentPointerUp);
    viewport.addEventListener('scroll', onViewportScroll, { passive: true });

    emit('initialised', scrollElement);
}

function onHandlePointerDown(): void {
    isDragging.value = true;
}
function onDocumentPointerUp(): void {
    isDragging.value = false;
}
function onViewportScroll(): void {
    const element = scrollElement;
    if (!element) return;
    const maxScroll = element.scrollHeight - element.clientHeight;
    if (maxScroll <= 0) return;
    const ratio = element.scrollTop / maxScroll;
    currentRow.value = Math.max(1, Math.round(ratio * rowCount));
    labelOffsetY.value = ratio * (element.clientHeight - 40) + 20;
}
</script>

<template>
    <div class="relative">
        <OverlayScrollbarsComponent class="h-full" defer :options="{ scrollbars: { autoHide: 'leave' } }" @os-initialized="handleInitialised">
            <slot />
        </OverlayScrollbarsComponent>

        <div
            v-if="isDragging && rowCount > 0"
            class="pointer-events-none absolute right-4 z-20 rounded-full bg-zinc-800 px-3 py-1.5 text-sm font-semibold text-zinc-50 select-none dark:bg-zinc-200 dark:text-zinc-800"
            :style="{ top: labelOffsetY + 'px', transform: 'translateY(-50%)' }"
        >
            {{ currentRow.toLocaleString() }}
        </div>
    </div>
</template>
