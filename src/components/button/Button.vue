<script setup lang="ts">
// External Dependencies
import { computed } from 'vue';

// Properties & Emits
type Properties = {
    isActive?: boolean;
    variant?: 'primary' | 'neutral' | 'positive' | 'guarded' | 'destructive' | 'ghost' | 'outline' | 'listItem' | 'avatar' | 'iconLarge' | 'iconSmall';
};
const { isActive = false, variant = 'neutral' } = defineProps<Properties>();

const baseType1Classes = 'dark:text-content rounded-md text-[15px] leading-6 focus-visible:ring-2';
const baseType2Classes = 'focus-visible:ring-2';

// Classes
const paddingClasses = computed(() => (variant === 'avatar' ? 'p-0' : variant === 'iconSmall' ? 'p-1.25' : variant === 'iconLarge' ? 'p-1.75' : 'px-3 py-1.5'));
const variantClasses = computed(() => {
    switch (variant) {
        case 'primary':
            return [
                baseType1Classes,
                'bg-blue-100 inset-ring-blue-200 hover:bg-blue-200 active:bg-blue-300 text-blue-900 focus-visible:ring-blue-300',
                'dark:bg-blue-300/20 dark:inset-ring-blue-300/15 dark:hover:bg-blue-300/30 dark:active:bg-blue-300/40 dark:focus-visible:ring-zinc-500'
            ];
        case 'positive':
            return [
                baseType1Classes,
                'bg-green-100 inset-ring-green-200 hover:bg-green-200 active:bg-green-300 text-green-900 focus-visible:ring-green-300',
                'dark:bg-green-300/20 dark:inset-ring-green-300/15 dark:hover:bg-green-300/30 dark:active:bg-green-300/40 dark:focus-visible:ring-green-500'
            ];
        case 'guarded':
            return [
                baseType1Classes,
                'bg-orange-100 inset-ring-orange-200 hover:bg-orange-200 active:bg-orange-300 text-orange-900 focus-visible:ring-orange-300',
                'dark:bg-amber-300/20 dark:inset-ring-amber-300/15 dark:hover:bg-amber-300/30 dark:active:bg-amber-300/40 dark:focus-visible:ring-amber-500'
            ];
        case 'destructive':
            return [
                baseType1Classes,
                'bg-red-100 hover:bg-red-200 active:bg-red-300 text-red-900 focus-visible:ring-red-300',
                'dark:bg-red-400/20 dark:hover:bg-red-400/30 dark:active:bg-red-400/40 dark:focus-visible:ring-red-500'
            ];
        case 'ghost':
            return [
                baseType1Classes,
                'bg-transparent',
                'hover:bg-zinc-100 active:bg-zinc-200 focus-visible:ring-zinc-300',
                'dark:hover:bg-zinc-300/20 dark:active:bg-zinc-300/30 dark:focus-visible:ring-zinc-500'
            ];
        case 'outline':
            return [
                baseType1Classes,
                'bg-transparent inset-ring inset-ring-separator dark:inset-ring-separator',
                'hover:bg-zinc-100 active:bg-zinc-200 focus-visible:ring-zinc-300',
                'dark:hover:bg-zinc-300/20 dark:active:bg-zinc-300/30 dark:focus-visible:ring-zinc-500'
            ];
        case 'listItem':
            return [
                baseType1Classes,
                'bg-zinc-50 hover:bg-zinc-100 active:bg-zinc-200 focus-visible:ring-zinc-300',
                'dark:bg-zinc-300/20 dark:hover:bg-zinc-300/30 dark:active:bg-zinc-300/40 dark:focus-visible:ring-zinc-500',
                isActive ? 'bg-zinc-100 dark:hover:bg-zinc-300/30' : undefined
            ];
        case 'avatar':
            return [
                baseType2Classes,
                'dpuse-avatar rounded-full ring-2 ring-offset-0 ring-transparent',
                'hover:ring-zinc-500 active:ring-zinc-600 focus-visible:ring-zinc-300',
                'dark:hover:ring-zinc-300 dark:active:ring-zinc-200 dark:focus-visible:ring-zinc-500'
            ];
        case 'iconLarge':
            return [
                baseType2Classes,
                'dpuse-lg rounded-md',
                'hover:bg-zinc-100 active:bg-zinc-200 focus-visible:ring-zinc-300 dark:hover:bg-zinc-300/20 dark:active:bg-zinc-300/30 dark:focus-visible:ring-zinc-500'
            ];
        case 'iconSmall':
            return [
                baseType2Classes,
                'dpuse-sm rounded-md',
                'hover:bg-zinc-100 active:bg-zinc-200 focus-visible:ring-zinc-300 dark:hover:bg-zinc-300/20 dark:active:bg-zinc-300/30 dark:focus-visible:ring-zinc-500'
            ];
        default:
            return [
                baseType1Classes,
                'bg-zinc-100 hover:bg-zinc-200 active:bg-zinc-300 text-zinc-900 focus-visible:ring-zinc-300',
                'dark:bg-zinc-300/20 dark:hover:bg-zinc-300/30 dark:active:bg-zinc-300/40 dark:focus-visible:ring-zinc-500'
            ];
    }
});
</script>

<template>
    <button class="transition-[background-color] duration-150 focus-visible:outline-none" :class="[paddingClasses, variantClasses]" type="button">
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
