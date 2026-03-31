<script setup lang="ts">
// External Dependencies
import { computed } from 'vue';

// Properties & Emits
export type VariantTypeId = 'primary' | 'positive' | 'guarded' | 'destructive' | 'listitemDestructive' | 'ghost' | 'outline' | 'listItem' | 'avatar' | 'iconLarge' | 'iconSmall';
const { isActive = false, variant = 'neutral' } = defineProps<{ isActive?: boolean; variant?: VariantTypeId }>();

// Constants ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const COMMON_RECTANGLE_CLASSES = 'rounded-md text-[15px] leading-6 focus-visible:ring-2 dark:text-zinc-300 px-3 py-1.5';
const COMMON_GRAPHIC_CLASSES = 'focus-visible:ring-2';

const COMMON_DESTRUCTIVE_CLASSES = [
    'bg-red-100 hover:bg-red-200 active:bg-red-300 text-red-900 focus-visible:ring-red-300',
    'dark:bg-red-400/20 dark:hover:bg-red-400/30 dark:active:bg-red-400/40 dark:focus-visible:ring-red-500'
];
const COMMON_GUARDED_CLASSES = [
    'bg-orange-100 hover:bg-orange-200 active:bg-orange-300 text-orange-900 focus-visible:ring-orange-300',
    'dark:bg-amber-300/20 dark:hover:bg-amber-300/30 dark:active:bg-amber-300/40 dark:focus-visible:ring-amber-500'
];
const COMMON_PRIMARY_CLASSES = [
    'bg-blue-100 hover:bg-blue-200 active:bg-blue-300 text-blue-900 focus-visible:ring-blue-300',
    'dark:bg-blue-300/20 dark:hover:bg-blue-300/30 dark:active:bg-blue-300/40 dark:focus-visible:ring-blue-500'
];
const COMMON_POSITIVE_CLASSES = [
    'bg-green-100 hover:bg-green-200 active:bg-green-300 text-green-900 focus-visible:ring-green-300',
    'dark:bg-green-300/20 dark:hover:bg-green-300/30 dark:active:bg-green-300/40 dark:focus-visible:ring-green-500'
];
const COMMON_NEUTRAL_CLASSES = [
    'bg-zinc-100 hover:bg-zinc-200 active:bg-zinc-300 text-zinc-900 focus-visible:ring-zinc-300',
    'dark:bg-zinc-300/20 dark:hover:bg-zinc-300/30 dark:active:bg-zinc-300/40 dark:focus-visible:ring-zinc-500'
];

const COMMON_GHOST_CLASSES = [
    'bg-transparent hover:bg-zinc-100 active:bg-zinc-200 focus-visible:ring-zinc-300',
    'dark:hover:bg-zinc-300/20 dark:active:bg-zinc-300/30 dark:focus-visible:ring-zinc-500'
];
const COMMON_AVATAR_CLASSES = [
    'dpuse-avatar border rounded-full ring-2 ring-offset-0 ring-transparent',
    'border-separator hover:ring-zinc-300 active:ring-zinc-400 focus-visible:ring-zinc-300',
    'dark:border-zinc-400 dark:hover:ring-zinc-600 dark:active:ring-zinc-500 dark:focus-visible:ring-zinc-600'
];
const COMMON_ICON_CLASSES = [
    'rounded-md hover:bg-zinc-100 active:bg-zinc-200 focus-visible:ring-zinc-300 dark:hover:bg-zinc-300/20 dark:active:bg-zinc-300/30 dark:focus-visible:ring-zinc-500'
];
const COMMON_OUTLINE_CLASSES = [
    'bg-transparent inset-ring inset-ring-separator dark:inset-ring-separator',
    'hover:bg-zinc-100 active:bg-zinc-200 focus-visible:ring-zinc-300',
    'dark:hover:bg-zinc-300/20 dark:active:bg-zinc-300/30 dark:focus-visible:ring-zinc-500'
];

// Local State ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const variantClasses = computed((): (string | string[] | Record<string, string> | undefined)[] => {
    switch (variant) {
        case 'primary':
            return [COMMON_RECTANGLE_CLASSES, COMMON_PRIMARY_CLASSES];
        case 'positive':
            return [COMMON_RECTANGLE_CLASSES, COMMON_POSITIVE_CLASSES];
        case 'guarded':
            return [COMMON_RECTANGLE_CLASSES, COMMON_GUARDED_CLASSES];
        case 'destructive':
            return [COMMON_RECTANGLE_CLASSES, COMMON_DESTRUCTIVE_CLASSES];
        case 'ghost':
            return [COMMON_RECTANGLE_CLASSES, COMMON_GHOST_CLASSES];
        case 'outline':
            return [COMMON_RECTANGLE_CLASSES, COMMON_OUTLINE_CLASSES];
        case 'listItem':
            return [
                COMMON_RECTANGLE_CLASSES,
                'bg-zinc-50 hover:bg-zinc-100 active:bg-zinc-200 focus-visible:ring-zinc-300',
                'dark:bg-zinc-300/10 dark:hover:bg-zinc-300/20 dark:active:bg-zinc-300/30 dark:focus-visible:ring-zinc-500',
                isActive ? 'bg-zinc-200 dark:hover:bg-zinc-300/30' : undefined
            ];
        case 'listitemDestructive':
            return [COMMON_RECTANGLE_CLASSES, COMMON_DESTRUCTIVE_CLASSES, isActive ? 'bg-red-300 dark:bg-red-400/40' : undefined];
        case 'avatar':
            return [COMMON_GRAPHIC_CLASSES, COMMON_AVATAR_CLASSES];
        case 'iconLarge':
            return [COMMON_GRAPHIC_CLASSES, COMMON_ICON_CLASSES, 'dpuse-lg p-1.75'];
        case 'iconSmall':
            return [COMMON_GRAPHIC_CLASSES, COMMON_ICON_CLASSES, 'dpuse-sm p-1.25'];
        default:
            return [COMMON_RECTANGLE_CLASSES, COMMON_NEUTRAL_CLASSES];
    }
});
</script>

<template>
    <button class="transition-[background-color] duration-150 focus-visible:outline-none" :class="variantClasses" type="button">
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
