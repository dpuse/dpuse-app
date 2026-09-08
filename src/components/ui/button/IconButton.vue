<script setup lang="ts">
// A glyph on its own, optionally with a word under it. Square-ish by default, because it sits inside a surface and
// shares that surface's gridlines; 'rounded' where it sits in a row of its own kind, such as the composer's bar.
//
// 'accessibleLabel' is required rather than optional. Five of these had no accessible name at all, which is invisible in
// review precisely because the button looks finished — a glyph says nothing to a screen reader. Making it a prop the
// compiler asks for is the only version of this rule that cannot be forgotten.

// ── External Dependencies & Registrations
import { computed } from 'vue';
import type { RouteLocationRaw } from 'vue-router';

// ── Local Framework
import { type ButtonSize, type ButtonVariant, ICON_SIZE_CLASSES, VARIANT_CLASSES } from './baseButton';

// ── Static Components
import BaseButton from './BaseButton.vue';

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

// The neutral resting state: no fill until pointed at. Kept apart from 'VARIANT_CLASSES' because an icon button's
// default is quieter than a rectangle's — a toolbar of filled squares would read as a toolbar of pressed buttons.
const QUIET_CLASSES = 'hover:bg-zinc-100 active:bg-zinc-200 dark:hover:bg-zinc-300/25 dark:active:bg-zinc-300/35';

// Marks the button whose state is on, rather than the button under the pointer.
const ACTIVE_CLASSES = 'bg-blue-50! dark:bg-zinc-300/25!';

// ── Options, Props, Slots & Emits ────────────────────────────────────────────────────────────────────────────────────

interface Properties {
    accessibleLabel: string;
    disabled?: boolean;
    isActive?: boolean;
    label?: string; // Shown beneath the glyph. Not a substitute for 'accessibleLabel', which names the control either way.
    rounded?: boolean;
    size?: ButtonSize;
    to?: RouteLocationRaw;
    variant?: ButtonVariant;
}
const { accessibleLabel, disabled, isActive, label, rounded, size = 'lg', to, variant } = defineProps<Properties>();

// ── Derived State ────────────────────────────────────────────────────────────────────────────────────────────────────

const classes = computed(() => [
    rounded ? 'rounded-full' : 'rounded-md',
    ICON_SIZE_CLASSES[size],
    variant ? VARIANT_CLASSES[variant] : QUIET_CLASSES,
    isActive ? ACTIVE_CLASSES : undefined
]);
</script>

<template>
    <BaseButton :aria-label="accessibleLabel" class="inline-flex flex-col items-center justify-center" :class="classes" data-region="IconButton" :disabled="disabled" :to="to">
        <slot />
        <span v-if="label" class="mt-0.5 max-w-full truncate text-xs">{{ label }}</span>
    </BaseButton>
</template>
