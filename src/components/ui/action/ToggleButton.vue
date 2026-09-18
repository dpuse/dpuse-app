<script setup lang="ts">
// ── External Dependencies & Registrations
import { computed } from 'vue';

// ── Local Framework
import { type ButtonSize, ICON_SIZE_CLASSES, PRESS_CLASSES, SELECTED_CLASSES, UNSELECTED_CLASSES } from './action';

// ── Static Components
import ActionWrapper from './ActionWrapper.vue';

// ── Options, Props, Slots & Emits ────────────────────────────────────────────────────────────────────────────────────

interface Properties {
    accessibleLabel: string;
    isFloating?: boolean;
    isOpen?: boolean;
    size?: ButtonSize;
}
const { accessibleLabel, isOpen, isFloating, size = 'lg' } = defineProps<Properties>();

// ── Derived State ────────────────────────────────────────────────────────────────────────────────────────────────────

const classes = computed(() => [ICON_SIZE_CLASSES[size], PRESS_CLASSES, isFloating ? 'shadow-md' : '', isOpen ? SELECTED_CLASSES : UNSELECTED_CLASSES]);
</script>

<template>
    <ActionWrapper
        :aria-expanded="isOpen"
        :aria-label="accessibleLabel"
        class="inline-flex items-center justify-center rounded-full border border-transparent"
        :class="classes"
        data-region="ToggleButton"
    >
        <slot />
    </ActionWrapper>
</template>
