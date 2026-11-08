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
// Dimming the content rather than the whole button keeps the solid fill, which stops the page showing through. Every
// segment has a line on its left, and the pill pulls its segments 1px left so the first line is clipped. Segments can
// then come and go in any order without one of them owning the pill's start.
const { disabled, disabledReason, icon, isLabelHidden, isStepAction, label } = defineProps<{
    disabled?: boolean;
    disabledReason?: string; // Shown as the tooltip while disabled, so the user knows what makes the action available.
    icon: Component;
    isLabelHidden?: boolean; // Shows just the icon whatever the container's width, for a row short of room.
    isStepAction?: boolean; // Moves the user on, so its label stays longest and its arrow follows the label.
    label: string;
}>();
</script>

<template>
    <ActionWrapper
        :aria-label="label"
        class="inline-flex h-full items-center gap-x-1 border-l border-pill-border px-3 focus-visible:-outline-offset-2! disabled:opacity-100! disabled:hover:bg-pill! [&:disabled>*]:opacity-40"
        :class="PILL_FILL_CLASSES"
        :disabled="disabled"
        :title="disabled && disabledReason ? disabledReason : label"
    >
        <component :is="icon" v-if="!isStepAction" aria-hidden="true" class="size-5" :stroke-width="1.25" />
        <span class="hidden text-sm" :class="{ '@min-[21.5rem]:inline': isStepAction && !isLabelHidden, '@lg:inline': !isStepAction && !isLabelHidden }">{{ label }}</span>
        <component :is="icon" v-if="isStepAction" aria-hidden="true" class="size-5" :stroke-width="1.25" />
    </ActionWrapper>
</template>
