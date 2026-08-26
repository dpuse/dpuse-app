// ── External Dependencies & Registrations
import '@fontsource-variable/inter';
import { createApp } from 'vue';
import { z } from 'zod/v4'; // TODO: Required by Vercel AI SDK. Remove if we standardise on Tanstack AI.

// ── DPUse Framework
import { AppError } from '@dpuse/dpuse-shared/errors';

// ── Local Framework
import '@/assets/main.css';
import { createAppRouter } from '@/router';
import { raiseAppLevelError, raiseStaleDeployFailure } from '@/state/errors';
import { reportAppError, reportFatalError } from '@/observability/errorTracking';

// ── Static Components
import App from '@/App.vue';

// ── App Bootstrap ────────────────────────────────────────────────────────────────────────────────────────────────────

try {
    z.config({ jitless: true }); // TODO: Required by Vercel AI SDK. Remove if we standardise on Tanstack AI.

    // Add global error handlers.
    addEventListener('error', (event): void => {
        // 'colno', 'filename' and 'lineno' are captured even when an error object came with the event: a cross-origin
        // script gives no error object and only a bare 'Script error.' message, leaving no stack, so they are then
        // the only thing locating the failure.
        const data = { colno: event.colno, filename: event.filename, lineno: event.lineno, originalMessage: event.message, typeId: 'unhandledRuntime' };
        const cause = event.error instanceof Error ? event.error : new Error(event.message || 'Unknown error.');
        void reportAppError(new AppError('Unhandled error.', 'dpuse.main', data, { cause }));
    });
    addEventListener('unhandledrejection', (event): void => {
        const data = { typeId: 'unhandledPromiseRejection' };
        const cause = event.reason instanceof Error ? event.reason : new Error(String(event.reason ?? 'Unknown promise rejection error.'));
        void reportAppError(new AppError('Unhandled promise rejection.', 'dpuse.main', data, { cause }));

        // 'preventDefault' stops the browser logging the rejection itself, duplicating the console output the call
        // above has already produced. Production only: in development that browser reporting is what lets devtools
        // pause on the rejection.
        if (import.meta.env.PROD) event.preventDefault();
    });

    // Vite raises this when a dynamic import cannot be fetched, which in production means the running app is out of
    // date and the chunks it is asking for have been replaced by a newer deployment. Only a refresh clears it, so it
    // goes straight to the service failure banner and is never rendered inside a panel — a panel may be exactly what
    // failed to load.
    //
    // Deliberately does not call 'preventDefault': Vite rethrows the original error only when the event is left
    // alone. Prevent it and Vite's 'baseModule().catch(handlePreloadError)' returns normally, so the failed import
    // resolves with 'undefined' rather than rejecting, so 'defineAsyncPanel' never renders its error component.
    // Letting it throw keeps that path working; 'raiseStaleDeployFailure' drops the duplicate report that arrives
    // once the same failure is caught downstream.
    addEventListener('vite:preloadError', (event): void => {
        const data = { typeId: 'vitePreloadError' };
        raiseStaleDeployFailure(new AppError('Failed to load part of the app.', 'dpuse.main', data, { cause: event.payload }));
    });

    if (trustedTypes != null) {
        trustedTypes.createPolicy('default', {
            // Allow inline worker blob URLs created by Vite's `?worker&inline` transform. Without this,
            // `require-trusted-types-for 'script'` blocks `new Worker(blobUrl)` because the URL is a plain string.
            //
            // The throw below is deliberate: nothing else should be reaching a script-URL sink, so anything that does
            // is a change worth noticing rather than waving through. Being the default policy, it covers third-party
            // code too — so if a library ever loads a script by URL, the throw surfaces inside that library rather
            // than anywhere in this file, and this is the line to look at.
            createScriptURL: (url: string): string => {
                if (url.startsWith('blob:')) return url;
                throw new Error(`Blocked TrustedScriptURL: ${url}`);
            },
            // Exists only because `require-trusted-types-for 'script'` would otherwise make third-party code throw
            // when it writes markup it generated itself into a Trusted Types sink — squire-rte's undo/redo, Unovis's
            // pattern defs, and turndown's native-parser probe behind the markdown tool — none of which can be fixed
            // from here. Libraries that build nodes rather than parse strings never reach a sink and need nothing:
            // Observable Plot, and TanStack's `vue-table` and `vue-virtual`. Ones that manage their own policy, such
            // as Highcharts, are allowed by name in the CSP `trusted-types` list instead.
            createHTML: (html: string): string => html
        });
    }

    // Create and mount application.
    const app = createApp(App);
    app.config.errorHandler = (error, instance, info): void => {
        // Reaching here means no 'ErrorBoundary' contained the error, so there is no region left that could show it in
        // place — it is treated as fatal unless the error itself says otherwise.
        const data = { componentName: instance?.$.type.name ?? undefined, info, typeId: 'unhandledVueRuntime' };
        const cause = error ?? 'Unknown Vue runtime error.';
        raiseAppLevelError(new AppError('Unhandled Vue error.', 'dpuse.main', data, { cause }));
    };
    app.use(createAppRouter());
    app.mount('#app');
} catch (error) {
    reportFatalError(error);
}
