<script setup lang="ts">
// ── External Dependencies & Registrations
import { ArrowRightIcon } from '@lucide/vue';

// ── Options, Properties, Model Value, Slots & Emits ──────────────────────────────────────────────────────────────────

const { label } = defineProps<{ label: string }>();
</script>

<template>
    <button
        class="absolute right-3 bottom-(--safe-bottom-offset) inline-flex h-9 items-center gap-x-1 rounded-full border border-blue-200 bg-blue-50 pr-2 pl-3 text-blue-600 shadow-md hover:bg-blue-100 focus-visible:ring-blue-300 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-300 dark:hover:bg-blue-900 dark:focus-visible:ring-blue-500"
        data-region="StepActionButton"
    >
        <span class="text-sm">{{ label }}</span>
        <ArrowRightIcon class="size-5" :stroke-width="1.25" />
    </button>
</template>
