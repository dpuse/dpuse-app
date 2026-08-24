// ── External Dependencies & Registrations
import '@fontsource-variable/inter';
import { createApp } from 'vue';
import { z } from 'zod/v4'; // TODO: Required by Vercel AI SDK.

// ── DPUse Framework
import { AppError } from '@dpuse/dpuse-shared/errors';

// ── Local Framework
import '@/assets/main.css';
import { createAppRouter } from '@/router';
import { reportAppError, reportFatalError } from '@/observability/errorTracking';

// ── Static Components
import App from '@/App.vue';

// ── App Bootstrap ────────────────────────────────────────────────────────────────────────────────────────────────────

z.config({ jitless: true }); // TODO: Required by Vercel AI SDK.

try {
    // Add global error handlers.
    addEventListener('error', (event): void => {
        if (event.error instanceof Error) {
            const data = { colno: event.colno, filename: event.filename, lineno: event.lineno, originalMessage: event.message, typeId: 'unhandledRuntime' };
            void reportAppError(new AppError('Unhandled error.', 'dpuse.main', data, { cause: event.error }));
        } else {
            void reportAppError(new AppError('Unhandled error.', 'dpuse.main', { typeId: 'unhandledRuntime' }, { cause: new Error(event.message || 'Unknown error.') }));
        }
    });
    addEventListener('unhandledrejection', (event): void => {
        const data = { typeId: 'unhandledPromiseRejection' };
        if (event.reason instanceof Error) {
            void reportAppError(new AppError('Unhandled promise rejection.', 'dpuse.main', data, { cause: event.reason }));
        } else {
            const cause = new Error(String(event.reason ?? 'Unknown promise rejection error.'));
            void reportAppError(new AppError('Unhandled promise rejection.', 'dpuse.main', data, { cause }));
        }
        event.preventDefault();
    });

    if (trustedTypes != null) {
        trustedTypes.createPolicy('default', {
            // Allow inline worker blob URLs created by Vite's `?worker&inline` transform. Without this,
            // `require-trusted-types-for 'script'` blocks `new Worker(blobUrl)` because the URL is a plain string.
            createScriptURL: (url: string): string => {
                if (url.startsWith('blob:')) return url;
                throw new Error(`Blocked TrustedScriptURL: ${url}`);
            },
            // A deliberate pass-through, not a sanitizer. This exists only so Trusted-Types-unaware code (turndown's
            // native-parser probe in TextEditor.vue, and third-party charting libraries like TanStack Charts and
            // Unovis that write their own internally-generated, non-user-supplied markup via raw 'innerHTML =') keeps
            // working under `require-trusted-types-for 'script'`, rather than throwing or silently losing content.
            // It was briefly a fail-safe that blanked unrecognised writes instead, but that broke exactly those
            // libraries' legitimate internal rendering with no real security benefit: a malicious script already
            // running on the page doesn't need this sink at all (it has direct, unrestricted DOM APIs), so this
            // policy was never a defence against that. Actual sanitization happens at the specific call sites that
            // render externally-influenced content - Vue's `v-html` sites (ChatPanel, ContextModelPanel,
            // TextEditor) and the presenter packages - which call DOMPurify.sanitize() themselves before assigning.
            createHTML: (html: string): string => html
        });
    }

    // Create and mount application.
    const app = createApp(App);
    app.config.errorHandler = (error, instance, info): void => {
        const data = { componentName: instance?.$.type.name ?? undefined, info, typeId: 'unhandledVueRuntime' };
        void reportAppError(new AppError('Unhandled Vue error.', 'dpuse.main', data, { cause: error ?? 'Unknown Vue runtime error.' }));
    };
    app.use(createAppRouter());
    app.mount('#app');
} catch (error) {
    reportFatalError(error);
}
