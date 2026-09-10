<script setup lang="ts">
// ── External Dependencies & Registrations
import type { Component } from 'vue';

// ── Static Components
import ActionWrapper from '@/components/ui/action/ActionWrapper.vue';

// ── Options, Props, Slots & Emits ────────────────────────────────────────────────────────────────────────────────────

interface Properties {
    icon: Component;
    iconIsLeading?: boolean;
    label: string;
}
const { icon, iconIsLeading, label } = defineProps<Properties>();
</script>

<template>
    <ActionWrapper
        class="absolute right-3 bottom-(--safe-bottom-offset) inline-flex h-9 items-center gap-x-1 rounded-full border border-selected-border bg-selected text-selected-text shadow-md hover:bg-selected-hover"
        :class="iconIsLeading ? 'pr-3 pl-2' : 'pr-2 pl-3'"
        data-region="PillButton"
    >
        <component :is="icon" v-if="iconIsLeading" class="size-5" :stroke-width="1.25" />
        <span class="text-sm">{{ label }}</span>
        <component :is="icon" v-if="!iconIsLeading" class="size-5" :stroke-width="1.25" />
    </ActionWrapper>
</template>
