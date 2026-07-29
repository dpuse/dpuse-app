<script setup lang="ts">
// ── External Dependencies & Registrations
import { useTemplateRef, watch } from 'vue';

// ── Local Components - Static
import Button from '@/components/ui/button/Button.vue';
import CloseButton from '@/components/ui/button/CloseButton.vue';

// ── Options, Properties, Model Value, Slots & Emits ──────────────────────────────────────────────────────────────────

const { title } = defineProps<{ title: string }>();
const modelValue = defineModel<boolean>();
const emit = defineEmits<{ save: [] }>();

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

const dialog = useTemplateRef<HTMLDialogElement>('dialogReference');

// ── Side Effects ─────────────────────────────────────────────────────────────────────────────────────────────────────

watch(modelValue, (newModelValue) => {
    if (!dialog.value) return;

    if (newModelValue === true && !dialog.value.open) {
        dialog.value.showModal();
    } else if (newModelValue !== true && dialog.value.open) {
        dialog.value.close();
    }
});

// ── Event Handlers ───────────────────────────────────────────────────────────────────────────────────────────────────

function handleClose(): void {
    modelValue.value = false;
}

function handleSave(): void {
    emit('save');
}
</script>

<template>
    <dialog
        ref="dialogReference"
        class="m-0 hidden size-full max-h-full max-w-none flex-col overflow-y-hidden bg-surface pt-[calc(env(safe-area-inset-top)+24px)] pr-[calc(env(safe-area-inset-right))] pb-5 pl-[calc(env(safe-area-inset-left))] open:flex md:m-auto md:max-h-[85vh] md:w-fit md:rounded-lg md:border-boundary"
        @close="handleClose"
        @cancel="handleClose"
    >
        <!-- Header -->
        <div class="mx-6 flex flex-none items-center border-b border-separator pb-3">
            <div class="flex-1 text-xl">{{ title }}</div>
            <CloseButton class="flex-none" @click="handleClose" />
        </div>

        <!-- Body -->
        <slot />

        <!-- Footer -->
        <div class="mx-6 flex flex-none justify-end gap-x-2 border-t border-separator pt-3">
            <Button variant="outline" @click="handleClose">Cancel</Button>
            <Button variant="primary" @click="handleSave">Save</Button>
        </div>
    </dialog>
</template>

<style scoped>
dialog {
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
    dialog[open] {
        opacity: 0;
        transform: scale(0.96);
    }
}

dialog::backdrop {
    background: var(--overlay);
    opacity: 1;
    transition: opacity 0.15s ease-out allow-discrete;
}

@starting-style {
    dialog[open]::backdrop {
        opacity: 0;
    }
}
</style>
