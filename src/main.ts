// External dependencies
import { createApp } from 'vue';
import { createPinia } from 'pinia';

// App core
import '@/assets/main.css';
import { createAppRouter } from '@/router';
import { logException, showErrorSafely } from '@/observability/errorTracking';

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
    showErrorSafely(error);
}
