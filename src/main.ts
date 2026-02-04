// Vendor dependencies
import { createApp } from 'vue';
import { createPinia } from 'pinia';

// Workbench core
import '@/assets/main.css';
import App from '@/App.vue';
import type { Exception } from '@/composables/useMonitor';
import router from '@/router';
import { monitorInstance, pendingExceptions } from '@/stores/sessionStore';

// import posthog from 'posthog-js';
// posthog.init(import.meta.env.VITE_POSTHOG_PROJECT_API_KEY, { api_host: 'https://eu.i.posthog.com', defaults: '2025-11-30' });

// Window error handlers
globalThis.addEventListener('error', (event) => reportException({ typeId: 'runtime', payload: event }));
globalThis.addEventListener('unhandledrejection', (event) => reportException({ typeId: 'promise', payload: event }));

// Bootstrap workbench application
try {
    const app = createApp(App);
    app.config.errorHandler = (error, instance, info) => reportException({ typeId: 'vue', payload: { error, info } });
    app.use(createPinia());
    app.use(router);
    // initTranslations(app); // Setup internationalization.
    app.mount('#app');
} catch (error) {
    reportErrorSafely(error);
}

// Error helpers ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function reportException(exception: Exception) {
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
}
