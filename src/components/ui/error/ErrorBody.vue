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
import RectangleButton from '@/components/ui/action/RectangleButton.vue';

// ── Options, Props, Slots & Emits ────────────────────────────────────────────────────────────────────────────────────

// The full failure body, authored once. 'ErrorNotice' renders it in the card presentation and inside the dialog its
// narrow presentation opens, which is why this stays a component of its own rather than markup inside that one: it
// appears twice in the same tree at the same time. It carries its own card chrome but no outer spacing — the caller
// places it.
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
//
// Several failures rather than one, because losing the network fails every service the app loads independently — the
// authentication SDK and the configuration monitor start together, the engine follows when something needs it — and
// each is a separate capability that de-duplication cannot merge. One card listing four losses reads as the single
// thing that happened; four cards read as four problems. A region only ever has one, and passes it as a list of one.
interface Properties {
    canCancel?: boolean;
    canRetry: boolean;
    failures: AppFailure[];
}
const { canCancel, canRetry, failures } = defineProps<Properties>();

defineEmits<{ cancel: []; reload: []; retry: [] }>();

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

const TEXT = {
    'cancel.label': { en: 'Cancel', es: 'Cancelar' },
    'cause.label': { en: 'Cause', es: 'Causa' },
    'console.text': { en: 'See the browser console for more details.', es: 'Consulte la consola del navegador para obtener más detalles.' },
    'reload.label': { en: 'Reload App', es: 'Recargar aplicación' },
    'reporting.failed.text': {
        en: 'Unable to confirm this error was logged with DPUse Support.',
        es: 'No se puede confirmar que este error se haya registrado con el soporte de DPUse.'
    },
    'reporting.pending.text': { en: 'Logging this error with DPUse Support…', es: 'Registrando este error con el soporte de DPUse…' },
    'reporting.succeeded.text': {
        en: 'This error has been logged with DPUse Support for investigation.',
        es: 'Este error se ha registrado con el soporte de DPUse para su investigación.'
    },
    'retry.label': { en: 'Retry', es: 'Reintentar' },
    'staleDeploy.text': {
        en: 'You may be running an outdated version of the app. Reloading fetches the current one.',
        es: 'Es posible que esté utilizando una versión desactualizada de la aplicación. Al recargar se obtiene la versión actual.'
    },
    'trace.label': { en: 'Trace', es: 'Traza' }
};

// ── Derived State ────────────────────────────────────────────────────────────────────────────────────────────────────

// Serialised once per failure rather than three times in the template, which would walk each cause chain again for
// the message, the cause and every trace line.
const entries = computed(() =>
    failures.map((failure) => {
        const trace = serialiseError(failure.error);
        return { cause: trace.length > 1 ? trace.at(-1) : undefined, failure, main: trace[0], trace };
    })
);

// Shown once however many failures share the reason. A stale deployment fails every chunk the session goes on to need,
// so repeating the same sentence per entry would say nothing new four times.
const needsReload = computed(() => failures.some((failure) => failure.needsReload));
</script>

