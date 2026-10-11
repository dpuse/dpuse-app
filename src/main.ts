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
// versions back to 83, which lack only 'field-sizing' (the chat box does not grow as the user types).
//
// '?fault=browser' forces the check to fail.
const isBrowserSupported = !(import.meta.env.DEV && hasFault('browser')) && (__SUPPORTED_BROWSER_REGEXP__.test(navigator.userAgent) || 'trustedTypes' in globalThis);
if (isBrowserSupported) {
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

            // The location is recorded for every error, as it is the only location when a plain value such as a string
            // is thrown.
            const data = { colno: event.colno, filename: event.filename, lineno: event.lineno, originalMessage: event.message, typeId: 'unhandledRuntime' };

            // A thrown value that is not an Error is passed on as it is, so the report shows its contents.
            const cause: unknown = event.error ?? new Error(event.message || 'Unknown error.');
            raiseAppFailure(new AppError('Unhandled error.', 'dpuse-app.main', data, { cause }));

            // Stops the browser logging the error a second time, as the app has already logged it.
            event.preventDefault();
        });

        // Reports and shows promise failures that nothing else handled. A promise can fail with a value that is not an
        // Error, so that value is passed on as it is and the report shows its contents.
        addEventListener('unhandledrejection', (event): void => {
            const data = { typeId: 'unhandledPromiseRejection' };
            const cause: unknown = event.reason ?? new Error('Unknown promise rejection error.');
            raiseAppFailure(new AppError('Unhandled promise rejection.', 'dpuse-app.main', data, { cause }));

            // Stops the browser logging the failure a second time, as the app has already logged it.
            event.preventDefault();
        });

        // A new deployment deletes the old version's code files (chunks). A user still running the old version then fails
        // to load one, and Vite raises 'vite:preloadError'. Nothing is shown here, because the user may never open the
        // screen that needs the chunk. That screen shows its own reload message. The failure is reported only if no newer
        // version is known, because only then is it a fault rather than an out-of-date page.
        //
        // No 'preventDefault', so Vite passes the error on to the screen that asked for the chunk.
        addEventListener('vite:preloadError', (event): void => {
            // Marks the error so the screen offers a refresh, not a retry. Each browser words the error message
            // differently, so the message cannot be used to recognise this error.
            markStaleDeployError(event.payload);

            const data = { typeId: 'vitePreloadError' };
            reportStaleDeployFailure(new AppError('Failed to load part of the app.', 'dpuse-app.main', data, { cause: event.payload }));
        });

        // With Trusted Types enforced, the browser blocks any script URL or HTML string not passed through a policy.
        // The 'default' policy covers any that are not given a policy of their own.
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

        // Reports and shows any Vue error that no 'ErrorBoundary' caught, in the app-level failure dialog.
        app.config.errorHandler = (error, instance, info): void => {
            // Panels loaded on demand show and report their own load failures, so those are skipped here.
            if (isComponentLoaderErrorInfo(info)) return;

            // A thrown value that is not an Error is passed on as it is, so the report shows its contents.
            const data = { componentName: instance?.$.type.name ?? instance?.$.type.__name, info, typeId: 'unhandledVueRuntime' };
            raiseAppFailure(new AppError('Unhandled Vue error.', 'dpuse-app.main', data, { cause: error }));
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
