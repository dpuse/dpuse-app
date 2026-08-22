<script setup lang="ts">
// ── Local Components - Static
import Input from '@/components/ui/Input.vue';
import TextEditor from '@/components/ui/TextEditor.vue';

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

const labelValue = defineModel<string>('label');
const descriptionValue = defineModel<string>('description', { default: '' });
</script>

<template>
    <div class="flex min-h-0 max-w-prose flex-1 flex-col gap-y-4 overflow-x-hidden overflow-y-auto overscroll-y-none px-6 py-4">
        <Input v-model="labelValue" label="Label" />
        <TextEditor v-model="descriptionValue" class="min-h-25 flex-1" label="Description" />
    </div>
</template>
