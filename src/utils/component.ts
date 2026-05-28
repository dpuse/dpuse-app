// External Dependencies
import { type Component, h } from 'vue';

// Local (App) Framework
import ChunkLoadError from '@/components/ui/ChunkLoadError.vue';
import { navLoadingState } from '@/state/appProgress';
import { completeBusy, failBusy, startBusy } from '@/state/appLoad';

// Actions ─────────────────────────────────────────────────────────────────────────────────────────────────────────────

export function load(chunkName: string, importFunction: () => Promise<Component>): () => Promise<Component> {
    return async () => {
        startBusy();
        return importFunction()
            .catch((error) => {
                if (navLoadingState.isBlocking.value) navLoadingState.fail();
                else failBusy();
                return { render: (): ReturnType<typeof h> => h(ChunkLoadError, { chunkName, error }) } as Component;
            })
            .finally(() => {
                if (import.meta.env.DEV) console.info(`[dpuse:app] ℹ️ Component '${chunkName}' loaded.`);
                completeBusy();
            });
    };
}
