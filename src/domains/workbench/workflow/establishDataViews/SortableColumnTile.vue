<script setup lang="ts">
// External Dependencies
import { GripVerticalIcon } from 'lucide-vue-next';
import type { Component } from 'vue';

// Properties & Emits
const { name, sortable, isDragging = false, tileClass, icon } = defineProps<{
    name: string;
    sortable: boolean;
    selected: boolean;
    isDragging?: boolean;
    tileClass: string;
    icon: Component;
}>();
const emit = defineEmits<{
    toggle: [name: string];
    handlePointerDown: [event: PointerEvent, name: string];
}>();

function handleClick(): void {
    // In closed (sortable) mode, clicks are for drag only — do not toggle selection
    if (!sortable) emit('toggle', name);
}
</script>

<template>
    <button
        :data-sort-name="name"
        class="flex items-center gap-0 rounded-md p-2 text-left text-xs transition-colors"
        :class="[tileClass, { 'opacity-30': isDragging }]"
        type="button"
        @click="handleClick"
    >
        <component :is="icon" class="size-4 flex-none opacity-70" />
        <span class="min-w-0 truncate pl-1 font-mono">{{ name }}</span>
        <span
            v-if="sortable"
            class="ml-auto flex-none cursor-grab p-0.5 opacity-40 active:cursor-grabbing"
            style="touch-action: none"
            @pointerdown="emit('handlePointerDown', $event, name)"
        >
            <GripVerticalIcon class="size-3.5" />
        </span>
    </button>
</template>
