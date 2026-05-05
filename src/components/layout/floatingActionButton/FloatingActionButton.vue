<script setup lang="ts">
// External Dependencies
import { ArrowBigRightIcon, PlusIcon } from 'lucide-vue-next';

// Local Components - Static
import Button from '@/components/ui/button/Button.vue';

// Options, Properties, Slots & Emits
const { componentTypeLabel, variant, verb } = defineProps<{ componentTypeLabel?: string; variant: 'add' | 'step'; verb?: string }>();
</script>

<template>
    <Button
        shape="minimal"
        class="flex h-10 min-w-10 items-center justify-center gap-x-1 rounded-full p-1.75 shadow-md focus-visible:ring-2"
        :class="
            variant === 'step'
                ? 'border border-blue-400 bg-blue-50 text-blue-600 hover:bg-blue-100 focus-visible:ring-blue-300 dark:border-blue-500 dark:bg-blue-950 dark:text-blue-400 dark:hover:bg-blue-900 dark:focus-visible:ring-blue-500'
                : 'border border-zinc-300 bg-zinc-100 text-zinc-600 hover:bg-zinc-200 focus-visible:ring-zinc-300 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700 dark:focus-visible:ring-zinc-500'
        "
    >
        <!-- Verb & Component Type Label -->
        <div v-if="componentTypeLabel || verb" class="flex flex-col items-end pl-1.25">
            <span v-if="verb" class="text-xs leading-none">{{ verb }}</span>
            <span v-if="componentTypeLabel" class="text-xs leading-none">{{ componentTypeLabel }}</span>
        </div>

        <!-- Trailing Icon -->
        <PlusIcon v-if="variant === 'add'" />
        <ArrowBigRightIcon v-else class="size-5" :stroke-width="1.25" />
    </Button>
</template>
