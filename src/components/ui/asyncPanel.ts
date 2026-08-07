import { type AsyncComponentLoader, type Component, defineAsyncComponent, defineComponent, h, type VNode } from 'vue';

import ComponentLoadError from './ComponentLoadError.vue';
import ComponentLoadingSpinner from './placeholders/ComponentLoadingSpinner.vue';

// Replaces the Suspense + ComponentLoadError/loading-spinner boilerplate with defineAsyncComponent's own
// loadingComponent/errorComponent options, so lazy panels don't depend on Suspense (unsupported in Vapor mode).
export function defineAsyncPanel(loader: AsyncComponentLoader, name: string): Component {
    const errorComponent = defineComponent({
        props: { error: { type: null, required: true } },
        setup: (properties): (() => VNode) =>
            () =>
                h(ComponentLoadError, { name, error: properties.error })
    });

    return defineAsyncComponent({ loader, loadingComponent: ComponentLoadingSpinner, errorComponent });
}
