import type { Request as CfRequest, Response as CfResponse, ExportedHandler, Fetcher } from '@cloudflare/workers-types/experimental';

type Environment = {
    ASSETS: Fetcher;
};

export default {
    fetch(request: CfRequest, env: Environment): CfResponse {
        const url = new URL(request.url);

        if (url.pathname.startsWith('/api/')) {
            return Response.json({ name: 'Cloudflare' }) as unknown as CfResponse;
        }

        return env.ASSETS.fetch(request); // serves dist files directly
    }
} satisfies ExportedHandler<Environment>;
