<script setup lang="ts">
// External Dependencies
import { computed } from 'vue';
import { type RouteLocationRaw, RouterLink } from 'vue-router';

// Constants ───────────────────────────────────────────────────────────────────────────────────────────────────────────

const COMMON_RECTANGLE_CLASSES = 'rounded-md text-[15px] leading-6 focus-visible:ring-2 dark:text-zinc-300 px-3 py-1.5';
const COMMON_GRAPHIC_CLASSES = 'focus-visible:ring-2';

const COMMON_DESTRUCTIVE_CLASSES = [
    'bg-red-100 hover:bg-red-200 active:bg-red-300 text-red-900 focus-visible:ring-red-300',
    'dark:bg-red-300/20 dark:hover:bg-red-300/30 dark:active:bg-red-300/40 dark:focus-visible:ring-red-500'
];
const COMMON_GUARDED_CLASSES = [
    'bg-amber-100 hover:bg-amber-200 active:bg-amber-300 text-amber-900 focus-visible:ring-amber-300',
    'dark:bg-amber-300/30 dark:hover:bg-amber-300/30 dark:active:bg-amber-300/40 dark:focus-visible:ring-amber-500'
];
const COMMON_PRIMARY_CLASSES = [
    'bg-blue-100 hover:bg-blue-200 active:bg-blue-300 text-blue-900 focus-visible:ring-blue-300',
    'dark:bg-blue-300/20 dark:hover:bg-blue-300/30 dark:active:bg-blue-300/40 dark:focus-visible:ring-blue-500'
];
const COMMON_POSITIVE_CLASSES = [
    'bg-green-100 hover:bg-green-200 active:bg-green-300 text-green-900 focus-visible:ring-green-300',
    'dark:bg-green-300/30 dark:hover:bg-green-300/30 dark:active:bg-green-300/40 dark:focus-visible:ring-green-500'
];
const COMMON_NEUTRAL_CLASSES = [
    'bg-zinc-100 hover:bg-zinc-200 active:bg-zinc-300 text-zinc-900 focus-visible:ring-zinc-300',
    'dark:bg-zinc-300/20 dark:hover:bg-zinc-300/30 dark:active:bg-zinc-300/40 dark:focus-visible:ring-zinc-500'
];
const COMMON_GHOST_CLASSES = [
    'bg-transparent hover:bg-zinc-100 active:bg-zinc-200 focus-visible:ring-zinc-300',
    'dark:hover:bg-zinc-300/20 dark:active:bg-zinc-300/30 dark:focus-visible:ring-zinc-500'
];
const COMMON_ICON_CLASSES = [
    'rounded-md hover:bg-zinc-100 active:bg-zinc-200 focus-visible:ring-zinc-300 dark:hover:bg-zinc-300/20 dark:active:bg-zinc-300/30 dark:focus-visible:ring-zinc-500'
];
const COMMON_OUTLINE_CLASSES = [
    'bg-transparent inset-ring inset-ring-separator dark:inset-ring-separator',
    'hover:bg-zinc-100 active:bg-zinc-200 focus-visible:ring-zinc-300',
    'dark:hover:bg-zinc-300/20 dark:active:bg-zinc-300/30 dark:focus-visible:ring-zinc-500'
];

// Options, Properties, Slots & Emits ──────────────────────────────────────────────────────────────────────────────────

export type ButtonShape = 'icon' | 'minimal' | 'rectangle';
export type ButtonVariant = 'destructive' | 'ghost' | 'guarded' | 'neutral' | 'outline' | 'positive' | 'primary'; // TODO: Check actual usage of 'ghost', 'positive' and 'destructive'.
export type ButtonSize = 'lg' | 'sm';
type ButtonType = 'button' | 'reset' | 'submit'; // TODO: 'reset' and 'submit' are not used.
type Properties = { shape?: ButtonShape; variant?: ButtonVariant; size?: ButtonSize; isActive?: boolean; type?: ButtonType; to?: RouteLocationRaw };
const { shape = 'rectangle', variant = 'neutral', size = 'lg', isActive = false, type = 'button', to } = defineProps<Properties>();

// State ───────────────────────────────────────────────────────────────────────────────────────────────────────────────

const classes = computed((): (string | string[] | undefined)[] => {
    if (shape === 'minimal') return [];

    if (shape === 'icon') {
        if (size === 'sm') {
            return [
                COMMON_GRAPHIC_CLASSES,
                COMMON_ICON_CLASSES,
                'bg-zinc-50 py-2 px-2.5 [&_svg]:size-5 dark:bg-zinc-300/10',
                isActive ? 'bg-blue-50! dark:bg-blue-300/20! cursor-default! pointer-events-none!' : undefined
            ];
        }
        return [COMMON_GRAPHIC_CLASSES, COMMON_ICON_CLASSES, 'p-1.75 [&_svg]:size-[26px]'];
    }

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
        default:
            return [COMMON_RECTANGLE_CLASSES, COMMON_NEUTRAL_CLASSES];
    }
});
</script>

<template>
    <component :is="to ? RouterLink : 'button'" class="transition-[background-color] duration-150 focus-visible:outline-none" :class="classes" v-bind="to ? { to } : { type }">
        <slot />
    </component>
</template>
