<script setup lang="ts">
// ── External Dependencies & Registrations
import type { Component } from 'vue';

// ── Options, Props, Slots & Emits ────────────────────────────────────────────────────────────────────────────────────

const { countText, icon, subtitle, title } = defineProps<{
    countText?: string; // Apart on the right, in line with the counts of the rows below.
    icon?: Component; // After the heading, such as the order a list is sorted in. Decoration only, because the words say the same.
    subtitle?: string; // What the block shows, lighter than the subject, so the subject reads first.
    title: string;
}>();
</script>

<template>
    <h3 class="m-0 flex justify-between gap-x-4 text-sm font-medium text-emphasis" data-region="SectionHeading">
        <span>
            {{ title }}
            <span v-if="subtitle" class="font-normal text-muted">– {{ subtitle }}</span>
            <component :is="icon" v-if="icon" aria-hidden="true" class="ml-1 inline size-4 align-text-bottom text-muted" :stroke-width="1.5" />
        </span>
        <span v-if="countText" class="font-normal text-muted tabular-nums">{{ countText }}</span>
    </h3>
</template>
