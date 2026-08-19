<script setup lang="ts">
// ── External Dependencies & Registrations
import { PlusIcon } from '@lucide/vue';

// ── Options, Properties, Model Value, Slots & Emits ──────────────────────────────────────────────────────────────────

const { label } = defineProps<{ label: string }>();
</script>

<template>
    <button
        class="absolute right-3 bottom-(--safe-bottom-offset) inline-flex h-9 items-center gap-x-1 rounded-full border pr-3 pl-2 shadow-md"
        :class="[
            'border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-100 focus-visible:ring-sky-300',
            'dark:border-sky-800 dark:bg-sky-950 dark:text-sky-300 dark:hover:bg-sky-900 dark:focus-visible:ring-sky-500'
        ]"
    >
        <PlusIcon class="size-5" :stroke-width="1.25" />
        <span class="text-sm">{{ label }}</span>
    </button>
</template>
