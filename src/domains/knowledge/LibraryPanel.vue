<script setup lang="ts">
// ─── External Dependencies
import { marked } from 'marked';
import { SendHorizonalIcon } from 'lucide-vue-next';
import { ChatClient, fetchServerSentEvents } from '@tanstack/ai-client';
import { onMounted, onUnmounted, ref } from 'vue';

// ─── Local Components - Static
import Button from '@/components/ui/button/Button.vue';
import KnowledgeHeader from '@/components/framework/header/KnowledgeHeader.vue';
import ScrollArea from '@/components/ui/ScrollArea.vue';

// ─── Options, Properties, Slots & Emits ──────────────────────────────────────────────────────────────────────────────

const { title } = defineProps<{ title: string }>();

// ─── Constants ───────────────────────────────────────────────────────────────────────────────────────────────────────

const PROMPT = 'What should I search for to find the latest developments in renewable energy?';

// ─── State ───────────────────────────────────────────────────────────────────────────────────────────────────────────

const scrollElement = ref<HTMLElement | null>(null);
let scrollObserver: MutationObserver | null = null;

const tsUserText = ref<string | undefined>();
const tsAssistantThinking = ref<string | undefined>();
const tsAssistantText = ref<string | undefined>();

let client: ChatClient;

// ─── Side Effects ────────────────────────────────────────────────────────────────────────────────────────────────────

onMounted(() => {
    client = new ChatClient({
        connection: fetchServerSentEvents('https://api.dpuse.app/ai/chat'),
        forwardedProps: {
            messages: [{ id: 'msg-1', role: 'user', parts: [{ type: 'text', text: 'Hello, what can you help me with?' }] }],
            model: 'claude-sonnet-4-6',
            options: {
                systemPrompt: 'You are a helpful assistant.',
                temperature: 1,
                maxTokens: 1024,
                thinking: { type: 'enabled', budget_tokens: 2000 }
            },
            provider: 'anthropic',
            sdkAdapter: 'tanstack',
            stream: true
        },
        initialMessages: [],
        onMessagesChange: (messages): void => {
            for (const message of messages) {
                for (const part of message.parts) {
                    if (message.role === 'user') {
                        if (part.type === 'text') tsUserText.value = part.content;
                    } else if (message.role === 'assistant') {
                        if (part.type === 'thinking') tsAssistantThinking.value = part.content;
                        else if (part.type === 'text') tsAssistantText.value = marked(part.content) as string;
                    }
                }
            }
        },
        onResponse: (): void => {},
        onChunk: (): void => {},
        onFinish: (): void => {}
    });
});

onUnmounted(() => scrollObserver?.disconnect());

// ─── Handlers ────────────────────────────────────────────────────────────────────────────────────────────────────────

async function handleSendMessage(): Promise<void> {
    await client.sendMessage(PROMPT);
}

function handleScrollAreaInitialised(element: HTMLElement): void {
    scrollElement.value = element;
    scrollObserver = new MutationObserver(() => {
        element.scrollTop = element.scrollHeight;
    });
    scrollObserver.observe(element, { childList: true, subtree: true, characterData: true });
}
</script>

<template>
    <div class="flex h-full flex-col">
        <KnowledgeHeader class="mx-4 flex-none" :overline="'Knowledge'" :title="title" />

        <div class="flex flex-1 flex-col overflow-y-hidden px-4">
            <ScrollArea class="flex flex-1 flex-col" @initialised="handleScrollAreaInitialised">
                <div>{{ tsUserText }}</div>
                <div>{{ tsAssistantThinking }}</div>
                <div v-html="tsAssistantText" />
            </ScrollArea>

            <div class="flex-none pb-6">
                <div class="mt-2">
                    <textarea
                        id="comment"
                        name="comment"
                        class="block max-h-48 w-full resize-none rounded-md border-0 bg-surface px-3 py-1.5 text-base outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6 dark:bg-white/5 dark:text-white dark:outline-white/10 dark:placeholder:text-gray-500 dark:focus:outline-indigo-500"
                        rows="4"
                    />
                </div>

                <div>Status goes here...</div>

                <div class="flex justify-end pr-1 pb-1">
                    <Button icon-size="sm" @click="handleSendMessage">
                        <SendHorizonalIcon stroke-width="1.25" />
                    </Button>
                </div>
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
