<script setup lang="ts">
defineProps<{ value: unknown; loading: boolean }>();
</script>

<template>
    <div class="flex items-center overflow-hidden px-3">
        <div v-if="loading" class="h-4 w-3/4 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" />
        <span v-else class="truncate text-sm text-zinc-800 dark:text-zinc-300">{{ value ?? '' }}</span>
    </div>
</template>
