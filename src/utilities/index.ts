// ── External Dependencies & Registrations
import { promiseTimeout } from '@vueuse/core';
import { type AsyncComponentLoader, type Component, type ComponentPublicInstance, defineAsyncComponent, defineComponent, h, ref, type VNode } from 'vue';

// ── DPUse Framework
import type { BaseConfig, ConnectorConfig, CookbookConfig, PresenterConfig, ToolConfig } from '@dpuse/dpuse-shared';

// ── Local Framework
import { throwOnFault, throwOnStaleFault } from '@/observability/faultInjection';

// ── Static Components
import ComponentLoadingSpinner from '@/components/ui/placeholder/ComponentLoadingSpinner.vue';
import LoadFailureNotice from '@/components/ui/error/LoadFailureNotice.vue';

// ── Types ────────────────────────────────────────────────────────────────────────────────────────────────────────────

export interface LazyComponentOptions {
    // An overlay has no region of its own to show a load failure in, so its failure is shown as a modal. Dismissing
    // the modal calls 'onDismiss', which closes the overlay too.
    failureOwnsScreen?: { onDismiss: () => void };
    // False for overlays and layout parts, such as dialogs, menus and the pane splitter. The spinner takes up space in
    // the page, so it would appear where an overlay never does, or push apart the panes the splitter divides.
    hasPlaceholder?: boolean;
    simulation?: AsyncPanelSimulation;
}

// Development-only settings that slow or fail a load, because a fast local connection never shows the spinner or the
// failure display.
export interface AsyncPanelSimulation {
    delayMs?: number;
    failsToLoad?: boolean;
}

export interface SetupOptionConfig<TIcon = string> extends Omit<BaseConfig, 'icon' | 'iconDark'> {
    icon: TIcon | null;
    iconDark: TIcon | null;
    to?: string;
    rightAligned?: boolean;
}

// The module types loaded at run time, as listed under 'Manage Configuration'. A union rather than 'ModuleConfig', so
// each panel can narrow on 'typeId' and reach its own fields.
export type PluginConfig = ConnectorConfig | CookbookConfig | PresenterConfig | ToolConfig;

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

// How long a load runs before the spinner appears, so a fast load does not flash one. Exported so the router's lazy
// route components wait just as long.
export const VISIBLE_DELAY_MS = 150;

// ── Actions ──────────────────────────────────────────────────────────────────────────────────────────────────────────

export function assertDefined<T>(value: T | null | undefined, message = 'Expected value to be defined.'): T {
    if (value == null) throw new Error(message);
    return value;
}

// Uses the loading and error options of 'defineAsyncComponent' rather than 'Suspense', which Vapor mode does not
// support. Vue passes the error component only the error, not a retry, so the retry is built here.
export function defineLazyComponent(loader: AsyncComponentLoader, name: string, options: LazyComponentOptions = {}): Component {
    const { failureOwnsScreen, hasPlaceholder = true, simulation } = options;

    // Vue forgets a failed load, so remounting the panel fetches it again. A retry bumps this counter, which is the
    // panel's key. It lives here because the failure display sits inside the panel being remounted.
    const attempt = ref(0);

    // A function rather than a component that extends 'LoadFailureNotice'. 'extends' would copy the template but not
    // 'setup', so the failure would be neither shown nor reported.
    const errorComponent = (failureProperties: { error: unknown }): VNode =>
        h(LoadFailureNotice, { ...failureProperties, name, onDismiss: failureOwnsScreen?.onDismiss, ownsScreen: failureOwnsScreen != null, retry: () => attempt.value++ });

    // 'delay' replaces Vue's default of 200ms, so every spinner in the app waits the same time. A failure is shown
    // even when no spinner is, because the user must always be told.
    const loadingComponent = hasPlaceholder ? ComponentLoadingSpinner : undefined;
    const asyncComponent = defineAsyncComponent({ loader: buildLoader(loader, name, simulation), loadingComponent, delay: VISIBLE_DELAY_MS, errorComponent });

    // A wrapper, because a component cannot set its own key. Attributes are passed on by hand with fallthrough off,
    // so they reach the panel once rather than twice.
    return defineComponent({
        name: `${name}Host`,
        inheritAttrs: false,
        setup(_properties, { attrs, expose, slots }) {
            // Vue removes 'ref' before the wrapper sees it, so a caller's template ref lands on the wrapper. The
            // wrapper exposes the panel's instance, so the panel's 'defineExpose' is still reachable.
            const panel = ref<ComponentPublicInstance | null>(null);

            expose(
                new Proxy(
                    {},
                    {
                        get: (_target, key): unknown => (panel.value as unknown as Record<string | symbol, unknown> | null)?.[key],
                        has: (_target, key): boolean => panel.value != null && Reflect.has(panel.value, key)
                    }
                )
            );

            return () => h(asyncComponent, { ...attrs, key: attempt.value, ref: panel }, slots);
        }
    });
}

// Read from the user agent because no feature test tells Safari apart. iPadOS Safari reports itself as macOS, and every
// iOS browser also names Safari, so the other browsers are excluded by their own tokens.
export function isSafariBrowser(): boolean {
    return /^(?:(?!chrome|chromium|android|crios|edgios|fxios).)*safari/i.test(navigator.userAgent);
}

// Callers that arrive while a load is running share it, and a load that succeeded is kept. A failed load is dropped,
// because a rejected promise would hand the same failure to every retry.
export function shareLoad<T>(load: () => Promise<T>): () => Promise<T> {
    const state: { pendingLoad: Promise<T> | undefined } = { pendingLoad: undefined };
    return (): Promise<T> => {
        if (state.pendingLoad != null) return state.pendingLoad;
        const pendingLoad = load();
        state.pendingLoad = pendingLoad;
        void pendingLoad.catch(() => {
            state.pendingLoad = undefined;
        });
        return pendingLoad;
    };
}

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

// Adds the development-only faults and simulation, so a slow or failing load can be tried without editing a call site.
// Route components have their own version in the router.
//
// '?fault=panel' fails every panel unless one is named, as in '?fault=panel:ChatPanel'. Naming one is the only way to
// fail a panel nested inside another, because otherwise the outer panel fails first.
function buildLoader(loader: AsyncComponentLoader, name: string, simulation?: AsyncPanelSimulation): AsyncComponentLoader {
    if (!import.meta.env.DEV) return loader;

    return async () => {
        throwOnFault('panel', name, `Simulated ${name} load failure.`);
        throwOnStaleFault('panel-stale', name);
        if (!simulation) return loader();

        const { delayMs = 0, failsToLoad = false } = simulation;
        if (delayMs > 0) await promiseTimeout(delayMs);
        if (failsToLoad) throw new Error('Simulated component load error.');
        return loader();
    };
}
