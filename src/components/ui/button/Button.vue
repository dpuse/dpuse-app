<script setup lang="ts">
// ── External Dependencies & Registrations
import { computed } from 'vue';
import { type RouteLocationRaw, RouterLink } from 'vue-router';

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

// Outline rather than 'ring'. A Tailwind ring is a box-shadow, and box-shadows are not painted in forced-colors
// mode, so the focus indicator disappeared entirely for the users most likely to be navigating by keyboard.
// Outlines survive it, follow 'border-radius' in every browser this app supports, and take no part in layout.
//
// One colour for every variant, rather than a ring tinted to match each. What a focus indicator has to do is
// clear 3:1 against whatever it sits on, which is a property of the page rather than of the button — and the
// per-variant tints this replaces were how 'zinc-300' came to be the light-mode indicator at 1.5:1.
const COMMON_FOCUS_CLASSES = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring';

const COMMON_RECTANGLE_CLASSES = `rounded-md text-[15px] leading-6 ${COMMON_FOCUS_CLASSES} px-3 py-1.5`;
const COMMON_GRAPHIC_CLASSES = COMMON_FOCUS_CLASSES;

const COMMON_DESTRUCTIVE_CLASSES = ['bg-danger hover:bg-danger-hover active:bg-danger-active text-danger-text'];
const COMMON_GUARDED_CLASSES = ['bg-warning hover:bg-warning-hover active:bg-warning-active text-warning-text'];
const COMMON_PRIMARY_CLASSES = ['bg-info hover:bg-info-hover active:bg-info-active text-info-text'];
const COMMON_POSITIVE_CLASSES = ['bg-success hover:bg-success-hover active:bg-success-active text-success-text'];
const COMMON_NEUTRAL_CLASSES = [
    'bg-zinc-100 hover:bg-zinc-200 active:bg-zinc-300 text-emphasis',
    'dark:bg-zinc-300/20 dark:hover:bg-zinc-300/35 dark:active:bg-zinc-300/45 dark:dark:text-content'
];
const COMMON_GHOST_CLASSES = ['bg-transparent hover:bg-zinc-100 active:bg-zinc-200', 'dark:hover:bg-zinc-300/25 dark:active:bg-zinc-300/35 dark:dark:text-content'];
const COMMON_ICON_CLASSES = [
    'rounded-md hover:bg-zinc-100 active:bg-zinc-200 dark:hover:bg-zinc-300/25 dark:active:bg-zinc-300/35 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring'
];
const COMMON_OUTLINE_CLASSES = [
    'bg-transparent inset-ring inset-ring-separator dark:inset-ring-separator',
    'hover:bg-zinc-100 active:bg-zinc-200',
    'dark:hover:bg-zinc-300/25 dark:active:bg-zinc-300/35 dark:dark:text-content'
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
            return [COMMON_GRAPHIC_CLASSES, COMMON_ICON_CLASSES, 'bg-zinc-50 p-1.75 [&_svg]:size-5 dark:bg-zinc-300/10', isActive ? 'bg-blue-50! dark:bg-zinc-300/25!' : undefined];
        }
        return [COMMON_GRAPHIC_CLASSES, COMMON_ICON_CLASSES, 'p-1.75 [&_svg]:size-6.5'];
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
    <component :is="to ? RouterLink : 'button'" class="transition-[background-color] duration-150" :class="classes" data-region="Button" v-bind="to ? { to } : { type }">
        <slot />
    </component>
</template>
