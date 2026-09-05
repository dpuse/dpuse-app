<script setup lang="ts">
// ── External Dependencies & Registrations
import { TriangleAlertIcon } from '@lucide/vue';
import { computed, nextTick, ref, useTemplateRef, watch } from 'vue';

// ── DPUse Framework
import { serialiseError } from '@dpuse/dpuse-shared/errors';

// ── Local Framework
import type { AppFailure } from '@/state/errors';
import { t } from '@/state/locale';

// ── Static Components
import CloseButton from '@/components/ui/button/CloseButton.vue';
import ErrorDetail from '@/components/ui/error/ErrorDetail.vue';

// ── Options, Props, Slots & Emits ────────────────────────────────────────────────────────────────────────────────────

// The single surface for a failure, wherever it happened. Within a region the shell is decided by the width this
// component is given, not by the caller — panes are resized at runtime by 'PaneSplitter.vue', so a caller cannot know.
//
// 'canRetry' is false where nothing local could be retried — a failure with no region of its own, where a fresh
// document is the only recovery there is. Everywhere else both recoveries are offered; see the note in 'ErrorDetail'.
//
// A failure fills the space it owns. 'coversRegion' says the region is that space — a panel that never loaded, a view
// that could not render — so it reads as failed rather than as oddly empty with a card in it. Opt-in, because plenty
// of failures cost only part of what a region does: a chat whose markdown formatter died still shows its messages, and
// covering it would claim more than went wrong. It asks nothing of the host, growing in flow rather than being
// positioned, so no caller needs to be a containing block.
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
    coversRegion?: boolean;
    failures: AppFailure[];
    isDismissible?: boolean;
    ownsScreen?: boolean;
}
// eslint-disable-next-line @typescript-eslint/no-useless-default-assignment -- The default is not useless: an absent boolean prop is 'false' to Vue, and retrying is what every caller but 'App.vue' wants.
const { canRetry = true, coversRegion, failures, isDismissible, ownsScreen } = defineProps<Properties>();
const emit = defineEmits<{ dismiss: []; retry: [] }>();

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

const T = {
    'detail.label.aria': { en: 'Show error details', es: 'Mostrar detalles del error' },
    'dismiss.label.aria': { en: 'Dismiss', es: 'Descartar' },
    'reload.label': { en: 'Reload', es: 'Recargar' },
    'retry.label': { en: 'Retry', es: 'Reintentar' }
};

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

// Detail dialog — reachable from the badge, which has no room to show the body in place. The element itself always
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
        if (!screenDialog.value?.open) screenDialog.value?.showModal();
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
}
</script>

<template>
    <div class="error-display" :class="[ownsScreen ? 'owns-screen' : 'is-region', { 'covers-region': coversRegion }]" data-region="ErrorDisplay">
        <!-- The region shells, and the dialog the badge opens. A screen-owning failure has no use for any of them: it
             has no region to measure, and shows its body in its own modal below. -->
        <template v-if="!ownsScreen">
            <!-- Badge - the container is too narrow for prose, so the body moves to a dialog. -->
            <button
                :aria-label="t(T, 'detail.label.aria')"
                class="shell-badge items-center justify-center rounded-md border border-warning-ring/20 bg-warning p-1.5 text-warning-text hover:bg-warning-hover focus-visible:ring-2 focus-visible:ring-warning-ring focus-visible:outline-none active:bg-warning-active"
                :title="mainSerialisedError.message"
                type="button"
                @click="handleShowDetail"
            >
                <span class="shell-badge-body"><TriangleAlertIcon class="size-5" stroke-width="1.3" /></span>
            </button>

            <!-- Card - room for the whole body. -->
            <div class="shell-card">
                <ErrorDetail class="mx-auto my-8 w-[calc(100%-2rem)] max-w-sm" :can-retry="canRetry" :failures="failures" @reload="handleReload" @retry="handleRetry" />
            </div>

            <dialog ref="detailDialogReference" class="detail-dialog" @cancel="handleCloseDetail" @close="handleCloseDetail">
                <!-- Closed from the corner rather than by a button under the body, which sat outside the panel and read
                     as belonging to the page behind it. Placed as 'DialogModal' places its own, so a dialog opened from
                     here is dismissed the same way as every other one. -->
                <div v-if="detailIsVisible" class="relative">
                    <ErrorDetail can-cancel :can-retry="canRetry" :failures="failures" @cancel="handleRequestCloseDetail" @reload="handleReload" @retry="handleRetry" />
                    <CloseButton class="absolute top-2 right-2" @click="handleRequestCloseDetail" />
                </div>
            </dialog>
        </template>

        <!-- Screen - a failure no region owns, so the space it has lost is the screen. Opened by the failure rather
             than by a click, and closed by the corner button: an acknowledgement, not the dead end this app used to
             show, which suppressed every dialog for the rest of the session and had no way out at all. -->
        <dialog v-else ref="screenDialogReference" class="screen-dialog" @cancel="emit('dismiss')" @close="emit('dismiss')">
            <div class="relative">
                <ErrorDetail :can-retry="canRetry" :failures="failures" @reload="handleReload" @retry="handleRetry" />
                <CloseButton v-if="isDismissible" :aria-label="t(T, 'dismiss.label.aria')" class="absolute top-2 right-2" @click="screenDialog?.close()" />
            </div>
        </dialog>
    </div>
</template>

<style scoped>
.error-display.is-region {
    container-type: inline-size;
}

