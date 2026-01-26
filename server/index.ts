import type { Request as CfRequest, Response as CfResponse, ExportedHandler } from '@cloudflare/workers-types/experimental';

type Environment = Record<string, unknown>;

export default {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    fetch(request: CfRequest, environment: Environment): CfResponse {
        const url = new URL(request.url);

        if (url.pathname.startsWith('/api/')) {
            return Response.json({
                name: 'Cloudflare'
            }) as unknown as CfResponse;
        }

        // For all other requests, return a blank response with security headers
        const headers = new Headers();
        headers.set(
            'Content-Security-Policy',
            "default-src 'none';" +
                " base-uri 'self';" +
                " connect-src 'self' https://www.datapos.app wss://www.datapos.app https://api.datapos.app wss://api.datapos.app https://engine-eu.datapos.app https://sample-data-eu.datapos.app https://743f845f-9767-4da0-8f7f-c29c4f6f12f0b.hanko.io https://eu-api.honeybadger.io;" +
                " form-action 'none';" +
                " frame-ancestors 'none';" +
                " img-src 'self';" +
                " manifest-src 'self';" +
                " script-src 'self' https://engine-eu.datapos.app 'wasm-unsafe-eval' data: 'sha256-FKabkTPxmdbfQtfvuUPyT13E2ga22HRaIjqUW0M21Zns=';" +
                " style-src 'self' 'unsafe-inline';" +
                " worker-src 'self' blob:;"
        );
        headers.set('Cross-Origin-Opener-Policy', 'same-origin');
        headers.set('Cross-Origin-Embedder-Policy', 'require-corp');
        headers.set('Cross-Origin-Resource-Policy', 'cross-origin');
        headers.set('Document-Policy', 'js-profiling');

        return new Response(null, { status: 404, headers }) as unknown as CfResponse;
    }
} satisfies ExportedHandler<Environment>;
