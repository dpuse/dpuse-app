// ── External Dependencies & Registrations
import '@fontsource-variable/inter/opsz.css'; // Includes the optical-size axis, which sharpens small text.
import { createApp } from 'vue';
import { VueQueryPlugin } from '@tanstack/vue-query';

// ── DPUse Framework
import { AppError } from '@dpuse/dpuse-shared';

// ── Local Framework
import '@/assets/main.css';
import { createAppRouter } from '@/router';
import { queryClient } from '@/services/queryClient';
import { hasFault, throwOnFault } from '@/observability/faultInjection';
import { isComponentLoaderErrorInfo, markStaleDeployError, raiseAppFailure, reportStaleDeployFailure } from '@/state/errors';
import { reportFatalError, reportUnsupportedBrowser } from '@/observability/errorTracking';

// ── Static Components
import App from '@/App.vue';

// ── App Bootstrap ────────────────────────────────────────────────────────────────────────────────────────────────────

// Checks browser support first, so an unsupported browser gets a clear message rather than a failure later on.
//
// Some privacy-focused browsers under-report their version, so a browser that fails the version check is still
// accepted if it supports Trusted Types, which the app needs to start. As a trade-off, this also accepts older Chrome
// versions back to 83, which lack only 'field-sizing' (text boxes do not grow as the user types).
//
// '?fault=browser' forces the check to fail.
if (!(import.meta.env.DEV && hasFault('browser')) && (__SUPPORTED_BROWSER_REGEXP__.test(navigator.userAgent) || 'trustedTypes' in globalThis)) {
    try {
        // '?fault=bootstrap' throws here to test the message shown when the app fails to start.
        if (import.meta.env.DEV) throwOnFault('bootstrap');

        // Reports and shows errors that nothing else handled, such as those in timers or DOM listeners outside Vue.
        addEventListener('error', (event): void => {
            // The app's own errors always include a file, so one with no file or error object came from outside the
            // app, such as a browser extension.
            if (event.error == null && !event.filename) {
                console.warn('[dpuse:app] Ignored an error from a script outside the app.', event.message);
                return;
            }

            // Recorded for every error, as they are the only location when a plain value such as a string is thrown.
            const data = { colno: event.colno, filename: event.filename, lineno: event.lineno, originalMessage: event.message, typeId: 'unhandledRuntime' };

            const cause = event.error instanceof Error ? event.error : new Error(event.message || 'Unknown error.');
            raiseAppFailure(new AppError('Unhandled error.', 'dpuse-app.main', data, { cause }));
        });

        // Reports and shows promise failures that nothing else handled. A promise can fail with a value that is not an
        // Error, so it is wrapped in one to give the report a message and a stack trace.
        addEventListener('unhandledrejection', (event): void => {
            const data = { typeId: 'unhandledPromiseRejection' };
            const cause = event.reason instanceof Error ? event.reason : new Error(String(event.reason ?? 'Unknown promise rejection error.'));
            raiseAppFailure(new AppError('Unhandled promise rejection.', 'dpuse-app.main', data, { cause }));

            // Stops the browser logging the failure a second time. Production only, so developers still see it.
            if (import.meta.env.PROD) event.preventDefault();
        });

        // A new deployment deletes the old version's code files (chunks), so a user still running it cannot load new
        // ones and Vite raises 'vite:preloadError'. Nothing is shown here, as the chunk may be for a screen the user
        // never opens; a screen that needs it shows its own reload message. It is reported only if no newer version is
        // known, because only then is it a fault rather than an old version.
        //
        // No 'preventDefault', so Vite passes the error on to the screen that asked for the chunk.
        addEventListener('vite:preloadError', (event): void => {
            // Marks the error so the screen offers a refresh, not a retry. The message differs between browsers, so it
            // cannot be used to tell.
            markStaleDeployError(event.payload);

            const data = { typeId: 'vitePreloadError' };
            reportStaleDeployFailure(new AppError('Failed to load part of the app.', 'dpuse-app.main', data, { cause: event.payload }));
        });

        // Trusted Types rejects script URLs and HTML strings that have not passed through a policy. The 'default'
        // policy handles those that do not use their own.
        if (trustedTypes != null) {
            trustedTypes.createPolicy('default', {
                // Allows only the blob URLs Vite uses to start inline workers. Any other script URL throws.
                createScriptURL: (url: string): string => {
                    if (url.startsWith('blob:')) return url;
                    throw new Error(`Blocked TrustedScriptURL: ${url}`);
                },
                // Passes all HTML through unchecked, giving up Trusted Types' HTML protection, so libraries that write
                // HTML strings (squire-rte, TanStack Charts, turndown, Unovis) work. Libraries with their own policy,
                // such as Highcharts, are listed in the CSP 'trusted-types' list instead.
                createHTML: (html: string): string => html
            });
        }

        const app = createApp(App);
        app.config.errorHandler = (error, instance, info): void => {
            // Panels loaded on demand show and report their own load failures, so those are skipped here.
            if (isComponentLoaderErrorInfo(info)) return;

            // Reports and shows any other error that no 'ErrorBoundary' caught, in a strip that does not cover the app.
            const data = { componentName: instance?.$.type.name ?? undefined, info, typeId: 'unhandledVueRuntime' };
            const cause = error instanceof Error ? error : new Error('Unknown Vue runtime error.', { cause: error });
            raiseAppFailure(new AppError('Unhandled Vue error.', 'dpuse-app.main', data, { cause }));
        };
        app.use(createAppRouter());
        app.use(VueQueryPlugin, { queryClient });
        app.mount('#app');

        // '?fault=preload' fakes a chunk download failure, to check it is reported but not shown.
        if (import.meta.env.DEV && hasFault('preload')) {
            setTimeout(() => {
                const event = new Event('vite:preloadError');
                Object.assign(event, { payload: new TypeError('Failed to fetch dynamically imported module: simulated preload failure.') });
                dispatchEvent(event);
            }, 0);
        }
    } catch (error) {
        // The app failed to start, so the error is shown as plain HTML.
        reportFatalError(error);
    }
} else {
    reportUnsupportedBrowser();
}
