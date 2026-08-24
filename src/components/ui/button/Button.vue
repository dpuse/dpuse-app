<script setup lang="ts">
// ── External Dependencies & Registrations
import { computed } from 'vue';
import { type RouteLocationRaw, RouterLink } from 'vue-router';

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

const COMMON_RECTANGLE_CLASSES = 'rounded-md text-[15px] leading-6 focus-visible:ring-2 px-3 py-1.5';
const COMMON_GRAPHIC_CLASSES = 'focus-visible:ring-2';

const COMMON_DESTRUCTIVE_CLASSES = ['bg-danger hover:bg-danger-hover active:bg-danger-active text-danger-text focus-visible:ring-danger-ring'];
const COMMON_GUARDED_CLASSES = ['bg-warning hover:bg-warning-hover active:bg-warning-active text-warning-text focus-visible:ring-warning-ring'];
const COMMON_PRIMARY_CLASSES = ['bg-info hover:bg-info-hover active:bg-info-active text-info-text focus-visible:ring-info-ring'];
const COMMON_POSITIVE_CLASSES = ['bg-success hover:bg-success-hover active:bg-success-active text-success-text focus-visible:ring-success-ring'];
const COMMON_NEUTRAL_CLASSES = [
    'bg-zinc-100 hover:bg-zinc-200 active:bg-zinc-300 text-emphasis focus-visible:ring-zinc-300',
    'dark:bg-zinc-300/20 dark:hover:bg-zinc-300/35 dark:active:bg-zinc-300/45 dark:focus-visible:ring-zinc-500 dark:text-content'
];
const COMMON_GHOST_CLASSES = [
    'bg-transparent hover:bg-zinc-100 active:bg-zinc-200 focus-visible:ring-zinc-300',
    'dark:hover:bg-zinc-300/25 dark:active:bg-zinc-300/35 dark:focus-visible:ring-zinc-500 dark:text-content'
];
const COMMON_ICON_CLASSES = [
    'rounded-md hover:bg-zinc-100 active:bg-zinc-200 focus-visible:ring-zinc-300 dark:hover:bg-zinc-300/25 dark:active:bg-zinc-300/35 dark:focus-visible:ring-zinc-500'
];
const COMMON_OUTLINE_CLASSES = [
    'bg-transparent inset-ring inset-ring-separator dark:inset-ring-separator',
    'hover:bg-zinc-100 active:bg-zinc-200 focus-visible:ring-zinc-300',
    'dark:hover:bg-zinc-300/25 dark:active:bg-zinc-300/35 dark:focus-visible:ring-zinc-500 dark:text-content'
];

// ── Options, Props, Slots & Emits ────────────────────────────────────────────────────────────────────────────────────

interface Properties {
    shape?: ButtonShape;
    variant?: ButtonVariant;
    size?: ButtonSize;
    isActive?: boolean;
    type?: ButtonType;
    to?: RouteLocationRaw;
}
export type ButtonShape = 'icon' | 'minimal' | 'rectangle';
export type ButtonVariant = 'destructive' | 'ghost' | 'guarded' | 'neutral' | 'outline' | 'positive' | 'primary'; // TODO: Check actual usage of 'ghost', 'positive' and 'destructive'.
export type ButtonSize = 'lg' | 'sm';
type ButtonType = 'button' | 'reset' | 'submit'; // TODO: 'reset' and 'submit' are not used.

const { shape = 'rectangle', variant = 'neutral', size = 'lg', isActive, type = 'button', to } = defineProps<Properties>();

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

const classes = computed((): (string | string[] | undefined)[] => {
    if (shape === 'minimal') return [];

    if (shape === 'icon') {
        if (size === 'sm') {
            return [
                COMMON_GRAPHIC_CLASSES,
                COMMON_ICON_CLASSES,
                'bg-zinc-50 py-2 px-2.5 [&_svg]:size-5 dark:bg-zinc-300/10',
                isActive ? 'bg-blue-50! dark:bg-zinc-300/25!' : undefined
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
    <component
        :is="to ? RouterLink : 'button'"
        class="transition-[background-color] duration-150 focus-visible:outline-none"
        :class="classes"
        data-region="Button"
        v-bind="to ? { to } : { type }"
    >
        <slot />
    </component>
</template>
