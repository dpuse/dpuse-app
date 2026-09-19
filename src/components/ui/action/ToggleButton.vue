<script setup lang="ts">
// ── External Dependencies & Registrations
import { computed } from 'vue';

// ── Local Framework
import { type ButtonSize, ICON_SIZE_CLASSES, PRESS_CLASSES, SEGMENT_SELECTED_CLASSES, UNSELECTED_CLASSES } from './action';

// ── Static Components
import ActionWrapper from './ActionWrapper.vue';

// ── Options, Props, Slots & Emits ────────────────────────────────────────────────────────────────────────────────────

interface Properties {
    accessibleLabel: string;
    isFloating?: boolean;
    isOpen?: boolean;
    isSegment?: boolean; // One of a group in a pill track, where open shows as the selected segment.
    size?: ButtonSize;
}
const { accessibleLabel, isOpen, isFloating, isSegment, size = 'lg' } = defineProps<Properties>();

// ── Derived State ────────────────────────────────────────────────────────────────────────────────────────────────────

// A lone pane toggle shows no open state of its own: the pane it opens is on screen, which says so already.
const classes = computed(() => [ICON_SIZE_CLASSES[size], PRESS_CLASSES, isFloating ? 'shadow-md' : '', isOpen && isSegment ? SEGMENT_SELECTED_CLASSES : UNSELECTED_CLASSES]);
</script>

<template>
    <ActionWrapper
        :aria-expanded="isOpen"
        :aria-label="accessibleLabel"
        class="inline-flex items-center justify-center rounded-full"
        :class="classes"
        data-region="ToggleButton"
    >
        <slot />
    </ActionWrapper>
</template>
