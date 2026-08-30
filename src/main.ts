// ── External Dependencies & Registrations
import '@fontsource-variable/inter';
import { createApp } from 'vue';
import { z } from 'zod/v4'; // TODO: Required by Vercel AI SDK. Remove if we standardise on Tanstack AI.

// ── DPUse Framework
import { AppError } from '@dpuse/dpuse-shared/errors';

// ── Local Framework
import '@/assets/main.css';
import { createAppRouter } from '@/router';
import { isComponentLoaderErrorInfo, markStaleDeployError, raiseAppFailure, reportStaleDeployFailure } from '@/state/errors';
import { hasFault, throwOnFault } from '@/observability/faultInjection';
import { reportFatalError } from '@/observability/errorTracking';

// ── Static Components
import App from '@/App.vue';

// ── App Bootstrap ────────────────────────────────────────────────────────────────────────────────────────────────────

try {
    if (import.meta.env.DEV) throwOnFault('bootstrap'); // Before anything mounts, so the raw DOM banner is what answers.
    z.config({ jitless: true }); // TODO: Required by Vercel AI SDK. Remove if we standardise on Tanstack AI.

    // Add global error handlers. Shown, not just reported: an error thrown outside Vue — from a timer, a DOM listener,
    // a worker message — costs the user exactly what one thrown inside it does, and there is no region that could have
    // caught either.
    addEventListener('error', (event): void => {
        // 'colno', 'filename' and 'lineno' are captured even when an error object came with the event: a cross-origin
        // script gives no error object and only a bare 'Script error.' message, leaving no stack, so they are then
        // the only thing locating the failure.
        const data = { colno: event.colno, filename: event.filename, lineno: event.lineno, originalMessage: event.message, typeId: 'unhandledRuntime' };
        const cause = event.error instanceof Error ? event.error : new Error(event.message || 'Unknown error.');
        raiseAppFailure(new AppError('Unhandled error.', 'dpuse.main', data, { cause }));
    });
    addEventListener('unhandledrejection', (event): void => {
        const data = { typeId: 'unhandledPromiseRejection' };
        const cause = event.reason instanceof Error ? event.reason : new Error(String(event.reason ?? 'Unknown promise rejection error.'));
        raiseAppFailure(new AppError('Unhandled promise rejection.', 'dpuse.main', data, { cause }));

        // 'preventDefault' stops the browser logging the rejection itself, duplicating the console output the call
        // above has already produced. Production only: in development that browser reporting is what lets devtools
        // pause on the rejection.
        if (import.meta.env.PROD) event.preventDefault();
    });

    // Vite raises this when a dynamic import cannot be fetched, which in production means the running app is out of
    // date and the chunks it is asking for have been replaced by a newer deployment. Reported but not displayed: Vite
    // preloads chunks for screens the user may never open, so on its own this has cost them nothing. Whatever actually
    // needs the chunk fails in its own right, and shows it in the region that was waiting for it.
    //
    // Deliberately does not call 'preventDefault': Vite rethrows the original error only when the event is left
    // alone. Prevent it and Vite's 'baseModule().catch(handlePreloadError)' returns normally, so the failed import
    // resolves with 'undefined' rather than rejecting, so 'defineAsyncPanel' never renders its error component.
    // Letting it throw keeps that path working; 'reportStaleDeployFailure' drops the duplicate report that arrives
    // once the same failure is caught downstream.
    addEventListener('vite:preloadError', (event): void => {
        // Marked before anything else: this event is Vite telling us, with certainty, that the running deployment can
        // no longer fetch its own chunks. It carries the very error object it is about to rethrow, so whoever awaited
        // that import ends up wrapping a cause we have already recognised — no message matching required.
        markStaleDeployError(event.payload);

        const data = { typeId: 'vitePreloadError' };
        reportStaleDeployFailure(new AppError('Failed to load part of the app.', 'dpuse.main', data, { cause: event.payload }));
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
        // A lazy panel that failed to load is already displayed and reported by its own 'PanelLoadFailure'. Vue
        // reports it here as well, so without this every panel failure arrives twice: once precisely, in the panel's
        // own place, and once as 'Unhandled Vue error.' across the top of an app that is otherwise working.
        if (isComponentLoaderErrorInfo(info)) return;

        // Reaching here means no 'ErrorBoundary' contained the error, so there is no region left that could show it in
        // place. It goes to the app-level strip instead, which reports it and shows it whole — not over the app, which
        // is still standing and still the user's.
        const data = { componentName: instance?.$.type.name ?? undefined, info, typeId: 'unhandledVueRuntime' };
        const cause = error ?? 'Unknown Vue runtime error.';
        raiseAppFailure(new AppError('Unhandled Vue error.', 'dpuse.main', data, { cause }));
    };
    app.use(createAppRouter());
    app.mount('#app');

    // A preload nobody asked for. Raised here rather than at a call site because Vite is what normally fires it, and
    // deferred a tick so the app is mounted and the tester can see that nothing appears on screen.
    if (import.meta.env.DEV && hasFault('preload')) {
        setTimeout(() => {
            const event = new Event('vite:preloadError');
            Object.assign(event, { payload: new TypeError('Failed to fetch dynamically imported module: simulated preload failure.') });
            dispatchEvent(event);
        }, 0);
    }
} catch (error) {
    reportFatalError(error);
}
