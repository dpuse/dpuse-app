<script setup lang="ts">
// ── External Dependencies & Registrations
import DOMPurify from 'dompurify';
import { marked } from 'marked';
import Squire from 'squire-rte';
import TurndownService from 'turndown';
import { BoldIcon, ItalicIcon, LinkIcon, UnderlineIcon } from '@lucide/vue';
import { onBeforeUnmount, onMounted, reactive, ref, shallowRef, useId, watch } from 'vue';

// ── Local Components - Static
import Button from './button/Button.vue';

// ── Options, Properties, Slots & Emits ───────────────────────────────────────────────────────────────────────────────

const { id, label, labelHidden = false, modelValue } = defineProps<{ id?: string; label: string; labelHidden?: boolean; modelValue: string }>();
const emit = defineEmits<{ 'update:modelValue': [string] }>();

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

const editorElement = ref<HTMLElement>();
const editor = shallowRef<Squire>();
const internalUpdatePending = ref(false);
const generatedId = useId();
const turndown = new TurndownService();
turndown.keep(['u']);

const activeFormats = reactive({ bold: false, italic: false, underline: false, link: false });

// ── Behaviour ────────────────────────────────────────────────────────────────────────────────────────────────────────

function updateActiveFormats(): void {
    if (!editor.value) return;
    activeFormats.bold = editor.value.hasFormat('B');
    activeFormats.italic = editor.value.hasFormat('I');
    activeFormats.underline = editor.value.hasFormat('U');
    activeFormats.link = editor.value.hasFormat('A');
}

function toggleBold(): void {
    if (activeFormats.bold) editor.value?.removeBold();
    else editor.value?.bold();
}

function toggleItalic(): void {
    if (activeFormats.italic) editor.value?.removeItalic();
    else editor.value?.italic();
}

function toggleUnderline(): void {
    if (activeFormats.underline) editor.value?.removeUnderline();
    else editor.value?.underline();
}

function toggleLink(): void {
    if (!editor.value) return;
    if (activeFormats.link) {
        editor.value.removeLink();
        return;
    }
    const url = prompt('Enter a URL');
    if (url === null || url === '') return;
    editor.value.makeLink(url);
}

// ── Side Effects ─────────────────────────────────────────────────────────────────────────────────────────────────────

onMounted(() => {
    editor.value = new Squire(editorElement.value!, {
        blockTag: 'P',
        sanitizeToDOMFragment: (html: string): DocumentFragment => DOMPurify.sanitize(html, { RETURN_DOM_FRAGMENT: true })
    });
    editor.value.setHTML(DOMPurify.sanitize(marked.parse(modelValue, { async: false })));
    editor.value.addEventListener('input', () => {
        internalUpdatePending.value = true;
        emit('update:modelValue', turndown.turndown(editor.value!.getRoot()));
    });
    editor.value.addEventListener('pathChange', updateActiveFormats);
    editor.value.addEventListener('select', updateActiveFormats);
    editor.value.addEventListener('cursor', updateActiveFormats);
});

watch(
    () => modelValue,
    (newValue) => {
        if (internalUpdatePending.value) {
            internalUpdatePending.value = false;
            return;
        }
        const html = DOMPurify.sanitize(marked.parse(newValue, { async: false }));
        if (editor.value && editor.value.getHTML() !== html) {
            editor.value.setHTML(html);
        }
    }
);

onBeforeUnmount(() => {
    editor.value?.destroy();
});
</script>

<template>
    <label :for="id ?? generatedId" :class="labelHidden ? 'sr-only' : 'mb-1 block text-xs font-medium text-muted'">{{ label }}</label>
    <div class="w-full overflow-hidden rounded border border-boundary bg-surface" data-region="TextEditor">
        <!-- Toolbar -->
        <div class="flex gap-0.5 border-b border-boundary p-1">
            <Button shape="icon" size="sm" type="button" :is-active="activeFormats.bold" aria-label="Bold" @click="toggleBold">
                <BoldIcon />
            </Button>
            <Button shape="icon" size="sm" type="button" :is-active="activeFormats.italic" aria-label="Italic" @click="toggleItalic">
                <ItalicIcon />
            </Button>
            <Button shape="icon" size="sm" type="button" :is-active="activeFormats.underline" aria-label="Underline" @click="toggleUnderline">
                <UnderlineIcon />
            </Button>
            <Button shape="icon" size="sm" type="button" :is-active="activeFormats.link" aria-label="Link" @click="toggleLink">
                <LinkIcon />
            </Button>
        </div>

        <!-- Content -->
        <div :id="id ?? generatedId" ref="editorElement" class="min-h-[2em] p-2.5 text-sm text-content outline-none"></div>
    </div>
</template>
