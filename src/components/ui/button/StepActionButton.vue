<script setup lang="ts">
// ── External Dependencies & Registrations
import { ArrowRightIcon } from '@lucide/vue';

// ── Options, Props, Slots & Emits ────────────────────────────────────────────────────────────────────────────────────

const { label } = defineProps<{ label: string }>();
</script>

<template>
    <button
        class="absolute right-3 bottom-(--safe-bottom-offset) inline-flex h-9 items-center gap-x-1 rounded-full border pr-2 pl-3 shadow-md"
        :class="[
            'border-selected-border bg-selected text-selected-text hover:bg-selected-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring'
        ]"
        data-region="StepActionButton"
    >
        <span class="text-sm">{{ label }}</span>
        <ArrowRightIcon class="size-5" :stroke-width="1.25" />
    </button>
</template>
