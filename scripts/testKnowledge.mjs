import process from 'node:process';

async function embedText(accountId, apiToken, model, text) {
    const embedUrl = `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${model}`;
    const response = await fetch(embedUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiToken}`
        },
        body: JSON.stringify({ text })
    });

    if (!response.ok) {
        const body = await response.text();
        throw new Error(`Embedding request failed: ${response.status} ${body}`);
    }

    const json = await response.json();
    const vector = json?.result?.data?.[0]?.embedding ?? json?.result?.data?.[0];

    if (!Array.isArray(vector)) {
        console.error('Unexpected embedding payload:', JSON.stringify(json, null, 2));
        throw new Error('Could not extract embedding vector array');
    }

    return vector;
}

async function main() {
    const accountId = process.env['CLOUDFLARE_ACCOUNT_ID1'];
    const apiToken = process.env['CLOUDFLARE_AI_API_TOKEN1'];
    const vectorIndex = 'datapos-knowledge';

    const embeddingsModel = '@cf/baai/bge-base-en-v1.5';
    const testQuery = 'Show me the current state of all modules.';

    const queryVector = await embedText(accountId, apiToken, embeddingsModel, testQuery);

    const queryUrl = `https://api.cloudflare.com/client/v4/accounts/${accountId}/vectorize/v2/indexes/${vectorIndex}/query`;

    const queryResponse = await fetch(queryUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiToken}`
        },
        body: JSON.stringify({
            vector: queryVector,
            topK: 3,
            returnValues: false,
            includeMetadata: true
        })
    });

    if (!queryResponse.ok) {
        const body = await queryResponse.text();
        throw new Error(`Vectorize query failed: ${queryResponse.status} ${body}`);
    }

    const queryJson = await queryResponse.json();

    console.log('Vectorize query response:', JSON.stringify(queryJson, null, 2));

    const matches = queryJson?.result?.matches ?? [];
    if (matches.length > 0) {
        console.log('\nMatch previews:');
        for (const match of matches) {
            console.log(`- ${match.id} (score: ${match.score?.toFixed?.(3) ?? match.score})`);
            const text = match.metadata?.text;
            if (typeof text === 'string' && text.length > 0) {
                const preview = text.length > 200 ? `${text.slice(0, 200)}...` : text;
                console.log(`  text: ${preview}`);
            }
        }
    }
}

// eslint-disable-next-line unicorn/prefer-top-level-await
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
