<script setup lang="ts">
// External dependencies
import type { HTMLAttributes } from 'vue';
import { useVModel } from '@vueuse/core';

// Core
import { cn } from '@/lib/utils';

// Properties
type Properties = { class?: HTMLAttributes['class']; defaultValue?: string | number; modelValue?: string | number };
const properties = defineProps<Properties>();

// Emits
const emits = defineEmits<{ (event: 'update:modelValue', payload: string | number): void }>();

// Models
const modelValue = useVModel(properties, 'modelValue', emits, { passive: true, defaultValue: properties.defaultValue });
</script>

<template>
    <textarea
        v-model="modelValue"
        data-slot="textarea"
        :class="
            cn(
                'border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 flex field-sizing-content min-h-16 w-full rounded-md border bg-transparent px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
                properties.class
            )
        "
    />
</template>
