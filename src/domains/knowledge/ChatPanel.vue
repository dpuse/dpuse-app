<script setup lang="ts">
// ─── External Dependencies
import { Chat } from '@ai-sdk/vue';
import { computed } from 'vue';
import { marked } from 'marked';
import { SendHorizonalIcon } from 'lucide-vue-next';
import { DefaultChatTransport, isReasoningUIPart, isTextUIPart } from 'ai';

// ─── Local Components - Static
import Button from '@/components/ui/button/Button.vue';
import KnowledgeHeader from '@/components/framework/header/KnowledgeHeader.vue';

// ─── Constants ───────────────────────────────────────────────────────────────────────────────────────────────────────

const PROMPT = 'What should I search for to find the latest developments in renewable energy?';

// ─── Options, Properties, Slots & Emits ──────────────────────────────────────────────────────────────────────────────

const { title } = defineProps<{ title: string }>();

// ─── State ───────────────────────────────────────────────────────────────────────────────────────────────────────────

const chat = new Chat({
    transport: new DefaultChatTransport({
        api: 'https://api.dpuse.app/ai2/chat',
        body: {
            model: 'claude-sonnet-4-6',
            options: {
                systemPrompt: 'You are a helpful assistant.',
                temperature: 0.7,
                maxTokens: 1024,
                thinking: { type: 'enabled', budget_tokens: 2000 }
            },
            provider: 'anthropic',
            stream: true
        }
    })
});

// ─── Derived State ───────────────────────────────────────────────────────────────────────────────────────────────────

const vercelUserText = computed(() => {
    const last = chat.messages.toReversed().find((m) => m.role === 'user');
    return last?.parts.find(isTextUIPart)?.text;
});

const vercelAssistantThinking = computed(() => {
    const last = chat.messages.toReversed().find((m) => m.role === 'assistant');
    return last?.parts.find(isReasoningUIPart)?.text;
});

const vercelAssistantText = computed(() => {
    const last = chat.messages.toReversed().find((m) => m.role === 'assistant');
    const text = last?.parts.find(isTextUIPart)?.text;
    return text == null ? undefined : (marked(text) as string);
});

// ─── Handlers ────────────────────────────────────────────────────────────────────────────────────────────────────────

async function handleSendMessage(): Promise<void> {
    await chat.sendMessage({ text: PROMPT });
}
</script>

<template>
    <div class="flex h-full flex-col">
        <KnowledgeHeader class="mx-4 flex-none" :overline="'Knowledge'" :title="title" />

        <div class="flex flex-1 flex-col overflow-y-hidden px-4">
            <div class="bg-red-100 text-xs text-gray-400 dark:text-gray-500">status: {{ chat.status }}</div>
            <div class="bg-blue-100">{{ vercelUserText }}</div>
            <div class="bg-yellow-100">{{ vercelAssistantThinking }}</div>
            <div class="bg-green-100" v-html="vercelAssistantText" />

            <div class="flex-none pb-6">
                <div class="mt-2">
                    <textarea
                        id="comment"
                        name="comment"
                        class="block max-h-48 w-full resize-none rounded-md border-0 bg-surface px-3 py-1.5 text-base outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6 dark:bg-white/5 dark:text-white dark:outline-white/10 dark:placeholder:text-gray-500 dark:focus:outline-indigo-500"
                        rows="4"
                    />
                </div>

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
