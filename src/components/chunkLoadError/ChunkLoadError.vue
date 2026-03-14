<script setup lang="ts">
defineProps<{ chunkName: string; error: unknown }>();
</script>

<template>
    <div class="mt-[7.5vh] text-center">
        <svg class="mx-auto size-12 text-zinc-400 dark:text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path vector-effect="non-scaling-stroke" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
        </svg>
        <h3 class="mt-2 text-sm font-semibold text-zinc-900 dark:text-white">Failed to load {{ chunkName }}</h3>
        <p class="mt-1 text-sm text-zinc-500 dark:text-zinc-400">This section could not be loaded. Check your connection and try again.</p>
        <p class="mt-1 font-mono text-xs text-zinc-400 dark:text-zinc-500">{{ error instanceof Error ? error.message : String(error) }}</p>
    </div>
</template>
