// External Dependencies
import { type Component, h } from 'vue';

// Local (App) Framework
import ChunkLoadError from '@/components/ui/ChunkLoadError.vue';
import { complete, fail, isBlocking, start } from '@/state/navigation';

// Counter-based so concurrent non-route loads (dialogs, menus) don't cancel each other.
let _count = 0;

// Actions ─────────────────────────────────────────────────────────────────────────────────────────────────────────────

export function load(chunkName: string, importFunction: () => Promise<Component>): () => Promise<Component> {
    return async () => {
        // If a route navigation is already in progress it owns the loading state — don't interfere.
        const isRouteNav = isBlocking.value;
        if (!isRouteNav && _count++ === 0) start();

        return importFunction()
            .catch((error) => {
                _count = 0;
                fail();
                return { render: (): ReturnType<typeof h> => h(ChunkLoadError, { chunkName, error }) } as Component;
            })
            .finally(() => {
                if (import.meta.env.DEV) console.info(`[dpuse:app] ℹ️ Component '${chunkName}' loaded.`);
                if (!isRouteNav) {
                    _count = Math.max(0, _count - 1);
                    if (_count === 0) complete();
                }
            });
    };
}
