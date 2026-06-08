<script setup lang="ts">
import { computed, useId } from 'vue';

type Properties = {
    disabled?: boolean;
    errors?: string[];
    label?: string;
    placeholder?: string;
    type?: string;
};

const { disabled = false, errors = [], label, placeholder, type = 'text' } = defineProps<Properties>();
const modelValue = defineModel<string>({ default: '' });
defineEmits<{ blur: [] }>();

const id = useId();
const hasErrors = computed(() => errors.length > 0);
</script>

<template>
    <div data-region="TextField">
        <label v-if="label" :for="id" class="mb-1 block text-xs font-medium text-muted">{{ label }}</label>
        <div
            class="flex items-center rounded border bg-surface transition-colors focus-within:ring-1 focus-within:ring-accent/20"
            :class="hasErrors ? 'border-red-500' : 'border-boundary focus-within:border-accent'"
        >
            <input
                :id="id"
                v-model="modelValue"
                class="w-full bg-transparent px-2.5 py-1.5 text-sm text-content outline-none placeholder:text-subtle disabled:cursor-not-allowed disabled:opacity-50"
                :disabled="disabled"
                :placeholder="placeholder"
                :type="type"
                @blur="$emit('blur')"
            />
        </div>
        <ul v-if="hasErrors" class="mt-1 space-y-0.5">
            <li v-for="(error, i) in errors" :key="i" class="text-xs text-red-500">{{ error }}</li>
        </ul>
    </div>
</template>
