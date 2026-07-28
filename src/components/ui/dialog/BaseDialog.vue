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
    <dialog ref="dialog" class="m-auto max-h-[calc(100vh-32px)] rounded-none border-boundary bg-surface px-6 py-4 text-content sm:rounded-lg" @close="close" @cancel="close">
        <div class="flex flex-col">
            <!-- Header -->
            <div class="flex flex-none items-center border-b border-separator pb-3">
                <div class="flex-1 text-2xl">{{ title }}</div>
                <CloseButton class="flex-none" @click="close" />
            </div>

            <!-- Body -->
            <div class="flex flex-1 flex-col gap-y-3 py-3">
                <slot />
            </div>

            <!-- Footer -->
            <div class="mt-2 flex flex-none justify-end gap-x-2">
                <Button variant="outline" @click="close">Cancel</Button>
                <Button variant="primary" @click="save">Save</Button>
            </div>
        </div>
    </dialog>
</template>

<style scoped>
dialog {
    width: min(90vw, 28rem);
    box-shadow:
        0 20px 50px rgb(0 0 0 / 0.25),
        0 2px 6px rgb(0 0 0 / 0.08);
    opacity: 1;
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
