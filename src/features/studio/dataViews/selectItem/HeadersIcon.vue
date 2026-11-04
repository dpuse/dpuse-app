<script setup lang="ts">
// ── Options, Props, Slots & Emits ────────────────────────────────────────────────────────────────────────────────────

const { hasHeaders } = defineProps<{
    hasHeaders: boolean; // Fills the top row, which stands for the header row. Left empty when the first record is data.
}>();
</script>

<template>
    <!-- Lucide's 'panel-top' with its top row filled, because Lucide has no filled variant. The same size and stroke as
         a Lucide icon, so it lines up with the other selects' icons. -->
    <svg
        aria-hidden="true"
        data-region="HeadersIcon"
        fill="none"
        stroke="currentColor"
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
    >
        <path v-if="hasHeaders" d="M3 9V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v4z" fill="currentColor" />
        <rect height="18" rx="2" width="18" x="3" y="3" />
        <path d="M3 9h18" />
    </svg>
</template>
