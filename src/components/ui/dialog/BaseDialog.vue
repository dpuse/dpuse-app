<script setup lang="ts">
import { ref, watch } from 'vue';

import Button from '@/components/ui/button/Button.vue';
import CloseButton from '@/components/ui/button/CloseButton.vue';

const { modelValue, title } = defineProps<{ modelValue: boolean; title: string }>();

const emit = defineEmits<{ 'update:modelValue': [boolean]; save: [] }>();

const dialog = ref<HTMLDialogElement>();

watch(
    () => modelValue,
    (open) => {
        if (!dialog.value) return;

        if (open && !dialog.value.open) {
            dialog.value.showModal();
        } else if (!open && dialog.value.open) {
            dialog.value.close();
        }
    }
);

function close(): void {
    emit('update:modelValue', false);
}

function save(): void {
    emit('save');
}
</script>

<template>
    <dialog
        ref="dialog"
        class="m-0 hidden size-full max-h-full max-w-none flex-col overflow-y-hidden bg-surface pt-[calc(env(safe-area-inset-top)+24px)] pr-[calc(env(safe-area-inset-right))] pb-6 pl-[calc(env(safe-area-inset-left))] open:flex md:m-auto md:max-h-[85vh] md:w-fit md:rounded-lg md:border-boundary"
        @close="close"
        @cancel="close"
    >
        <!-- Header -->
        <div class="mx-6 flex flex-none items-center border-b border-separator pb-3">
            <div class="flex-1 text-xl">{{ title }}</div>
            <CloseButton class="flex-none" @click="close" />
        </div>

        <!-- Body -->
        <div class="mx-6 flex min-h-0 flex-1 flex-col gap-y-4 overflow-x-hidden overflow-y-auto overscroll-y-none py-4">
            <slot />
        </div>

        <!-- Footer -->
        <div class="mx-6 flex flex-none justify-end gap-x-2 border-t border-separator pt-4">
            <Button variant="outline" @click="close">Cancel</Button>
            <Button variant="primary" @click="save">Save</Button>
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
