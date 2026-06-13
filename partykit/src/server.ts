import { routePartykitRequest } from 'partyserver';
import { YServer } from 'y-partyserver';
import { Doc, applyUpdate, encodeStateAsUpdate } from 'yjs';

const STORAGE_KEY = 'document';

export class DocumentRoom extends YServer {
    async onLoad() {
        const stored = await this.ctx.storage.get<Uint8Array>(STORAGE_KEY);
        if (!stored) return null;
        const doc = new Doc();
        applyUpdate(doc, stored);
        return doc;
    }

    async onSave() {
        await this.ctx.storage.put(STORAGE_KEY, encodeStateAsUpdate(this.document));
    }
}

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
