import type { Request as CfRequest, Response as CfResponse, ExportedHandler } from '@cloudflare/workers-types/experimental';

type Environment = Record<string, unknown>;

// EXAMPLE: fetch('/api/test').then(async (response) => console.log(response, await response.text()));

export default {
    fetch(request: CfRequest): CfResponse {
        const url = new URL(request.url);

        if (url.pathname.startsWith('/api/')) {
            return Response.json({ name: 'Cloudflare' });
        }

        return new Response(null, { status: 404 });
    }
} satisfies ExportedHandler<Environment>;
