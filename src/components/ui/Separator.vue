<script setup lang="ts">
// ── Options, Props, Slots & Emits ────────────────────────────────────────────────────────────────────────────────────

interface Properties {
    text?: string;
}
const { text } = defineProps<Properties>();
</script>

<template>
    <div v-if="text" class="flex flex-none items-center gap-4 font-light" data-region="Separator">
        <div class="flex-1 border-t border-separator" />
        <span class="text-muted">{{ text }}</span>
        <div class="flex-1 border-t border-separator" />
    </div>

    <div v-else class="h-px flex-none bg-separator" data-region="Separator" />
</template>
