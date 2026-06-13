import { routePartykitRequest } from 'partyserver';
import { YServer } from 'y-partyserver';

export class DocumentRoom extends YServer {}

export interface Env {
    main: DurableObjectNamespace<DocumentRoom>;
}

export default {
    async fetch(request: Request, env: Env): Promise<Response> {
        return (
            (await routePartykitRequest(request, env, {
                cors: {
                    'Access-Control-Allow-Origin': 'https://www.dpuse.app',
                    'Access-Control-Allow-Methods': 'GET, POST, HEAD, OPTIONS',
                    'Access-Control-Allow-Headers': '*',
                },
            })) ?? new Response('Not found', { status: 404 })
        );
    },
};
