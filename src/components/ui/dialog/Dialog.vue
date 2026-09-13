<script setup lang="ts">
// ── External Dependencies & Registrations
import { onMounted, useTemplateRef, watch } from 'vue';

// ── Local Framework

// ── Static Components
import CloseButton from '@/components/ui/action/CloseButton.vue';
import DialogHeader from '@/components/ui/dialog/DialogHeader.vue';

// ── Options, Props, Slots & Emits ────────────────────────────────────────────────────────────────────────────────────

// Sizing is declared by the caller rather than taken from the content, because the frame is rendered before the body's
// chunk has loaded and so has nothing to measure.
//   'full'      A set size, independent of content. The size itself is a parameter: the wide dialogs and the
//               near-fullscreen diagrams are the same mode with different numbers.
//   'reserved'  Starts at 'minHeight' and grows with its content — what a multi-step body needs.
//   'fit'       Sized entirely by content. Only safe for a body that is statically imported, since nothing else can
//               know the size before the chunk arrives.
//
// 'isOpen' is required rather than defaulting: a dialog that silently fails to open looks identical to a click that
// did nothing, so the caller has to say. URL-driven dialogs are mounted only while open and pass a literal true.
const {
    isOpen,
    maxWidth = '48rem',
    minHeight,
    sizing = 'full',
    title
} = defineProps<{ isOpen: boolean; maxWidth?: string; minHeight?: string; sizing?: 'fit' | 'full' | 'reserved'; title?: string }>();
const emit = defineEmits<{ close: [] }>();

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

const dialogElement = useTemplateRef<HTMLDialogElement>('dialogReference');

// ── Side Effects ─────────────────────────────────────────────────────────────────────────────────────────────────────

// 'showModal' is what promotes the element to the top layer, and with it comes Escape, focus containment, focus
// returned to whatever opened it, and the rest of the document marked inert. None of that is reimplemented here.
onMounted(() => {
    if (isOpen) dialogElement.value?.showModal();
});

watch(
    () => isOpen,
    (newIsOpen) => {
        if (newIsOpen) {
            dialogElement.value?.showModal();
        } else {
            dialogElement.value?.close();
        }
    }
);

// ── Event Handlers ───────────────────────────────────────────────────────────────────────────────────────────────────

// Fired by the close button, by Escape, and by 'close()'. What dismissal then means is the caller's: a URL-driven
// dialog clears its 'dlg' parameter through 'useDialogs', so the back button and the dialog agree on the app's state.
function handleClose(): void {
    emit('close');
}

function handleRequestClose(): void {
    dialogElement.value?.close(); // Fires 'close', so dismissal runs through one path however it was triggered.
}
</script>

<template>
    <dialog
        ref="dialogReference"
        :class="[
            'dialog-modal m-0 hidden size-full max-h-full max-w-full flex-col overflow-y-hidden bg-surface text-content open:flex',
            'pt-[calc(env(safe-area-inset-top))] pr-[calc(env(safe-area-inset-right))] pl-[calc(env(safe-area-inset-left))]',
            'md:mx-auto md:mt-6 md:mb-auto md:max-h-[calc(100%-48px)] md:rounded-lg',
            sizing === 'fit' ? 'md:w-auto md:max-w-(--dialog-modal-max-width)' : 'md:w-(--dialog-modal-max-width) md:max-w-[calc(100vw-2rem)]',
            sizing === 'full' ? '' : 'dialog-modal-content-height'
        ]"
        data-region="Dialog"
        :style="{ 'container-type': 'inline-size', '--dialog-modal-max-width': maxWidth, '--dialog-modal-min-height': minHeight ?? '0px' }"
        @cancel="handleClose"
        @close="handleClose"
    >
        <DialogHeader v-if="title" class="flex-none" :title="title" />

        <slot />

        <CloseButton class="absolute top-[calc(env(safe-area-inset-top)+12px)] right-(--safe-right-offset) md:top-3 md:right-3" @click="handleRequestClose" />
    </dialog>
</template>

<style scoped>
/* Only above 'md', where the panel is a floating box rather than the full screen. The minimum stops a 'reserved'
   dialog collapsing around its loading spinner and then jumping when the body arrives. It is not transitioned: the
   value never changes after mount, and the growth that does happen is carried by the body's own animation, which the
   frame follows because its height is content-driven. */
@media (min-width: 48rem) {
    /* The 'md:mt-6 md:mb-auto' pairing on the element pins the panel 24px from the top rather than centring it
       vertically. A dialog whose height changes — the sign-in flow moving between steps — would otherwise move both
       its edges and shift content under the cursor; anchored to the top, only the bottom edge travels. The auto
       bottom margin is what stops the UA's 'inset: 0' stretching it to fill instead. */

    /* 'full' keeps the height it inherits from 'size-full', capped by the max-height above: its bodies lay themselves
       out with 'flex-1', which collapses to nothing unless the frame has a real height to divide up. */
    .dialog-modal {
        min-height: var(--dialog-modal-min-height, 0);
    }

    /* 'fit-content', not 'auto'. A modal dialog is pinned by the UA stylesheet with 'inset: 0', so 'height: auto'
       means fill the viewport rather than fit the content — which is why the UA's own default is 'fit-content'.
       Stated here rather than as a utility because 'size-full' sets both dimensions and Tailwind emits it after the
       'md:' height variants, and because the lint rule rewrites any longhand split back to the shorthand. */
    .dialog-modal-content-height {
        height: fit-content;
    }
}

.dialog-modal {
    box-shadow:
        0 20px 50px rgb(0 0 0 / 0.25),
        0 2px 6px rgb(0 0 0 / 0.08);
    transform: scale(1);
    transition:
        opacity 0.15s ease-out,
        transform 0.15s ease-out,
        overlay 0.15s ease-out allow-discrete,
        display 0.15s ease-out allow-discrete;
}

@starting-style {
    .dialog-modal[open] {
        opacity: 0;
        transform: scale(0.96);
    }
}

.dialog-modal::backdrop {
    background: var(--overlay);
    opacity: 1;
    transition: opacity 0.15s ease-out allow-discrete;
}

@starting-style {
    .dialog-modal[open]::backdrop {
        opacity: 0;
    }
}

@media (prefers-reduced-motion: reduce) {
    .dialog-modal,
    .dialog-modal::backdrop {
        transition: none;
    }
}
</style>
