<script setup lang="ts">
// External Dependencies
import { ArrowBigRightIcon, PlusIcon } from 'lucide-vue-next';

// Properties, Slots & Emits
const { typeLabel, variant, verb } = defineProps<{ typeLabel?: string; variant: 'add' | 'next'; verb?: string }>();
</script>

<template>
    <button
        class="absolute flex items-center gap-x-1 rounded-full p-1.75 shadow-md"
        :class="
            variant === 'next'
                ? 'border border-blue-400 bg-blue-50 text-blue-600 hover:bg-blue-100 dark:border-blue-500 dark:bg-blue-950 dark:text-blue-400 dark:hover:bg-blue-900'
                : 'border border-zinc-300 bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700'
        "
    >
        <div v-if="typeLabel || verb" class="flex flex-col items-end pl-1.25">
            <span v-if="verb" class="text-xs leading-none">{{ verb }}</span>
            <span v-if="typeLabel" class="text-xs leading-none">{{ typeLabel }}</span>
        </div>
        <PlusIcon v-if="variant === 'add'" />
        <ArrowBigRightIcon v-else :stroke-width="1.25" />
    </button>
</template>
