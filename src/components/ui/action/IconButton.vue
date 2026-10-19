<script setup lang="ts">
// ── External Dependencies & Registrations
import { computed } from 'vue';
import type { RouteLocationRaw } from 'vue-router';

// ── Local Framework
import { type ButtonShape, type ButtonSize, ICON_SIZE_CLASSES, PRESS_CLASSES, SELECTED_CLASSES, TOGGLED_CLASSES, UNSELECTED_CLASSES } from './action';

// ── Static Components
import ActionWrapper from './ActionWrapper.vue';

// ── Options, Props, Slots & Emits ────────────────────────────────────────────────────────────────────────────────────

interface Properties {
    accessibleLabel: string;
    disabled?: boolean;
    isActive?: boolean; // Chosen from a set, or the current place, e.g. the open option on the rail.
    isPressed?: boolean; // An on/off toggle that is on, e.g. bold. Sets 'aria-pressed'.
    label?: string;
    shape?: ButtonShape;
    size?: ButtonSize;
    to?: RouteLocationRaw;
}
const { accessibleLabel, disabled, isActive, isPressed, label, shape = 'square', size = 'lg', to } = defineProps<Properties>();
defineSlots<{ default: () => unknown }>();

// ── Derived State ────────────────────────────────────────────────────────────────────────────────────────────────────

const stateClasses = computed(() => {
    if (isActive) return SELECTED_CLASSES;
    return isPressed ? TOGGLED_CLASSES : UNSELECTED_CLASSES;
});
const classes = computed(() => [shape === 'square' ? 'rounded-lg' : 'rounded-full', ICON_SIZE_CLASSES[size], PRESS_CLASSES, 'dark:text-content', stateClasses.value]);
</script>

<template>
    <ActionWrapper
        :aria-label="accessibleLabel"
        :aria-pressed="isPressed"
        class="inline-flex flex-col items-center justify-center"
        :class="classes"
        data-region="IconButton"
        :disabled="disabled"
        :to="to"
    >
        <slot />
        <span v-if="label" class="mt-0.5 max-w-full truncate text-xs">{{ label }}</span>
    </ActionWrapper>
</template>
