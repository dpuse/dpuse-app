<script setup lang="ts">
// ── External Dependencies & Registrations
import DOMPurify from 'dompurify';
import Squire from 'squire-rte';
import { BoldIcon, ItalicIcon, LinkIcon, UnderlineIcon } from '@lucide/vue';
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, shallowRef, useAttrs, useId, useTemplateRef, watch } from 'vue';

// ── DPUse Framework
import { AppError } from '@dpuse/dpuse-shared/errors';

// ── Local Framework
import { assertDefined } from '@/utilities/index.ts';
import { type AppFailure, raiseFailure } from '@/state/errors';
import { useMarkedTool } from '@/services/useMarkedTool';

// ── Static Components
import Button from '@/components/ui/button/Button.vue';
import ErrorShell from '@/components/ui/error/ErrorShell.vue';

// ── Options, Props, Slots & Emits ────────────────────────────────────────────────────────────────────────────────────

interface Properties {
    id?: string;
    label: string;
    labelHidden?: boolean;
}
const { id, label, labelHidden } = defineProps<Properties>();

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

const activeFormats = reactive({ bold: false, italic: false, underline: false, link: false });
const attributes = useAttrs();
const editorElement = useTemplateRef<HTMLElement>('editor');
const editor = shallowRef<Squire>();
const editorId = id ?? useId();
const labelId = useId();
const internalUpdatePending = ref(false);
const { markedTool, failure: markedToolFailure, initialise: initialiseMarkedTool } = useMarkedTool();
const parentCanScroll = ref(true);
const editorFailure = shallowRef<AppFailure | undefined>();
const scrollableAncestorObserver = shallowRef<ResizeObserver>();
const textValue = defineModel<string>({ required: true });

// ── Derived State ────────────────────────────────────────────────────────────────────────────────────────────────────

// Either failure leaves the editor unusable, so ErrorShell presents whichever one occurred.
const renderFailure = computed(() => editorFailure.value ?? markedToolFailure.value);

// ── Side Effects ─────────────────────────────────────────────────────────────────────────────────────────────────────

onMounted(() => {
    void initialiseEditor();
});

watch(textValue, async (newValue) => {
    if (internalUpdatePending.value) {
        internalUpdatePending.value = false;
        return;
    }
    const tool = markedTool.value ?? (await initialiseMarkedTool());
    if (!tool) return; // Formatter unavailable; the failure is already reported and shown by ErrorShell.

    // Sanitised for the comparison below, not for safety — 'setHTML' sanitises through 'sanitizeToDOMFragment'
    // anyway. 'getHTML' returns Squire's own sanitised markup, so comparing raw rendered output against it would
    // mismatch and fire a needless 'setHTML' that resets the cursor.
    const html = DOMPurify.sanitize(tool.render(newValue));
    if (editor.value && editor.value.getHTML() !== html) {
        editor.value.setHTML(html);
    }
    await nextTick();
    const ancestor = findScrollableAncestor(editorElement.value);
    if (ancestor) updateParentCanScroll(ancestor);
});

onBeforeUnmount(() => {
    editor.value?.destroy();
    scrollableAncestorObserver.value?.disconnect();
});

// ── Event Handlers ───────────────────────────────────────────────────────────────────────────────────────────────────

function handleFocusEditor(): void {
    editor.value?.focus();
}

function handleRetry(): void {
    void initialiseEditor();
}

function handleToggleBold(): void {
    if (activeFormats.bold) editor.value?.removeBold();
    else editor.value?.bold();
}

function handleToggleItalic(): void {
    if (activeFormats.italic) editor.value?.removeItalic();
    else editor.value?.italic();
}

function handleToggleLink(): void {
    if (!editor.value) return;
    if (activeFormats.link) {
        editor.value.removeLink();
        return;
    }
    const url = prompt('Enter a URL');
    if (url === null || url === '') return;
    editor.value.makeLink(url);
}

function handleToggleUnderline(): void {
    if (activeFormats.underline) editor.value?.removeUnderline();
    else editor.value?.underline();
}

function handleUpdateActiveFormats(): void {
    if (!editor.value) return;
    activeFormats.bold = editor.value.hasFormat('B');
    activeFormats.italic = editor.value.hasFormat('I');
    activeFormats.underline = editor.value.hasFormat('U');
    activeFormats.link = editor.value.hasFormat('A');
}

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

function findScrollableAncestor(element: HTMLElement | null): HTMLElement | null {
    const assertedElement = assertDefined(element);
    let node = assertedElement.parentElement;
    while (node) {
        const overflowY = getComputedStyle(node).overflowY;
        if (overflowY === 'auto' || overflowY === 'scroll') return node;
        node = node.parentElement;
    }
    return null;
}

