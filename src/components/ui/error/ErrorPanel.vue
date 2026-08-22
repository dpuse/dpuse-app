<script setup lang="ts">
// ── External Dependencies & Registrations
import { computed } from 'vue';
import { ChevronDownIcon, RefreshCwIcon, TriangleAlertIcon } from '@lucide/vue';

// ── DPUse Framework
import { type AppError, serialiseError } from '@dpuse/dpuse-shared/errors';

// ── Local Framework

// ── Local Components - Static
import Button from '@/components/ui/button/Button.vue';

// ── Options, Properties, Slots & Emits ───────────────────────────────────────────────────────────────────────────────

const { error } = defineProps<{ error: AppError }>();
defineEmits<{ retry: [] }>();

// ── Derived State ────────────────────────────────────────────────────────────────────────────────────────────────────

const errorTrace = computed(() => serialiseError(error));
const mainSerialisedError = computed(() => errorTrace.value[0]);
const originalSerialisedError = computed(() => (errorTrace.value.length > 1 ? errorTrace.value.at(-1) : undefined));
</script>

<template>
    <div class="mx-auto my-8 w-[calc(100%-2rem)] max-w-sm rounded-lg border border-warning-ring/20 bg-warning px-4 py-5">
        <TriangleAlertIcon class="size-8 text-warning-text" />

        <p class="mt-2 text-sm font-semibold text-warning-text">{{ mainSerialisedError.message }}</p>

        <p v-if="originalSerialisedError" class="mt-2 text-sm text-warning-text/80"><span class="text-sm font-semibold">Cause</span>: {{ originalSerialisedError.message }}</p>

        <details v-if="errorTrace.length > 0" class="group my-3 text-left">
            <summary class="flex w-fit cursor-pointer list-none items-center gap-1 text-sm font-semibold text-warning-text/80 [&::-webkit-details-marker]:hidden">
                Trace
                <ChevronDownIcon class="size-4 transition-transform group-open:rotate-180" />
            </summary>

            <ul class="pl-4!">
                <li v-for="(serialisedError, index) in errorTrace" :key="index" class="text-sm leading-snug! text-warning-text/70">
                    {{ serialisedError.message }}
                    <span class="text-warning-text/50">({{ serialisedError.name }})</span>
                </li>
            </ul>
        </details>

        <Button class="mt-3 ml-auto flex items-center inset-ring inset-ring-warning-ring/20" variant="guarded" @click="$emit('retry')">
            <RefreshCwIcon class="mr-1.5 size-4" />
            Retry
        </Button>

        <p class="mb-0! border-t border-warning-ring/30 pt-2 text-xs leading-snug! text-warning-text/60">
            See the browser console for more details. This error has been logged with DPUse Support for investigation.
        </p>
    </div>
</template>
