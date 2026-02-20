<script setup lang="ts">
// External dependencies
import { computed } from 'vue';

// Properties
const properties = defineProps<{ isActive?: boolean; variant?: 'danger' | 'warning' | 'success' }>();

// Variant themes
const themeClasses = computed(() => {
    const base = 'transition-[background-color] duration-150 group-focus-visible:outline group-focus-visible:outline-2 group-focus-visible:outline-offset-2';
    switch (properties.variant) {
        case 'danger':
            return `${base} bg-red-50 hover:bg-red-100 dark:bg-red-500/20 dark:hover:bg-red-500/25 text-red-700 dark:text-red-500 group-focus-visible:outline-red-400 dark:group-focus-visible:outline-red-500`;
        case 'warning':
            return `${base} bg-amber-50 hover:bg-amber-100 dark:bg-amber-500/20 dark:hover:bg-amber-500/25 text-amber-700 dark:text-amber-500 group-focus-visible:outline-amber-500 dark:group-focus-visible:outline-amber-500`;
        case 'success':
            return `${base} bg-green-50 hover:bg-green-100 dark:bg-green-500/20 dark:hover:bg-green-500/25 text-green-700 dark:text-green-500 group-focus-visible:outline-green-400 dark:group-focus-visible:outline-green-500`;
        default:
            return `${base} ${properties.isActive ? 'bg-zinc-200 dark:bg-zinc-500/50' : 'group-focus-visible:outline-zinc-500 dark:group-focus-visible:outline-zinc-400'} bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-500/20 dark:hover:bg-zinc-500/40`;
    }
});
</script>

<template>
    <div class="inline-flex w-full items-center rounded-md px-2.5 py-2 text-sm" :class="themeClasses">
        <slot />
    </div>
</template>
