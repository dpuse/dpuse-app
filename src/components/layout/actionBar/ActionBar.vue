<script setup lang="ts">
// External Dependencies
import { computed } from 'vue';
import type { RouteLocationRaw } from 'vue-router';
import { ArrowBigRightIcon, EraserIcon, PlusIcon } from 'lucide-vue-next';

// Local Components - Static
import Button from '@/components/ui/button/Button.vue';

// Options, Properties, Slots & Emits ──────────────────────────────────────────────────────────────────────────────────

type Tab = { id: string; label: string };
type Properties = {
    clearAction?: boolean;
    commitActionLabel?: string;
    commitActionVariant?: 'add' | 'select';
    itemActions?: Tab[];
    modelValue?: string;
    to?: RouteLocationRaw;
};
const { clearAction = false, commitActionLabel, commitActionVariant, itemActions = [], modelValue, to } = defineProps<Properties>();

const emit = defineEmits<{ 'update:modelValue': [id: string]; clear: []; commit: [] }>();

// Derived State ───────────────────────────────────────────────────────────────────────────────────────────────────────

const clearActionClasses = computed(() => [
    itemActions.length > 0 || commitActionVariant ? 'rounded-l-full pl-3 pr-2' : 'rounded-full px-3',
    'inline-flex items-center gap-x-1 text-sm focus:z-10 focus-visible:ring-2',
    'border border-amber-400 bg-amber-50 text-amber-600 hover:bg-amber-100 focus-visible:ring-amber-300 dark:border-amber-500 dark:bg-amber-950 dark:text-amber-400 dark:hover:bg-amber-900 dark:focus-visible:ring-amber-500'
]);

const commitActionClasses = computed(() => [
    clearAction || itemActions.length > 0 ? 'rounded-r-full pr-3 pl-2' : 'rounded-full min-w-10',
    'inline-flex items-center justify-center gap-x-1 text-sm focus:z-10 focus-visible:ring-2',
    commitActionVariant === 'select'
        ? 'border border-blue-400 bg-blue-50 text-blue-600 hover:bg-blue-100 focus-visible:ring-blue-300 dark:border-blue-500 dark:bg-blue-950 dark:text-blue-400 dark:hover:bg-blue-900 dark:focus-visible:ring-blue-500'
        : 'border border-zinc-300 bg-zinc-100 text-zinc-600 hover:bg-zinc-200 focus-visible:ring-zinc-300 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700 dark:focus-visible:ring-zinc-500'
]);
</script>

<template>
    <div class="isolate inline-flex h-10 rounded-full shadow-md">
        <!-- Clear Action -->
        <Button v-if="clearAction" shape="minimal" :to="to" :class="clearActionClasses" @click="$emit('clear')">
            <EraserIcon class="size-5" :stroke-width="1.25" />
            Clear
        </Button>

        <!-- Item Actions -->
        <button
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
        </button>

        <!-- Divider -->
        <!-- <span v-if="hasLocalActions" class="relative z-10 -ml-px inline-flex w-px self-stretch bg-blue-400 dark:bg-blue-500" aria-hidden="true" /> -->

        <!-- Commit Add Action -->
        <template v-if="commitActionVariant === 'add'">
            <Button shape="minimal" :to="to" :class="[commitActionClasses, { 'pr-3.5 pl-2': commitActionLabel }]" @click="$emit('commit')">
                <PlusIcon class="size-5" :stroke-width="1.25" />
                {{ commitActionLabel }}
            </Button>
        </template>

        <!-- Commit Select Action -->
        <template v-else-if="commitActionVariant === 'select'">
            <Button shape="minimal" :to="to" class="pr-2 pl-3.5" :class="commitActionClasses" @click="emit('commit')">
                Select
                <ArrowBigRightIcon class="size-5" :stroke-width="1.25" />
            </Button>
        </template>
    </div>
</template>
