<script setup lang="ts">
// ── External Dependencies & Registrations
import { TriangleAlertIcon } from '@lucide/vue';
import { computed, ref, useTemplateRef } from 'vue';

// ── DPUse Framework
import { type AppError, serialiseError } from '@dpuse/dpuse-shared/errors';

// ── Local Framework
import { t } from '@/state/locale';

// ── Static Components
import Button from '@/components/ui/button/Button.vue';
import ErrorDetail from '@/components/ui/error/ErrorDetail.vue';

// ── Options, Props, Slots & Emits ────────────────────────────────────────────────────────────────────────────────────

// The single surface for a recoverable error. Which of the three shells renders is decided by the width this component
// is given, not by the caller — panes are resized at runtime by 'PaneSplitter.vue', so a caller cannot know.
// 'errorWasReported' is undefined while the report is still in flight; it is passed straight through to 'ErrorDetail'.
const { error, errorWasReported } = defineProps<{ error: AppError; errorWasReported: boolean | undefined }>();
const emit = defineEmits<{ retry: [] }>();

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

const T = {
    'close.label': { en: 'Close', es: 'Cerrar' },
    'detail.label.aria': { en: 'Show error details', es: 'Mostrar detalles del error' },
    'reporting.failed': { en: 'Unable to confirm this error was logged with DPUse Support.', es: 'No se puede confirmar que este error se haya registrado con el soporte de DPUse.' },
    'reporting.pending': { en: 'Logging this error with DPUse Support…', es: 'Registrando este error con el soporte de DPUse…' },
    'reporting.succeeded': {
        en: 'This error has been logged with DPUse Support for investigation.',
        es: 'Este error se ha registrado con el soporte de DPUse para su investigación.'
    },
    'retry.label': { en: 'Retry', es: 'Reintentar' }
};

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

// Detail dialog — only reachable from the badge shell, where there is no room to show the body in place. The element
// itself always exists so its ref is available on the click that opens it; only its contents are conditional.
const detailDialog = useTemplateRef<HTMLDialogElement>('detailDialogReference');
const detailIsVisible = ref(false);

// ── Derived State ────────────────────────────────────────────────────────────────────────────────────────────────────

const mainSerialisedError = computed(() => serialiseError(error)[0]);

// ── Event Handlers ───────────────────────────────────────────────────────────────────────────────────────────────────

function handleCloseDetail(): void {
    detailIsVisible.value = false;
}

function handleRequestCloseDetail(): void {
    detailDialog.value?.close(); // Fires 'close', which clears the contents.
}

function handleRetry(): void {
    handleRequestCloseDetail();
    emit('retry');
}

function handleShowDetail(): void {
    detailIsVisible.value = true;
    detailDialog.value?.showModal();
}
</script>

<template>
    <div class="error-display" data-region="ErrorDisplay">
        <!-- Badge - the container is too narrow for prose, so the body moves to a dialog. -->
        <button
            :aria-label="t(T, 'detail.label.aria')"
            class="shell-badge items-center justify-center rounded-md border border-warning-ring/20 bg-warning p-1.5 text-warning-text hover:bg-warning-hover focus-visible:ring-2 focus-visible:ring-warning-ring focus-visible:outline-none active:bg-warning-active"
            :title="mainSerialisedError.message"
            type="button"
            @click="handleShowDetail"
        >
            <TriangleAlertIcon class="size-5" />
        </button>

        <!-- Notice - room for one line. -->
        <div class="shell-notice items-center justify-between gap-2 rounded-md border border-warning-ring/20 bg-warning px-3 py-1.5 text-xs text-warning-text">
            <span class="flex min-w-0 items-center gap-1.5">
                <TriangleAlertIcon class="size-3.5 shrink-0" />
                {{ mainSerialisedError.message }}
                <span v-if="errorWasReported == null">{{ t(T, 'reporting.pending') }}</span>
                <span v-else-if="errorWasReported">{{ t(T, 'reporting.succeeded') }}</span>
                <span v-else class="font-semibold">{{ t(T, 'reporting.failed') }}</span>
            </span>
            <Button class="shrink-0" shape="minimal" size="sm" variant="guarded" @click="handleRetry">{{ t(T, 'retry.label') }}</Button>
        </div>

        <!-- Card - room for the whole body. -->
        <ErrorDetail class="shell-card mx-auto my-8 w-[calc(100%-2rem)] max-w-sm" :error="error" :error-was-reported="errorWasReported" @retry="handleRetry" />

        <dialog ref="detailDialogReference" class="detail-dialog" @cancel="handleCloseDetail" @close="handleCloseDetail">
            <template v-if="detailIsVisible">
                <ErrorDetail :error="error" :error-was-reported="errorWasReported" @retry="handleRetry" />
                <Button class="mt-3 ml-auto flex" variant="outline" @click="handleRequestCloseDetail">{{ t(T, 'close.label') }}</Button>
            </template>
        </dialog>
    </div>
</template>

<style scoped>
.error-display {
    container-type: inline-size;
}

/* Shell selection. Narrow rails such as the studio option bar cannot fit prose at any font size, so below the notice
   threshold only the badge shows and the body moves into the dialog. Width alone decides — height is not queried
   because these containers are scroll regions whose height says nothing about the room actually available. */
.shell-badge {
    display: flex;
}

.shell-notice,
.shell-card {
    display: none;
}

@container (min-width: 20rem) {
    .shell-badge {
        display: none;
    }

    .shell-notice {
        display: flex;
    }
}

@container (min-width: 28rem) {
    .shell-notice {
        display: none;
    }

    .shell-card {
        display: block;
    }
}

/* The dialog is opened from the badge, which sits inside a clipped, possibly transformed container. Rendering it in
   the top layer with 'showModal()' is what keeps it out of that stacking context, so it needs no z-index of its own. */
.detail-dialog {
    max-width: min(24rem, calc(100vw - 2rem));
    margin: auto;
    background: transparent;
    padding: 0;
    border: none;
}

.detail-dialog::backdrop {
    background: var(--overlay);
}
</style>
