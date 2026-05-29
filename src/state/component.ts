// External Dependencies
import { type Component, h } from 'vue';

// Local (App) Framework
import ChunkLoadError from '@/components/ui/ChunkLoadError.vue';
import { createLoadingState, type ReadableLoadingState, routeLoadingState } from '@/state/loading';

// State ───────────────────────────────────────────────────────────────────────────────────────────────────────────────

const _busyState = createLoadingState({ visibleDelayMs: 200, minVisibleMs: 350 });
let _busyCount = 0;

export const chunkLoadingState: ReadableLoadingState = _busyState;

// Actions ─────────────────────────────────────────────────────────────────────────────────────────────────────────────

export function load(chunkName: string, importFunction: () => Promise<Component>): () => Promise<Component> {
    return async () => {
        _busyCount++;
        _busyState.start();
        return importFunction()
            .catch((error) => {
                routeLoadingState.fail();
                _busyCount = 0;
                _busyState.fail();
                return { render: (): ReturnType<typeof h> => h(ChunkLoadError, { chunkName, error }) } as Component;
            })
            .finally(() => {
                if (import.meta.env.DEV) console.info(`[dpuse:app] ℹ️ Component '${chunkName}' loaded.`);
                _busyCount = Math.max(0, _busyCount - 1);
                if (_busyCount === 0) _busyState.complete();
            });
    };
}
