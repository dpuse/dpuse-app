<script setup lang="ts">
// ── External Dependencies & Registrations
import { computed } from 'vue';
import { ChevronDownIcon, RefreshCwIcon, RepeatIcon, TriangleAlertIcon } from '@lucide/vue';

// ── DPUse Framework
import { serialiseError } from '@dpuse/dpuse-shared/errors';

// ── Local Framework
import type { AppFailure } from '@/state/errors';
import { t } from '@/state/locale';

// ── Static Components
import Button from '@/components/ui/button/Button.vue';

// ── Options, Props, Slots & Emits ────────────────────────────────────────────────────────────────────────────────────

// The full failure body, authored once. 'ErrorDisplay' renders it in the card shell and inside the dialog its narrow
// shells open, which is why this stays a component of its own rather than markup inside that one: it appears twice in
// the same tree at the same time. It carries its own card chrome but no outer spacing — the caller places it.
//
// Both recoveries are always offered. Which one is likely to work is decided by matching browser-specific wording
// (see 'STALE_DEPLOY_MESSAGE_PATTERNS'), so it can be wrong — and offering only its choice would leave the user with
// the single button that cannot help them. Showing both costs a wasted click when the guess is wrong, instead of a
// dead end; the guess is left to say so in words, above.
//
// 'canRetry' is false where nothing local could be retried — a failure with no region of its own, where a fresh
// document is the only recovery there is.
//
// 'canCancel' is true only in the dialog, where cancelling means closing it. Rendered in place there is nothing to
// cancel: the failure has already happened, and a button that only made the account of it disappear would leave a
// region that is broken and no longer says so.
interface Properties {
    canCancel?: boolean;
    canRetry: boolean;
    failure: AppFailure;
}
const { canCancel, canRetry, failure } = defineProps<Properties>();

defineEmits<{ cancel: []; reload: []; retry: [] }>();

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

const T = {
    'cancel.label': { en: 'Cancel', es: 'Cancelar' },
    'cause.label': { en: 'Cause', es: 'Causa' },
    'console.message': { en: 'See the browser console for more details.', es: 'Consulte la consola del navegador para obtener más detalles.' },
    'reporting.failed': {
        en: 'Unable to confirm this error was logged with DPUse Support.',
        es: 'No se puede confirmar que este error se haya registrado con el soporte de DPUse.'
    },
    'reload.label': { en: 'Reload', es: 'Recargar' },
    'reporting.pending': { en: 'Logging this error with DPUse Support…', es: 'Registrando este error con el soporte de DPUse…' },
    'reporting.succeeded': {
        en: 'This error has been logged with DPUse Support for investigation.',
        es: 'Este error se ha registrado con el soporte de DPUse para su investigación.'
    },
    'retry.label': { en: 'Retry', es: 'Reintentar' },
    'staleDeploy.message': {
        en: 'You may be running an outdated version of the app. Reloading fetches the current one.',
        es: 'Es posible que esté utilizando una versión desactualizada de la aplicación. Al recargar se obtiene la versión actual.'
    },
    'trace.label': { en: 'Trace', es: 'Traza' }
};

// ── Derived State ────────────────────────────────────────────────────────────────────────────────────────────────────

const errorTrace = computed(() => serialiseError(failure.error));
const mainSerialisedError = computed(() => errorTrace.value[0]);
const originalSerialisedError = computed(() => (errorTrace.value.length > 1 ? errorTrace.value.at(-1) : undefined));
</script>

<template>
    <div class="rounded-lg border border-warning-ring/20 bg-warning px-4 py-5" data-region="ErrorDetail">
        <TriangleAlertIcon class="size-8 text-warning-text" stroke-width="1.5" />

        <p class="mt-2 text-sm font-semibold wrap-anywhere text-warning-text">{{ mainSerialisedError.message }}</p>

        <p v-if="originalSerialisedError" class="mt-2 text-sm wrap-anywhere text-warning-text/80">
            <span class="text-sm font-semibold">{{ t(T, 'cause.label') }}</span
            >: {{ originalSerialisedError.message }}
        </p>

        <p v-if="failure.needsReload" class="mt-2 text-sm text-warning-text/80">{{ t(T, 'staleDeploy.message') }}</p>

        <!-- 'overflow-wrap: anywhere' because a trace carries chunk URLs, which have no spaces to break at and would
             otherwise push the body wider than the region holding it. -->
        <details v-if="errorTrace.length > 0" class="group my-3 text-left">
            <summary class="flex w-fit cursor-pointer list-none items-center gap-1 text-sm font-semibold text-warning-text/80 [&::-webkit-details-marker]:hidden">
                {{ t(T, 'trace.label') }}:
                <ChevronDownIcon class="size-4 transition-transform group-open:rotate-180" />
            </summary>

            <!-- 'list-disc' restored explicitly: the preflight reset strips markers from every list, so the items were
                 already 'li' elements but sat unmarked, reading as wrapped prose rather than as a chain of causes. -->
            <ul class="list-disc pl-4! marker:text-warning-text/50">
                <li v-for="(serialisedError, index) in errorTrace" :key="index" class="text-sm leading-snug! wrap-anywhere text-warning-text/70">
                    {{ serialisedError.message }}
                    <span class="text-warning-text/50">({{ serialisedError.name }})</span>
                </li>
            </ul>
        </details>

        <!-- Reload stands apart on the left and in the danger colour: it is the heaviest thing offered here, costing
             the whole page and anything unsaved on it, so it is kept away from the buttons the user reaches for first
             and coloured to say so. Cancel and Retry group on the right, being the two that cost nothing. -->
        <div class="mt-6 flex flex-wrap items-center justify-between gap-2">
            <Button class="flex items-center" variant="destructive" @click="$emit('reload')">
                <RefreshCwIcon class="mr-1.5 size-4" />
                {{ t(T, 'reload.label') }}
            </Button>

            <div class="flex flex-wrap items-center gap-2">
                <!-- Only in the dialog, where it is the close action in words rather than a second way out: the body
                     rendered in place has nothing to close, and an error must not be dismissable into thin air. -->
                <Button v-if="canCancel" variant="outline" @click="$emit('cancel')">{{ t(T, 'cancel.label') }}</Button>

                <!-- Edged, which no 'guarded' button elsewhere needs: this one is filled with the same token as the
                     body behind it, and in light mode that token is opaque, so the two are the same colour and the
                     button has no edge at all. Dark mode only appears correct because there the token is 10% alpha and
                     the button's coat composites over the body's to about 19%.
                     'inset-ring' rather than 'border', matching how the 'outline' variant on Cancel draws its own: a
                     ring is a box-shadow and takes no layout space, where a border would add 2px and leave this button
                     visibly larger than the one beside it. -->
                <Button v-if="canRetry" class="flex items-center inset-ring inset-ring-warning-ring/40" variant="guarded" @click="$emit('retry')">
                    <RepeatIcon class="mr-1.5 size-4" />
                    {{ t(T, 'retry.label') }}
                </Button>
            </div>
        </div>

        <p class="mt-2 mb-0! border-t border-warning-ring/30 pt-2 text-xs leading-snug! text-warning-text">
            {{ t(T, 'console.message') }}
            <span v-if="failure.wasReported.value == null">{{ t(T, 'reporting.pending') }}</span>
            <span v-else-if="failure.wasReported.value">{{ t(T, 'reporting.succeeded') }}</span>
            <span v-else class="font-semibold">{{ t(T, 'reporting.failed') }}</span>
        </p>
    </div>
</template>
