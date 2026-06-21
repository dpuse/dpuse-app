<script setup lang="ts">
// External Dependencies & Registrations
import { ref } from 'vue';

// State ───────────────────────────────────────────────────────────────────────────────────────────────────────────────

const modelValue = defineModel<number>();

const isDragging = ref(false);

// ── Event Handlers ───────────────────────────────────────────────────────────────────────────────────────────────────

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
        class="h-full w-1 flex-none cursor-col-resize border-x border-boundary transition-colors hover:bg-separator"
        data-region="PaneSplitter"
        role="button"
        tabIndex="0"
        @pointerdown="handlePointerDown"
        @pointermove="handlePointerMove"
        @pointerup="handlePointerUp"
        @dblclick="handleDoubleClick"
    />
</template>
