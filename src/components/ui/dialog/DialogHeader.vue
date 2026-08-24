<script setup lang="ts">
// ── Options, Props, Slots & Emits ────────────────────────────────────────────────────────────────────────────────────
const { title } = defineProps<{ title: string }>();
</script>

<template>
    <div class="mx-4 flex justify-start border-b border-separator py-4 text-lg font-light" data-region="DialogHeader">{{ title }}</div>
</template>
