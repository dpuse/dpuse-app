<script setup lang="ts">
// ── External Dependencies & Registrations
import type { Component } from 'vue';
import { CheckIcon, GripVerticalIcon } from '@lucide/vue';

// ── Options, Props, Slots & Emits ────────────────────────────────────────────────────────────────────────────────────

interface Properties {
    name: string;
    sortable: boolean;
    selected: boolean;
    tileClass: string;
    icon: Component;
}
const { name, sortable, tileClass, icon, selected } = defineProps<Properties>();

const emit = defineEmits<{ toggle: [name: string] }>();

// ── Event Handlers ───────────────────────────────────────────────────────────────────────────────────────────────────

function handleClick(): void {
    // In closed (sortable) mode, clicks are for drag only — do not toggle selection
    if (!sortable) emit('toggle', name);
}
</script>

<template>
    <button :data-selected="selected" class="flex items-center gap-0 rounded-md p-2 text-left text-xs transition-colors" :class="tileClass" type="button" @click="handleClick">
        <component :is="icon" class="size-4 flex-none opacity-70" />

        <span class="min-w-0 truncate pl-1 font-mono">{{ name }}</span>

        <span v-if="sortable" class="ml-auto flex-none cursor-grab p-0.5 opacity-50 active:cursor-grabbing" data-select-handle style="touch-action: none">
            <GripVerticalIcon class="size-3.5" />
        </span>

        <span v-else-if="selected" class="ml-auto flex-none p-0.5 opacity-70" aria-hidden="true">
            <CheckIcon class="size-3.5" stroke-width="2.5" />
        </span>
    </button>
</template>
