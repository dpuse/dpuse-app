<script setup lang="ts">
// ── Local Framework
import { t } from '@/state/locale';
import { TEXT } from './ConfirmDialog_.json';

// ── Static Components
import Dialog from '@/components/ui/dialog/Dialog.vue';
import RectangleButton from '@/components/ui/action/RectangleButton.vue';

// ── Options, Props, Slots & Emits ────────────────────────────────────────────────────────────────────────────────────

// For an action that cannot be undone, so the confirm button is always the destructive one. Opening and closing are the
// caller's, which pairs with VueUse's 'useConfirmDialog': 'isRevealed' in, 'confirm' and 'cancel' out.
const { confirmLabel, isOpen, message, title } = defineProps<{ confirmLabel: string; isOpen: boolean; message: string; title: string }>();
const emit = defineEmits<{ cancel: []; confirm: [] }>();

// ── Event Handlers ───────────────────────────────────────────────────────────────────────────────────────────────────

function handleCancel(): void {
    emit('cancel');
}

// The frame also reports a close when the caller shuts it after a choice; only a close while still open, by Escape or
// the close button, is the user backing out.
function handleClose(): void {
    if (isOpen) emit('cancel');
}

function handleConfirm(): void {
    emit('confirm');
}
</script>

<template>
    <Dialog :is-open="isOpen" max-width="28rem" sizing="fit" :title="title" @close="handleClose">
        <p class="p-4">{{ message }}</p>

        <!-- Cancel comes first so it, not the destructive button, takes focus when the dialog opens. -->
        <div class="flex justify-end gap-x-2 px-4 pb-4">
            <RectangleButton @click="handleCancel">{{ t(TEXT, 'cancel.label') }}</RectangleButton>
            <RectangleButton variant="destructive" @click="handleConfirm">{{ confirmLabel }}</RectangleButton>
        </div>
    </Dialog>
</template>
