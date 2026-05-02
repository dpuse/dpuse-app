<script setup lang="ts">
// External Dependencies
import { ArrowBigRightIcon, PlusIcon } from 'lucide-vue-next';

const { variant = 'next' } = defineProps<{ variant?: 'add' | 'next' }>();
</script>

<template>
    <button
        class="absolute flex h-10 w-10 items-center justify-center rounded-full border border-blue-500 bg-blue-500/15 text-blue-600 shadow-md hover:bg-blue-500/25 dark:border-blue-400 dark:bg-blue-500/25 dark:text-blue-400 dark:hover:bg-blue-500/35"
    >
        <PlusIcon v-if="variant === 'add'" />
        <ArrowBigRightIcon v-else :stroke-width="1.5" />
    </button>
</template>
