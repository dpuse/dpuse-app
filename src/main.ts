// External Dependencies
import { createApp } from 'vue';
import { z } from 'zod/v4';

// DPUse Framework
import { AppError } from '@dpuse/dpuse-shared/errors';

// Local (App) Framework
import '@/assets/main.css';
import { createAppRouter } from '@/router';
import { reportAppError, reportFatalError } from '@/observability/errorTracking';

// Local Components - Static
import App from '@/App.vue';

// App Bootstrap ───────────────────────────────────────────────────────────────────────────────────────────────────────

z.config({ jitless: true }); // NOTE: Required by Vercel AI SDK.

try {
    // Add global error handlers.
    globalThis.addEventListener('error', (event): void => {
        if (event.error instanceof Error) {
            const data = { colno: event.colno, filename: event.filename, lineno: event.lineno, originalMessage: event.message, typeId: 'unhandledRuntime' };
            reportAppError(new AppError('Unhandled error.', 'dpuse.main', data, { cause: event.error }));
        } else {
            reportAppError(new AppError('Unhandled error.', 'dpuse.main', { typeId: 'unhandledRuntime' }, { cause: new Error(event.message || 'Unknown error.') }));
        }
    });
    globalThis.addEventListener('unhandledrejection', (event): void => {
        const data = { typeId: 'unhandledPromiseRejection' };
        if (event.reason instanceof Error) {
            reportAppError(new AppError('Unhandled promise rejection.', 'dpuse.main', data, { cause: event.reason }));
        } else {
            reportAppError(new AppError('Unhandled promise rejection.', 'dpuse.main', data, { cause: new Error(String(event.reason ?? 'Unknown promise rejection error.')) }));
        }
        event.preventDefault();
    });

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

    // Create and mount application.
    const app = createApp(App);
    app.config.errorHandler = (error, instance, info): void => {
        // TODO: Changed from 'instance?.$options?.__name' to 'instance?.$.type?.name'. Ensure this works.
        const data = { componentName: instance?.$.type?.name ?? undefined, info, typeId: 'unhandledVueRuntime' };
        reportAppError(new AppError('Unhandled Vue error.', 'dpuse.main', data, { cause: error ?? 'Unknown Vue runtime error.' }));
    };
    app.use(createAppRouter());
    app.mount('#app');
} catch (error) {
    reportFatalError(error);
}
