<script setup lang="ts">
// ── External Dependencies & Registrations
import { nextTick, useTemplateRef, watch } from 'vue';

// ── Local Framework
import type { AppFailure } from '@/state/errors';
import { t } from '@/state/locale';
import { reloadForFailures, waitForCloseAnimation } from '@/components/ui/error/errorNoticeSupport';

// ── Static Components
import CloseButton from '@/components/ui/action/CloseButton.vue';
import ErrorBody from '@/components/ui/error/ErrorBody.vue';

// ── Options, Props, Slots & Emits ────────────────────────────────────────────────────────────────────────────────────

// A failure that no region owns, so the space it has lost is the screen, and it is shown as a modal. A failure inside a
// region is 'ErrorNotice' instead. The modal is not the lock this app used to have, which was permanent, suppressed
// every dialog and had no way out. This one asks to be acknowledged once and closes.
//
// 'canRetry' is false where nothing local could be retried, and a fresh document is the only recovery there is.
//
// Several failures rather than one: losing the network fails every service the app loads independently, and one body
// listing them reads as the single thing that happened. Only 'App.vue', which holds every failure no region owned,
// passes more than one.
interface Properties {
    canRetry?: boolean;
    failures: AppFailure[];
    isDismissible?: boolean;
}
// eslint-disable-next-line @typescript-eslint/no-useless-default-assignment -- The default is not useless: an absent boolean prop is 'false' to Vue, and retrying is what every caller but 'App.vue' wants.
const { canRetry = true, failures, isDismissible } = defineProps<Properties>();
const emit = defineEmits<{ dismiss: []; retry: [] }>();

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

const TEXT = {
    'dismiss.aria': { en: 'Dismiss', es: 'Descartar' }
};

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

const dialog = useTemplateRef<HTMLDialogElement>('dialogReference');

// ── Side Effects ─────────────────────────────────────────────────────────────────────────────────────────────────────

// Opened by the failure rather than by a click. Watched rather than opened once on mount, so a second failure arriving
// after the first was dismissed opens it again.
watch(
    () => failures,
    async () => {
        if (failures.length === 0) return;
        await nextTick(); // The element is rendered by the same change that brings the failures, so it exists only after this.
        if (dialog.value?.open === true) return;
        dialog.value?.showModal();
        dialog.value?.focus();
    },
    { immediate: true }
);

// ── Event Handlers ───────────────────────────────────────────────────────────────────────────────────────────────────

function handleReload(): void {
    reloadForFailures(failures);
}

function handleRetry(): void {
    emit('retry');
}

// Reports the dismissal only once the fade-out has finished. The host removes this dialog as soon as it hears, which
// would otherwise take it off the screen halfway through.
async function handleClose(): Promise<void> {
    await waitForCloseAnimation(dialog.value);
    if (dialog.value?.open === true) return; // A new failure opened it again while it was fading out.
    emit('dismiss');
}
</script>

<template>
    <!-- The dialog focuses itself on open. Otherwise the browser focuses the first control, the trace toggle, and shows
         its keyboard focus ring before the user has pressed a key. Chrome ignores 'autofocus' on a dialog, so
         'tabindex="-1"' and a 'focus()' call do it instead. A set width rather than a maximum, so the panel does not
         change shape with whatever the failure says. 'min()' lets it give way on a narrow screen. -->
    <dialog
        ref="dialogReference"
        class="m-auto max-h-[calc(100dvh-4rem)] w-[min(65ch,calc(100vw-2rem))] dialog-fade rounded-lg bg-surface dialog-backdrop shadow-dialog outline-none"
        data-region="ErrorDialog"
        tabindex="-1"
        @close="handleClose"
    >
        <div class="relative">
            <ErrorBody :can-retry="canRetry" :failures="failures" @reload="handleReload" @retry="handleRetry" />
            <CloseButton v-if="isDismissible" :aria-label="t(TEXT, 'dismiss.aria')" class="absolute top-2 right-2" @click="dialog?.close()" />
        </div>
    </dialog>
</template>
