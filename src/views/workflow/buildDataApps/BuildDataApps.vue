<script setup lang="ts">
try {
    throw new Error('A test error');
} catch (error) {
    // Generate or reuse a persistent distinct_id
    // const DISTINCT_ID_KEY = 'posthog_distinct_id';
    // let distinctId = localStorage.getItem(DISTINCT_ID_KEY);
    // if (!distinctId) {
    const distinctId = 'anon_' + Math.random().toString(36).substring(2, 10);
    //     localStorage.setItem(DISTINCT_ID_KEY, distinctId);
    // }

    const payload = {
        event: '$exception',
        distinct_id: distinctId,
        properties: {
            $exception_list: [
                {
                    type: (error as Error).name || 'Error',
                    value: (error as Error).message || 'Unknown error',
                    mechanism: { handled: false, type: 'generic', synthetic: false },
                    stacktrace: { type: 'raw', frames: parseStack((error as Error).stack) }
                }
            ],
            page_url: globalThis.location.href,
            browser: navigator.userAgent,
            timestamp: Date.now()
        }
    };

    fetch('https://eu.i.posthog.com/capture/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            api_key: import.meta.env.VITE_POSTHOG_PROJECT_API_KEY,
            ...payload
        })
    }).catch(console.error);
}

function parseStack(stack?: string) {
    if (!stack) return [];
    const lines = stack.split('\n').slice(1);
    return lines.map((line) => {
        const match = line.match(/at (.*?) \((.*?):(\d+):(\d+)\)/);
        if (!match) {
            return {
                platform: 'javascript',
                lang: 'javascript',
                function: line.trim() || '<anonymous>',
                in_app: true
            };
        }
        return {
            platform: 'javascript',
            lang: 'javascript',
            function: match[1] || '<anonymous>',
            filename: match[2],
            lineno: Number.parseInt(match[3] ?? '', 10),
            colno: Number.parseInt(match[4] ?? '', 10),
            in_app: true
        };
    });
}
</script>

<template>
    <div class="flex h-full items-center justify-center overflow-y-auto rounded-b-lg border-x border-b">Build data apps...</div>
</template>
