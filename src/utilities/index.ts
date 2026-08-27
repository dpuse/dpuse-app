// ── External Dependencies & Registrations
import { type AsyncComponentLoader, type Component, defineAsyncComponent, defineComponent } from 'vue';

// ── DPUse Tools
import type { BaseConfig } from '@dpuse/dpuse-shared';

// ── Static Components
import ComponentLoadFailure from '@/components/ui/error/ComponentLoadFailure.vue';
import ComponentLoadingSpinner from '@/components/ui/placeholder/ComponentLoadingSpinner.vue';

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

// How long a load must run before the spinner appears. Below this the load is over before the eye registers it, and
// showing anything reads as a flicker rather than as progress. Exported so the router can hold lazy route components to
// the same threshold, which it reaches by its own route rather than through 'defineAsyncPanel'.
export const VISIBLE_DELAY_MS = 150;

// ── Types ────────────────────────────────────────────────────────────────────────────────────────────────────────────

export interface AsyncPanelOptions {
    // Overlays and layout chrome — dialogs, menus, the pane splitter — must not be stood in for while they load. The
    // spinner sits in the normal flow, so in their place it either appears where an overlay never would or, for the
    // splitter, claims a full flex share and shoves the panes it divides. They are invisible until ready instead.
    hasPlaceholder?: boolean;
    simulation?: AsyncPanelSimulation;
}

// Development-only levers for exercising the loading spinner and the load-failure display, which a fast local
// connection otherwise never shows.
export interface AsyncPanelSimulation {
    delayMs?: number;
    failsToLoad?: boolean;
}

export interface ConfigOptionConfig<TIcon = string> extends Omit<BaseConfig, 'icon' | 'iconDark'> {
    icon: TIcon | null;
    iconDark: TIcon | null;
    to?: string;
    rightAligned?: boolean;
}

// ── Actions ──────────────────────────────────────────────────────────────────────────────────────────────────────────

export function assertDefined<T>(value: T | null | undefined, message = 'Expected value to be defined.'): T {
    if (value == null) throw new Error(message);
    return value;
}

// Replaces the Suspense + error/loading-spinner boilerplate with defineAsyncComponent's own
// loadingComponent/errorComponent options, so lazy panels don't depend on Suspense (unsupported in Vapor mode).
// defineAsyncComponent auto-passes `error` and `retry` to errorComponent, so only `name` is supplied via a prop
// default on an extended component rather than a hand-written render function (keeps this vapor-compilable).
export function defineAsyncPanel(loader: AsyncComponentLoader, name: string, options: AsyncPanelOptions = {}): Component {
    const { hasPlaceholder = true, simulation } = options;

    const errorComponent = defineComponent({
        extends: ComponentLoadFailure,
        props: { name: { type: String, default: () => name } }
    });

    // 'delay' is stated rather than left to defineAsyncComponent's own default of 200ms, which is a number this app
    // never chose. A failure is always shown, even where the load itself is not: it is the one thing the user has to
    // be told about, and appearing in the wrong place beats not appearing.
    const loadingComponent = hasPlaceholder ? ComponentLoadingSpinner : undefined;
    return defineAsyncComponent({ loader: buildLoader(loader, simulation), loadingComponent, delay: VISIBLE_DELAY_MS, errorComponent });
}

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

// A slow or failing chunk is the one thing about this that cannot be reproduced on a fast local connection, so the
// simulation is built in rather than left to be hand-edited into a call site and accidentally committed. Ignored
// outside development, so a stray flag cannot reach users. Route components have their own version of this in the
// router, driven by the URL, because they are loaded by the router rather than through 'defineAsyncPanel'.
function buildLoader(loader: AsyncComponentLoader, simulation?: AsyncPanelSimulation): AsyncComponentLoader {
    if (!simulation || !import.meta.env.DEV) return loader;

    return async () => {
        const { delayMs = 0, failsToLoad = false } = simulation;
        if (delayMs > 0) await new Promise<void>((resolve) => setTimeout(resolve, delayMs));
        if (failsToLoad) throw new Error('Simulated component load error.');
        return loader();
    };
}
