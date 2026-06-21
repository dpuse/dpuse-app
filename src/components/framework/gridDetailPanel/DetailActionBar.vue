<script setup lang="ts">
// ── External Dependencies & Registrations
import { ArrowBigLeftIcon, ArrowBigRightIcon } from 'lucide-vue-next';

// ── Local Components - Static
import Button from '@/components/ui/button/Button.vue';

// ── Options, Properties, Slots & Emits ───────────────────────────────────────────────────────────────────────────────

export type ItemAction = { id: string; label: string };
const { itemActions = [], commitVariant } = defineProps<{ commitVariant?: 'add' | 'select'; itemActions?: ItemAction[] }>();

defineEmits<{ clear: []; commit: [] }>();

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

const modelValue = defineModel<string>();
</script>

<template>
    <div class="isolate inline-flex h-10 rounded-full shadow-md" data-region="DetailActionBar">
        <!-- Clear Action -->
        <Button
            class="inline-flex items-center gap-x-1"
            :class="[
                'border-zinc-200 bg-amber-50 text-amber-600 hover:bg-amber-100 focus-visible:ring-amber-300 dark:border-zinc-500 dark:bg-amber-950 dark:text-amber-400 dark:hover:bg-amber-900 dark:focus-visible:ring-amber-500',
                commitVariant ? 'rounded-l-full border-y border-l pr-2 pl-3' : 'rounded-full border pr-4 pl-3'
            ]"
            shape="minimal"
            @click="$emit('clear')"
        >
            <ArrowBigLeftIcon class="size-5" :stroke-width="1.25" />
            <span class="text-sm">Clear</span>
        </Button>

        <!-- Item Actions -->
        <Button
            v-for="itemAction in itemActions"
            :key="itemAction.id"
            class="inline-flex items-center border-y border-l border-zinc-200 bg-white px-2 dark:border-zinc-500"
            shape="minimal"
            @click="modelValue = itemAction.id"
        >
            <!-- <EllipsisIcon class="size-5" stroke-width="1.25" /> -->
            <span class="text-sm">{{ itemAction.label }}</span>
        </Button>

        <!-- Add/Commit Action -->
        <Button
            v-if="commitVariant"
            class="inline-flex items-center gap-x-1 rounded-r-full border border-l-zinc-300 pr-3 pl-2 dark:border-l-zinc-500"
            :class="[
                'border-zinc-200 bg-blue-50 text-blue-600 hover:bg-blue-100 focus-visible:ring-blue-300 dark:border-zinc-500 dark:bg-blue-950 dark:text-blue-400 dark:hover:bg-blue-900 dark:focus-visible:ring-blue-500'
            ]"
            shape="minimal"
            @click="$emit('commit')"
        >
            <span class="text-sm">{{ commitVariant === 'add' ? 'Add' : 'Commit' }}</span>
            <ArrowBigRightIcon class="size-5" :stroke-width="1.25" />
        </Button>
    </div>
</template>
