// ── External Dependencies & Registrations
import { type AsyncComponentLoader, type Component, type ComponentPublicInstance, defineAsyncComponent, defineComponent, h, ref, type VNode } from 'vue';

// ── DPUse Tools
import type { BaseConfig } from '@dpuse/dpuse-shared';
import type { ConnectorConfig } from '@dpuse/dpuse-shared/component/module/connector';
import type { CookbookConfig } from '@dpuse/dpuse-shared/component/module/cookbook';
import type { PresenterConfig } from '@dpuse/dpuse-shared/component/module/presenter';
import type { ToolConfig } from '@dpuse/dpuse-shared/component/module/tool';

// ── Local Framework
import { throwOnFault, throwOnStaleFault } from '@/observability/faultInjection';

// ── Static Components
import LoadFailureNotice from '@/components/ui/error/LoadFailureNotice.vue';
import ComponentLoadingSpinner from '@/components/ui/placeholder/ComponentLoadingSpinner.vue';

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

// How long a load must run before the spinner appears. Below this the load is over before the eye registers it, and
// showing anything reads as a flicker rather than as progress. Exported so the router can hold lazy route components to
// the same threshold, which it reaches by its own route rather than through 'defineAsyncPanel'.
export const VISIBLE_DELAY_MS = 150;

// ── Types ────────────────────────────────────────────────────────────────────────────────────────────────────────────

export interface AsyncPanelOptions {
    // For an overlay, which has no region for its failure to stand in: in its place the failure would squeeze into
    // whatever the overlay is anchored to, which is a badge at best. It is shown as a modal instead, and dismissing it
    // calls 'onDismiss' so the overlay's open state closes with it.
    failureOwnsScreen?: { onDismiss: () => void };
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

export interface SetupOptionConfig<TIcon = string> extends Omit<BaseConfig, 'icon' | 'iconDark'> {
    icon: TIcon | null;
    iconDark: TIcon | null;
    to?: string;
    rightAligned?: boolean;
}

// The module types that are dynamically loaded and executable in their own right, as listed under 'Manage
// Configuration'. A union rather than 'ModuleConfig' so that each panel can narrow on 'typeId' and reach its own fields.
export type PluginConfig = ConnectorConfig | CookbookConfig | PresenterConfig | ToolConfig;

// ── Actions ──────────────────────────────────────────────────────────────────────────────────────────────────────────

export function assertDefined<T>(value: T | null | undefined, message = 'Expected value to be defined.'): T {
    if (value == null) throw new Error(message);
    return value;
}

// Trailing-edge only: each call resets the timer, so only the last call within 'delayMs' of silence actually runs.
// 'cancel' drops a pending call outright — call it from 'onUnmounted' when a caller keeps the debounced function
// around past a single render.
export function debounce<Arguments extends unknown[]>(function_: (...arguments_: Arguments) => void, delayMs: number): ((...arguments_: Arguments) => void) & { cancel: () => void } {
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    function debounced(...arguments_: Arguments): void {
        if (timeoutId !== undefined) clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
            timeoutId = undefined;
            function_(...arguments_);
        }, delayMs);
    }

    debounced.cancel = (): void => {
        if (timeoutId !== undefined) clearTimeout(timeoutId);
        timeoutId = undefined;
    };

    return debounced;
}

// Replaces the Suspense + error/loading-spinner boilerplate with defineAsyncComponent's own
// loadingComponent/errorComponent options, so lazy panels don't depend on Suspense (unsupported in Vapor mode).
// 'defineAsyncComponent' passes its error component only the error — not the 'retry' its own options document — so
// the retry offered to the user is built here instead.
export function defineAsyncPanel(loader: AsyncComponentLoader, name: string, options: AsyncPanelOptions = {}): Component {
    const { failureOwnsScreen, hasPlaceholder = true, simulation } = options;

    // Bumping this remounts the panel, which is what makes a retry actually fetch again: Vue drops its cached request
    // as soon as a load fails, so a fresh mount is a fresh attempt rather than a replay of the failure. The failure
    // display cannot do this itself — it is rendered inside the very component that has to be remounted, which is why
    // the counter lives out here. Shared by every instance of this panel, which in practice means the one.
    const attempt = ref(0);

    // A functional component rather than 'defineComponent({ extends: LoadFailureNotice, props: { name } })'. That
    // reads correctly and is silently inert: Vue takes 'setup' from the component's own definition, and 'extends' does
    // not put it there, so the base's template was inherited while none of its script ran — no display, no report.
    // Forwarding the props by hand is what makes the failure component actually run.
    const errorComponent = (failureProperties: { error: unknown }): VNode => h(LoadFailureNotice, { ...failureProperties, name, onDismiss: failureOwnsScreen?.onDismiss, ownsScreen: failureOwnsScreen != null, retry: () => attempt.value++ });

    // 'delay' is stated rather than left to defineAsyncComponent's own default of 200ms, which is a number this app
    // never chose. A failure is always shown, even where the load itself is not: it is the one thing the user has to
    // be told about, and appearing in the wrong place beats not appearing.
    const loadingComponent = hasPlaceholder ? ComponentLoadingSpinner : undefined;
    const asyncComponent = defineAsyncComponent({ loader: buildLoader(loader, name, simulation), loadingComponent, delay: VISIBLE_DELAY_MS, errorComponent });

    // Wrapped only to hold the key, since a component cannot key itself. Attributes are forwarded by hand with
    // fallthrough switched off, so what the caller passes lands on the panel once rather than on both.
    return defineComponent({
        name: `${name}Host`,
        inheritAttrs: false,
        setup(_properties, { attrs, expose, slots }) {
            // A template ref on a panel has to be forwarded by hand as well, and cannot go through 'attrs': Vue takes
            // 'ref' off the vnode before the wrapper ever sees it, so a caller's ref lands on this host — which exposes
            // nothing of its own — rather than on the panel. Holding the panel's instance and re-exposing it is what
            // keeps the panel's 'defineExpose' reachable from the call site.
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

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

// A slow or failing chunk is the one thing about this that cannot be reproduced on a fast local connection, so the
// simulation is built in rather than left to be hand-edited into a call site and accidentally committed. Ignored
// outside development, so a stray flag cannot reach users. Route components have their own version of this in the
// router, because they are loaded by the router rather than through 'defineAsyncPanel'.
//
// The '?fault=panel' faults apply to every panel at once unless one is named — '?fault=panel:ChatPanel'. Naming one is
// what makes a panel nested inside another reachable: without it the outer panel fails first and the inner one never
// loads, so its failure can never be seen.
function buildLoader(loader: AsyncComponentLoader, name: string, simulation?: AsyncPanelSimulation): AsyncComponentLoader {
    if (!import.meta.env.DEV) return loader;

    return async () => {
        throwOnFault('panel', name, `Simulated ${name} load failure.`);
        throwOnStaleFault('panel-stale', name);
        if (!simulation) return loader();

        const { delayMs = 0, failsToLoad = false } = simulation;
        if (delayMs > 0) await new Promise<void>((resolve) => setTimeout(resolve, delayMs));
        if (failsToLoad) throw new Error('Simulated component load error.');
        return loader();
    };
}
