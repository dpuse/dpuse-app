// External Dependencies
import * as Y from 'yjs';
import Collaboration from '@tiptap/extension-collaboration';
import CollaborationCaret from '@tiptap/extension-collaboration-caret';
import StarterKit from '@tiptap/starter-kit';
import YProvider from 'y-partyserver/provider';
import { type AnyExtension, type Editor, useEditor } from '@tiptap/vue-3';
import { type MaybeRefOrGetter, onBeforeUnmount, type Ref, ref, type ShallowRef, toValue, watchEffect } from 'vue';

// Constants ───────────────────────────────────────────────────────────────────────────────────────────────────────────

const PARTYKIT_HOST = 'dpuse-partykit.terrell-jm.workers.dev';

export const CURSOR_COLORS = ['#958DF1', '#F98181', '#FBBC88', '#FAF594', '#70CFF8', '#94FADB', '#B9F18D'];

// Types ───────────────────────────────────────────────────────────────────────────────────────────────────────────────

export interface CollaborativeUser {
    name: MaybeRefOrGetter<string>;
    color: string;
}

// Composable ──────────────────────────────────────────────────────────────────────────────────────────────────────────

export function useCollaborativeEditor(
    documentId: string,
    user: CollaborativeUser,
    extensions: AnyExtension[] = []
): { editor: ShallowRef<Editor | undefined>; isConnected: Ref<boolean> } {
    const ydoc = new Y.Doc();

    const provider = new YProvider(PARTYKIT_HOST, documentId, ydoc, { protocol: 'wss' });

    const isConnected = ref(false);
    provider.on('status', ({ status }: { status: string }) => {
        isConnected.value = status === 'connected';
    });

    const editor = useEditor({
        injectCSS: false,
        extensions: [
            StarterKit.configure({ undoRedo: false }),
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
