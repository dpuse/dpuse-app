<script setup lang="ts">
// ── External Dependencies & Registrations
import { computed, useAttrs, useId } from 'vue';

// ── Options, Props, Slots & Emits ────────────────────────────────────────────────────────────────────────────────────

defineOptions({ inheritAttrs: false });

interface Properties {
    errors?: string[];
    label?: string;
    type?: string;
}
const { errors = [], label, type = 'text' } = defineProps<Properties>();

defineEmits<{ blur: [] }>();

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

const id = useId();
const attributes = useAttrs();
const textValue = defineModel<string>({ default: '' });
const valueHasErrors = computed(() => errors.length > 0);
</script>

<template>
    <div :class="attributes.class" data-region="TextField" :style="attributes.style as string">
        <!-- Label -->
        <label v-if="label" :for="id" class="mb-1 block text-xs font-medium text-muted">{{ label }}</label>

        <!-- Input -->
        <input
            :id="id"
            v-model="textValue"
            v-bind="{ ...attributes, class: undefined, style: undefined }"
            class="w-full rounded border bg-surface px-2.5 py-1.5 text-sm text-content transition-colors outline-none placeholder:text-subtle focus:ring-1 focus:ring-accent/20 disabled:cursor-not-allowed disabled:opacity-50"
            :class="valueHasErrors ? 'border-danger-ring' : 'border-boundary focus:border-accent'"
            :type="type"
            @blur="$emit('blur')"
        />

        <!-- Errors -->
        <ul v-if="valueHasErrors" class="mt-1 space-y-0.5">
            <li v-for="(error, i) in errors" :key="i" class="text-xs text-danger-text">{{ error }}</li>
        </ul>
    </div>
</template>
