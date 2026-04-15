<script setup lang="ts">
// External Dependencies
import { ref } from 'vue';

// Properties, Emits & Slots ───────────────────────────────────────────────────────────────────────────────────────────

const modelValue = defineModel<number>();

// State ───────────────────────────────────────────────────────────────────────────────────────────────────────────────

const isDragging = ref(false);

// UI Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

function handleDoubleClick(): void {
    modelValue.value = 50;
}

function handlePointerDown(event: PointerEvent): void {
    isDragging.value = true;
    document.body.style.userSelect = 'none';
    (event.target as HTMLElement).setPointerCapture(event.pointerId);
}

function handlePointerMove(event: PointerEvent): void {
    if (!isDragging.value) return;
    const percent = (event.clientX / window.innerWidth) * 100;
    modelValue.value = Math.min(Math.max(percent, 20), 80);
}

function handlePointerUp(): void {
    isDragging.value = false;
    document.body.style.userSelect = '';
}
</script>

<template>
    <!-- TODO: May need to pass the tabindex. -->
    <div
        class="border-boundary hover:bg-separator h-full w-1 flex-none cursor-col-resize border-x transition-colors"
        role="button"
        tabIndex="0"
        @pointerdown="handlePointerDown"
        @pointermove="handlePointerMove"
        @pointerup="handlePointerUp"
        @dblclick="handleDoubleClick"
    />
</template>
