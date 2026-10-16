// ── External Dependencies & Registrations
import '@fontsource-variable/inter/opsz.css'; // Includes the optical-size axis, which sharpens small text.
import { createApp } from 'vue';
import DOMPurify from 'dompurify';
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
            const defaultPolicy = trustedTypes.createPolicy('default', {
                // Refuses every script string, as the browser does for a policy without 'createScript'. Defining it
                // makes the policy a full 'TrustedTypePolicy', so it can stand in for a plugin's own.
                createScript: (script: string): string => {
                    throw new Error(`Blocked TrustedScript: ${script}`);
                },
                // Refuses every script URL. The engine starts its worker through its own 'dpuse-engine' policy, and no
                // other code may load a script by URL.
                createScriptURL: (url: string): string => {
                    throw new Error(`Blocked TrustedScriptURL: ${url}`);
                },
                // Cleans all HTML with DOMPurify, so libraries that write HTML strings (squire-rte, TanStack Charts,
                // turndown, Unovis) work without being able to add script to the page.
                createHTML: (html: string): string => DOMPurify.sanitize(html)
            });

            // Registers DOMPurify's 'dompurify' policy now, before a plugin can take the name. If a plugin took it
            // first, DOMPurify could not register the name, as duplicates are not allowed, and the 'default'
            // policy's 'createHTML' would fail.
            DOMPurify.sanitize('');

            // Plugins such as Highcharts create their own Trusted Types policy, which the browser refuses unless the
            // CSP 'trusted-types' list names it. Only 'highcharts' is listed today. Any other plugin is given the
            // 'default' policy instead.
            const createListedPolicy = trustedTypes.createPolicy.bind(trustedTypes);
            trustedTypes.createPolicy = (policyName: string, policyOptions?: TrustedTypePolicyOptions): TrustedTypePolicy => {
                try {
                    return createListedPolicy(policyName, policyOptions);
                } catch {
                    return defaultPolicy;
                }
            };
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
