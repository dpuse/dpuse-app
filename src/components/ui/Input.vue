<script setup lang="ts">
// ── External Dependencies & Registrations
import { useAttrs, useId } from 'vue';

// ── Options, Properties, Slots & Emits ───────────────────────────────────────────────────────────────────────────────

const { id, label, labelHidden = false } = defineProps<{ id?: string; label: string; labelHidden?: boolean }>();

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

const attributes = useAttrs();
const generatedId = useId();
const modelValue = defineModel<string>();
</script>

<template>
    <label :for="id ?? generatedId" :class="labelHidden ? 'sr-only' : ''">{{ label }}</label>
    <input
        v-model="modelValue"
        v-bind="{ id: id ?? generatedId, name: id ?? generatedId, ...attributes }"
        class="block rounded-md px-3 py-2 outline-1 -outline-offset-1 outline-separator placeholder:text-muted focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 dark:focus:outline-indigo-500"
        data-region="Input"
    />
</template>
