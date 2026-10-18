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
    <!-- From 'md' up the panel is a floating box. 'md:mt-6 md:mb-auto' pins it 24px from the top rather than centring
         it, so a dialog whose height changes, such as the sign-in flow moving between steps, moves only its bottom edge
         and does not shift content under the cursor. The minimum height stops a 'reserved' dialog collapsing around its
         loading spinner and jumping when the body arrives. 'full' keeps the height of 'size-full', because its bodies
         lay themselves out with 'flex-1', which needs a real height to divide up. 'reserved' fits its content with
         'h-fit' rather than 'h-auto': the UA pins a modal dialog with 'inset: 0', so 'auto' would fill the viewport. -->
    <DialogBase
        ref="dialogBaseReference"
        :class="[
            'hidden dialog-fade flex-col overflow-y-hidden bg-surface text-content dialog-backdrop shadow-dialog open:flex',
            'm-0 size-full max-h-full max-w-full',
            'pt-[calc(env(safe-area-inset-top))] pr-[calc(env(safe-area-inset-right))] pl-[calc(env(safe-area-inset-left))]',
            'md:mx-auto md:mt-6 md:mb-auto md:max-h-[calc(100%-48px)] md:min-h-(--dialog-modal-min-height) md:w-(--dialog-modal-max-width) md:max-w-[calc(100vw-2rem)] md:rounded-lg',
            sizing === 'full' ? '' : 'md:h-fit'
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
