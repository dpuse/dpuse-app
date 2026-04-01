<script setup lang="ts">
// Properties & Emits
const { text } = defineProps<{ text?: string }>();
</script>

<template>
    <div v-if="text" class="flex flex-none items-center gap-4 font-light">
        <div class="border-separator flex-1 border-t" />
        <span class="text-muted">{{ text }}</span>
        <div class="border-separator flex-1 border-t" />
    </div>

    <div v-else class="bg-separator h-px flex-none" />
</template>
