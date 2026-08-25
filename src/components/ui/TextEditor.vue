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
import { reportAppError } from '@/observability/errorTracking';
import { useMarkedTool } from '@/services/useMarkedTool';

// ── Static Components
import Button from '@/components/ui/button/Button.vue';
import ErrorPanel from '@/components/ui/error/ErrorPanel.vue';

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
const { markedTool, error: markedToolError, errorWasReported: markedToolErrorWasReported, initialise: initialiseMarkedTool } = useMarkedTool();
const parentCanScroll = ref(true);
const editorError = shallowRef<AppError | undefined>();
// Undefined until the error report completes, so ErrorPanel can distinguish reporting-pending from failed.
const editorErrorWasReported = ref<boolean | undefined>();
const scrollableAncestorObserver = shallowRef<ResizeObserver>();
const textValue = defineModel<string>({ required: true });

// ── Derived State ────────────────────────────────────────────────────────────────────────────────────────────────────

// Either failure leaves the editor unusable, so ErrorPanel presents whichever one occurred.
const renderError = computed(() => editorError.value ?? markedToolError.value);
const errorWasReported = computed(() => (editorError.value ? editorErrorWasReported.value : markedToolErrorWasReported.value));

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
    if (!tool) return; // Formatter unavailable; the failure is already reported and shown by ErrorPanel.

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
    editorError.value = undefined;
    editorErrorWasReported.value = undefined;
    try {
        let editorInstance = editor.value;
        if (!editorInstance) {
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
        if (tool) editorInstance.setHTML(DOMPurify.sanitize(tool.render(textValue.value)));
    } catch (error) {
        editorError.value = new AppError('Failed to initialise text editor.', 'dpuse.textEditor.initialiseEditor', { typeId: 'handled' }, { cause: error });
        editorErrorWasReported.value = await reportAppError(editorError.value);
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

        <ErrorPanel v-if="renderError" :error="renderError" :error-was-reported="errorWasReported" @retry="handleRetry" />

        <div
            v-show="!renderError"
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
                class="min-h-10 flex-1 overflow-y-auto px-2.5 outline-none"
                :class="parentCanScroll ? 'overscroll-y-auto' : 'overscroll-y-none'"
            />
        </div>
    </div>
</template>
