<script setup lang="ts">
// ── External Dependencies & Registrations
import type { RouteLocationRaw } from 'vue-router';

// ── Local Framework
import { type ButtonVariant, VARIANT_CLASSES } from './baseButton';

// ── Static Components
import BaseButton, { type ButtonType } from './BaseButton.vue';

// ── Options, Props, Slots & Emits ────────────────────────────────────────────────────────────────────────────────────

interface Properties {
    disabled?: boolean;
    to?: RouteLocationRaw;
    type?: ButtonType;
    variant?: ButtonVariant;
}
const { disabled, to, type, variant = 'neutral' } = defineProps<Properties>();
</script>

<template>
    <BaseButton class="rounded-md px-3 py-1.5 text-[15px] leading-6" :class="VARIANT_CLASSES[variant]" data-region="RectangleButton" :disabled="disabled" :to="to" :type="type">
        <slot />
    </BaseButton>
</template>
