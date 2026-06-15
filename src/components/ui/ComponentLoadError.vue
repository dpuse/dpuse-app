<script setup lang="ts">
// External Dependencies & Registrations
import { RefreshCwIcon, TriangleAlertIcon } from 'lucide-vue-next';

// Local Components - Static
import Button from '@/components/ui/button/Button.vue';

// Options, Properties, Slots & Emits ──────────────────────────────────────────────────────────────────────────────────

const { name, error } = defineProps<{ name?: string; error: unknown }>();

// UI Handlers ─────────────────────────────────────────────────────────────────────────────────────────────────────────

function handleReloadApplication(): void {
    globalThis.location.reload();
}
</script>

<template>
    <div
        class="mx-auto mt-[calc(env(safe-area-inset-top)+7.5vh)] w-[calc(100%-2rem)] max-w-sm rounded-lg border border-amber-200/70 bg-amber-50/70 px-4 py-5 text-center dark:border-amber-300/30 dark:bg-amber-300/10"
        data-region="ComponentLoadError"
    >
        <TriangleAlertIcon class="mx-auto size-12 text-amber-700 dark:text-amber-300" stroke-width="1" />
        <h3 class="mt-2 text-sm font-semibold text-amber-900 dark:text-amber-100">Failed to load {{ name ?? 'Unknown' }} component.</h3>
        <p class="mt-1 text-sm text-amber-800 dark:text-amber-200">
            You may be using an outdated version of the app and this component hasn’t loaded yet, or your internet connection may be unstable. Please check your connection and
            reload the app.
        </p>
        <p class="mt-2 rounded px-2 py-1 font-mono text-xs text-amber-900 dark:text-amber-100">
            {{ error instanceof Error ? error.message : String(error) }}
        </p>
        <Button class="mx-auto mt-4 flex items-center" variant="guarded" @click="handleReloadApplication">
            <RefreshCwIcon class="mr-1.5 size-4" />
            Reload App
        </Button>
    </div>
</template>
