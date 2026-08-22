<script setup lang="ts">
// ── External Dependencies & Registrations
import { useAttrs, useId } from 'vue';

// ── Options, Properties, Slots & Emits ───────────────────────────────────────────────────────────────────────────────

const { id, label, labelHidden } = defineProps<{ id?: string; label: string; labelHidden?: boolean }>();

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

const attributes = useAttrs();
const inputId = id ?? useId();
const modelValue = defineModel<string>();
</script>

<template>
    <div data-region="Input">
        <label :for="inputId" :class="labelHidden ? 'sr-only' : 'mb-1 block text-sm font-medium text-muted'">{{ label }}</label>
        <input
            v-bind="{ id: inputId, name: inputId, ...attributes }"
            v-model="modelValue"
            class="block w-full rounded-md px-3 py-1.5 outline-1 -outline-offset-1 outline-separator placeholder:text-muted focus:outline-2 focus:-outline-offset-2 focus:outline-accent"
            data-region="Input"
        />
    </div>
</template>
