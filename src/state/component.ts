// ── External Dependencies & Registrations
import { type Component, h } from 'vue';

// ── Local (App) Framework
import ComponentLoadError from '@/components/ui/ComponentLoadError.vue';
import { complete, fail, navigationIsActive, start } from '@/state/navigation';

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

// Shared across every `load()` call so concurrent non-route loads (dialogs, menus) don't cancel each other.
const state: { activeLoadCount: number } = { activeLoadCount: 0 };

// ── Actions ──────────────────────────────────────────────────────────────────────────────────────────────────────────

export function load(name: string, importFunction: () => Promise<Component>, simulateDelayMs = 0, isSimulatedLoadError = false): () => Promise<Component> {
    const importOrReject = (): Promise<Component> => {
        if (isSimulatedLoadError) return Promise.reject<Component>(new Error('Simulated component load error.'));
        return importFunction();
    };

    return async () => {
        if (import.meta.env.DEV) console.info(`[dpuse:app] ℹ️  Component '${name}' loaded.`);

        // If a route navigation is already in progress it owns the loading state — don't interfere.
        const isNavigationActive = navigationIsActive.value;
        if (!isNavigationActive && state.activeLoadCount++ === 0) start();

        try {
            if (simulateDelayMs > 0) await new Promise<void>((resolve) => setTimeout(resolve, simulateDelayMs));
            return await importOrReject();
        } catch (error) {
            state.activeLoadCount = 0;
            fail();
            return { render: (): ReturnType<typeof h> => h(ComponentLoadError, { name, error }) } as Component;
        } finally {
            if (!isNavigationActive) {
                state.activeLoadCount = Math.max(0, state.activeLoadCount - 1);
                if (state.activeLoadCount === 0) complete();
            }
        }
    };
}
