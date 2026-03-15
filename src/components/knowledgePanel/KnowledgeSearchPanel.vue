<script setup lang="ts">
// External Dependencies
import { micromark } from 'micromark';
import { ref } from 'vue';
import { SendHorizonalIcon } from 'lucide-vue-next';
import { ChatClient, fetchServerSentEvents } from '@tanstack/ai-client';

// App Components - Statically imported so always available, even after app goes offline.
import Button from '@/components/button/Button.vue';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// Chat state (kept here so it persists across view switches)
const userText = ref<string | undefined>();
const assistantThinking = ref<string | undefined>();
const assistantText = ref<string | undefined>();

const client = new ChatClient({
    connection: fetchServerSentEvents('https://api.datapos.app/ai/anthropic/chat'),
    body: { model: 'claude-sonnet-4-5' },
    initialMessages: [],
    onMessagesChange: (messages): void => {
        for (const message of messages) {
            for (const part of message.parts) {
                if (message.role === 'user') {
                    if (part.type === 'text') {
                        userText.value = part.content;
                    }
                } else if (message.role === 'assistant') {
                    if (part.type === 'thinking') {
                        assistantThinking.value = part.content;
                    } else if (part.type === 'text') {
                        assistantText.value = micromark(part.content);
                    }
                }
            }
        }
    },
    onResponse: (response): void => {},
    onChunk: (chunk): void => {},
    // onToolCall: async ({ toolName, input }) => {
    //     // Handle client tool execution
    //     return { result: '...' };
    // },
    onFinish: (message): void => {}
});

async function runTest(): Promise<void> {
    await client.sendMessage('What should I search for to find the latest developments in renewable energy?');
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
</script>

<template>
    <div class="flex flex-1 flex-col overflow-y-hidden px-4">
        <div class="text-muted-foreground flex flex-1 flex-col gap-y-4 overflow-y-auto py-4 font-light wrap-break-word">
            <div>{{ userText }}</div>
            <div>{{ assistantThinking }}</div>
            <div v-html="assistantText" />
        </div>

        <div class="flex-none pb-6">
            <div>
                <div class="mt-2">
                    <textarea
                        id="comment"
                        name="comment"
                        class="bg-surface block max-h-48 w-full resize-none rounded-md border-0 px-3 py-1.5 text-base outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6 dark:bg-white/5 dark:text-white dark:outline-white/10 dark:placeholder:text-gray-500 dark:focus:outline-indigo-500"
                        rows="4"
                    />
                </div>
            </div>

            <div class="flex justify-end pr-1 pb-1">
                <Button icon-size="sm" @click="runTest">
                    <SendHorizonalIcon stroke-width="1.25" />
                </Button>
            </div>
        </div>
    </div>
</template>

<style scoped>
:deep(h2) {
    font-weight: 500;
    margin-top: 12px;
}
:deep(ul) {
    list-style-type: disc;
    margin-top: 4px;
    margin-bottom: 4px;
    padding-left: 20px;
}
:deep(ol) {
    list-style-type: decimal;
    margin-top: 4px;
    margin-bottom: 4px;
    padding-left: 20px;
}
:deep(li) {
    margin-top: 2px;
    margin-bottom: 2px;
}
:deep(p) {
    margin-top: 12px;
}
:deep(strong) {
    font-weight: 500;
}
</style>
