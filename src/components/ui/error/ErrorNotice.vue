<script setup lang="ts">
// ── External Dependencies & Registrations
import { TriangleAlertIcon } from '@lucide/vue';
import { computed, nextTick, ref, useTemplateRef, watch } from 'vue';

// ── DPUse Framework
import { serialiseError } from '@dpuse/dpuse-shared';

// ── Local Framework
import type { AppFailure } from '@/state/errors';
import { t } from '@/state/locale';

// ── Static Components
import CloseButton from '@/components/ui/action/CloseButton.vue';
import ErrorBody from '@/components/ui/error/ErrorBody.vue';

// ── Options, Props, Slots & Emits ────────────────────────────────────────────────────────────────────────────────────

// The single surface for a failure, wherever it happened. Within a region the presentation is decided by the width
// this component is given, not by the caller — panes are resized at runtime by 'PaneSplitter.vue', so a caller cannot know.
//
// 'canRetry' is false where nothing local could be retried — a failure with no region of its own, where a fresh
// document is the only recovery there is. Everywhere else both recoveries are offered; see the note in 'ErrorBody'.
//
// A failure fills the space it owns. Within a region it covers the whole region, so the region reads as failed rather
// than as oddly empty. It grows in flow rather than being positioned, so no caller needs to be a containing block.
//
// 'ownsScreen' is the same rule one level up, for a failure no region owns at all: its space is the screen, so it is
// shown as a modal. That is not the lock this app used to have — that was permanent, suppressed every dialog, and had
// no way out. This asks to be acknowledged once and closes.
//
// Several failures rather than one: losing the network fails every service the app loads independently, and one body
// listing them reads as the single thing that happened. A region passes a list of one; only 'App.vue', which holds
// every failure no region owned, passes more.
interface Properties {
    canRetry?: boolean;
    failures: AppFailure[];
    isDismissible?: boolean;
    ownsScreen?: boolean;
}
// eslint-disable-next-line @typescript-eslint/no-useless-default-assignment -- The default is not useless: an absent boolean prop is 'false' to Vue, and retrying is what every caller but 'App.vue' wants.
const { canRetry = true, failures, isDismissible, ownsScreen } = defineProps<Properties>();
const emit = defineEmits<{ dismiss: []; retry: [] }>();

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

const TEXT = {
    'detail.aria': { en: 'Show error details', es: 'Mostrar detalles del error' },
    'dismiss.aria': { en: 'Dismiss', es: 'Descartar' },
    'reload.label': { en: 'Reload', es: 'Recargar' },
    'retry.label': { en: 'Retry', es: 'Reintentar' }
};

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

// ── Detail Dialog ─ Reachable from the badge, which has no room to show the body in place. The element itself always
// exists so its ref is available on the click that opens it; only its contents are conditional.
const detailDialog = useTemplateRef<HTMLDialogElement>('detailDialogReference');
const detailIsVisible = ref(false);

// Screen-owning modal — the same element, opened by the failure rather than by a click. Watched rather than opened
// once on mount, so a second failure arriving after the first was dismissed opens it again.
const screenDialog = useTemplateRef<HTMLDialogElement>('screenDialogReference');

// ── Derived State ────────────────────────────────────────────────────────────────────────────────────────────────────

const mainSerialisedError = computed(() => serialiseError(failures[0].error)[0]);

// The first destination recorded by any of them. Only a failed navigation sets one, and there is only ever one of
// those on screen, so 'first' is not a choice between rivals.
const reloadPath = computed(() => failures.find((failure) => failure.reloadPath != null)?.reloadPath);

// ── Side Effects ─────────────────────────────────────────────────────────────────────────────────────────────────────

watch(
    () => failures,
    async () => {
        if (!ownsScreen || failures.length === 0) return;
        await nextTick(); // The element is rendered by the same change that brings the failures, so it exists only after this.
        if (screenDialog.value?.open === true) return;
        screenDialog.value?.showModal();
        screenDialog.value?.focus();
    },
    { immediate: true }
);

// ── Event Handlers ───────────────────────────────────────────────────────────────────────────────────────────────────

// Both fetch the document again, which is what picks up the new deployment's chunk names. 'assign' is used when the
// failure recorded where the user was heading, so the reload finishes that journey rather than fetching the page in
// place — a route that cannot fetch its chunk leaves the URL on the screen the user was leaving.
function handleReload(): void {
    handleRequestCloseDetail();
    if (reloadPath.value == null) {
        location.reload();
        return;
    }
    location.assign(reloadPath.value);
}

