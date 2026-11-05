<script setup lang="ts">
// ── External Dependencies & Registrations
import type { Component } from 'vue';

// ── Local Framework
import { PILL_FILL_CLASSES } from './action';

// ── Static Components
import ActionWrapper from '@/components/ui/action/ActionWrapper.vue';

// ── Options, Props, Slots & Emits ────────────────────────────────────────────────────────────────────────────────────

// One action in a pill that holds several. The pill clips its segments to its round ends, so the focus outline sits inside
// the segment. The pill's container decides when a label shows, and 'aria-label' keeps the action named without it.
// Dimming the content rather than the whole button keeps the solid fill, which stops the page showing through.
const { icon, isSeparated, isStepAction, label } = defineProps<{
    icon: Component;
    isSeparated?: boolean; // Has a segment before it.
    isStepAction?: boolean; // Moves the user on, so its label stays longest and its arrow follows the label.
    label: string;
}>();
</script>

<template>
    <ActionWrapper
        :aria-label="label"
        class="inline-flex h-full items-center gap-x-1 px-3 focus-visible:-outline-offset-2! disabled:opacity-100! disabled:hover:bg-pill! [&:disabled>*]:opacity-40"
        :class="[PILL_FILL_CLASSES, { 'border-l border-pill-border': isSeparated }]"
        :title="label"
    >
        <component :is="icon" v-if="!isStepAction" aria-hidden="true" class="size-5" :stroke-width="1.25" />
        <span class="hidden text-sm" :class="isStepAction ? '@min-[21.5rem]:inline' : '@min-[32rem]:inline'">{{ label }}</span>
        <component :is="icon" v-if="isStepAction" aria-hidden="true" class="size-5" :stroke-width="1.25" />
    </ActionWrapper>
</template>
