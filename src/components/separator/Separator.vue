<script setup lang="ts">
// Properties
type Properties = { text?: string };
const { text } = defineProps<Properties>();
</script>

<template>
    <div v-if="text" class="flex items-center gap-4 font-light">
        <div class="border-separator flex-1 border-t" />
        <span class="text-muted">{{ text }}</span>
        <div class="border-separator flex-1 border-t" />
    </div>

    <div v-else class="bg-separator h-px" />
</template>
