<script setup lang="ts">
// ── External Dependencies & Registrations
import { onMounted, useTemplateRef, watch } from 'vue';

// ── Options, Props, Slots & Emits ────────────────────────────────────────────────────────────────────────────────────

// The behaviour every modal dialog shares, with none of its look. 'Dialog' (content) and 'ConfirmDialog' (a question)
// build on it and pass their own classes, style and role, which land on the element by attribute fallthrough.
//
// 'isOpen' is required rather than defaulting: a dialog that silently fails to open looks identical to a click that
// did nothing, so the caller has to say.
const { isOpen } = defineProps<{ isOpen: boolean }>();
const emit = defineEmits<{ close: [] }>();
defineSlots<{ default: () => unknown }>();
defineExpose({ requestClose });

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

// Fired by Escape, by 'requestClose', and by 'close()'. What dismissal then means is the caller's: a URL-driven dialog
// clears its 'dlg' parameter through 'useDialogs', so the back button and the dialog agree on the app's state.
function handleClose(): void {
    emit('close');
}

// ── Actions ──────────────────────────────────────────────────────────────────────────────────────────────────────────

// Exposed for a variant's own close button. Closing the element fires 'close', so dismissal runs through one path
// however it was triggered.
function requestClose(): void {
    dialogElement.value?.close();
}
</script>

<template>
    <dialog ref="dialogReference" @cancel="handleClose" @close="handleClose">
        <slot />
    </dialog>
</template>
