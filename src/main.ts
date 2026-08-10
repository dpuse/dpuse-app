// ── External Dependencies & Registrations
import { createApp } from 'vue';
// import DOMPurify from 'dompurify';
// import { z } from 'zod/v4';

// ── DPUse Framework
import { AppError } from '@dpuse/dpuse-shared/errors';

// ── Local Framework
import '@/assets/main.css';
import { createAppRouter } from '@/router';
import { reportAppError, reportFatalError } from '@/observability/errorTracking';

// ── Local Components - Static
import App from '@/App.vue';

// ── App Bootstrap ────────────────────────────────────────────────────────────────────────────────────────────────────

// z.config({ jitless: true }); // NOTE: Required by Vercel AI SDK.

try {
    // Add global error handlers.
    addEventListener('error', (event): void => {
        if (event.error instanceof Error) {
            const data = { colno: event.colno, filename: event.filename, lineno: event.lineno, originalMessage: event.message, typeId: 'unhandledRuntime' };
            reportAppError(new AppError('Unhandled error.', 'dpuse.main', data, { cause: event.error }));
        } else {
            reportAppError(new AppError('Unhandled error.', 'dpuse.main', { typeId: 'unhandledRuntime' }, { cause: new Error(event.message || 'Unknown error.') }));
        }
    });
    addEventListener('unhandledrejection', (event): void => {
        const data = { typeId: 'unhandledPromiseRejection' };
        if (event.reason instanceof Error) {
            reportAppError(new AppError('Unhandled promise rejection.', 'dpuse.main', data, { cause: event.reason }));
        } else {
            const cause = new Error(String(event.reason ?? 'Unknown promise rejection error.'));
            reportAppError(new AppError('Unhandled promise rejection.', 'dpuse.main', data, { cause }));
        }
        event.preventDefault();
    });

    // Define Trusted Types default policy to allow inline worker blob URLs created by Vite's `?worker&inline` transform.
    // Without this, `require-trusted-types-for 'script'` blocks `new Worker(blobUrl)` because the URL is a plain string.
    if (trustedTypes != null) {
        // const sanitizeHTML = (html: string): string => DOMPurify.sanitize(html);
        trustedTypes.createPolicy('default', {
            // Allow 'blob:' prefixed URLs for Vite's `?worker&inline` worker factory.
            createScriptURL: (url: string): string => {
                if (url.startsWith('blob:')) return url;
                throw new Error(`Blocked TrustedScriptURL: ${url}`);
            },
            // Also required by turndown (used in TextEditor.vue): on load it probes `new DOMParser().parseFromString('', 'text/html')`
            // to decide whether to use the native parser. That call is always made with an empty string, so returning '' below
            // changes nothing for it either way.
            //
            // Deliberately NOT a sanitizer (createHTML: sanitizeHTML, above, commented out). DOMPurify used to be loaded eagerly
            // here purely to back this policy, which cost every single page load ~10KB gzip even though most sessions never hit
            // a raw HTML sink. Sanitization now happens only at the specific call sites that need it, instead of centrally here:
            //   - Vue's `v-html` sites (ChatPanel, LibraryPanel, ContextModelPanel, TextEditor) call DOMPurify.sanitize()
            //     themselves before assigning - v-html never reaches this policy anyway, since Vue registers its own 'vue'
            //     Trusted Types policy (a plain pass-through, no sanitising) for it.
            //   - Presenter plugins (e.g. dpuse-presenter-default's `renderTo.innerHTML = html`) are handed a sanitizing
            //     function by loadSanitizeHTML() (see '@/security/trustedTypesSanitizer') via their constructor, before the
            //     app ever dynamically imports the presenter module. Presenters are loaded from a remote URL and cannot be
            //     trusted to sanitize themselves, so this is the mechanism that keeps sanitization under this app's control.
            // Any HTML sink write that bypasses both of those paths is intentionally blanked here rather than silently trusted.
            createHTML: (): string => ''
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
