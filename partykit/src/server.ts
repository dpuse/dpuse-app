import { routePartykitRequest } from 'partyserver';
import { YServer } from 'y-partyserver';
import { applyUpdate, Doc, encodeStateAsUpdate } from 'yjs';

const STORAGE_KEY = 'document';

export class DocumentRoom extends YServer {
    async onLoad() {
        const stored = await this.ctx.storage.get<Uint8Array>(STORAGE_KEY);
        if (!stored) return null;
        const document_ = new Doc();
        applyUpdate(document_, stored);
        return document_;
    }

    async onSave() {
        await this.ctx.storage.put(STORAGE_KEY, encodeStateAsUpdate(this.document));
    }
}

export interface Env {
    main: DurableObjectNamespace<DocumentRoom>;
}

export default {
    async fetch(request: Request, environment: Env): Promise<Response> {
        return (
            (await routePartykitRequest(request, environment, {
                cors: {
                    'Access-Control-Allow-Origin': 'https://www.dpuse.app',
                    'Access-Control-Allow-Methods': 'GET, POST, HEAD, OPTIONS',
                    'Access-Control-Allow-Headers': '*',
                },
            })) ?? new Response('Not found', { status: 404 })
        );
    },
};
