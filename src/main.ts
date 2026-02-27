// External dependencies
import { createApp } from 'vue';
import { createPinia } from 'pinia';

// App core
import '@/assets/main.css';
import { createAppRouter } from '@/router';
import { logException } from '@/observability/eventTracking';

// App components
import App from '@/App.vue';

// Bootstrap application ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

try {
    // Add global error handlers
    globalThis.addEventListener('error', (event): void => logException({ typeId: 'unhandledRuntime', payload: event }));
    globalThis.addEventListener('unhandledrejection', (event): void => logException({ typeId: 'unhandledPromise', payload: event }));

    // Define Trusted Types default policy to allow inline worker blob URLs created by Vite's `?worker&inline` transform.
    // Without this, `require-trusted-types-for 'script'` blocks `new Worker(blobUrl)` because the URL is a plain string.
    if (globalThis.trustedTypes != null) {
        globalThis.trustedTypes.createPolicy('default', {
            // Allow 'blob:' prefixed URLs for Vite's `?worker&inline` worker factory.
            createScriptURL: (url: string): string => {
                if (url.startsWith('blob:')) return url;
                throw new Error(`Blocked TrustedScriptURL: ${url}`);
            }
        });
    }

    // Create and mount application
    const app = createApp(App);
    app.config.errorHandler = (error, instance, info): void => logException({ typeId: 'unhandledVue', payload: { error, instance, info } });
    app.use(createPinia());
    app.use(createAppRouter());
    app.mount('#app');
} catch (error) {
    reportErrorSafely(error);
}

// Report error helpers ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function reportErrorSafely(error: unknown): void {
    // Insert error message into the body of the page
    const errorDiv = globalThis.document.createElement('div');
    errorDiv.textContent = `Application failed to load: ${error instanceof Error ? error.message : String(error)}`;
    errorDiv.style.position = 'fixed';
    errorDiv.style.top = '0';
    errorDiv.style.left = '0';
    errorDiv.style.width = '100vw';
    errorDiv.style.background = '#b91c1c';
    errorDiv.style.color = 'white';
    errorDiv.style.padding = '1.5rem';
    errorDiv.style.fontSize = '1.25rem';
    errorDiv.style.zIndex = '9999';
    errorDiv.style.fontFamily = 'monospace, monospace';
    globalThis.document.body.append(errorDiv);

    // TODO: Attempt to send to error tracker...
    try {
    } catch {}

    // TODO: Check pending exceptions for any entries, display on page and attempt to send to error tracker...
}