<template>
    <div class="rounded-lg border border-warning-ring/20 bg-warning px-4 py-5" data-region="ErrorBody">
        <TriangleAlertIcon class="size-8 text-warning-text" stroke-width="1.5" />

        <!-- One block per failure, ruled off from the next so four losses read as a list rather than as run-on prose.
             The rule is on every block but the first, which is what keeps it between them and not above the lot. -->
        <div v-for="(entry, entryIndex) in entries" :key="entryIndex" :class="entryIndex > 0 ? 'mt-4 border-t border-warning-ring/20 pt-4' : undefined">
            <p class="mt-2 text-sm font-semibold wrap-anywhere text-warning-text">{{ entry.main.message }}</p>

            <p v-if="entry.cause" class="mt-2 text-sm wrap-anywhere text-warning-text/80">
                <span class="text-sm font-semibold">{{ t(TEXT, 'cause.label') }}</span
                >: {{ entry.cause.message }}
            </p>

            <!-- 'overflow-wrap: anywhere' because a trace carries chunk URLs, which have no spaces to break at and
                 would otherwise push the body wider than the region holding it. -->
            <details v-if="entry.trace.length > 0" class="group my-3 text-left">
                <!-- No focus box of any kind: a summary is focusable, so browsers draw their own, and inside a
                     warning-coloured panel any box reads as a stray control. The chevron already turns to show the
                     open state, which is the feedback that matters here. -->
                <summary
                    class="flex w-fit cursor-pointer list-none items-center gap-1 text-sm font-semibold text-warning-text/80 focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-focus-ring [&::-webkit-details-marker]:hidden"
                >
                    {{ t(TEXT, 'trace.label') }}:
                    <ChevronDownIcon class="size-4 transition-transform group-open:rotate-180" />
                </summary>

                <!-- 'list-disc' restored explicitly: the preflight reset strips markers from every list, so the items
                     were already 'li' elements but sat unmarked, reading as wrapped prose rather than as a chain of
                     causes. -->
                <ul class="list-disc pl-4! marker:text-warning-text/50">
                    <li v-for="(serialisedError, index) in entry.trace" :key="index" class="text-sm leading-snug! wrap-anywhere text-warning-text/70">
                        {{ serialisedError.message }}
                        <span class="text-warning-text/50">({{ serialisedError.name }})</span>
                    </li>
                </ul>
            </details>

            <p class="mt-2 mb-0! text-xs leading-snug! text-warning-text/80">
                <span v-if="entry.failure.wasReported.value == null">{{ t(TEXT, 'reporting.pending.text') }}</span>
                <span v-else-if="entry.failure.wasReported.value">{{ t(TEXT, 'reporting.succeeded.text') }}</span>
                <span v-else class="font-semibold">{{ t(TEXT, 'reporting.failed.text') }}</span>
            </p>
        </div>

        <p v-if="needsReload" class="mt-4 text-sm text-warning-text/80">{{ t(TEXT, 'staleDeploy.text') }}</p>

        <!-- Reload stands apart on the left and in the danger colour: it is the heaviest thing offered here, costing
             the whole page and anything unsaved on it, so it is kept away from the buttons the user reaches for first
             and coloured to say so. Cancel and Retry group on the right, being the two that cost nothing. -->
        <div class="mt-6 flex flex-wrap items-center justify-between gap-2">
            <RectangleButton class="flex items-center" variant="destructive" @click="$emit('reload')">
                <RefreshCwIcon class="mr-1.5 size-4" />
                {{ t(TEXT, 'reload.label') }}
            </RectangleButton>

            <div class="flex flex-wrap items-center gap-2">
                <!-- Only in the dialog, where it is the close action in words rather than a second way out: the body
                     rendered in place has nothing to close, and an error must not be dismissable into thin air. -->
                <RectangleButton v-if="canCancel" variant="outline" @click="$emit('cancel')">{{ t(TEXT, 'cancel.label') }}</RectangleButton>

                <!-- Edged, which no 'guarded' button elsewhere needs: this one is filled with the same token as the
                     body behind it, and in light mode that token is opaque, so the two are the same colour and the
                     button has no edge at all. Dark mode only appears correct because there the token is 10% alpha and
                     the button's coat composites over the body's to about 19%.
                     'inset-ring' rather than 'border', matching how the 'outline' variant on Cancel draws its own: a
                     ring is a box-shadow and takes no layout space, where a border would add 2px and leave this button
                     visibly larger than the one beside it. -->
                <RectangleButton v-if="canRetry" class="flex items-center inset-ring inset-ring-warning-ring/40" variant="guarded" @click="$emit('retry')">
                    <RepeatIcon class="mr-1.5 size-4" />
                    {{ t(TEXT, 'retry.label') }}
                </RectangleButton>
            </div>
        </div>

        <p class="mt-2 mb-0! border-t border-warning-ring/30 pt-2 text-xs leading-snug! text-warning-text">{{ t(TEXT, 'console.text') }}</p>
    </div>
</template>
