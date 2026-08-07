import { type AsyncComponentLoader, type Component, defineAsyncComponent, defineComponent } from 'vue';

import ComponentLoadError from './ComponentLoadError.vue';
import ComponentLoadingSpinner from './placeholders/ComponentLoadingSpinner.vue';

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
