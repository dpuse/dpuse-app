<script setup lang="ts">
// ── External Dependencies & Registrations
import { computed } from 'vue';
import { ChevronDownIcon, RefreshCwIcon, TriangleAlertIcon } from '@lucide/vue';

// ── DPUse Framework
import { type AppError, serialiseError } from '@dpuse/dpuse-shared/errors';

// ── Local Framework
import { t } from '@/state/locale';

// ── Static Components
import Button from '@/components/ui/button/Button.vue';

// ── Options, Props, Slots & Emits ────────────────────────────────────────────────────────────────────────────────────

// The full error body, authored once. 'ErrorDisplay' renders it directly where there is room and inside a dialog where
// there is not, so it carries its own card chrome but no outer spacing — the caller places it.
// 'errorWasReported' is undefined while the report is still in flight, so the body says the reporting is pending
// rather than claiming it could not be confirmed — see the reporting note in the template.
const { error, errorWasReported } = defineProps<{ error: AppError; errorWasReported: boolean | undefined }>();
defineEmits<{ retry: [] }>();

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

const T = {
    'cause.label': { en: 'Cause', es: 'Causa' },
    'console.message': { en: 'See the browser console for more details.', es: 'Consulte la consola del navegador para obtener más detalles.' },
    'reporting.failed': { en: 'Unable to confirm this error was logged with DPUse Support.', es: 'No se puede confirmar que este error se haya registrado con el soporte de DPUse.' },
    'reporting.pending': { en: 'Logging this error with DPUse Support…', es: 'Registrando este error con el soporte de DPUse…' },
    'reporting.succeeded': {
        en: 'This error has been logged with DPUse Support for investigation.',
        es: 'Este error se ha registrado con el soporte de DPUse para su investigación.'
    },
    'retry.label': { en: 'Retry', es: 'Reintentar' },
    'trace.label': { en: 'Trace', es: 'Traza' }
};

// ── Derived State ────────────────────────────────────────────────────────────────────────────────────────────────────

const errorTrace = computed(() => serialiseError(error));
const mainSerialisedError = computed(() => errorTrace.value[0]);
const originalSerialisedError = computed(() => (errorTrace.value.length > 1 ? errorTrace.value.at(-1) : undefined));
</script>

<template>
    <div class="rounded-lg border border-warning-ring/20 bg-warning px-4 py-5" data-region="ErrorDetail">
        <TriangleAlertIcon class="size-8 text-warning-text" />

        <p class="mt-2 text-sm font-semibold text-warning-text">{{ mainSerialisedError.message }}</p>

        <p v-if="originalSerialisedError" class="mt-2 text-sm text-warning-text/80">
            <span class="text-sm font-semibold">{{ t(T, 'cause.label') }}</span
            >: {{ originalSerialisedError.message }}
        </p>

        <details v-if="errorTrace.length > 0" class="group my-3 text-left">
            <summary class="flex w-fit cursor-pointer list-none items-center gap-1 text-sm font-semibold text-warning-text/80 [&::-webkit-details-marker]:hidden">
                {{ t(T, 'trace.label') }}
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
            {{ t(T, 'retry.label') }}
        </Button>

        <p class="mt-6! mb-0! border-t border-warning-ring/30 pt-2 text-xs leading-snug! text-warning-text">
            {{ t(T, 'console.message') }}
            <span v-if="errorWasReported == null">{{ t(T, 'reporting.pending') }}</span>
            <span v-else-if="errorWasReported">{{ t(T, 'reporting.succeeded') }}</span>
            <span v-else class="font-semibold">{{ t(T, 'reporting.failed') }}</span>
        </p>
    </div>
</template>
