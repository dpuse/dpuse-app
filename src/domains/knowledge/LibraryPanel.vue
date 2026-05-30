<script setup lang="ts">
// External Dependencies
import { Chat } from '@ai-sdk/vue';
import { marked } from 'marked';
import { SendHorizonalIcon } from 'lucide-vue-next';
import { ChatClient, fetchServerSentEvents } from '@tanstack/ai-client';
import { computed, onMounted, ref } from 'vue';
import { DefaultChatTransport, isReasoningUIPart, isTextUIPart } from 'ai';

// Local (App) Framework
// import { type BreadcrumbConfig, useBreadcrumbs } from '@/composables/useBreadcrumbs';

// Local Components - Static
import Button from '@/components/ui/button/Button.vue';
import KnowledgeHeader from '@/components/framework/header/KnowledgeHeader.vue';

// Options, Properties, Slots & Emits ──────────────────────────────────────────────────────────────────────────────────

const { title } = defineProps<{ title: string }>();

// EXPERIMENTAL ────────────────────────────────────────────────────────────────────────────────────────────────────────

const PROMPT = 'What should I search for to find the latest developments in renewable energy?';

const activeTab = ref<'tanstack' | 'vercel'>('tanstack');

// ─── TanStack AI ──────────────────────────────────────────────────────────────

const tsUserText = ref<string | undefined>();
const tsAssistantThinking = ref<string | undefined>();
const tsAssistantText = ref<string | undefined>();

let client: ChatClient;

onMounted(() => {
    client = new ChatClient({
        connection: fetchServerSentEvents('https://api.dpuse.app/ai/anthropic/chat'),
        body: { model: 'claude-sonnet-4-6' },
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

async function runTanStackTest(): Promise<void> {
    await client.sendMessage(PROMPT);
}

// ─── Vercel AI SDK (@ai-sdk/vue Chat) ────────────────────────────────────────
// Dummy endpoint — server must use streamText + toUIMessageStreamResponse()
// messages/status/error getters are backed by Vue refs inside VueChatState

const vercelChat = new Chat({
    transport: new DefaultChatTransport({
        api: 'https://api.dpuse.app/ai/vanthropic/chat',
        body: { model: 'claude-sonnet-4-6' }
    })
});

const vercelUserText = computed(() => {
    const last = vercelChat.messages.toReversed().find((m) => m.role === 'user');
    return last?.parts.find(isTextUIPart)?.text;
});

const vercelAssistantThinking = computed(() => {
    const last = vercelChat.messages.toReversed().find((m) => m.role === 'assistant');
    return last?.parts.find(isReasoningUIPart)?.text;
});

const vercelAssistantText = computed(() => {
    const last = vercelChat.messages.toReversed().find((m) => m.role === 'assistant');
    const text = last?.parts.find(isTextUIPart)?.text;
    return text == null ? undefined : (marked(text) as string);
});

async function runVercelTest(): Promise<void> {
    await vercelChat.sendMessage({ text: PROMPT });
}

// ─── Shared ───────────────────────────────────────────────────────────────────

async function runTest(): Promise<void> {
    await (activeTab.value === 'tanstack' ? runTanStackTest() : runVercelTest());
}
</script>

<template>
    <div class="flex h-full flex-col">
        <KnowledgeHeader class="mx-4 flex-none" :overline="'Knowledge'" :title="title" />

        <div class="flex flex-1 flex-col overflow-y-hidden px-4">
            <!-- Tab toggle -->
            <div class="flex flex-none gap-x-2 border-b border-gray-200 dark:border-white/10">
                <button
                    class="border-b-2 px-3 pb-2 text-sm font-medium transition-colors"
                    :class="
                        activeTab === 'tanstack'
                            ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                            : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                    "
                    @click="activeTab = 'tanstack'"
                >
                    TanStack AI
                </button>
                <button
                    class="border-b-2 px-3 pb-2 text-sm font-medium transition-colors"
                    :class="
                        activeTab === 'vercel'
                            ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                            : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                    "
                    @click="activeTab = 'vercel'"
                >
                    Vercel AI SDK
                </button>
            </div>

            <!-- TanStack output -->
            <div v-if="activeTab === 'tanstack'" class="flex flex-1 flex-col gap-y-4 overflow-y-auto py-4 font-light wrap-break-word text-muted">
                <div>{{ tsUserText }}</div>
                <div>{{ tsAssistantThinking }}</div>
                <div v-html="tsAssistantText" />
            </div>

            <!-- Vercel output -->
            <div v-else class="flex flex-1 flex-col gap-y-4 overflow-y-auto py-4 font-light wrap-break-word text-muted">
                <div class="text-xs text-gray-400 dark:text-gray-500">status: {{ vercelChat.status }}</div>
                <div>{{ vercelUserText }}</div>
                <div>{{ vercelAssistantThinking }}</div>
                <div v-html="vercelAssistantText" />
            </div>

            <div class="flex-none pb-6">
                <div>
                    <div class="mt-2">
                        <textarea
                            id="comment"
                            name="comment"
                            class="block max-h-48 w-full resize-none rounded-md border-0 bg-surface px-3 py-1.5 text-base outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6 dark:bg-white/5 dark:text-white dark:outline-white/10 dark:placeholder:text-gray-500 dark:focus:outline-indigo-500"
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
