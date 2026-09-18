// ── External Dependencies & Registrations
import '@fontsource-variable/inter';
import { createApp } from 'vue';

// ── DPUse Framework
import { AppError } from '@dpuse/dpuse-shared/errors';

// ── Local Framework
import '@/assets/main.css';
import { createAppRouter } from '@/router';
import { reportFatalError } from '@/observability/errorTracking';
import { hasFault, throwOnFault } from '@/observability/faultInjection';
import { isComponentLoaderErrorInfo, markStaleDeployError, raiseAppFailure, reportStaleDeployFailure } from '@/state/errors';

// ── Static Components
import App from '@/App.vue';

// ── App Bootstrap ────────────────────────────────────────────────────────────────────────────────────────────────────

try {
    if (import.meta.env.DEV) throwOnFault('bootstrap'); // Thrown before mount, so the plain DOM fallback banner shows.

    // Errors thrown outside Vue (timers, DOM listeners, worker messages) are shown as well as reported, because no
    // region exists that could catch them.
    addEventListener('error', (event): void => {
        // No error object and no file means a script from outside the app threw, such as a browser extension or
        // Safari's share sheet, and the browser hid its details. The app's own errors always carry a file.
        if (event.error == null && !event.filename) {
            console.warn('[dpuse:app] Ignored an error from a script outside the app.', event.message);
            return;
        }

        // Position is kept because an error without a stack has nothing else to locate it.
        const data = { colno: event.colno, filename: event.filename, lineno: event.lineno, originalMessage: event.message, typeId: 'unhandledRuntime' };
        const cause = event.error instanceof Error ? event.error : new Error(event.message || 'Unknown error.');
        raiseAppFailure(new AppError('Unhandled error.', 'dpuse.main', data, { cause }));
    });
    addEventListener('unhandledrejection', (event): void => {
        const data = { typeId: 'unhandledPromiseRejection' };
        const cause = event.reason instanceof Error ? event.reason : new Error(String(event.reason ?? 'Unknown promise rejection error.'));
        raiseAppFailure(new AppError('Unhandled promise rejection.', 'dpuse.main', data, { cause }));

        // Stops the browser logging the rejection a second time. Production only, because devtools needs that log to
        // pause on the rejection.
        if (import.meta.env.PROD) event.preventDefault();
    });

    // Vite raises this when a chunk cannot be fetched, which in production means a newer deployment replaced it.
    // Reported but not shown, because the chunk may be a preload for a screen the user never opens; anything that
    // needs it shows its own error.
    //
    // No 'preventDefault': Vite rethrows the error only when the event is left alone, and that rethrow is what makes
    // 'defineAsyncPanel' render its error component. 'reportStaleDeployFailure' drops the duplicate report that follows.
    addEventListener('vite:preloadError', (event): void => {
        // Marked first, so code awaiting the import recognises the rethrown error as a stale deploy without matching
        // its message.
        markStaleDeployError(event.payload);

        const data = { typeId: 'vitePreloadError' };
        reportStaleDeployFailure(new AppError('Failed to load part of the app.', 'dpuse.main', data, { cause: event.payload }));
    });

    if (trustedTypes != null) {
        trustedTypes.createPolicy('default', {
            // Allows the blob URLs that Vite's '?worker&inline' uses to start workers. Any other script URL is
            // unexpected and throws; as the default policy this covers libraries too, so a library loading a script by
            // URL fails here.
            createScriptURL: (url: string): string => {
                if (url.startsWith('blob:')) return url;
                throw new Error(`Blocked TrustedScriptURL: ${url}`);
            },
            // Lets libraries write markup they generate themselves, such as squire-rte, Unovis and turndown.
            // Libraries with their own policy, such as Highcharts, are allowed by name in the CSP 'trusted-types' list.
            createHTML: (html: string): string => html
        });
    }

    // Create and mount the app.
    const app = createApp(App);
    app.config.errorHandler = (error, instance, info): void => {
        // A lazy panel that failed to load already shows and reports the error in its 'LoadFailureNotice'.
        if (isComponentLoaderErrorInfo(info)) return;

        // No 'ErrorBoundary' caught the error, so the app-level strip reports it without covering the app.
        const data = { componentName: instance?.$.type.name ?? undefined, info, typeId: 'unhandledVueRuntime' };
        const cause = error ?? 'Unknown Vue runtime error.';
        raiseAppFailure(new AppError('Unhandled Vue error.', 'dpuse.main', data, { cause }));
    };
    app.use(createAppRouter());
    app.mount('#app');

    // Simulates a Vite preload failure after mount, to check that nothing appears on screen.
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
