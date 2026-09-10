<script setup lang="ts">
// ── External Dependencies & Registrations
import { type RouteLocationRaw, RouterLink } from 'vue-router';

// ── Options, Props, Slots & Emits ────────────────────────────────────────────────────────────────────────────────────

interface Properties {
    disabled?: boolean; // Only applies to buttons. Currently no anchors (RouterLinks) require it.
    to?: RouteLocationRaw;
    type?: ButtonType;
}
export type ButtonType = 'button' | 'submit';
const { disabled, to, type = 'button' } = defineProps<Properties>();
</script>

<template>
    <component
        :is="to ? RouterLink : 'button'"
        class="transition-[background-color,border-color] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring disabled:opacity-40"
        data-region="ActionWrapper"
        v-bind="to ? { to } : { type, disabled }"
    >
        <slot />
    </component>
</template>
