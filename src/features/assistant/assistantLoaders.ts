// ── External Dependencies & Registrations
import type { Component } from 'vue';

// ── Actions ──────────────────────────────────────────────────────────────────────────────────────────────────────────

// The assistant's panes load on demand. The pane and its prefetch share one loader, so both fetch the same chunk and
// the open that follows a prefetch finds it already in the browser.

export function loadAssistantLayout(): Promise<{ default: Component }> {
    return import('./AssistantLayout.vue');
}

export function loadChatPanel(): Promise<{ default: Component }> {
    return import('./chat/ChatPanel.vue');
}

export function loadLibraryPanel(): Promise<{ default: Component }> {
    return import('./library/LibraryPanel.vue');
}

// Starts fetching the assistant while the user points at or focuses its toggle, so the pane opens without a spinner.
// Chat is fetched with it because the assistant always opens on chat. Never rejects.
export async function prefetchAssistant(): Promise<void> {
    try {
        await Promise.all([loadAssistantLayout(), loadChatPanel()]);
    } catch {
        // Ignored, because the pane fetches again when it opens and shows that failure itself.
    }
}

// Starts fetching the library while the user points at or focuses its toggle. Left out of 'prefetchAssistant' because
// the assistant opens without the library. Never rejects.
export async function prefetchLibrary(): Promise<void> {
    try {
        await loadLibraryPanel();
    } catch {
        // Ignored, because the pane fetches again when it opens and shows that failure itself.
    }
}
