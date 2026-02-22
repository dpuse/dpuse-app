<script setup lang="ts">
// External dependencies
import { computed } from 'vue';
import type { RouteLocationRaw } from 'vue-router';

// Properties
type Properties = { isActive?: boolean; to: RouteLocationRaw; variant?: 'commit' | 'danger' | 'ghost' | 'iconLarge' | 'iconSmall' | 'item' | 'outline' | 'success' | 'warning' };
const { isActive = false, to, variant = 'ghost' } = defineProps<Properties>();

// Classes
const paddingClasses = computed(() => (variant === 'iconSmall' ? 'p-1.25' : variant === 'iconLarge' ? 'p-2' : 'px-3 py-2'));
const variantClasses = computed(() => {
    switch (variant) {
        case 'commit':
            return 'bg-zinc-600 text-zinc-200 hover:bg-zinc-700 focus-visible:outline-zinc-600 dark:bg-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-600 dark:focus-visible:outline-zinc-500';
        case 'danger':
            return 'bg-red-50 hover:bg-red-100 dark:bg-red-500/20 dark:hover:bg-red-500/25 text-red-700 dark:text-red-500 focus-visible:outline-red-400 dark:focus-visible:outline-red-500';
        case 'ghost':
            return 'focus-visible:outline-zinc-500 dark:focus-visible:outline-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-500/40';
        case 'iconLarge':
            return 'focus-visible:outline-zinc-500 dark:focus-visible:outline-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-500/40';
        case 'iconSmall':
            return 'focus-visible:outline-zinc-500 dark:focus-visible:outline-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-500/40';
        case 'item':
            return `${isActive ? 'bg-zinc-200 dark:bg-zinc-500/50' : 'focus-visible:outline-zinc-500 dark:focus-visible:outline-zinc-400'} bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-500/20 dark:hover:bg-zinc-500/40`;
        case 'outline':
            return 'inset-ring inset-ring-separator focus-visible:outline-zinc-500 dark:focus-visible:outline-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-500/40';
        case 'success':
            return 'bg-green-50 hover:bg-green-100 dark:bg-green-500/20 dark:hover:bg-green-500/25 text-green-700 dark:text-green-500 focus-visible:outline-green-400 dark:focus-visible:outline-green-500';
        case 'warning':
            return 'bg-amber-50 hover:bg-amber-100 dark:bg-amber-500/20 dark:hover:bg-amber-500/25 text-amber-700 dark:text-amber-500 focus-visible:outline-amber-500 dark:focus-visible:outline-amber-500';
        default:
            return 'focus-visible:outline-zinc-500 dark:focus-visible:outline-zinc-400 bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-500/20 dark:hover:bg-zinc-500/40';
    }
});
</script>

<template>
    <RouterLink
        class="inline-flex items-center justify-center gap-x-2 rounded-md transition-[background-color] duration-150 focus-visible:outline-2 focus-visible:outline-offset-2"
        :class="[paddingClasses, variantClasses]"
        :to="to"
    >
        <slot />
    </RouterLink>
</template>
