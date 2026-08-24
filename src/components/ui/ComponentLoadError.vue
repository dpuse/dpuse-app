<script setup lang="ts">
// ── External Dependencies & Registrations
import { RefreshCwIcon, TriangleAlertIcon } from '@lucide/vue';

// ── Static Components
import Button from '@/components/ui/button/Button.vue';

// ── Options, Props, Slots & Emits ────────────────────────────────────────────────────────────────────────────────────

const { name, error } = defineProps<{ name?: string; error: unknown }>();

// ── Event Handlers ───────────────────────────────────────────────────────────────────────────────────────────────────

function handleReloadApp(): void {
    location.reload();
}
</script>

<template>
    <div
        class="mx-auto mt-[calc(env(safe-area-inset-top)+7.5vh)] w-[calc(100%-2rem)] max-w-sm rounded-lg border border-warning-ring/20 bg-warning px-4 py-5 text-center"
        data-region="ComponentLoadError"
    >
        <TriangleAlertIcon class="mx-auto size-12 text-warning-text" stroke-width="1" />
        <h3 class="mt-2 text-sm font-semibold text-warning-text">Failed to load {{ name ?? 'Unknown' }} component.</h3>
        <p class="mt-1 text-sm text-warning-text">
            You may be using an outdated version of the app and this component hasn’t loaded yet, or your internet connection may be unstable. Please check your connection and
            reload the app.
        </p>
        <p class="mt-2 rounded px-2 py-1 font-mono text-xs text-warning-text">
            {{ error instanceof Error ? error.message : String(error) }}
        </p>
        <Button class="mx-auto mt-4 flex items-center" variant="guarded" @click="handleReloadApp">
            <RefreshCwIcon class="mr-1.5 size-4" />
            Reload App
        </Button>
    </div>
</template>
