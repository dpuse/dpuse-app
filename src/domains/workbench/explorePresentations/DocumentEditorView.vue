<script setup lang="ts">
// External Dependencies
import { computed } from 'vue';
import { EditorContent } from '@tiptap/vue-3';
import { useRoute } from 'vue-router';

// Local (App) Framework
import { t } from '@/state/locale';
import { emailAddress } from '@/state/session';
import T from './DocumentEditorView.json';
import { useCollaborativeEditor } from '@/composables/useCollaborativeEditor';

// Local Components - Static
import Button from '@/components/ui/button/Button.vue';
import Separator from '@/components/ui/Separator.vue';
import WorkbenchHeader from '@/components/framework/header/WorkbenchHeader.vue';

// Constants ───────────────────────────────────────────────────────────────────────────────────────────────────────────

const CURSOR_COLORS = ['#958DF1', '#F98181', '#FBBC88', '#FAF594', '#70CFF8', '#94FADB', '#B9F18D'];

// State ───────────────────────────────────────────────────────────────────────────────────────────────────────────────

const route = useRoute();
const rawId = route.params.documentId;
const documentId = Array.isArray(rawId) ? (rawId[0] ?? '') : (rawId ?? '');

const user = {
    name: computed(() => emailAddress.value ?? 'Anonymous'),
    // eslint-disable-next-line sonarjs/pseudo-random -- TODO
    color: CURSOR_COLORS[Math.floor(Math.random() * CURSOR_COLORS.length)]!
};

const { editor, isConnected } = useCollaborativeEditor(documentId, user);

const connectionLabel = computed(() => (isConnected.value ? t(T, 'connected') : t(T, 'connecting')));
</script>

<template>
    <div class="flex min-h-0 flex-1 flex-col">
        <WorkbenchHeader class="flex-none px-4" :overline="t(T, 'Document')" :title="documentId" to="explorePresentations" />

        <Separator class="mx-4" />

        <!-- Toolbar -->
        <div class="flex flex-none items-center gap-1 border-b border-separator px-4 py-1">
            <Button
                shape="icon"
                size="sm"
                :is-active="editor?.isActive('bold')"
                :title="t(T, 'toolbar.bold')"
                :disabled="!editor"
                @click="editor?.chain().focus().toggleBold().run()"
            >
                <strong>B</strong>
            </Button>
            <Button
                shape="icon"
                size="sm"
                :is-active="editor?.isActive('italic')"
                :title="t(T, 'toolbar.italic')"
                :disabled="!editor"
                @click="editor?.chain().focus().toggleItalic().run()"
            >
                <em>I</em>
            </Button>
            <Separator class="mx-1 h-5" style="width: 1px" />
            <Button
                shape="icon"
                size="sm"
                :is-active="editor?.isActive('heading', { level: 1 })"
                :title="t(T, 'toolbar.h1')"
                :disabled="!editor"
                @click="editor?.chain().focus().toggleHeading({ level: 1 }).run()"
            >
                {{ t(T, 'toolbar.h1') }}
            </Button>
            <Button
                shape="icon"
                size="sm"
                :is-active="editor?.isActive('heading', { level: 2 })"
                :title="t(T, 'toolbar.h2')"
                :disabled="!editor"
                @click="editor?.chain().focus().toggleHeading({ level: 2 }).run()"
            >
                {{ t(T, 'toolbar.h2') }}
            </Button>

            <span class="ml-auto text-xs text-muted">{{ connectionLabel }}</span>
        </div>

        <!-- Editor -->
        <div class="collaborative-editor min-h-0 flex-1 overflow-y-auto">
            <EditorContent class="h-full" :editor="editor" />
        </div>
    </div>
</template>

<style>
.collaborative-editor .tiptap {
    min-height: 100%;
    padding: 2rem;
    outline: none;
}

.collaborative-editor .tiptap h1 {
    font-size: 1.75rem;
    font-weight: 700;
    margin-bottom: 0.5rem;
}
.collaborative-editor .tiptap h2 {
    font-size: 1.375rem;
    font-weight: 600;
    margin-bottom: 0.5rem;
}
.collaborative-editor .tiptap p {
    margin-bottom: 0.75rem;
}
.collaborative-editor .tiptap p:last-child {
    margin-bottom: 0;
}
.collaborative-editor .tiptap strong {
    font-weight: 700;
}
.collaborative-editor .tiptap em {
    font-style: italic;
}

.collaborative-editor .collaboration-cursor__caret {
    border-left: 1px solid;
    border-right: 1px solid;
    margin-left: -1px;
    margin-right: -1px;
    pointer-events: none;
    position: relative;
    word-break: normal;
}

.collaborative-editor .collaboration-cursor__label {
    border-radius: 3px 3px 3px 0;
    font-size: 12px;
    font-weight: 600;
    left: -1px;
    line-height: normal;
    padding: 0.1rem 0.3rem;
    position: absolute;
    top: -1.4em;
    user-select: none;
    white-space: nowrap;
}
</style>
