// ── Local Framework
import { whenRetrievalSettles } from '@/services/retrievalReady';
import { configRetrievalFailed, configRetrievalSucceeded } from '@/state/session';

// ── Composables ──────────────────────────────────────────────────────────────────────────────────────────────────────

// Resolves once configMonitor has either completed its initial handshake or exhausted its reconnect attempts. Await
// this before reading 'toolConfigs', 'presenterConfigs' or 'cookbookConfigs' — see 'whenRetrievalSettles'.
//
// Retrieval is started by configMonitor at application boot, so awaiting this never depends on which component mounted.
export function useConfigsReady(): Promise<void> {
    return whenRetrievalSettles(configRetrievalSucceeded, configRetrievalFailed);
}
