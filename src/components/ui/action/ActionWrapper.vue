<script setup lang="ts">
// ── External Dependencies & Registrations
import { type RouteLocationRaw, RouterLink } from 'vue-router';

// ── Local Framework
import type { ButtonType } from './action';

// ── Options, Props, Slots & Emits ────────────────────────────────────────────────────────────────────────────────────

interface Properties {
    disabled?: boolean; // Only applies to buttons and not passed through to RouterLinks (anchors). Currently no RouterLinks require it.
    to?: RouteLocationRaw;
    type?: ButtonType;
}
const { disabled, to, type = 'button' } = defineProps<Properties>();
</script>

<template>
    <component
        :is="to ? RouterLink : 'button'"
        class="transition-[background-color,border-color,box-shadow] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring disabled:opacity-40"
        data-region="ActionWrapper"
        v-bind="to ? { to } : { type, disabled }"
    >
        <slot />
    </component>
</template>
