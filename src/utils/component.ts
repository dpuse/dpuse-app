// External Dependencies
import type { Component } from 'vue';
import { h } from 'vue';

// Local (App) Framework
import ChunkLoadError from '~/src/components/ui/chunkLoadError/ChunkLoadError.vue';
import { completeBusy, startBusy } from '@/state/appProgress';

// Actions ─────────────────────────────────────────────────────────────────────────────────────────────────────────────

export function load(chunkName: string, importFunction: () => Promise<Component>, delayMs = 0): () => Promise<Component> {
    return async () => {
        startBusy();
        const load = delayMs > 0 ? new Promise<void>((resolve) => setTimeout(resolve, delayMs)).then(() => importFunction()) : importFunction();
        return load.catch((error) => ({ render: (): ReturnType<typeof h> => h(ChunkLoadError, { chunkName, error }) }) as Component).finally(() => completeBusy());
    };
}
