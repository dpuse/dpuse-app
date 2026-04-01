import type { Request as CfRequest, Response as CfResponse, ExportedHandler } from '@cloudflare/workers-types/experimental';

type Environment = { ASSETS: { fetch(request: Request): Promise<Response> } };

// Nonce ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function generateNonce(): string {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    return btoa(String.fromCodePoint(...bytes));
}

class NonceInjector {
    constructor(private readonly nonce: string) {}
    element(element: Element): void {
        element.setAttribute('nonce', this.nonce);
    }
}

// Content Security Policy ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/** Builds the full CSP header for a given nonce. The Worker sets this on every HTML response,
 *  making the static policy in public/_headers unreachable (it is kept only as documentation). */
// TODO: Remove following settings from '_header' in '/public'.
function buildCsp(nonce: string): string {
    return (
        "default-src 'none';" +
        " base-uri 'self';" +
        " connect-src 'self' https://www.dpuse.app wss://www.dpuse.app data: https://auth.dpuse.app https://api.dpuse.app wss://api.dpuse.app https://engine-eu.dpuse.app https://sample-data-eu.dpuse.app;" +
        " form-action 'none';" +
        " frame-ancestors 'none';" +
        " img-src 'self' https://gravatar.com https://flagcdn.com;" +
        " manifest-src 'self';" +
        " object-src 'none';" +
        ` script-src 'self' https://engine-eu.dpuse.app https://static.cloudflareinsights.com 'wasm-unsafe-eval' 'nonce-${nonce}';` +
        ` style-src 'self' 'nonce-${nonce}';` +
        " worker-src 'self' blob:;" +
        " require-trusted-types-for 'script';"
    );
}

// Worker ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// EXAMPLE: fetch('/api/test').then(async (response) => console.log(response, await response.text()));

export default {
    async fetch(request: CfRequest, environment: Environment): Promise<CfResponse> {
        const url = new URL(request.url);

        if (url.pathname.startsWith('/api/')) {
            return Response.json({ name: 'Cloudflare' }) as CfResponse;
        }

        const assetResponse = await environment.ASSETS.fetch(request as unknown as Request);

        // Only process HTML — pass all other assets (JS, CSS, images) through unchanged.
        // Also skip nonce injection in dev (localhost) — Vite handles CSP via vite.config.ts
        // using 'unsafe-inline', and its HMR style injections do not carry a nonce.
        const contentType = assetResponse.headers.get('Content-Type') ?? '';
        if (!contentType.includes('text/html') || url.hostname === 'localhost' || url.hostname === '127.0.0.1') {
            return assetResponse as unknown as CfResponse;
        }

        const nonce = generateNonce();
        const injector = new NonceInjector(nonce);

        const headers = new Headers(assetResponse.headers);
        headers.set('Content-Security-Policy', buildCsp(nonce));

        // Stream the HTML through HTMLRewriter:
        // - adds nonce attribute to every <style> and <script> tag
        // - appends a <meta name="csp-nonce"> to <head> so the Vue app can pass it to AG Grid
        const body = new HTMLRewriter()
            .on('style', injector)
            .on('script', injector)
            .on('head', {
                element(element: Element): void {
                    element.append(`<meta name="csp-nonce" content="${nonce}">`, { html: true });
                }
            })
            .transform(new Response(assetResponse.body, { headers }));

        return body as unknown as CfResponse;
    }
} satisfies ExportedHandler<Environment>;
