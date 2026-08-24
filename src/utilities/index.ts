// ── External Dependencies & Registrations
import { type AsyncComponentLoader, type Component, defineAsyncComponent, defineComponent } from 'vue';

// ── DPUse Tools
import type { BaseConfig } from '@dpuse/dpuse-shared';

// ── Static Components
import ComponentLoadError from '@/components/ui/ComponentLoadError.vue';
import ComponentLoadingSpinner from '@/components/ui/placeholder/ComponentLoadingSpinner.vue';

// ── Types ────────────────────────────────────────────────────────────────────────────────────────────────────────────

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

// Replaces the Suspense + ComponentLoadError/loading-spinner boilerplate with defineAsyncComponent's own
// loadingComponent/errorComponent options, so lazy panels don't depend on Suspense (unsupported in Vapor mode).
// defineAsyncComponent only auto-passes `error` to errorComponent, so `name` is supplied via a prop default
// on an extended component rather than a hand-written render function (keeps this vapor-compilable).
export function defineAsyncPanel(loader: AsyncComponentLoader, name: string): Component {
    const errorComponent = defineComponent({
        extends: ComponentLoadError,
        props: { name: { type: String, default: () => name } }
    });

    return defineAsyncComponent({ loader, loadingComponent: ComponentLoadingSpinner, errorComponent });
}
