// Vendor dependencies
import { createApp } from 'vue';
import { createPinia } from 'pinia';

// Workbench core
import '@/assets/main.css';
import App from '@/App.vue';
import router from '@/router';
import { type Exception, monitorInstance, pendingExceptions, useSessionStore } from '@/stores/sessionStore';

// Window error handlers
globalThis.addEventListener('error', (event) => reportException({ typeId: 'runtime', error: event.error, message: event.message }));
globalThis.addEventListener('unhandledrejection', (event) => reportException({ typeId: 'promise', error: undefined, message: event.reason }));

// Bootstrap workbench application
try {
    const app = createApp(App);
    app.config.errorHandler = (error, instance, info) => reportException({ typeId: 'vue', error, info });
    app.use(createPinia());
    app.use(router);
    // initTranslations(app); // Setup internationalization.
    app.mount('#app');

    useSessionStore().initialiseServices();
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