function handleRetry(): void {
    handleRequestCloseDetail();
    emit('retry');
}

function handleCloseDetail(): void {
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
    <div class="error-notice" :class="ownsScreen ? 'owns-screen' : 'is-region'" data-region="ErrorNotice">
        <!-- Both dialogs focus themselves on open. Otherwise the browser focuses the first control, the trace toggle,
             and shows its keyboard focus ring before the user has pressed a key. Chrome ignores 'autofocus' on a
             dialog, so 'tabindex="-1"' and a 'focus()' call do it instead. Tabbing still shows each control's ring. -->

        <!-- The region's presentations, and the dialog the badge opens. A screen-owning failure has no use for any of them: it
             has no region to measure, and shows its body in its own modal below. -->
        <template v-if="!ownsScreen">
            <!-- Badge ─ The container is too narrow for prose, so the body moves to a dialog. -->
            <button :aria-label="t(TEXT, 'detail.aria')" class="notice-badge text-warning-text" :title="mainSerialisedError.message" type="button" @click="handleShowDetail">
                <span class="notice-badge-body"><TriangleAlertIcon stroke-width="1.3" /></span>
            </button>

            <!-- Card ─ Room for the whole body. -->
            <div class="notice-card">
                <ErrorBody :can-retry="canRetry" :failures="failures" @reload="handleReload" @retry="handleRetry" />
            </div>

            <dialog ref="detailDialogReference" class="detail-dialog outline-none" tabindex="-1" @cancel="handleCloseDetail" @close="handleCloseDetail">
                <!-- Closed from the corner rather than by a button under the body, which sat outside the panel and read
                     as belonging to the page behind it. Placed as 'Dialog' places its own, so a dialog opened from
                     here is dismissed the same way as every other one. -->
                <div v-if="detailIsVisible" class="relative">
                    <ErrorBody can-cancel :can-retry="canRetry" :failures="failures" @cancel="handleRequestCloseDetail" @reload="handleReload" @retry="handleRetry" />
                    <CloseButton class="absolute top-2 right-2" @click="handleRequestCloseDetail" />
                </div>
            </dialog>
        </template>

        <!-- Screen ─ A failure no region owns, so the space it has lost is the screen. Opened by the failure rather
             than by a click, and closed by the corner button: an acknowledgement, not the dead end this app used to
             show, which suppressed every dialog for the rest of the session and had no way out at all. -->
        <dialog v-else ref="screenDialogReference" class="screen-dialog outline-none" tabindex="-1" @cancel="emit('dismiss')" @close="emit('dismiss')">
            <div class="relative">
                <ErrorBody :can-retry="canRetry" :failures="failures" @reload="handleReload" @retry="handleRetry" />
                <CloseButton v-if="isDismissible" :aria-label="t(TEXT, 'dismiss.aria')" class="absolute top-2 right-2" @click="screenDialog?.close()" />
            </div>
        </dialog>
    </div>
</template>

<style scoped>
/* Takes the height its host will give it, so the presentation inside has something to fill. Harmless where the host
   offers none: the presentation falls back to its own minimum. */
.error-notice.is-region {
    display: flex;
    flex: 1 1 auto;
    min-height: 0;
    container-type: inline-size;
}

/* Presentation selection. Narrow rails such as the studio option bar cannot fit prose at any font size, so below the
   threshold only the badge shows and the body moves into the dialog. Width alone decides — height is not queried
   because these containers are scroll regions whose height says nothing about the room actually available.

   One threshold, and set by what actually binds. The buttons wrap onto separate lines rather than squashing, so they
   stop being the constraint at about 8rem and the text becomes it instead: below roughly 20 characters a line — some
   11rem once the 16px inset either side is taken — an error message stops being readable at all, whatever it says.
   Panes are 'minWidth: 0', so a dragged splitter really does reach this band; below it the badge stands in, with the
   whole body one click away in its dialog.

   The badge is the whole region: same warning ground, same 16px inset and same centring as the body it stands in for,
   so the two read as one treatment at two widths. */
.is-region .notice-badge {
    display: flex;
    flex: 1 1 auto;
    align-items: safe center;
    justify-content: center;
    min-height: 10rem;
    padding: 1rem;
    border: none;
    border-radius: 0;
    background: var(--warning);
    cursor: pointer;
}

/* The three signals that this whole region is a target, rather than a coloured area that happens to contain an icon.

   'outline' rather than a ring: a ring is a box-shadow drawn outside the element's edge, and this one fills its region,
   so the shadow would be the first thing an ancestor's overflow clips. */
.is-region .notice-badge:hover {
    background: var(--warning-hover);
}

.is-region .notice-badge:active {
    background: var(--warning-active);
}

.is-region .notice-badge:focus-visible {
    outline: 2px solid var(--warning-ring);
    outline-offset: -2px;
}

/* Laid out exactly as the body's own leading icon is: same size, same left edge, inside the same maximum width. The
   two presentations are one treatment at two widths, so the icon must not move or change size as the region crosses
   the threshold — only what follows it disappears. */
.is-region .notice-badge-body {
    display: block;
    width: 100%;
    max-width: 65ch;
    text-align: left;
}

.is-region .notice-badge-body > svg {
    width: 2rem;
    height: 2rem;
    transition: transform 150ms;
}

/* The icon leans into the pointer. Small, but it is the only thing on screen with a shape, so it is what the eye
   checks when deciding whether the area under the cursor does anything. */
.is-region .notice-badge:hover .notice-badge-body > svg {
    transform: scale(1.08);
}

.is-region .notice-card {
    display: none;
}

@container (min-width: 11rem) {
    .is-region .notice-badge {
        display: none;
    }

    /* Fills the region rather than sitting in it, so the space the content would have occupied reads as failed rather
       than as oddly empty. Grows in flow instead of being positioned, which is what keeps it independent of the host:
       an absolutely positioned version would centre itself over the nearest positioned ancestor, and these callers
       sit in scroll areas, flex columns and detail slots that make no promise about being one.

       Scrolling belongs to the region, not to the body inside it — a scrollbar hugging the body reads as part of the
       error text rather than as the region having more to show. Centred with 'safe', which is what lets centring and
       scrolling coexist: it centres a body that fits and falls back to the start edge for one that does not, where
       plain centring would push the top out of reach above this container's start edge. */
    .is-region .notice-card {
        display: flex;
        flex: 1 1 auto;
        align-items: safe center;
        justify-content: center;
        min-height: 10rem;
        overflow-y: auto;
        padding: 1rem;
        background: var(--warning);
    }

    /* The maximum matches Tailwind's 'max-w-prose': past about 65 characters the eye loses the line it is returning
       to, and an error message is read once, carefully, by someone who did not plan to be reading it. */
    .is-region .notice-card > * {
        width: 100%;
        max-width: 65ch;
        margin: 0;
    }

    /* 'ErrorBody' carries its own card padding, border and background for when it stands alone in a dialog. Here it
       stands on the region's warning ground, so they would only draw a box inside a region that is uniformly in error
       and double the inset. */
    .is-region [data-region='ErrorBody'] {
        padding: 0;
        border: none;
        border-radius: 0;
        background: none;
    }
}

/* Nothing of its own is laid out: the screen-owning placement is entirely the modal below, which the browser renders
   in the top layer. */
.error-notice.owns-screen {
    display: contents;
}

/* Sized like the detail dialog but allowed the wider prose measure, since this one is the whole account of what the
   app has lost rather than a narrow rail's overflow.

   A set width rather than a maximum, so the panel stands still: the UA sizes a dialog to 'fit-content', which had it
   growing and shrinking with whatever the failure happened to say, and a box that changes shape per message reads as
   part of the error. The 'min()' is what keeps the floor from becoming an overflow — below the measure there is no
   room to hold, so it gives way to the width actually available. */
.screen-dialog {
    width: min(65ch, calc(100vw - 2rem));
    max-height: calc(100dvh - 4rem);
    margin: auto;
    padding: 0;
    border: none;
}

.screen-dialog::backdrop {
    background: var(--overlay);
}

/* The dialog is opened from the badge, which may sit inside a clipped, possibly transformed container. Rendering it
   in the top layer with 'showModal()' is what keeps it out of that stacking context, so it needs no z-index of its
   own. */
.detail-dialog {
    width: min(24rem, calc(100vw - 2rem));
    margin: auto;
    padding: 0;
    border: none;
}

.detail-dialog::backdrop {
    background: var(--overlay);
}

/* Both dialogs float over the scrim, and in dark mode the warning ground on 'ErrorBody' is a 10% tint rather than a
   solid colour. A solid surface underneath is what keeps the scrim and the page from showing through the card. The
   radius matches the card's 'rounded-lg', and the shadow matches 'Dialog'. */
.screen-dialog,
.detail-dialog {
    border-radius: 0.5rem;
    background: var(--surface);
    box-shadow:
        0 20px 50px rgb(0 0 0 / 0.25),
        0 2px 6px rgb(0 0 0 / 0.08);
}
</style>
