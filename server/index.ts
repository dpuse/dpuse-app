import type { Request as CfRequest, Response as CfResponse, ExportedHandler } from '@cloudflare/workers-types/experimental';

type Environment = Record<string, unknown>;

export default {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async fetch(request: CfRequest, environment: Environment): CfResponse {
        // const url = new URL(request.url);

        // if (url.pathname.startsWith('/api/')) {
        //     return Response.json({ name: 'Cloudflare' }) as unknown as CfResponse;
        // }

        // return new Response(null, { status: 404 }) as unknown as CfResponse;

        const response = await env.ASSETS.fetch(request);

        const headers = new Headers(response.headers);
        headers.set(
            'Content-Security-Policy',
            "default-src 'self'; " +
                "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
                "style-src 'self' 'unsafe-inline'; " +
                "img-src 'self' data: https:; " +
                "font-src 'self' data:; " +
                "connect-src 'self'"
        );

        return new Response(response.body, {
            status: response.status,
            statusText: response.statusText,
            headers
        });
    }
} satisfies ExportedHandler<Environment>;
