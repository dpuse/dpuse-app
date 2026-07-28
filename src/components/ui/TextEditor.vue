<script setup lang="ts">
// ── External Dependencies & Registrations
import DOMPurify from 'dompurify';
import { marked } from 'marked';
import Squire from 'squire-rte';
import TurndownService from 'turndown';
import { BoldIcon, ItalicIcon, LinkIcon, UnderlineIcon } from '@lucide/vue';
import { onBeforeUnmount, onMounted, reactive, ref, shallowRef, useAttrs, useId, watch } from 'vue';

// ── Local Components - Static
import Button from './button/Button.vue';

// ── Options, Properties, Slots & Emits ───────────────────────────────────────────────────────────────────────────────

const { id, label, labelHidden = false, modelValue } = defineProps<{ id?: string; label: string; labelHidden?: boolean; modelValue: string }>();
const emit = defineEmits<{ 'update:modelValue': [string] }>();

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

const activeFormats = reactive({ bold: false, italic: false, underline: false, link: false });
const attributes = useAttrs();
const editorElement = ref<HTMLElement>();
const editor = shallowRef<Squire>();
const editorId = id ?? useId();
const labelId = useId();
const internalUpdatePending = ref(false);
const turndown = new TurndownService();
turndown.keep(['u']);

// ── Behaviour ────────────────────────────────────────────────────────────────────────────────────────────────────────

function focusEditor(): void {
    editor.value?.focus();
}

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
    editor.value.addEventListener('blur', () => {
        console.log('blur...');
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
    <div data-region="TextEditor">
        <!-- A contenteditable div can never be a labeled form field, so a real <label for> would be flagged by browsers as unassociated. Its accessible name is wired via aria-labelledby on the editor below instead, and click-to-focus is wired manually here to mirror native <label for> behaviour (pointer-only, same as native; keyboard users already reach the editor directly via Tab). -->
        <!-- eslint-disable-next-line vuejs-accessibility/click-events-have-key-events, vuejs-accessibility/no-static-element-interactions -->
        <div :id="labelId" :class="labelHidden ? 'sr-only' : 'mb-1 block text-sm font-medium text-muted'" @click="focusEditor">
            {{ label }}
        </div>

        <div
            class="w-full overflow-hidden rounded-md bg-surface outline-1 -outline-offset-1 outline-separator focus-within:outline-2 focus-within:-outline-offset-2 focus-within:outline-indigo-600 dark:focus-within:outline-indigo-500"
        >
            <!-- Toolbar -->
            <div class="flex gap-0.5 border-b border-boundary p-1">
                <Button shape="icon" size="sm" type="button" :is-active="activeFormats.bold" aria-label="Bold" @mousedown.prevent @click="toggleBold">
                    <BoldIcon />
                </Button>
                <Button shape="icon" size="sm" type="button" :is-active="activeFormats.italic" aria-label="Italic" @mousedown.prevent @click="toggleItalic">
                    <ItalicIcon />
                </Button>
                <Button shape="icon" size="sm" type="button" :is-active="activeFormats.underline" aria-label="Underline" @mousedown.prevent @click="toggleUnderline">
                    <UnderlineIcon />
                </Button>
                <Button shape="icon" size="sm" type="button" :is-active="activeFormats.link" aria-label="Link" @mousedown.prevent @click="toggleLink">
                    <LinkIcon />
                </Button>
            </div>

            <!-- Content -->
            <div
                ref="editorElement"
                v-bind="{ id: editorId, name: editorId, ...attributes }"
                role="textbox"
                aria-multiline="true"
                :aria-labelledby="labelId"
                class="max-h-100 min-h-[2em] overflow-y-scroll overscroll-y-none px-2.5 outline-none"
            />
        </div>
    </div>
</template>
