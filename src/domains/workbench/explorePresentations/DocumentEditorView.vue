<script setup lang="ts">
// ── External Dependencies & Registrations
import { computed } from 'vue';
import { EditorContent } from '@tiptap/vue-3';
import { useRoute } from 'vue-router';

// ── Local (App) Framework
const { ChartNode } = await import('./ChartNode');
import { emailAddress } from '@/state/session';
import { t } from '@/state/locale';
import T from './DocumentEditorView.json';
import { CURSOR_COLORS, useCollaborativeEditor } from '@/composables/useCollaborativeEditor';

// ── Local Components - Static
import Button from '@/components/ui/button/Button.vue';
import Separator from '@/components/ui/Separator.vue';
import WorkbenchHeader from '@/components/framework/header/WorkbenchHeader.vue';

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

const route = useRoute();
const rawId = route.params.documentId;
const documentId = Array.isArray(rawId) ? (rawId[0] ?? '') : (rawId ?? '');

const user = {
    name: computed(() => emailAddress.value ?? 'Anonymous'),
    // eslint-disable-next-line sonarjs/pseudo-random -- TODO
    color: CURSOR_COLORS[Math.floor(Math.random() * CURSOR_COLORS.length)]!
};

const { editor, editorIsConnected } = useCollaborativeEditor(documentId, user, [ChartNode]);

const connectionLabel = computed(() => t(T, editorIsConnected.value ? 'connected' : 'connecting'));
</script>

<template>
    <div class="flex min-h-0 flex-1 flex-col">
        <WorkbenchHeader class="flex-none px-4" :overline="t(T, 'Document')" :title="documentId" to="explorePresentations" />

        <Separator class="mx-4" />

        <!-- Toolbar -->
        <div class="mx-4 flex flex-none items-center gap-1 border-b border-separator py-1">
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
            <Separator class="mx-1 h-5" style="width: 1px" />
            <Button
                shape="icon"
                size="sm"
                :title="t(T, 'toolbar.chart')"
                :disabled="!editor"
                @click="
                    editor
                        ?.chain()
                        .focus()
                        .insertContent({ type: 'chart', attrs: { title: 'New Chart', labels: 'Jan,Feb,Mar,Apr,May', data: '10,20,15,30,25' } })
                        .run()
                "
            >
                {{ t(T, 'toolbar.chart') }}
            </Button>

            <span class="ml-auto text-xs text-muted">{{ connectionLabel }}</span>
        </div>

        <!-- Editor -->
        <div class="dpuse-collaborative-editor min-h-0 flex-1 overflow-y-auto">
            <EditorContent class="h-full" :editor="editor" />
        </div>
    </div>
</template>

<style>
/* TODO: Need to change following to :deep() so we can change style to scoped. */
.dpuse-collaborative-editor .tiptap {
    min-height: 100%;
    padding: 1rem;
    outline: none;
    white-space: pre-wrap;
}

.dpuse-collaborative-editor .tiptap h1 {
    font-size: 1.75rem;
    font-weight: 700;
    margin-bottom: 0.5rem;
}
.dpuse-collaborative-editor .tiptap h2 {
    font-size: 1.375rem;
    font-weight: 600;
    margin-bottom: 0.5rem;
}
.dpuse-collaborative-editor .tiptap p {
    margin-bottom: 0.75rem;
}
.dpuse-collaborative-editor .tiptap p:last-child {
    margin-bottom: 0;
}
.dpuse-collaborative-editor .tiptap strong {
    font-weight: 700;
}
.dpuse-collaborative-editor .tiptap em {
    font-style: italic;
}

.dpuse-collaborative-editor .collaboration-carets__caret {
    border-left: 1px solid;
    border-right: 1px solid;
    margin-left: -1px;
    margin-right: -1px;
    pointer-events: none;
    position: relative;
    word-break: normal;
}

.dpuse-collaborative-editor .collaboration-carets__label {
    border-radius: 3px 3px 3px 0;
    color: #000;
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

.dpuse-collaborative-editor .collaboration-carets__caret[data-color='#958DF1'] {
    border-color: #958df1;
}
.dpuse-collaborative-editor .collaboration-carets__caret[data-color='#F98181'] {
    border-color: #f98181;
}
.dpuse-collaborative-editor .collaboration-carets__caret[data-color='#FBBC88'] {
    border-color: #fbbc88;
}
.dpuse-collaborative-editor .collaboration-carets__caret[data-color='#FAF594'] {
    border-color: #faf594;
}
.dpuse-collaborative-editor .collaboration-carets__caret[data-color='#70CFF8'] {
    border-color: #70cff8;
}
.dpuse-collaborative-editor .collaboration-carets__caret[data-color='#94FADB'] {
    border-color: #94fadb;
}
.dpuse-collaborative-editor .collaboration-carets__caret[data-color='#B9F18D'] {
    border-color: #b9f18d;
}

.dpuse-collaborative-editor .collaboration-carets__label[data-color='#958DF1'] {
    background-color: #958df1;
}
.dpuse-collaborative-editor .collaboration-carets__label[data-color='#F98181'] {
    background-color: #f98181;
}
.dpuse-collaborative-editor .collaboration-carets__label[data-color='#FBBC88'] {
    background-color: #fbbc88;
}
.dpuse-collaborative-editor .collaboration-carets__label[data-color='#FAF594'] {
    background-color: #faf594;
}
.dpuse-collaborative-editor .collaboration-carets__label[data-color='#70CFF8'] {
    background-color: #70cff8;
}
.dpuse-collaborative-editor .collaboration-carets__label[data-color='#94FADB'] {
    background-color: #94fadb;
}
.dpuse-collaborative-editor .collaboration-carets__label[data-color='#B9F18D'] {
    background-color: #b9f18d;
}
</style>
