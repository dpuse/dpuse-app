// ── DPUse Framework
import type { SanitizeHTML } from '@dpuse/dpuse-shared/component/module/presenter';

// ── Trusted Types Sanitizer ──────────────────────────────────────────────────────────────────────────────────────────

const cache: { sanitizeHTMLPromise?: Promise<SanitizeHTML> } = {};

// Lazily loads DOMPurify (kept out of the initial bundle - see the removed static import and poisoned 'default'
// policy in main.ts) and, on browsers enforcing Trusted Types, creates the 'dpuse-sanitizer' policy that presenter
// plugins use to sanitize HTML before inserting it into the DOM. Must be awaited before the app ever dynamically
// imports a presenter module, so that both this policy and DOMPurify's own internal 'dompurify' policy are claimed
// by this trusted code before any less-trusted, remotely-loaded presenter code could attempt to claim them itself -
// see the 'trusted-types' CSP directive in public/_headers, which only allows a fixed set of policy names, but does
// not stop whichever code runs first from claiming one of them.
export function loadSanitizeHTML(): Promise<SanitizeHTML> {
    cache.sanitizeHTMLPromise ??= (async (): Promise<SanitizeHTML> => {
        const { default: DOMPurify } = await import('dompurify');
        DOMPurify.sanitize(''); // Claims DOMPurify's own internal 'dompurify' Trusted Types policy before any presenter code can.

        if (trustedTypes == null) return (html: string): string => DOMPurify.sanitize(html);

        const policy = trustedTypes.createPolicy('dpuse-sanitizer', { createHTML: (html: string): string => DOMPurify.sanitize(html) });
        return (html: string) => policy.createHTML(html);
    })();
    return cache.sanitizeHTMLPromise;
}
