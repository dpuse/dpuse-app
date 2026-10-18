<script setup lang="ts">
// ── External Dependencies & Registrations
import { TriangleAlertIcon } from '@lucide/vue';
import { computed, ref, useTemplateRef } from 'vue';

// ── DPUse Framework
import { serialiseError } from '@dpuse/dpuse-shared';

// ── Local Framework
import type { AppFailure } from '@/state/errors';
import { t } from '@/state/locale';
import { reloadForFailures, waitForCloseAnimation } from '@/components/ui/error/errorNoticeSupport';

// ── Static Components
import CloseButton from '@/components/ui/action/CloseButton.vue';
import ErrorBody from '@/components/ui/error/ErrorBody.vue';

// ── Options, Props, Slots & Emits ────────────────────────────────────────────────────────────────────────────────────

// The surface for a failure inside a region. A failure no region owns takes the screen with 'ErrorDialog' instead. The
// presentation is decided by the width this component is given, not by the caller — panes are resized at runtime by
// 'PaneSplitter.vue', so a caller cannot know.
//
// 'canRetry' is false where nothing local could be retried. Everywhere else both recoveries are offered; see the note
// in 'ErrorBody'.
//
// A failure fills the space it owns, so the region reads as failed rather than as oddly empty. It grows in flow rather
// than being positioned, so no caller needs to be a containing block.
interface Properties {
    canRetry?: boolean;
    failures: AppFailure[];
}
// eslint-disable-next-line @typescript-eslint/no-useless-default-assignment -- The default is not useless: an absent boolean prop is 'false' to Vue, and retrying is what every caller but 'RetrievalGate' wants.
const { canRetry = true, failures } = defineProps<Properties>();
const emit = defineEmits<{ retry: [] }>();

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

const TEXT = {
    'detail.aria': { en: 'Show error details', es: 'Mostrar detalles del error' }
};

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

// ── Detail Dialog ─ Reachable from the badge, which has no room to show the body in place. The element itself always
// exists so its ref is available on the click that opens it; only its contents are conditional.
const detailDialog = useTemplateRef<HTMLDialogElement>('detailDialogReference');
const detailIsVisible = ref(false);

// ── Derived State ────────────────────────────────────────────────────────────────────────────────────────────────────

const mainSerialisedError = computed(() => serialiseError(failures[0].error)[0]);

// ── Event Handlers ───────────────────────────────────────────────────────────────────────────────────────────────────

function handleReload(): void {
    handleRequestCloseDetail();
    reloadForFailures(failures);
}

function handleRetry(): void {
    handleRequestCloseDetail();
    emit('retry');
}

// Clears the contents only once the fade-out has finished, so the card does not fade out empty.
async function handleCloseDetail(): Promise<void> {
    await waitForCloseAnimation(detailDialog.value);
    if (detailDialog.value?.open === true) return; // Opened again while it was fading out.
    detailIsVisible.value = false;
}

function handleRequestCloseDetail(): void {
    detailDialog.value?.close(); // Fires 'close', which clears the contents.
}

function handleShowDetail(): void {
    detailIsVisible.value = true;
    detailDialog.value?.showModal();
    detailDialog.value?.focus();
}
</script>

<template>
    <!-- Takes the height its host gives it, so the presentation inside has something to fill. A container, so the
         presentation is chosen by this element's width. -->
    <div class="@container flex min-h-0 flex-auto" data-region="ErrorNotice">
        <!-- Badge ─ Below 11rem, about 20 characters a line once the inset is taken, an error message stops being
             readable, so only the badge shows and the body moves to the dialog. Width alone decides, because these
             containers are scroll regions whose height says nothing about the room available. The badge fills the
             region with the same ground, inset and centring as the card, so the two read as one treatment at two
             widths. 'outline' rather than a ring for focus, because a ring is drawn outside the edge, where an
             ancestor's overflow would clip it. -->
        <button
            :aria-label="t(TEXT, 'detail.aria')"
            class="group flex min-h-40 flex-auto items-center-safe justify-center bg-warning p-4 text-warning-text hover:bg-warning-hover focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-warning-ring active:bg-warning-active @min-[11rem]:hidden"
            :title="mainSerialisedError.message"
            type="button"
            @click="handleShowDetail"
        >
            <!-- Laid out as the card body's own icon is, so the icon does not move as the region crosses the threshold.
                 It leans into the pointer because it is the only shape on screen, so it is what the eye checks. -->
            <span class="block w-full max-w-prose text-left">
                <TriangleAlertIcon class="size-8 transition-transform duration-150 group-hover:scale-108" stroke-width="1.3" />
            </span>
        </button>

        <!-- Card ─ Room for the whole body. The region scrolls, not the body, so a scrollbar does not read as part of
             the error text. 'safe' centring falls back to the top edge for a body that does not fit, where plain
             centring would push its top out of reach. -->
        <div class="hidden min-h-40 flex-auto items-center-safe justify-center overflow-y-auto bg-warning p-4 @min-[11rem]:flex">
            <ErrorBody class="w-full max-w-prose" :can-retry="canRetry" :failures="failures" is-embedded @reload="handleReload" @retry="handleRetry" />
        </div>

        <!-- Detail Dialog ─ Opened from the badge, which may sit in a clipped or transformed container. 'showModal()'
             renders it in the top layer, out of that stacking context, so it needs no z-index. It focuses itself on
             open so the browser does not show the trace toggle's focus ring before a key is pressed; Chrome ignores
             'autofocus' on a dialog. -->
        <dialog
            ref="detailDialogReference"
            class="m-auto w-[min(24rem,calc(100vw-2rem))] dialog-fade rounded-lg bg-surface dialog-backdrop shadow-dialog outline-none"
            tabindex="-1"
            @close="handleCloseDetail"
        >
            <!-- Closed from the corner, as 'Dialog' closes, rather than by a button under the body that read as
                 belonging to the page behind. -->
            <div v-if="detailIsVisible" class="relative">
                <ErrorBody can-cancel :can-retry="canRetry" :failures="failures" @cancel="handleRequestCloseDetail" @reload="handleReload" @retry="handleRetry" />
                <CloseButton class="absolute top-2 right-2" @click="handleRequestCloseDetail" />
            </div>
        </dialog>
    </div>
</template>
