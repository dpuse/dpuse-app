<script setup lang="ts">
// TODO: Move turndown to marked tool, or own tool if it is to be used by both marked and micromark.
// ── External Dependencies & Registrations
import DOMPurify from 'dompurify';
import Squire from 'squire-rte';
import TurndownService from 'turndown';
import { BoldIcon, ItalicIcon, LinkIcon, UnderlineIcon } from '@lucide/vue';
import { nextTick, onBeforeUnmount, onMounted, reactive, ref, shallowRef, useAttrs, useId, watch } from 'vue';

// ── DPUse Framework
import type { MarkedTool as MarkedToolType } from '@dpuse/dpuse-tool-marked-markdown-parser';

// ── Local Framework
import { toolConfigs } from '@/state/session';

// ── Local Components - Static
import Button from './button/Button.vue';

// ── Options, Properties, Slots & Emits ───────────────────────────────────────────────────────────────────────────────

const { id, label, labelHidden = false, modelValue } = defineProps<{ id?: string; label: string; labelHidden?: boolean; modelValue: string }>();
const emit = defineEmits<{ 'update:modelValue': [string] }>();

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

const activeFormats = reactive({ bold: false, italic: false, underline: false, link: false });
const attributes = useAttrs();
const rootElement = ref<HTMLElement>();
const editorElement = ref<HTMLElement>();
const editor = shallowRef<Squire>();
const editorId = id ?? useId();
const labelId = useId();
const internalUpdatePending = ref(false);
const markedTool = shallowRef<MarkedToolType>();
const parentCanScroll = ref(true);
const scrollableAncestorObserver = shallowRef<ResizeObserver>();
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

function findScrollableAncestor(element: HTMLElement): HTMLElement | null {
    let node = element.parentElement;
    while (node) {
        const overflowY = getComputedStyle(node).overflowY;
        if (overflowY === 'auto' || overflowY === 'scroll') return node;
        node = node.parentElement;
    }
    return null;
}

function updateParentCanScroll(ancestor: HTMLElement): void {
    parentCanScroll.value = ancestor.scrollHeight > ancestor.clientHeight;
}

// ── Side Effects ─────────────────────────────────────────────────────────────────────────────────────────────────────

const toolReady = new Promise<void>((resolve) => {
    watch(
        toolConfigs,
        (newToolConfigs) => {
            if (newToolConfigs.length === 0) return;
            resolve();
        },
        { immediate: true }
    );
});

onMounted(async () => {
    editor.value = new Squire(editorElement.value!, {
        blockTag: 'P',
        sanitizeToDOMFragment: (html: string): DocumentFragment => DOMPurify.sanitize(html, { RETURN_DOM_FRAGMENT: true })
    });
    editor.value.addEventListener('blur', () => {
        console.log('blur...');
        internalUpdatePending.value = true;
        emit('update:modelValue', turndown.turndown(editor.value!.getRoot()));
    });
    editor.value.addEventListener('pathChange', updateActiveFormats);
    editor.value.addEventListener('select', updateActiveFormats);
    editor.value.addEventListener('cursor', updateActiveFormats);

    const ancestor = findScrollableAncestor(rootElement.value!);
    if (ancestor) {
        updateParentCanScroll(ancestor);
        scrollableAncestorObserver.value = new ResizeObserver(() => updateParentCanScroll(ancestor));
        scrollableAncestorObserver.value.observe(ancestor);
    }

    await toolReady;
    markedTool.value = await loadMarkedTool();
    editor.value.setHTML(DOMPurify.sanitize(markedTool.value.render(modelValue)));
});

watch(
    () => modelValue,
    async (newValue) => {
        if (internalUpdatePending.value) {
            internalUpdatePending.value = false;
            return;
        }
        markedTool.value ??= await loadMarkedTool();
        const html = DOMPurify.sanitize(markedTool.value.render(newValue));
        if (editor.value && editor.value.getHTML() !== html) {
            editor.value.setHTML(html);
        }
        nextTick(() => {
            const ancestor = findScrollableAncestor(rootElement.value!);
            if (ancestor) updateParentCanScroll(ancestor);
        });
    }
);

onBeforeUnmount(() => {
    editor.value?.destroy();
    scrollableAncestorObserver.value?.disconnect();
});

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

async function loadMarkedTool(): Promise<MarkedToolType> {
    const toolModuleConfig = toolConfigs.value.find((config) => config.id === 'dpuse-tool-marked-markdown-parser');
    if (!toolModuleConfig) throw new Error('No Marked tool module configuration.');

    const url = `https://engine-eu.dpuse.app/tools/marked-markdown-parser_v${toolModuleConfig.version}/dpuse-tool-marked-markdown-parser.es.js`;
    const module = (await import(/* @vite-ignore */ url)) as { MarkedTool: new () => MarkedToolType };
    const MarkedTool = module.MarkedTool;
    return new MarkedTool();
}
</script>

<template>
    <div ref="rootElement" data-region="TextEditor" class="flex flex-col">
        <!-- A contenteditable div can never be a labeled form field, so a real <label for> would be flagged by browsers as unassociated. Its accessible name is wired via aria-labelledby on the editor below instead, and click-to-focus is wired manually here to mirror native <label for> behaviour (pointer-only, same as native; keyboard users already reach the editor directly via Tab). -->
        <!-- eslint-disable-next-line vuejs-accessibility/click-events-have-key-events, vuejs-accessibility/no-static-element-interactions -->
        <div :id="labelId" :class="labelHidden ? 'sr-only' : 'mb-1 block flex-none text-sm font-medium text-muted'" @click="focusEditor">
            {{ label }}
        </div>

        <div
            class="flex flex-1 flex-col overflow-hidden rounded-md bg-surface outline-1 -outline-offset-1 outline-separator focus-within:outline-2 focus-within:-outline-offset-2 focus-within:outline-accent"
        >
            <!-- Toolbar -->
            <div class="flex flex-none gap-0.5 border-b border-boundary bg-backdrop">
                <Button shape="icon" size="sm" type="button" :is-active="activeFormats.bold" aria-label="Bold" @mousedown.prevent @click="toggleBold">
                    <BoldIcon class="size-4.5!" />
                </Button>
                <Button shape="icon" size="sm" type="button" :is-active="activeFormats.italic" aria-label="Italic" @mousedown.prevent @click="toggleItalic">
                    <ItalicIcon class="size-4.5!" />
                </Button>
                <Button shape="icon" size="sm" type="button" :is-active="activeFormats.underline" aria-label="Underline" @mousedown.prevent @click="toggleUnderline">
                    <UnderlineIcon class="size-4.5!" />
                </Button>
                <Button shape="icon" size="sm" type="button" :is-active="activeFormats.link" aria-label="Link" @mousedown.prevent @click="toggleLink">
                    <LinkIcon class="size-4.5!" />
                </Button>
            </div>

            <!-- Content -->
            <div
                ref="editorElement"
                v-bind="{ id: editorId, name: editorId, ...attributes }"
                role="textbox"
                aria-multiline="true"
                :aria-labelledby="labelId"
                class="min-h-10 flex-1 overflow-y-auto px-2.5 outline-none"
                :class="parentCanScroll ? 'overscroll-y-auto' : 'overscroll-y-none'"
            />
        </div>
    </div>
</template>
