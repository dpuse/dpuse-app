<script setup lang="ts">
// ── External Dependencies & Registrations
import { computed } from 'vue';

// ── Local Framework
import { type ButtonSize, ICON_SIZE_CLASSES } from './action';

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

const classes = computed(() => [ICON_SIZE_CLASSES[size], isFloating ? 'shadow-md' : '', isOpen ? 'bg-blue-50! dark:bg-zinc-300/25!' : undefined]);
</script>

<template>
    <ActionWrapper
        :aria-expanded="isOpen"
        :aria-label="accessibleLabel"
        class="inline-flex items-center justify-center rounded-full border border-transparent hover:border-separator hover:bg-zinc-100 active:bg-zinc-200 dark:hover:bg-zinc-300/25 dark:active:bg-zinc-300/35"
        :class="classes"
        data-region="ToggleButton"
    >
        <slot />
    </ActionWrapper>
</template>
