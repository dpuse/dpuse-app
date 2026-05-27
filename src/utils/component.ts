// External Dependencies
import { type AsyncComponentOptions, type Component, h } from 'vue';

// Local (App) Framework
import ChunkLoadError from '@/components/ui/ChunkLoadError.vue';
import { completeBusy, failBusy, failNavigation, isRouteChanging, startBusy } from '@/state/appProgress';

// Actions ─────────────────────────────────────────────────────────────────────────────────────────────────────────────

export function buildLoadOptions(chunkName: string, importFunction: () => Promise<Component>, simulateDelayMs = 0, simulateLoadError = false): AsyncComponentOptions<Component> {
    return { loader: load(chunkName, importFunction, simulateDelayMs, simulateLoadError) };
}

export function load(chunkName: string, importFunction: () => Promise<Component>, simulateDelayMs = 0, simulateLoadError = false): () => Promise<Component> {
    return async () => {
        console.log('LOADING:', chunkName, simulateDelayMs, simulateLoadError);
        startBusy();
        const importOrReject = (): Promise<Component> => {
            if (simulateLoadError) return Promise.reject<Component>(new Error('Simulated chunk load error.'));
            return importFunction();
        };
        const load = simulateDelayMs > 0 ? new Promise<void>((resolve) => setTimeout(resolve, simulateDelayMs)).then(importOrReject) : importOrReject();
        return load
            .catch((error) => {
                if (isRouteChanging.value) failNavigation();
                else failBusy();
                return { render: (): ReturnType<typeof h> => h(ChunkLoadError, { chunkName, error }) } as Component;
            })
            .finally(() => completeBusy());
    };
}
