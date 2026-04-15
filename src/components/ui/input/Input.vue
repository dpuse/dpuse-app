<script setup lang="ts">
// Properties & Emits
type Properties = {
    autoComplete?: 'email' | 'current-password' | 'new-password';
    id: string;
    label: string;
    labelHidden?: boolean;
    modelValue?: string;
    placeholder?: string;
    required?: boolean;
    type?: 'email' | 'password' | 'text';
};
const { autoComplete, id, label, labelHidden = false, modelValue, placeholder, required = false, type = 'text' } = defineProps<Properties>();
defineEmits<{ 'update:modelValue': [value: string] }>();
</script>

<template>
    <label :for="id" :class="labelHidden ? 'sr-only' : ''">{{ label }}</label>
    <input
        :id="id"
        :name="id"
        :autocomplete="autoComplete"
        class="outline-separator placeholder:text-muted block rounded-md px-3 py-2 outline-1 -outline-offset-1 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 dark:focus:outline-indigo-500"
        :placeholder="placeholder"
        :required="required"
        :type="type"
        :value="modelValue"
        @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
    />
</template>
