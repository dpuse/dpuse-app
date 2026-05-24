<script setup lang="ts">
// External Dependencies
import { computed } from 'vue';
import type { RouteLocationRaw } from 'vue-router';
import { ArrowBigLeftIcon, ArrowBigRightIcon } from 'lucide-vue-next';

// Local Components - Static
import Button from '@/components/ui/button/Button.vue';

// Options, Properties, Slots & Emits ──────────────────────────────────────────────────────────────────────────────────

export type CommitVariant = 'add' | 'select';
const {
    itemActions = [],
    commitVariant = 'select',
    modelValue,
    to
} = defineProps<{ commitVariant?: CommitVariant; itemActions?: { id: string; label: string }[]; modelValue?: string; to?: RouteLocationRaw }>();

const emit = defineEmits<{ 'update:modelValue': [id: string]; clear: []; commit: [] }>();

// Derived State ───────────────────────────────────────────────────────────────────────────────────────────────────────

const clearActionClasses = computed(() => [
    'rounded-l-full pl-3 pr-2',
    'inline-flex items-center gap-x-1 text-sm focus:z-10 focus-visible:ring-2',
    'border-y border-l border-amber-400 bg-amber-50 text-amber-600 hover:bg-amber-100 focus-visible:ring-amber-300 dark:border-amber-500 dark:bg-amber-950 dark:text-amber-400 dark:hover:bg-amber-900 dark:focus-visible:ring-amber-500'
]);

const commitActionClasses = computed(() => [
    'rounded-r-full pr-3 pl-2',
    'inline-flex items-center gap-x-1 text-sm focus:z-10 focus-visible:ring-2',
    'border-y border-r  border-blue-300 bg-blue-50 text-blue-600 hover:bg-blue-100 focus-visible:ring-blue-300 dark:border-blue-500 dark:bg-blue-950 dark:text-blue-400 dark:hover:bg-blue-900 dark:focus-visible:ring-blue-500'
]);
</script>

<template>
    <div class="isolate inline-flex h-10 rounded-full shadow-md">
        <!-- Clear Action -->
        <Button shape="minimal" :to="to" :class="clearActionClasses" @click="$emit('clear')">
            <ArrowBigLeftIcon class="size-5" :stroke-width="1.25" />
            Clear
        </Button>

        <!-- Item Actions -->
        <!-- <button
            v-for="(itemAction, index) in itemActions"
            :key="itemAction.id"
            type="button"
            class="relative inline-flex items-center py-2 text-sm inset-ring-1 inset-ring-gray-300 focus:z-10"
            :class="[
                index === 0 && !clearAction ? 'rounded-l-full pr-2 pl-3' : '-ml-px px-2',
                modelValue === itemAction.id
                    ? 'bg-gray-100 text-gray-900 hover:bg-gray-200 dark:bg-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-600'
                    : 'bg-white text-gray-700 hover:bg-gray-50 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700'
            ]"
            :aria-pressed="modelValue === itemAction.id"
            @click="emit('update:modelValue', itemAction.id)"
        >
            {{ itemAction.label }}
        </button> -->
        <button v-if="modelValue" type="button" class="relative inline-flex items-center px-3 text-sm inset-ring-1 inset-ring-gray-300 focus:z-10">
            {{ modelValue }}
        </button>

        <!-- Divider -->
        <span class="relative z-10 inline-flex w-px self-stretch bg-zinc-300 dark:bg-zinc-500" aria-hidden="true" />

        <!-- Commit Select Action -->
        <Button class="pr-2 pl-2" :class="commitActionClasses" shape="minimal" :to="to" @click="emit('commit')">
            {{ commitVariant === 'add' ? 'Add' : 'Select' }}
            <ArrowBigRightIcon class="size-5" :stroke-width="1.25" />
        </Button>
    </div>
</template>
