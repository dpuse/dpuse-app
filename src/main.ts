// External dependencies
import { createApp } from 'vue';
import { createPinia } from 'pinia';

// Workbench core
import '@/assets/main.css';
import App from '@/App.vue';
import router from '@/router';
import { type Exception, monitorInstance, pendingExceptions } from '@/stores/sessionStore';

// Browser error handlers
globalThis.addEventListener('error', (event) => reportException({ typeId: 'unhandledRuntime', payload: event }));
globalThis.addEventListener('unhandledrejection', (event) => reportException({ typeId: 'unhandledPromise', payload: event }));

// Bootstrap workbench application
try {
    const app = createApp(App);
    app.config.errorHandler = (error, instance, info) => reportException({ typeId: 'unhandledVue', payload: { error, instance, info } });
    app.use(createPinia());
    app.use(router);
    app.mount('#app');
} catch (error) {
    reportErrorSafely(error);
}

// Error helpers ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function reportException(exception: Exception): void {
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
