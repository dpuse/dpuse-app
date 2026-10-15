// ── External Dependencies & Registrations
import '@fontsource-variable/inter/opsz.css'; // Includes the optical-size axis, which sharpens small text.
import { createApp } from 'vue';
import { VueQueryPlugin } from '@tanstack/vue-query';

// ── Local Framework
import '@/assets/main.css';
import { createAppRouter } from '@/router';
import { queryClient } from '@/services/queryClient';
import { handleRaisePromiseRejection, handleRaiseScriptError, handleRaiseVueError, handleReportPreloadError } from '@/state/errors';
import { showFatalError, showUnsupportedBrowser } from '@/observability/errorTracking';

// ── Static Components
import App from '@/App.vue';

// ── App Bootstrap ────────────────────────────────────────────────────────────────────────────────────────────────────

// Checks browser support first, so an unsupported browser gets a clear message rather than a failure later on.
//
// Some privacy-focused browsers under-report their version, so a browser that fails the version check is still accepted
// if it supports Trusted Types, which the app needs to start. As a trade-off, this also accepts older Chrome versions
// back to 83, which lack only 'field-sizing' (the chat box does not grow as the user types).
const isBrowserSupported = __SUPPORTED_BROWSER_REGEXP__.test(navigator.userAgent) || 'trustedTypes' in globalThis;
if (isBrowserSupported) {
    try {
        // Reports and shows errors and promise failures that nothing else handled, and reports chunks a new deployment
        // has deleted.
        addEventListener('error', handleRaiseScriptError);
        addEventListener('unhandledrejection', handleRaisePromiseRejection);
        addEventListener('vite:preloadError', handleReportPreloadError);

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

        app.config.errorHandler = handleRaiseVueError;

        app.use(createAppRouter());
        app.use(VueQueryPlugin, { queryClient });
        app.mount('#app');
    } catch (error) {
        // The app failed to start, so the error is shown as plain HTML.
        showFatalError(error);
    }
} else {
    showUnsupportedBrowser();
}