async function initialiseEditor(): Promise<void> {
    editorFailure.value = undefined;
    try {
        let editorInstance = editor.value;
        if (!editorInstance) {
            // Markup can only enter Squire through this hook — 'setHTML', paste and drop all call it — so DOMPurify
            // sees everything. The hook hands back a DocumentFragment rather than a string, so none of those routes
            // assigns to 'innerHTML', and none reaches a Trusted Types sink.
            //
            // Squire assigns 'innerHTML' directly in one private method, '_setRawHTML'. Only undo and redo call it,
            // and what they replay is markup Squire captured from its own DOM, which this hook had already sanitised.
            // Nothing unsanitised can reach it, so it needs no protection of its own.
            //
            // That one assignment is all that falls back on the default Trusted Types policy in 'main.ts'. It cannot
            // use a named policy instead: 'SquireConfig' offers no Trusted Types hook, and only the code performing
            // the assignment can apply a policy — here, Squire itself. Sanitising before calling Squire does not
            // help, because that decides what Squire receives, not which policy its own code uses.
            const newEditorInstance = new Squire(assertDefined(editorElement.value), {
                blockTag: 'P',
                sanitizeToDOMFragment: (html: string): DocumentFragment => DOMPurify.sanitize(html, { RETURN_DOM_FRAGMENT: true })
            });
            newEditorInstance.addEventListener('blur', () => {
                if (!markedTool.value) return; // Tool not loaded yet; nothing to convert against.

                internalUpdatePending.value = true;
                textValue.value = markedTool.value.toMarkdown(newEditorInstance.getRoot());
            });
            newEditorInstance.addEventListener('pathChange', handleUpdateActiveFormats);
            newEditorInstance.addEventListener('select', handleUpdateActiveFormats);
            newEditorInstance.addEventListener('cursor', handleUpdateActiveFormats);

            editor.value = newEditorInstance;
            editorInstance = newEditorInstance;

            const ancestor = findScrollableAncestor(editorElement.value);
            if (ancestor) {
                updateParentCanScroll(ancestor);
                scrollableAncestorObserver.value = new ResizeObserver(() => {
                    updateParentCanScroll(ancestor);
                });
                scrollableAncestorObserver.value.observe(ancestor);
            }
        }

        const tool = await initialiseMarkedTool();
        if (tool) editorInstance.setHTML(tool.render(textValue.value));
    } catch (error) {
        editorFailure.value = raiseFailure(new AppError('Failed to initialise text editor.', 'dpuse.textEditor.initialiseEditor', { typeId: 'handled' }, { cause: error }));
    }
}

function updateParentCanScroll(ancestor: HTMLElement): void {
    parentCanScroll.value = ancestor.scrollHeight > ancestor.clientHeight;
}
</script>

<template>
    <div class="flex flex-col" data-region="TextEditor">
        <!-- A contenteditable div can never be a labeled form field, so a real <label for> would be flagged by browsers as unassociated. Its accessible name is wired via aria-labelledby on the editor below instead, and click-to-focus is wired manually here to mirror native <label for> behaviour (pointer-only, same as native; keyboard users already reach the editor directly via Tab). -->
        <!-- eslint-disable-next-line vuejs-accessibility/click-events-have-key-events, vuejs-accessibility/no-static-element-interactions -->
        <div :id="labelId" :class="labelHidden ? 'sr-only' : 'mb-1 block flex-none text-sm font-medium text-muted'" @click="handleFocusEditor">
            {{ label }}
        </div>

        <ErrorShell v-if="renderFailure" covers-region :failures="[renderFailure]" @retry="handleRetry" />

        <div
            v-show="!renderFailure"
            class="flex flex-1 flex-col overflow-hidden rounded-md bg-surface outline-1 -outline-offset-1 outline-separator focus-within:outline-2 focus-within:-outline-offset-2 focus-within:outline-accent"
        >
            <!-- Toolbar -->
            <div class="flex flex-none gap-0.5 border-b border-boundary bg-backdrop">
                <Button shape="icon" size="sm" type="button" :is-active="activeFormats.bold" aria-label="Bold" @mousedown.prevent @click="handleToggleBold">
                    <BoldIcon class="size-4.5!" />
                </Button>
                <Button shape="icon" size="sm" type="button" :is-active="activeFormats.italic" aria-label="Italic" @mousedown.prevent @click="handleToggleItalic">
                    <ItalicIcon class="size-4.5!" />
                </Button>
                <Button shape="icon" size="sm" type="button" :is-active="activeFormats.underline" aria-label="Underline" @mousedown.prevent @click="handleToggleUnderline">
                    <UnderlineIcon class="size-4.5!" />
                </Button>
                <Button shape="icon" size="sm" type="button" :is-active="activeFormats.link" aria-label="Link" @mousedown.prevent @click="handleToggleLink">
                    <LinkIcon class="size-4.5!" />
                </Button>
            </div>

            <!-- Content -->
            <div
                ref="editor"
                v-bind="{ id: editorId, name: editorId, ...attributes }"
                role="textbox"
                aria-multiline="true"
                :aria-labelledby="labelId"
                class="min-h-10 flex-1 overflow-y-auto px-2.5 focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-focus-ring"
                :class="parentCanScroll ? 'overscroll-y-auto' : 'overscroll-y-none'"
            />
        </div>
    </div>
</template>
