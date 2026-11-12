// ── External Dependencies & Registrations
import { computed, type ComputedRef, type Ref, shallowReactive } from 'vue';
import { QueryCache, QueryClient } from '@tanstack/vue-query';

// ── DPUse Framework
import { AppError } from '@dpuse/dpuse-shared';

// ── Local Framework
import { type AppFailure, raiseFailure } from '@/state/errors';

// ── Composables ──────────────────────────────────────────────────────────────────────────────────────────────────────

// The failure to show for a query's error, for an 'ErrorNotice'.
export function useQueryFailure(error: Ref<Error | null>): ComputedRef<AppFailure | undefined> {
    return computed(() => (error.value == null ? undefined : queryFailures.get(error.value)));
}

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

// The failure raised for each failed fetch, keyed by the error the query holds. Raised in the cache's 'onError', which
// runs once per failed fetch however many components show the query, so a remount or a second reader never reports it
// again. Reactive, so a component reading it does not depend on whether the cache or the query updates first.
const queryFailures = shallowReactive(new WeakMap<Error, AppFailure>());

// TODO: Revisit Pinia Colada if the app adopts Pinia. On 2026-11-12 it was compared with Vue Query: Colada 1.4.9 with
// Pinia is about 7.5 KB gzipped against 12.3 KB, and covers every feature the app uses. It has no built-in retry,
// 'select' or structural sharing. In a browser benchmark with up to 100,000 records, refetching took 0.2 ms in both
// once structural sharing was off here, and Colada was a few ms faster with 200 components on one query. Vue Query
// stays because Colada needs Pinia, which the app does not use, and the small gain does not justify a migration.
export const queryClient = new QueryClient({
    queryCache: new QueryCache({
        onError: (error): void => {
            const appError = error instanceof AppError ? error : new AppError('Failed to load data.', 'dpuse-app.queryClient.onError', { typeId: 'handled' }, { cause: error });
            queryFailures.set(error, raiseFailure(appError));
        }
    }),
    defaultOptions: {
        queries: {
            // The app's data comes through the engine, mostly from stores in the browser, so neither the network coming
            // back nor the window regaining focus says anything about whether it has changed.
            refetchOnReconnect: false,
            refetchOnWindowFocus: false,
            retry: false, // A failure is shown with its Retry button at once, rather than after several silent attempts.
            // Cached data is handed out as the plain objects themselves. By default Vue Query wraps every nested object
            // in a read-only proxy, which the engine worker's 'postMessage' cannot copy, so saving it back would fail.
            shallow: true,
            // Each refetch keeps the new data as fetched. By default Vue Query compares it, object by object, with the
            // cached data to keep unchanged objects, which blocks the page for about 3 ms per 1,000 records.
            structuralSharing: false
        },
        mutations: { shallow: true }
    }
});
