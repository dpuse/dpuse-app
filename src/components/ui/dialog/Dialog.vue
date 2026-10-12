<script setup lang="ts">
// ── External Dependencies & Registrations
import { useTemplateRef } from 'vue';

// ── Static Components
import CloseButton from '@/components/ui/action/CloseButton.vue';
import DialogBase from '@/components/ui/dialog/DialogBase.vue';
import DialogHeader from '@/components/ui/dialog/DialogHeader.vue';

// ── Options, Props, Slots & Emits ────────────────────────────────────────────────────────────────────────────────────

// A dialog that shows content, closed with its ✕ or Escape. A dialog that asks a question is 'ConfirmDialog' instead.
//
// Sizing is declared by the caller rather than taken from the content, because the frame is rendered before the body's
// chunk has loaded and so has nothing to measure.
//   'full'      A set size, independent of content. The size itself is a parameter: the wide dialogs and the
//               near-fullscreen diagrams are the same mode with different numbers.
//   'reserved'  Starts at 'minHeight' and grows with its content — what a multi-step body needs.
// Below 'md' both modes take the whole screen.
//
// URL-driven dialogs are mounted only while open and pass a literal true for 'isOpen'.
const {
    isOpen,
    maxWidth = '48rem',
    minHeight,
    sizing = 'full',
    title
} = defineProps<{ isOpen: boolean; maxWidth?: string; minHeight?: string; sizing?: 'full' | 'reserved'; title?: string }>();
const emit = defineEmits<{ close: [] }>();
defineSlots<{ default: () => unknown }>();

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

const dialogBase = useTemplateRef<InstanceType<typeof DialogBase>>('dialogBaseReference');

// ── Event Handlers ───────────────────────────────────────────────────────────────────────────────────────────────────

function handleClose(): void {
    emit('close');
}

function handleRequestClose(): void {
    dialogBase.value?.requestClose();
}
</script>

<template>
    <DialogBase
        ref="dialogBaseReference"
        :class="[
            'dialog-modal hidden flex-col overflow-y-hidden bg-surface text-content open:flex',
            'm-0 size-full max-h-full max-w-full',
            'pt-[calc(env(safe-area-inset-top))] pr-[calc(env(safe-area-inset-right))] pl-[calc(env(safe-area-inset-left))]',
            'md:mx-auto md:mt-6 md:mb-auto md:max-h-[calc(100%-48px)] md:w-(--dialog-modal-max-width) md:max-w-[calc(100vw-2rem)] md:rounded-lg',
            sizing === 'full' ? '' : 'dialog-modal-content-height'
        ]"
        data-region="Dialog"
        :is-open="isOpen"
        :style="{ 'container-type': 'inline-size', '--dialog-modal-max-width': maxWidth, '--dialog-modal-min-height': minHeight ?? '0px' }"
        @close="handleClose"
    >
        <DialogHeader v-if="title" class="flex-none" :title="title" />

        <slot />

        <CloseButton class="absolute top-[calc(env(safe-area-inset-top)+12px)] right-(--safe-right-offset) md:top-3 md:right-3" @click="handleRequestClose" />
    </DialogBase>
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

/* The closed state is stated as well as the open one, so closing plays the opening in reverse. Without it the dialog and
   its backdrop stay fully visible for the length of the transition and then vanish together, which reads as a flash.
   'overlay' and 'display' keep the element in the top layer while it animates out. */
.dialog-modal {
    box-shadow:
        0 20px 50px rgb(0 0 0 / 0.25),
        0 2px 6px rgb(0 0 0 / 0.08);
    opacity: 0;
    transform: scale(0.96);
    transition:
        opacity 0.15s ease-out,
        transform 0.15s ease-out,
        overlay 0.15s ease-out allow-discrete,
        display 0.15s ease-out allow-discrete;
}

.dialog-modal[open] {
    opacity: 1;
    transform: scale(1);
}

@starting-style {
    .dialog-modal[open] {
        opacity: 0;
        transform: scale(0.96);
    }
}

.dialog-modal::backdrop {
    background: var(--overlay);
    opacity: 0;
    transition:
        opacity 0.15s ease-out,
        overlay 0.15s ease-out allow-discrete,
        display 0.15s ease-out allow-discrete;
}

.dialog-modal[open]::backdrop {
    opacity: 1;
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
