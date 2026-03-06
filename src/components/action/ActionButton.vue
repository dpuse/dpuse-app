<script setup lang="ts">
// External Dependencies
import { computed } from 'vue';

// Properties
type Properties = {
    isActive?: boolean;
    variant?: 'primary' | 'neutral' | 'positive' | 'guarded' | 'destructive' | 'ghost' | 'outline' | 'listItem' | 'avatar' | 'iconLarge' | 'iconSmall';
};
const { isActive = false, variant = 'neutral' } = defineProps<Properties>();

const baseType1Classes = 'text-[15px] rounded-md dark:text-content';

// Classes
const paddingClasses = computed(() => (variant === 'avatar' ? 'p-0' : variant === 'iconSmall' ? 'p-1.25' : variant === 'iconLarge' ? 'p-1.75' : 'px-3 py-2'));
const variantClasses = computed(() => {
    switch (variant) {
        case 'primary':
            return [
                baseType1Classes,
                'bg-blue-100 inset-ring-blue-200 hover:bg-blue-200 text-blue-900 focus-visible:outline-blue-300',
                'dark:bg-blue-300/20 dark:inset-ring-blue-300/15 dark:hover:bg-blue-300/30 dark:focus-visible:outline-zinc-500'
            ];
        case 'positive':
            return [
                baseType1Classes,
                'bg-green-100 inset-ring-green-200 hover:bg-green-200 text-green-900 focus-visible:outline-green-300',
                'dark:bg-green-300/20 dark:inset-ring-green-300/15 dark:hover:bg-green-300/30 dark:focus-visible:outline-green-500'
            ];
        case 'guarded':
            return [
                baseType1Classes,
                'bg-orange-100 inset-ring-orange-200 hover:bg-orange-200 text-orange-900 focus-visible:outline-orange-300',
                'dark:bg-amber-300/20 dark:inset-ring-amber-300/15 dark:hover:bg-amber-300/30  dark:focus-visible:outline-amber-500'
            ];
        case 'destructive':
            return [
                baseType1Classes,
                'bg-red-100 hover:bg-red-200 text-red-900 focus-visible:outline-red-300',
                'dark:bg-red-400/20 dark:hover:bg-red-400/30 dark:focus-visible:outline-red-500'
            ];
        case 'ghost':
            return [baseType1Classes, 'bg-transparent ', 'hover:bg-zinc-100 focus-visible:outline-zinc-300', 'dark:hover:bg-zinc-300/30 dark:focus-visible:outline-zinc-500'];
        case 'outline':
            return [
                baseType1Classes,
                'bg-transparent inset-ring inset-ring-separator dark:inset-ring-separator',
                'hover:bg-zinc-100 focus-visible:outline-zinc-300',
                'dark:hover:bg-zinc-300/30 dark:focus-visible:outline-zinc-500'
            ];
        case 'listItem':
            return [
                'rounded-md bg-transparent',
                'hover:bg-zinc-100 focus-visible:outline-zinc-300',
                'dark:hover:bg-zinc-300/30 dark:focus-visible:outline-zinc-400',
                isActive ? 'bg-zinc-100  dark:hover:bg-zinc-300/30' : undefined
            ];
        case 'avatar':
            return [
                'dpuse-avatar rounded-full outline-2 outline-offset-2 outline-transparent',
                'hover:outline-zinc-500 focus-visible:outline-zinc-300',
                'dark:hover:outline-zinc-300 dark:focus-visible:outline-zinc-500'
            ];
        case 'iconLarge':
            return ['dpuse-lg rounded-md', 'hover:bg-zinc-100 focus-visible:outline-zinc-300 dark:hover:bg-zinc-300/30 dark:focus-visible:outline-zinc-500'];
        case 'iconSmall':
            return ['dpuse-sm rounded-md', 'hover:bg-zinc-100 focus-visible:outline-zinc-300 dark:hover:bg-zinc-300/30 dark:focus-visible:outline-zinc-500'];
        default:
            return [
                baseType1Classes,
                'bg-zinc-100 hover:bg-zinc-200 text-zinc-900 focus-visible:outline-zinc-300',
                'dark:bg-zinc-300/20 dark:hover:bg-zinc-300/30 dark:focus-visible:outline-zinc-500'
            ];
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
