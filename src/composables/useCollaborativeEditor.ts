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

// Types ───────────────────────────────────────────────────────────────────────────────────────────────────────────────

export interface CollaborativeUser {
    name: MaybeRefOrGetter<string>;
    color: string;
}

// Composable ──────────────────────────────────────────────────────────────────────────────────────────────────────────

export function useCollaborativeEditor(documentId: string, user: CollaborativeUser, extensions: AnyExtension[] = []): { editor: ShallowRef<Editor | undefined>; isConnected: Ref<boolean> } {
    const ydoc = new Y.Doc();

    const provider = new YProvider(PARTYKIT_HOST, documentId, ydoc, { protocol: 'wss' });

    const isConnected = ref(false);
    provider.on('status', ({ status }: { status: string }) => {
        isConnected.value = status === 'connected';
    });

    const editor = useEditor({
        extensions: [
            StarterKit.configure({ undoRedo: false }),
            Collaboration.configure({ document: ydoc }),
            CollaborationCaret.configure({ provider, user: { name: toValue(user.name), color: user.color } }),
            ...extensions,
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
