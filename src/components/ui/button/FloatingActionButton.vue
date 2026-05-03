<script setup lang="ts">
// External Dependencies
import { ArrowBigRightIcon, PlusIcon } from 'lucide-vue-next';

// Options, Properties, Slots & Emits
const { typeLabel, variant, verb } = defineProps<{ typeLabel?: string; variant: 'add' | 'step'; verb?: string }>();
</script>

<template>
    <button
        class="fixed flex h-10 min-w-10 items-center justify-center gap-x-1 rounded-full p-1.75 shadow-md"
        :class="
            variant === 'step'
                ? 'border border-blue-400 bg-blue-50 text-blue-600 hover:bg-blue-100 dark:border-blue-500 dark:bg-blue-950 dark:text-blue-400 dark:hover:bg-blue-900'
                : 'border border-zinc-300 bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700'
        "
    >
        <!-- Label -->
        <div v-if="typeLabel || verb" class="flex flex-col items-end pl-1.25">
            <span v-if="verb" class="text-xs leading-none">{{ verb }}</span>
            <span v-if="typeLabel" class="text-xs leading-none">{{ typeLabel }}</span>
        </div>

        <!-- Trailing Icon -->
        <PlusIcon v-if="variant === 'add'" />
        <ArrowBigRightIcon v-else class="size-5" :stroke-width="1.25" />
    </button>
</template>
