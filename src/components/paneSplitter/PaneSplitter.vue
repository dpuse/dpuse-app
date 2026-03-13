<script setup lang="ts">
import { ref } from 'vue';

const props = withDefaults(defineProps<{ modelValue: number }>(), { modelValue: 50 });
const emit = defineEmits<{ 'update:modelValue': [value: number] }>();

const isDragging = ref(false);

function handlePointerDown(event: PointerEvent): void {
    isDragging.value = true;
    document.body.style.userSelect = 'none';
    (event.target as HTMLElement).setPointerCapture(event.pointerId);
}

function handlePointerMove(event: PointerEvent): void {
    if (!isDragging.value) return;
    const percent = (event.clientX / window.innerWidth) * 100;
    emit('update:modelValue', Math.min(Math.max(percent, 20), 80));
}

function handlePointerUp(): void {
    isDragging.value = false;
    document.body.style.userSelect = '';
}

function handleDblClick(): void {
    emit('update:modelValue', 50);
}
</script>

<template>
    <div
        class="border-boundary hover:bg-separator h-full w-1 flex-none cursor-col-resize border-x transition-colors"
        @pointerdown="handlePointerDown"
        @pointermove="handlePointerMove"
        @pointerup="handlePointerUp"
        @dblclick="handleDblClick"
    />
</template>
