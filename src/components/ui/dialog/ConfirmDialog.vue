<script setup lang="ts">
// ── External Dependencies & Registrations
import { useId } from 'vue';

// ── Local Framework
import { t } from '@/state/locale';
import { TEXT } from './ConfirmDialog_.json';

// ── Static Components
import DialogBase from '@/components/ui/dialog/DialogBase.vue';
import DialogHeader from '@/components/ui/dialog/DialogHeader.vue';
import RectangleButton from '@/components/ui/action/RectangleButton.vue';

// ── Options, Props, Slots & Emits ────────────────────────────────────────────────────────────────────────────────────

// A dialog that asks a question, so its labelled buttons are the only way to answer: a close button would not say
// whether it means yes or no. Escape means Cancel. On a small screen it is a sheet at the bottom, within reach of the
// thumb and with the page still visible above it. From 'md' up it is a small box in the middle of the screen.
//
// For an action that cannot be undone, so the confirm button is always the destructive one. Opening and closing are the
// caller's, which pairs with VueUse's 'useConfirmDialog': 'isRevealed' in, 'confirm' and 'cancel' out.
const { confirmLabel, isOpen, message, title } = defineProps<{ confirmLabel: string; isOpen: boolean; message: string; title: string }>();
const emit = defineEmits<{ cancel: []; confirm: [] }>();

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

const idPrefix = useId(); // Keeps the title and message ids unique on the page, for 'aria-labelledby' and 'aria-describedby'.

// ── Event Handlers ───────────────────────────────────────────────────────────────────────────────────────────────────

function handleCancel(): void {
    emit('cancel');
}

// The frame also reports a close when the caller shuts it after a choice. Only a close while still open, by Escape, is
// the user backing out.
function handleClose(): void {
    if (isOpen) emit('cancel');
}

function handleConfirm(): void {
    emit('confirm');
}
</script>

<template>
    <!-- 'alertdialog' tells assistive technology that this interrupts to ask for a decision, and reads the message with
         the title. Below 'md' it is a sheet that slides up from the bottom edge; from 'md' up it fades and scales as
         'Dialog' does. -->
    <DialogBase
        :aria-describedby="`${idPrefix}-message`"
        :aria-labelledby="`${idPrefix}-title`"
        class="fixed inset-x-0 top-auto bottom-0 m-0 hidden max-h-[80dvh] w-full max-w-none flex-col rounded-t-2xl border-x-0 border-t border-b-0 border-separator bg-surface p-0 text-content dialog-backdrop open:flex max-md:dialog-sheet md:inset-0 md:m-auto md:h-fit md:w-md md:max-w-[calc(100vw-2rem)] md:dialog-fade md:rounded-lg md:border md:shadow-dialog"
        data-region="ConfirmDialog"
        :is-open="isOpen"
        role="alertdialog"
        @close="handleClose"
    >
        <DialogHeader :id="`${idPrefix}-title`" class="flex-none" :title="title" />
        <p :id="`${idPrefix}-message`" class="p-4">{{ message }}</p>

        <!-- Cancel comes first so it, not the destructive button, takes focus when the dialog opens. The bottom padding
             clears the home indicator on phones, where the sheet sits against the bottom edge. -->
        <div class="flex justify-end gap-x-2 px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] md:pb-4">
            <RectangleButton @click="handleCancel">{{ t(TEXT, 'cancel.label') }}</RectangleButton>
            <RectangleButton variant="destructive" @click="handleConfirm">{{ confirmLabel }}</RectangleButton>
        </div>
    </DialogBase>
</template>
