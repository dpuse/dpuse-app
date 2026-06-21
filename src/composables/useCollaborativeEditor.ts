// ── External Dependencies & Registrations
import { type MaybeRefOrGetter, onBeforeUnmount, type Ref, ref, type ShallowRef, toValue, watchEffect } from 'vue';

// ── External Dependencies & Registrations - TipTap
import Bold from '@tiptap/extension-bold';
import Collaboration from '@tiptap/extension-collaboration';
import CollaborationCaret from '@tiptap/extension-collaboration-caret';
import Document from '@tiptap/extension-document';
import Dropcursor from '@tiptap/extension-dropcursor';
import Gapcursor from '@tiptap/extension-gapcursor';
import Heading from '@tiptap/extension-heading';
import Italic from '@tiptap/extension-italic';
import Paragraph from '@tiptap/extension-paragraph';
import Text from '@tiptap/extension-text';
import { type AnyExtension, type Editor, useEditor } from '@tiptap/vue-3';

// ── External Dependencies & Registrations - yjs & y-partyserver
import { Doc } from 'yjs';
import YProvider from 'y-partyserver/provider';

// ── Types ────────────────────────────────────────────────────────────────────────────────────────────────────────────

interface CollaborativeUser {
    name: MaybeRefOrGetter<string>;
    color: string;
}

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

const PARTYKIT_HOST = 'dpuse-partykit.terrell-jm.workers.dev';

export const CURSOR_COLORS = ['#958DF1', '#F98181', '#FBBC88', '#FAF594', '#70CFF8', '#94FADB', '#B9F18D'];

// ── Composables ──────────────────────────────────────────────────────────────────────────────────────────────────────

export function useCollaborativeEditor(
    documentId: string,
    user: CollaborativeUser,
    extensions: AnyExtension[] = []
): { editor: ShallowRef<Editor | undefined>; isConnected: Ref<boolean> } {
    const ydoc = new Doc();

    const isConnected = ref(false);
    const provider = new YProvider(PARTYKIT_HOST, documentId, ydoc, { protocol: 'wss' });
    provider.on('status', ({ status }: { status: string }) => {
        isConnected.value = status === 'connected';
    });

    const editor = useEditor({
        injectCSS: false,
        extensions: [
            Document,
            Paragraph,
            Text,
            Bold,
            Italic,
            Heading,
            Dropcursor,
            Gapcursor,
            Collaboration.configure({ document: ydoc }),
            CollaborationCaret.configure({
                provider,
                user: { name: toValue(user.name), color: user.color },
                render: (user) => {
                    const cursor = document.createElement('span');
                    cursor.classList.add('collaboration-carets__caret');
                    cursor.dataset.color = user.color;
                    const label = document.createElement('div');
                    label.classList.add('collaboration-carets__label');
                    label.dataset.color = user.color;
                    label.insertBefore(document.createTextNode(user.name), null);
                    cursor.insertBefore(label, null);
                    return cursor;
                }
            }),
            ...extensions
        ]
    });

    watchEffect(() => {
        provider.awareness.setLocalStateField('user', { name: toValue(user.name), color: user.color });
    });

    onBeforeUnmount(() => {
        editor.value?.destroy();
        provider.destroy();
        ydoc.destroy();
    });

    return { editor, isConnected };
}
