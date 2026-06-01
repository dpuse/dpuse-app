<script setup lang="ts">
// ─── External Dependencies
import { Chat } from '@ai-sdk/vue';
import { marked } from 'marked';
import { SendHorizonalIcon } from 'lucide-vue-next';
import { DefaultChatTransport, isReasoningUIPart, isTextUIPart, type ReasoningUIPart, type TextUIPart, type UIMessage } from 'ai';
import { onUnmounted, ref } from 'vue';

// ─── Local Components - Static
import Button from '@/components/ui/button/Button.vue';
import KnowledgeHeader from '@/components/framework/header/KnowledgeHeader.vue';
import ScrollArea from '@/components/ui/ScrollArea.vue';
import Separator from '~/src/components/ui/Separator.vue';

// ─── Options, Properties, Slots & Emits ──────────────────────────────────────────────────────────────────────────────

const { title } = defineProps<{ title: string }>();

// ─── State ───────────────────────────────────────────────────────────────────────────────────────────────────────────

const input = ref('What should I search for to find the latest developments in renewable energy?');
const scrollElement = ref<HTMLElement | null>(null);
let scrollObserver: MutationObserver | null = null;

const chat = new Chat({
    transport: new DefaultChatTransport({
        api: 'https://api.dpuse.app/ai/chat',
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

function renderText(text: string): string {
    return marked(text) as string;
}

type AssistantStep = { type: 'reasoning'; parts: ReasoningUIPart[]; isLast: boolean } | { type: 'text'; parts: TextUIPart[]; isLast: boolean };

function getMessageSteps(message: UIMessage): AssistantStep[] {
    const steps: AssistantStep[] = [];
    const reasoningParts = message.parts.filter(isReasoningUIPart);
    const textParts = message.parts.filter(isTextUIPart);
    if (reasoningParts.length > 0) steps.push({ type: 'reasoning', parts: reasoningParts, isLast: false });
    if (textParts.length > 0) steps.push({ type: 'text', parts: textParts, isLast: false });
    if (steps.length > 0) steps.at(-1)!.isLast = true;
    return steps;
}

// --- Side Effects ────────────────────────────────────────────────────────────────────────────────────────────────────

onUnmounted(() => scrollObserver?.disconnect());

// ─── Handlers ────────────────────────────────────────────────────────────────────────────────────────────────────────

async function handleSendMessage(): Promise<void> {
    const text = input.value.trim();
    if (!text) return;
    input.value = '';
    await chat.sendMessage({ text });
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

        <Separator class="mx-4" />

        <div class="flex min-h-0 flex-1 flex-col pl-4">
            <ScrollArea class="flex flex-1 flex-col" variant="none" @initialised="handleScrollAreaInitialised">
                <template v-for="message in chat.messages" :key="message.id">
                    <template v-if="message.role === 'user'">
                        <div v-for="part in message.parts.filter(isTextUIPart)" :key="part.text" class="mt-3 flex pr-4">
                            <div class="w-full rounded-md bg-blue-50 px-3 py-2 text-sm">{{ part.text }}</div>
                        </div>
                    </template>

                    <template v-else-if="message.role === 'assistant'">
                        <div class="mt-3 pr-4">
                            <div v-for="step in getMessageSteps(message)" :key="step.type" class="flex gap-3">
                                <div class="flex w-4 shrink-0 flex-col items-center">
                                    <div class="mt-1.25 h-2 w-2 shrink-0 rounded-full" :class="step.type === 'reasoning' ? 'bg-subtle' : 'bg-content'"></div>
                                    <div v-if="!step.isLast" class="mt-1 w-px flex-1 bg-separator"></div>
                                </div>
                                <div class="min-w-0 flex-1 pb-4">
                                    <template v-if="step.type === 'reasoning'">
                                        <div class="mb-1 text-xs font-medium tracking-wide text-subtle">Thinking</div>
                                        <div v-for="part in step.parts" :key="part.text" class="text-sm text-subtle">{{ part.text }}</div>
                                    </template>
                                    <template v-else>
                                        <div class="mb-1 text-xs font-medium tracking-wide text-subtle">Response</div>
                                        <div v-for="part in step.parts" :key="part.text" class="text-sm" v-html="renderText(part.text)" />
                                    </template>
                                </div>
                            </div>
                        </div>
                    </template>
                </template>
            </ScrollArea>

            <div class="relative flex-none pr-4">
                <div class="mt-0">
                    <textarea
                        id="comment"
                        v-model="input"
                        name="comment"
                        :class="[
                            'block h-18.25 max-h-40 w-full resize-none border-y border-separator bg-surface py-1.5 pr-3 pl-12.25 text-base',
                            'sm:text-sm/6 dark:bg-white/5 dark:text-white',
                            // 'outline-1 -outline-offset-1 outline-gray-300 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 dark:outline-white/10 dark:focus:outline-indigo-500',
                            'placeholder:text-gray-400 dark:placeholder:text-gray-500'
                        ]"
                        rows="2"
                    />
                </div>

                <div class="absolute right-4.25 bottom-px">
                    <Button icon-size="sm" @click="handleSendMessage">
                        <SendHorizonalIcon stroke-width="1.25" />
                    </Button>
                </div>
            </div>

            <div class="flex h-(--status-bar-height) items-center text-xs text-muted">Status: {{ chat.status }}; Provider: {{ 'Anthropic' }}; Model: {{ 'claude-sonnet-4-6' }}</div>
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