/* Takes the height its host will give it, so the covering shell inside has something to fill. Harmless where the host
   offers none: the shell falls back to its own minimum. */
.error-display.is-region.covers-region {
    display: flex;
    flex: 1 1 auto;
    min-height: 0;
}

/* Shell selection. Narrow rails such as the studio option bar cannot fit prose at any font size, so below the
   threshold only the badge shows and the body moves into the dialog. Width alone decides — height is not queried
   because these containers are scroll regions whose height says nothing about the room actually available.

   One threshold, and set by what actually binds. The buttons wrap onto separate lines rather than squashing, so they
   stop being the constraint at about 8rem and the text becomes it instead: below roughly 20 characters a line — some
   11rem once the 16px inset either side is taken — an error message stops being readable at all, whatever it says.
   Panes are 'minWidth: 0', so a dragged splitter really does reach this band; below it the badge stands in, with the
   whole body one click away in its dialog.

*/
.is-region .shell-badge {
    display: flex;
}

/* A pass-through outside the covering case, where the badge is a chip and the icon is all there is to place. */
.shell-badge-body {
    display: contents;
}

/* Covering, the badge is the region rather than a chip inside it: same warning ground, same 16px inset, same centring
   as the body it stands in for, so the two read as one treatment at two widths. Its chip chrome goes for the same
   reason the body's does — there is nothing to draw a box around when the whole region is the error.

   Kept outside the width query below, since this is the shell that shows beneath it; above the threshold the badge is
   hidden and these have nothing to apply to. */
.is-region.covers-region .shell-badge {
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
   They are restated here because the flat background above outranks the utility classes on the element that carry them
   — a chip's worth of specificity against a shell's — so without these the covering badge is inert to the eye and only
   the cursor gives it away.

   'outline' rather than the utilities' ring: a ring is a box-shadow drawn outside the element's edge, and this one
   fills its region, so the shadow would be the first thing an ancestor's overflow clips. */
.is-region.covers-region .shell-badge:hover {
    background: var(--warning-hover);
}

.is-region.covers-region .shell-badge:active {
    background: var(--warning-active);
}

.is-region.covers-region .shell-badge:focus-visible {
    outline: 2px solid var(--warning-ring);
    outline-offset: -2px;
}

/* Laid out exactly as the body's own leading icon is: same size, same left edge, inside the same maximum width. The
   two shells are one treatment at two widths, so the icon must not move or change size as the region crosses the
   threshold — only what follows it disappears. */
.is-region.covers-region .shell-badge-body {
    display: block;
    width: 100%;
    max-width: 65ch;
    text-align: left;
}

.is-region.covers-region .shell-badge-body > svg {
    width: 2rem;
    height: 2rem;
    transition: transform 150ms;
}

/* The icon leans into the pointer. Small, but it is the only thing on screen with a shape, so it is what the eye
   checks when deciding whether the area under the cursor does anything. */
.is-region.covers-region .shell-badge:hover .shell-badge-body > svg {
    transform: scale(1.08);
}

.is-region .shell-card {
    display: none;
}

@container (min-width: 11rem) {
    .is-region .shell-badge {
        display: none;
    }

    .is-region .shell-card {
        display: block;
    }

    /* Fills the region rather than sitting in it, so the space the content would have occupied reads as failed rather
       than as oddly empty. Grows in flow instead of being positioned, which is what keeps it independent of the host:
       an absolutely positioned version would centre itself over the nearest positioned ancestor, and these callers
       sit in scroll areas, flex columns and detail slots that make no promise about being one.

       Kept inside this query so it cannot outrank the badge: below this width there is no room to centre a body in,
       and the badge stands in for it.

       Scrolling belongs to the region, not to the body inside it — a scrollbar hugging the card reads as part of the
       error text rather than as the region having more to show. Centred with 'safe', which is what lets centring and
       scrolling coexist: it centres a body that fits and falls back to the start edge for one that does not, where
       plain centring would push the top out of reach above this container's start edge. */
    .is-region.covers-region .shell-card {
        display: flex;
        flex: 1 1 auto;
        align-items: safe center;
        justify-content: center;
        min-height: 10rem;
        overflow-y: auto;
        padding: 1rem;
        background: var(--warning);
    }

    /* Its own width and padding give way to the box above, which is then the only thing setting the inset — the body
       carries its own card padding for when it is a card, and left alone the two would compound to twice the gap. The
       maximum matches Tailwind's 'max-w-prose': past about 65 characters the eye loses the line it is returning to,
       and an error message is read once, carefully, by someone who did not plan to be reading it.

       The chrome goes with them: the body is already standing on the warning ground, so a bordered, rounded card of
       the same colour would only draw a box around the middle of a region that is uniformly in error. */
    .is-region.covers-region .shell-card > * {
        width: 100%;
        max-width: 65ch;
        margin: 0;
    }

    /* Reached by name rather than as a child, because the placement box now sits between this and the card. */
    .is-region.covers-region [data-region='ErrorDetail'] {
        padding: 0;
        border: none;
        border-radius: 0;
        background: none;
    }
}

/* Nothing of its own is laid out: the screen-owning placement is entirely the modal below, which the browser renders
   in the top layer. */
.error-display.owns-screen {
    display: contents;
}

/* Sized like the detail dialog but allowed the wider prose measure, since this one is the whole account of what the
   app has lost rather than a narrow rail's overflow. */
.screen-dialog {
    max-width: min(65ch, calc(100vw - 2rem));
    max-height: calc(100dvh - 4rem);
    margin: auto;
    background: transparent;
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
