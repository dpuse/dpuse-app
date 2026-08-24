<script setup lang="ts">
// ── External Dependencies & Registrations
import { PlusIcon } from '@lucide/vue';

// ── Options, Props, Slots & Emits ────────────────────────────────────────────────────────────────────────────────────

const { label } = defineProps<{ label: string }>();
</script>

<template>
    <button
        class="absolute right-3 bottom-(--safe-bottom-offset) inline-flex h-9 items-center gap-x-1 rounded-full border pr-3 pl-2 shadow-md"
        :class="['border-selected-border bg-selected text-selected-text hover:bg-selected-hover focus-visible:ring-selected-ring']"
    >
        <PlusIcon class="size-5" :stroke-width="1.25" />
        <span class="text-sm">{{ label }}</span>
    </button>
</template>
