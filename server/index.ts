import type { Request as CfRequest, Response as CfResponse, ExportedHandler } from '@cloudflare/workers-types/experimental';

type Environment = Record<string, unknown>;

export default {
    fetch(request: CfRequest): CfResponse {
        const url = new URL(request.url);

        if (url.pathname.startsWith('/api/')) {
            return Response.json({ name: 'Cloudflare' }) as unknown as CfResponse;
        }

        return new Response(null, { status: 404 }) as unknown as CfResponse;
    }
} satisfies ExportedHandler<Environment>;
