// ── External Dependencies & Registrations
import { type Ref, watch } from 'vue';

// ── Actions ──────────────────────────────────────────────────────────────────────────────────────────────────────────

// Shared body of the retrieval 'ready' composables ('useConfigsReady', 'useDataViewsReady'): resolves once a retrieval
// has either succeeded or failed, then stops watching. Callers await one of those composables before reading a
// configuration collection, since every collection starts empty and an empty collection is indistinguishable from one
// that legitimately contains no entries.
//
// Resolves rather than rejects on failure — a caller cannot recover from a failed retrieval, and each retrieval
// surfaces its own failure to the user, so awaiting code simply proceeds and lets its own load attempt fail naturally.
export function whenRetrievalSettles(retrievalSucceeded: Ref<boolean>, retrievalFailed: Ref<boolean>): Promise<void> {
    if (retrievalSucceeded.value || retrievalFailed.value) return Promise.resolve();

    return new Promise<void>((resolve) => {
        const stopWatching = watch([retrievalSucceeded, retrievalFailed], ([newRetrievalSucceeded, newRetrievalFailed]) => {
            if (!newRetrievalSucceeded && !newRetrievalFailed) return;
            stopWatching();
            resolve();
        });
    });
}
