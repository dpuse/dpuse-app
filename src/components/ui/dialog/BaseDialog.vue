<script setup lang="ts">
// ── External Dependencies & Registrations
import { useTemplateRef, watch } from 'vue';

// ── Local Components - Static
import Button from '@/components/ui/button/Button.vue';
import CloseButton from '@/components/ui/button/CloseButton.vue';

// ── Options, Props, Slots & Emits ────────────────────────────────────────────────────────────────────────────────────

const { title } = defineProps<{ title: string }>();
const emit = defineEmits<{ save: [] }>();

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

const dialog = useTemplateRef<HTMLDialogElement>('dialogReference');
const visibleValue = defineModel<boolean>();

// ── Side Effects ─────────────────────────────────────────────────────────────────────────────────────────────────────

watch(visibleValue, (newVisibleValue) => {
    if (!dialog.value) return;

    if (newVisibleValue === true && !dialog.value.open) {
        dialog.value.showModal();
    } else if (newVisibleValue !== true && dialog.value.open) {
        dialog.value.close();
    }
});

// ── Event Handlers ───────────────────────────────────────────────────────────────────────────────────────────────────

function handleClose(): void {
    visibleValue.value = false;
}

function handleSave(): void {
    emit('save');
}
</script>

<template>
    <dialog
        ref="dialogReference"
        :class="[
            'm-0 hidden size-full max-h-full max-w-full flex-col overflow-y-hidden bg-surface pt-[calc(env(safe-area-inset-top)+24px)] pr-[calc(env(safe-area-inset-right))] pb-5 pl-[calc(env(safe-area-inset-left))] open:flex',
            'md:m-auto md:size-fit md:max-h-[90vh] md:min-h-[90vh] md:max-w-[90vw] md:min-w-[90vw] md:rounded-lg md:border-boundary'
        ]"
        @close="handleClose"
        @cancel="handleClose"
    >
        <!-- Header -->
        <div class="flex flex-none items-center border-b border-separator px-6 pb-3">
            <div class="flex-1 text-xl">{{ title }}</div>
            <CloseButton class="flex-none" @click="handleClose" />
        </div>

        <!-- Body -->
        <slot />

        <!-- Footer -->
        <div class="flex flex-none justify-end gap-x-2 border-t border-separator px-6 pt-3">
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
