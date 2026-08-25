// ── Local Framework
import { whenRetrievalSettles } from '@/services/retrievalReady';
import { dataViewRetrievalFailed, dataViewRetrievalSucceeded } from '@/state/dataViews';

// ── Composables ──────────────────────────────────────────────────────────────────────────────────────────────────────

// Resolves once a data view retrieval attempt has completed. Await this before reading 'dataViewConfigs' — see
// 'whenRetrievalSettles'.
//
// Retrieval is started by the meta store connection watcher in '@/state/dataViews', which registers when that module is
// imported, so awaiting this never depends on which component mounted.
export function useDataViewsReady(): Promise<void> {
    return whenRetrievalSettles(dataViewRetrievalSucceeded, dataViewRetrievalFailed);
}
