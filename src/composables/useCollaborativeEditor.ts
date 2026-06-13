// External Dependencies
import * as Y from 'yjs';
import YProvider from 'y-partyserver/provider';
import { useEditor } from '@tiptap/vue-3';
import Collaboration from '@tiptap/extension-collaboration';
import CollaborationCaret from '@tiptap/extension-collaboration-caret';
import StarterKit from '@tiptap/starter-kit';
import { type MaybeRefOrGetter, onBeforeUnmount, ref, toValue, watchEffect } from 'vue';

// Constants ───────────────────────────────────────────────────────────────────────────────────────────────────────────

const PARTYKIT_HOST = 'dpuse-partykit.terrell-jm.workers.dev';

// Types ───────────────────────────────────────────────────────────────────────────────────────────────────────────────

export interface CollaborativeUser {
    name: MaybeRefOrGetter<string>;
    color: string;
}

// Composable ──────────────────────────────────────────────────────────────────────────────────────────────────────────

export function useCollaborativeEditor(documentId: string, user: CollaborativeUser) {
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
            CollaborationCaret.configure({ provider, user: { name: toValue(user.name), color: user.color } })
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
