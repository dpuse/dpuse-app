// ── External Dependencies & Registrations
import { computed, type ComputedRef, type Ref, shallowReactive } from 'vue';
import { QueryCache, QueryClient } from '@tanstack/vue-query';

// ── DPUse Framework
import { AppError } from '@dpuse/dpuse-shared';

// ── Local Framework
import { type AppFailure, raiseFailure } from '@/state/errors';

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

// The failure raised for each failed fetch, keyed by the error the query holds. Raised in the cache's 'onError', which
// runs once per failed fetch however many components show the query, so a remount or a second reader never reports it
// again. Reactive, so a component reading it does not depend on whether the cache or the query updates first.
const queryFailures = shallowReactive(new WeakMap<Error, AppFailure>());

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
            retry: false // A failure is shown with its Retry button at once, rather than after several silent attempts.
        }
    }
});

// ── Composables ──────────────────────────────────────────────────────────────────────────────────────────────────────

// The failure to show for a query's error, for an 'ErrorNotice'.
export function useQueryFailure(error: Ref<Error | null>): ComputedRef<AppFailure | undefined> {
    return computed(() => (error.value == null ? undefined : queryFailures.get(error.value)));
}
