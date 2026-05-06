import path from 'node:path';
import process from 'node:process';
import { readFile } from 'node:fs/promises';

async function main(): void {
    const accountId = process.env['CLOUDFLARE_ACCOUNT_ID1'];
    const apiToken = process.env['CLOUDFLARE_AI_API_TOKEN1'];
    const vectorIndex = 'datapos-knowledge';

    // 1. Load the markdown knowledge file
    const knowledgePath = path.resolve(process.cwd(), 'knowledge', 'module-states.md');

    // eslint-disable-next-line security/detect-non-literal-fs-filename --  Need to review approach.
    const fileContent = await readFile(knowledgePath, 'utf8');

    // For this POC, treat the entire file as a single chunk.
    // You can later replace this with more advanced chunking.
    const chunks = [
        {
            id: 'module-states-1',
            text: fileContent,
            metadata: {
                doc: 'module-states',
                section: 'full',
                feature: 'module_state_tracking'
            }
        }
    ];

    // 2. Call Workers AI embeddings to embed each chunk
    // Model example: @cf/baai/bge-base-en-v1.5 (check Cloudflare docs for the best choice)
    const embeddingsModel = '@cf/baai/bge-base-en-v1.5';

    const embedUrl = `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${embeddingsModel}`;

    const embeddedChunks = [];

    for (const chunk of chunks) {
        const embedResult = await fetch(embedUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${apiToken}`
            },
            body: JSON.stringify({
                text: chunk.text
            })
        });

        if (!embedResult.ok) {
            const body = await embedResult.text();
            throw new Error(`Embeddings request failed: ${embedResult.status} ${body}`);
        }

        const embedJson = await embedResult.json();

        // The exact shape of the response depends on the model.
        // Cloudflare's embeddings models typically return an object with a `data` or `result`
        // containing the vector. Adjust this extraction to match your chosen model's docs.
        const vector = embedJson?.result?.data?.[0]?.embedding ?? embedJson?.result?.data?.[0];

        if (!Array.isArray(vector)) {
            console.error('Embedding response payload:', JSON.stringify(embedJson, null, 2));
            throw new Error('Could not find embedding vector array in Workers AI response');
        }

        const metadataText = chunk.text.length > 4000 ? `${chunk.text.slice(0, 4000)}...` : chunk.text;

        embeddedChunks.push({
            id: chunk.id,
            values: vector,
            metadata: {
                ...chunk.metadata,
                text: metadataText
            }
        });
    }

    // 3. Upsert vectors into Cloudflare Vectorize
    const vectorizeUrl = `https://api.cloudflare.com/client/v4/accounts/${accountId}/vectorize/v2/indexes/${vectorIndex}/upsert`;

    const ndjsonPayload = embeddedChunks.map((chunk) => JSON.stringify(chunk)).join('\n');

    const upsertResult = await fetch(vectorizeUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-ndjson',
            Accept: 'application/json',
            Authorization: `Bearer ${apiToken}`
        },
        body: ndjsonPayload
    });

    if (!upsertResult.ok) {
        const body = await upsertResult.text();
        throw new Error(`Vectorize upsert failed: ${upsertResult.status} ${body}`);
    }

    console.log('Indexed knowledge into Vectorize index:', vectorIndex);
}


main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
