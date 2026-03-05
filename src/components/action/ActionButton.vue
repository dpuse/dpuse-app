<script setup lang="ts">
// External Dependencies
import { computed } from 'vue';

// Properties
type Properties = { isActive?: boolean; variant?: 'avatar' | 'commit' | 'danger' | 'default' | 'ghost' | 'iconLarge' | 'iconSmall' | 'item' | 'outline' | 'success' | 'warning' };
const { isActive = false, variant = 'ghost' } = defineProps<Properties>();

const theme1 = 'border text-[15px] rounded-md dark:text-white';

// Classes
const paddingClasses = computed(() => (variant === 'avatar' ? 'p-0' : variant === 'iconSmall' ? 'p-1.25' : variant === 'iconLarge' ? 'p-1.75' : 'px-3 py-2'));
const variantClasses = computed(() => {
    switch (variant) {
        case 'avatar':
            return 'dpuse-avatar overflow-hidden rounded-full outline-2 outline-offset-2 outline-transparent focus-visible:outline-zinc-500 dark:focus-visible:outline-zinc-400 hover:outline-zinc-300 dark:hover:outline-zinc-500/40';
        case 'commit':
            return (
                theme1 +
                ' bg-blue-50 border-blue-100 hover:bg-blue-200 text-blue-900 focus-visible:outline-zinc-600 dark:bg-blue-300/20 dark:border-blue-300/15 dark:hover:bg-blue-300/30 dark:focus-visible:outline-zinc-500'
            );
        case 'danger':
            return (
                theme1 +
                ' bg-red-100 border-red-200 hover:bg-red-200 text-red-900 dark:bg-red-400/20 dark:border-red-400/15 dark:hover:bg-red-400/30 focus-visible:outline-red-400 dark:focus-visible:outline-red-500'
            );
        case 'ghost':
            return 'rounded-md focus-visible:outline-zinc-500 dark:focus-visible:outline-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-500/40';
        case 'iconLarge':
            return 'dpuse-lg rounded-md focus-visible:outline-zinc-500 dark:focus-visible:outline-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-500/40';
        case 'iconSmall':
            return 'dpuse-sm rounded-md focus-visible:outline-zinc-500 dark:focus-visible:outline-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-500/40';
        case 'item':
            return `${isActive ? 'bg-zinc-200 dark:bg-zinc-500/50' : 'focus-visible:outline-zinc-500 dark:focus-visible:outline-zinc-400'} rounded-md bg-zinc-100 hover:bg-zinc-100 dark:bg-zinc-500/20 dark:hover:bg-zinc-500/40`;
        case 'outline':
            return 'rounded-md inset-ring inset-ring-separator focus-visible:outline-zinc-500 dark:focus-visible:outline-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-500/40';
        case 'success':
            return (
                theme1 +
                ' bg-green-100 border-green-200 hover:bg-green-200 text-green-900 dark:bg-green-300/20 dark:border-green-300/15 dark:hover:bg-green-300/30 focus-visible:outline-green-400 dark:focus-visible:outline-green-500'
            );
        case 'warning':
            return (
                theme1 +
                ' bg-orange-100 border-orange-200 hover:bg-orange-200 text-orange-900 dark:bg-amber-300/20 dark:border-amber-300/15 dark:hover:bg-amber-300/30 focus-visible:outline-amber-500 dark:focus-visible:outline-amber-500'
            );
        default:
            return (
                theme1 +
                ' bg-zinc-100 border-zinc-200 hover:bg-zinc-200 text-zinc-900 dark:bg-zinc-300/20 dark:border-zinc-300/15 dark:hover:bg-zinc-300/30 focus-visible:outline-zinc-500 dark:focus-visible:outline-zinc-500'
            );
    }
});
</script>

<template>
    <button
        class="inline-flex items-center justify-center gap-x-2 transition-[background-color] duration-150 focus-visible:outline-2 focus-visible:outline-offset-2"
        :class="[paddingClasses, variantClasses]"
        type="button"
    >
        <slot />
    </button>
</template>

<style scoped>
button.dpuse-sm > :deep(svg) {
    width: 20px;
    height: 20px;
}
button.dpuse-lg > :deep(svg) {
    width: 26px;
    height: 26px;
}
button.dpuse-avatar > :deep(img) {
    border-radius: 50%;
}
</style>
