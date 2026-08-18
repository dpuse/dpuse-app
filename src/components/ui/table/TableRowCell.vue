<script setup lang="ts">
// Options, Properties, Slots & Emits
const { loading, value } = defineProps<{ loading: boolean; value: unknown }>();
</script>

<template>
    <div class="flex items-center px-3" data-region="TableRowCell">
        <div v-if="loading" class="h-4 w-3/4 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" />
        <span v-else class="truncate text-sm text-emphasis dark:text-zinc-300">{{ value ?? '' }}</span>
    </div>
</template>
