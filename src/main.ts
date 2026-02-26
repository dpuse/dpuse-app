// External dependencies
import { createApp } from 'vue';
import { createPinia } from 'pinia';

// App core
import '@/assets/main.css';
import { createAppRouter } from '@/router';
import { type Exception, monitorInstance, pendingExceptions } from '@/stores/sessionStore';

// App components
import App from '@/App.vue';

// Define Trusted Types default policy to allow inline worker blob URLs created by Vite's `?worker&inline` transform.
// Without this, `require-trusted-types-for 'script'` blocks `new Worker(blobUrl)` because the URL is a plain string.
if (globalThis.trustedTypes != null) {
    globalThis.trustedTypes.createPolicy('default', {
        // Allow blob: and same-origin URLs for Vite's `?worker&inline` worker factory.
        createScriptURL: (url: string): string => {
            if (url.startsWith('blob:')) return url;
            throw new Error(`Blocked TrustedScriptURL: ${url}`);
        }
    });
}

// Bootstrap application ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// Add global error handlers
globalThis.addEventListener('error', (event): void => reportError({ typeId: 'unhandledRuntime', payload: event }));
globalThis.addEventListener('unhandledrejection', (event): void => reportError({ typeId: 'unhandledPromise', payload: event }));

// Create and mount application
try {
    const app = createApp(App);
    app.config.errorHandler = (error, instance, info): void => reportError({ typeId: 'unhandledVue', payload: { error, instance, info } });
    app.use(createPinia());
    app.use(createAppRouter());
    app.mount('#app');
} catch (error) {
    reportErrorSafely(error);
}

// Report error helpers ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function reportError(exception: Exception): void {
    if (monitorInstance) {
        monitorInstance.logException(exception);
    } else {
        pendingExceptions.push(exception);
    }
}

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
