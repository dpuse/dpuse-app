<script setup lang="ts">
// ── Local Framework
import { T } from './ContextDescriptorsPanel_.json';
import { t } from '@/state/locale';

// ── Static Components
import TextEditor from '@/components/ui/text/TextEditor.vue';
import TextInput from '@/components/ui/text/TextInput.vue';

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

const descriptionValue = defineModel<string>('description');
const labelValue = defineModel<string>('label');
</script>

<template>
    <div class="flex min-h-0 max-w-prose flex-1 flex-col gap-y-4 overflow-x-hidden overflow-y-auto overscroll-y-none px-6 py-4">
        <TextInput v-model="labelValue" :label="t(T, 'label.label')" />
        <TextEditor v-model="descriptionValue" class="min-h-25 flex-1" :label="t(T, 'description.label')" />
    </div>
</template>
