// Vendor dependencies
import { createPinia } from 'pinia';
import { type ComponentPublicInstance, createApp } from 'vue';

// Workbench core
import '@/assets/main.css';
import App from '@/App.vue';
import router from '@/router';
import { normalizeToError, VueHandledError, WindowHandledPromiseRejectionError, WindowHandledRuntimeError } from '@datapos/datapos-shared/errors';

// Window error handlers
globalThis.addEventListener('error', reportWindowError);
globalThis.addEventListener('unhandledrejection', reportWindowUnhandledRejection);

// Bootstrap workbench application
try {
    const app = createApp(App);
    app.config.errorHandler = reportVueError;
    app.use(createPinia());
    app.use(router);
    // initTranslations(app); // Setup internationalization.
    app.mount('#app');
} catch (error) {
    reportErrorSafely(error);
}

// Helpers ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function reportVueError(unhandledError: unknown, vm: ComponentPublicInstance | null, info: string): void {
    try {
        const normalisedError = normalizeToError(unhandledError ?? 'Unknown error.');
        const message = 'Unhandled runtime error intercepted by global Vue error handler.';
        reportErrorPlaceholder(new VueHandledError(message, 'workbench.reportVueError', info, vm?.$options?.name, { cause: normalisedError }), true, ['Unhandled']);
    } catch (error) {
        reportErrorSafely(error);
    }
}

function reportWindowError(event: ErrorEvent): void {
    try {
        const normalisedError = normalizeToError(event?.error ?? event?.message ?? 'Unknown error.');
        // if (normalisedError.message.includes('ResizeObserver loop ')) return; // Ignore this benign warning
        const message = 'Unhandled runtime error intercepted by global Window error handler.';
        reportErrorPlaceholder(new WindowHandledRuntimeError(message, 'workbench.reportWindowError', { cause: normalisedError }), true, ['Unhandled']);
    } catch (error) {
        reportErrorSafely(error);
    }
}

function reportWindowUnhandledRejection(event: PromiseRejectionEvent): void {
    try {
        const normalisedError = normalizeToError(event?.reason ?? 'Unknown promise rejection reason.');
        // if (normalisedError.message.includes('ResizeObserver loop ')) return; // Ignore this benign warning
        const message = 'Unhandled promise rejection intercepted by global Window error handler.';
        reportErrorPlaceholder(new WindowHandledPromiseRejectionError(message, 'workbench.reportWindowUnhandledRejection', { cause: normalisedError }), true, ['Unhandled']);
    } catch (error) {
        reportErrorSafely(error);
    }
}

function reportErrorPlaceholder(error: unknown, isShown: boolean, tags: string[]) {
    console.log(error, isShown, tags);
}

function reportErrorSafely(error: unknown): void {
    console.log(error);

    // Insert error message into the body of the page
    const errorDiv = document.createElement('div');
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
    document.body.append(errorDiv);

    // TODO: Attempt to send to error tracker...
    try {
    } catch {}
}
