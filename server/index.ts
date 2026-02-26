// import type { Request as CfRequest, Response as CfResponse, ExportedHandler } from '@cloudflare/workers-types/experimental';
import type { Request as CfRequest, Response as CfResponse, ExportedHandler, Fetcher } from '@cloudflare/workers-types/experimental';

// type Environment = Record<string, unknown>;
type Environment = {
    ASSETS: Fetcher;
};

// export default {
//     // eslint-disable-next-line @typescript-eslint/no-unused-vars
//     fetch(request: CfRequest, environment: Environment): CfResponse {
//         const url = new URL(request.url);

//         if (url.pathname.startsWith('/api/')) {
//             return Response.json({ name: 'Cloudflare' }) as unknown as CfResponse;
//         }

//         return new Response(null, { status: 404 }) as unknown as CfResponse;
//     }
// } satisfies ExportedHandler<Environment>;

// Content-Security-Policy: default-src 'none'; base-uri 'self'; connect-src 'self' https://www.datapos.app wss://www.datapos.app data: https://auth.datapos.app https://api.datapos.app wss://api.datapos.app https://engine-eu.datapos.app https://sample-data-eu.datapos.app https://eu.i.posthog.com https://eu-assets.i.posthog.com; form-action 'none'; frame-ancestors 'none'; img-src 'self' https://gravatar.com; manifest-src 'self'; object-src 'none'; script-src 'self' https://engine-eu.datapos.app https://static.cloudflareinsights.com 'wasm-unsafe-eval' 'sha256-zB6mwYmmKIlxJrDq5yysgDwDqL4RFTYqD9cEDekVWCA=' 'strict-dynamic'; style-src 'self' 'sha256-vUH6L8ih8gJc7zAGP15EpDqPYtrGDy1W2WZTdVKMVIE=' 'sha256-skqujXORqzxt1aE0NNXxujEanPTX6raoqSscTV/Ww/Y='; worker-src 'self' blob:;

export default {
    async fetch(request: CfRequest, environment: Environment): Promise<CfResponse> {
        const url = new URL(request.url);

        if (url.pathname.startsWith('/api/')) {
            return Response.json({ name: 'Cloudflare' }) as unknown as CfResponse;
        }

        const nonce = btoa(String.fromCodePoint(...crypto.getRandomValues(new Uint8Array(16))));
        const response = await environment.ASSETS.fetch(request);
        const html = await response.text();
        const modified = html.replace('<script>', `<script nonce="${nonce}">`).replace('<script type="module"', `<script nonce="${nonce}" type="module"`);

        return new Response(modified, {
            headers: {
                'Content-Type': 'text/html; charset=utf-8',
                'Access-Control-Allow-Origin': 'https://www.datapos.app',
                'Cross-Origin-Resource-Policy': 'cross-origin',
                'X-Content-Type-Options': 'nosniff',
                'Content-Security-Policy': [
                    "default-src 'none'",
                    "base-uri 'self'",
                    "connect-src 'self' https://www.datapos.app wss://www.datapos.app data: https://auth.datapos.app https://api.datapos.app wss://api.datapos.app https://engine-eu.datapos.app https://sample-data-eu.datapos.app https://eu.i.posthog.com https://eu-assets.i.posthog.com",
                    "form-action 'none'",
                    "frame-ancestors 'none'",
                    "img-src 'self' https://gravatar.com",
                    "manifest-src 'self'",
                    "object-src 'none'",
                    `script-src 'nonce-${nonce}' 'strict-dynamic' 'wasm-unsafe-eval'`,
                    "style-src 'self' 'sha256-vUH6L8ih8gJc7zAGP15EpDqPYtrGDy1W2WZTdVKMVIE=' 'sha256-skqujXORqzxt1aE0NNXxujEanPTX6raoqSscTV/Ww/Y='",
                    "worker-src 'self' blob:"
                ].join('; ')
            }
        }) as unknown as CfResponse;
    }
} satisfies ExportedHandler<Environment>;
