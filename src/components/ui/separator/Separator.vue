<script setup lang="ts">
// Options, Properties, Slots & Emits
const { text } = defineProps<{ text?: string }>();
</script>

<template>
    <div v-if="text" class="flex flex-none items-center gap-4 font-light">
        <div class="flex-1 border-t border-separator" />
        <span class="text-muted">{{ text }}</span>
        <div class="flex-1 border-t border-separator" />
    </div>

    <div v-else class="h-px flex-none bg-separator" />
</template>
