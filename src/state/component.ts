// External Dependencies
import { type Component, h } from 'vue';

// Local (App) Framework
import ChunkLoadError from '@/components/ui/ChunkLoadError.vue';
import { complete, fail, isNavigationActive, start } from '@/state/navigation';

// Counter-based so concurrent non-route loads (dialogs, menus) don't cancel each other.
let _count = 0;

// Actions ─────────────────────────────────────────────────────────────────────────────────────────────────────────────

export function load(chunkName: string, importFunction: () => Promise<Component>, simulateDelayMs = 0, simulateLoadError = false): () => Promise<Component> {
    return async () => {
        if (import.meta.env.DEV) console.info(`[dpuse:app] ℹ️ Loading '${chunkName}'...`, { simulateDelayMs, simulateLoadError });

        // If a route navigation is already in progress it owns the loading state — don't interfere.
        const isRouteNav = isNavigationActive.value;
        if (!isRouteNav && _count++ === 0) start();

        const importOrReject = (): Promise<Component> => {
            if (simulateLoadError) return Promise.reject<Component>(new Error('Simulated chunk load error.'));
            return importFunction();
        };
        const chunk = simulateDelayMs > 0
            ? new Promise<void>((resolve) => setTimeout(resolve, simulateDelayMs)).then(importOrReject)
            : importOrReject();

        return chunk
            .catch((error) => {
                _count = 0;
                fail();
                return { render: (): ReturnType<typeof h> => h(ChunkLoadError, { chunkName, error }) } as Component;
            })
            .finally(() => {
                if (!isRouteNav) {
                    _count = Math.max(0, _count - 1);
                    if (_count === 0) complete();
                }
            });
    };
}
