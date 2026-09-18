<script setup lang="ts">
// ── External Dependencies & Registrations
import { computed } from 'vue';
import type { RouteLocationRaw } from 'vue-router';

// ── Local Framework
import { type ButtonSize, ICON_SIZE_CLASSES, PRESS_CLASSES, SELECTED_CLASSES, UNSELECTED_CLASSES } from './action';

// ── Static Components
import ActionWrapper from './ActionWrapper.vue';

// ── Options, Props, Slots & Emits ────────────────────────────────────────────────────────────────────────────────────

interface Properties {
    accessibleLabel: string;
    disabled?: boolean;
    isActive?: boolean;
    label?: string;
    rounded?: boolean;
    size?: ButtonSize;
    to?: RouteLocationRaw;
}
const { accessibleLabel, disabled, isActive, label, rounded, size = 'lg', to } = defineProps<Properties>();

// ── Derived State ────────────────────────────────────────────────────────────────────────────────────────────────────

const classes = computed(() => [
    rounded ? 'rounded-full' : 'rounded-md',
    ICON_SIZE_CLASSES[size],
    PRESS_CLASSES,
    'dark:text-content',
    isActive ? SELECTED_CLASSES : UNSELECTED_CLASSES
]);
</script>

<template>
    <ActionWrapper :aria-label="accessibleLabel" class="inline-flex flex-col items-center justify-center" :class="classes" data-region="IconButton" :disabled="disabled" :to="to">
        <slot />
        <span v-if="label" class="mt-0.5 max-w-full truncate text-xs">{{ label }}</span>
    </ActionWrapper>
</template>
