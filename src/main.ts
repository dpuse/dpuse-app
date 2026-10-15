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
                // Refuses every script URL. The engine starts its worker through its own 'dpuse-engine' policy, and no
                // other code may load a script by URL.
                createScriptURL: (url: string): string => {
                    throw new Error(`Blocked TrustedScriptURL: ${url}`);
                },
                // Passes all HTML through unchecked, giving up Trusted Types' HTML protection, so libraries that write
                // HTML strings (squire-rte, TanStack Charts, turndown, Unovis) work.
                createHTML: (html: string): string => html
            });

            // Plugins such as Highcharts create their own named policy as they load, and the browser throws for any name
            // missing from the CSP 'trusted-types' list. Plugins are built separately, so their names cannot be listed in
            // advance. An unlisted or duplicate name gets a stand-in policy, so the 'default' policy has the final say.
            const createListedPolicy = trustedTypes.createPolicy.bind(trustedTypes);
            trustedTypes.createPolicy = (policyName: string, policyOptions?: TrustedTypePolicyOptions): TrustedTypePolicy => {
                try {
                    return createListedPolicy(policyName, policyOptions);
                } catch {
                    return createStandInPolicy(policyName, policyOptions);
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

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

// A stand-in policy applies the plugin's own rule but returns a plain string rather than a trusted value. When the string
// reaches the page, the browser passes it to the 'default' policy, which refuses every script URL.
function createStandInPolicy(policyName: string, policyOptions: TrustedTypePolicyOptions = {}): TrustedTypePolicy {
    const passToDefaultPolicy =
        (rule: ((input: string, ...rest: unknown[]) => string) | undefined, ruleName: string) =>
        (input: string, ...rest: unknown[]): string => {
            if (rule == null) throw new TypeError(`Trusted Types policy '${policyName}' has no '${ruleName}'.`);
            return rule(input, ...rest);
        };
    return {
        name: policyName,
        createHTML: passToDefaultPolicy(policyOptions.createHTML, 'createHTML'),
        createScript: passToDefaultPolicy(policyOptions.createScript, 'createScript'),
        createScriptURL: passToDefaultPolicy(policyOptions.createScriptURL, 'createScriptURL')
    } as unknown as TrustedTypePolicy;
}
