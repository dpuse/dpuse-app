<script setup lang="ts">
// ── Options, Props, Slots & Emits ────────────────────────────────────────────────────────────────────────────────────

const { loading, value } = defineProps<{ loading: boolean; value: unknown }>();

defineSlots<{
    icon?(): unknown; // Rendered before the value.
}>();
</script>

<template>
    <div class="flex items-center gap-x-1.5 px-3" data-region="TableRowCell">
        <div v-if="loading" class="h-4 w-3/4 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" />
        <template v-else>
            <slot name="icon" />
            <span class="truncate text-sm text-emphasis dark:text-zinc-300">{{ value ?? '' }}</span>
        </template>
    </div>
</template>
