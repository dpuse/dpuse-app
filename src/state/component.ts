// External Dependencies & Registrations
import { type Component, h } from 'vue';

// Local (App) Framework
import ComponentLoadError from '@/components/ui/ComponentLoadError.vue';
import { complete, fail, isNavigationActive, start } from '@/state/navigation';

// State ───────────────────────────────────────────────────────────────────────────────────────────────────────────────

let activeLoadCount = 0; // Counter-based so concurrent non-route loads (dialogs, menus) don't cancel each other.

// Actions ─────────────────────────────────────────────────────────────────────────────────────────────────────────────

export function load(name: string, importFunction: () => Promise<Component>, simulateDelayMs = 0, simulateLoadError = false): () => Promise<Component> {
    return async () => {
        if (import.meta.env.DEV) console.info(`[dpuse:app] ℹ️  Component '${name}' loaded.`);

        // If a route navigation is already in progress it owns the loading state — don't interfere.
        const isThisNavigationActive = isNavigationActive.value;
        if (!isThisNavigationActive && activeLoadCount++ === 0) start();

        const importOrReject = (): Promise<Component> => {
            if (simulateLoadError) return Promise.reject<Component>(new Error('Simulated component load error.'));
            return importFunction();
        };
        const component = simulateDelayMs > 0 ? new Promise<void>((resolve) => setTimeout(resolve, simulateDelayMs)).then(importOrReject) : importOrReject();

        return component
            .catch((error) => {
                activeLoadCount = 0;
                fail();
                return { render: (): ReturnType<typeof h> => h(ComponentLoadError, { name, error }) } as Component;
            })
            .finally(() => {
                if (!isThisNavigationActive) {
                    activeLoadCount = Math.max(0, activeLoadCount - 1);
                    if (activeLoadCount === 0) complete();
                }
            });
    };
}
