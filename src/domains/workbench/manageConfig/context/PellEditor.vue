<script setup lang="ts">
// ── External Dependencies & Registrations
import 'pell/dist/pell.css';
import { marked } from 'marked';
import TurndownService from 'turndown';
import { init, exec } from 'pell';
import { onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue';

// ── Options, Properties, Slots & Emits ───────────────────────────────────────────────────────────────────────────────

const properties = defineProps<{ modelValue: string }>();
const emit = defineEmits<{ 'update:modelValue': [string] }>();

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

const editorElement = ref<HTMLElement>();
const editor = shallowRef<ReturnType<typeof init>>();
const turndown = new TurndownService();

// ── Side Effects ─────────────────────────────────────────────────────────────────────────────────────────────────────

onMounted(() => {
    editor.value = init({
        element: editorElement.value!,
        onChange: () => emit('update:modelValue', turndown.turndown(editor.value!.content)),
        actions: ['bold', 'italic', 'underline', 'link'],
        defaultParagraphSeparator: 'p'
    });
    editor.value.content.innerHTML = marked.parse(properties.modelValue, { async: false }) as string;
});

watch(
    () => properties.modelValue,
    (newValue) => {
        const html = marked.parse(newValue, { async: false }) as string;
        if (editor.value && editor.value.content.innerHTML !== html) {
            editor.value.content.innerHTML = html;
        }
    }
);

onBeforeUnmount(() => {
    editorElement.value?.replaceChildren();
});
</script>

<template>
    <div ref="editorElement" class="pell-editor"></div>
</template>

<style scoped>
.pell-editor :deep(.pell-content) {
    min-height: 2em;
}
</style>
