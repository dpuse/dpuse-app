<script setup lang="ts">
// External Dependencies
import { computed } from 'vue';
import type { RouteLocationRaw } from 'vue-router';

// Local Components - Static
import Button from '@/components/ui/button/Button.vue';

// Options, Properties, Slots & Emits ──────────────────────────────────────────────────────────────────────────────────

defineOptions({ inheritAttrs: false });

type Tab = { id: string; label: string };

const { tabs = [], modelValue, variant = 'step', to } = defineProps<{
    tabs?: Tab[];
    modelValue?: string;
    variant?: 'add' | 'step';
    to?: RouteLocationRaw;
}>();

defineSlots<{ action(): unknown }>();

const emit = defineEmits<{ 'update:modelValue': [id: string]; action: [] }>();

// Derived State ───────────────────────────────────────────────────────────────────────────────────────────────────────

const hasTabs = computed(() => tabs.length > 0);

const actionButtonClasses = computed(() => [
    hasTabs.value ? 'relative -ml-px rounded-r-full py-2 pr-3 pl-2.5' : 'rounded-full p-1.75 min-w-10',
    'inline-flex items-center justify-center gap-x-1 text-xs focus:z-10 focus-visible:ring-2',
    variant === 'step'
        ? 'border border-blue-400 bg-blue-50 text-blue-600 hover:bg-blue-100 focus-visible:ring-blue-300 dark:border-blue-500 dark:bg-blue-950 dark:text-blue-400 dark:hover:bg-blue-900 dark:focus-visible:ring-blue-500'
        : 'border border-zinc-300 bg-zinc-100 text-zinc-600 hover:bg-zinc-200 focus-visible:ring-zinc-300 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700 dark:focus-visible:ring-zinc-500'
]);
</script>

<template>
    <div v-bind="$attrs">
        <span class="isolate inline-flex h-10 rounded-full shadow-md">
            <!-- Tab buttons -->
            <button
                v-for="(tab, index) in tabs"
                :key="tab.id"
                type="button"
                class="relative inline-flex items-center py-2 text-xs inset-ring-1 inset-ring-gray-300 focus:z-10"
                :class="[
                    index === 0 ? 'rounded-l-full pr-2 pl-3' : '-ml-px px-2',
                    modelValue === tab.id
                        ? 'bg-gray-100 text-gray-900 hover:bg-gray-200 dark:bg-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-600'
                        : 'bg-white text-gray-700 hover:bg-gray-50 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700'
                ]"
                :aria-pressed="modelValue === tab.id"
                @click="emit('update:modelValue', tab.id)"
            >
                {{ tab.label }}
            </button>

            <!-- Divider -->
            <span v-if="hasTabs" class="relative z-10 -ml-px inline-flex w-px self-stretch bg-blue-400 dark:bg-blue-500" aria-hidden="true" />

            <!-- Action button -->
            <Button shape="minimal" :to="to" :class="actionButtonClasses" @click="emit('action')">
                <slot name="action" />
            </Button>
        </span>
    </div>
</template>
