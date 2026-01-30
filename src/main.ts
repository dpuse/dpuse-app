// Vendor dependencies
import { createPinia } from 'pinia';
import { type ComponentPublicInstance, createApp } from 'vue';

// Application core
import '@/assets/main.css';
import App from '@/App.vue';
import router from '@/router';
import { ApplicationError, normalizeToError, VueHandledError, WindowHandledPromiseRejectionError, WindowHandledRuntimeError } from '@datapos/datapos-shared/errors';

// Window error handlers
// globalThis.addEventListener('error', reportWindowError);
// globalThis.addEventListener('unhandledrejection', reportWindowUnhandledRejection);

// Bootstrap workbench application
try {
    const app = createApp(App);
    // app.config.errorHandler = reportVueError;
    app.use(createPinia());
    app.use(router);
    // initTranslations(app); // Setup internationalization.
    app.mount('#app');

    // Wait for the mount to finish, then initialise the monitoring system and session services in parallel.
    // requestAnimationFrame(initialiseServices);
} catch (error) {
    //  reportErrorUsingBrowser(new ApplicationError('Failed to load application.', 'datapos-app|main', { cause: error }));
    reportBootstrapError(error);
}

function reportBootstrapError(error: unknown): void {
    console.log(error);
    // TODO: Insert error into the dom...
    // TODO: Attempt to send to error tracker...
}

// // Utilities - Report Vue Error
// function reportVueError(unhandledError: unknown, vm: ComponentPublicInstance | null, info: string): void {
//     try {
//         const normalisedError = normalizeToError(unhandledError ?? 'Unknown error.');
//         const m = 'Unhandled runtime error intercepted by global Vue error handler.';
//         reportError(new VueHandledError(m, 'datapos-app|main|app.config.errorHandler', info, vm?.$options?.name, { cause: normalisedError }), true, ['Unhandled']);
//     } catch (error) {
//         console.error('Error while reporting unhandled runtime error intercepted by Vue error handler:', error);
//     }
// }

// // Utilities - Report Window Error
// function reportWindowError(event: ErrorEvent): void {
//     try {
//         const normalisedError = normalizeToError(event?.error ?? event?.message ?? 'Unknown error.');
//         if (normalisedError.message.includes('ResizeObserver loop ')) return; // Ignore this benign warning.
//         const m = 'Unhandled runtime error intercepted by global Window error handler.';
//         reportError(new WindowHandledRuntimeError(m, 'datapos-app|main|window.addEventListener.error', { cause: normalisedError }), true, ['Unhandled']);
//     } catch (error) {
//         console.error('Error while reporting unhandled runtime error intercepted by Window error handler:', error);
//     }
// }

// // Utilities - Report Window Unhandled Rejection
// function reportWindowUnhandledRejection(event: PromiseRejectionEvent): void {
//     try {
//         const normalisedError = normalizeToError(event?.reason ?? 'Unknown promise rejection reason.');
//         if (normalisedError.message.includes('ResizeObserver loop ')) return; // Ignore this benign warning.
//         const m = 'Unhandled promise rejection intercepted by global Window error handler.';
//         reportError(new WindowHandledPromiseRejectionError(m, 'datapos-app|main|window.addEventListener.unhandledrejection', { cause: normalisedError }), true, ['Unhandled']);
//     } catch (error) {
//         console.error('Error while reporting unhandled promise rejection intercepted by Window error handler:', error);
//     }
// }
