<script setup lang="ts">
// External Dependencies
import { useId } from 'vue';

// Options, Properties, Slots & Emits ──────────────────────────────────────────────────────────────────────────────────

type AutoComplete = 'email' | 'current-password' | 'new-password';
type InputType = 'email' | 'password' | 'text';
type Properties = { autoComplete?: AutoComplete; id?: string; label: string; labelHidden?: boolean; placeholder?: string; required?: boolean; type?: InputType };
const { autoComplete, id, label, labelHidden = false, placeholder, required = false, type = 'text' } = defineProps<Properties>();

// State ───────────────────────────────────────────────────────────────────────────────────────────────────────────────

const modelValue = defineModel<string>();

const generatedId = useId();

// Handlers ────────────────────────────────────────────────────────────────────────────────────────────────────────────

function handleInput(event: Event): void {
    modelValue.value = (event.target as HTMLInputElement).value;
}
</script>

<template>
    <label :for="id ?? generatedId" :class="labelHidden ? 'sr-only' : ''">{{ label }}</label>
    <input
        :id="id ?? generatedId"
        :name="id ?? generatedId"
        :autocomplete="autoComplete"
        class="outline-separator placeholder:text-muted block rounded-md px-3 py-2 outline-1 -outline-offset-1 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 dark:focus:outline-indigo-500"
        :placeholder="placeholder"
        :required="required"
        :type="type"
        :value="modelValue"
        @input="handleInput"
    />
</template>
