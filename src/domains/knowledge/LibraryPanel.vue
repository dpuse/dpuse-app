<script setup lang="ts">
// ─── External Dependencies & Registrations
import DOMPurify from 'dompurify';
import { marked } from 'marked'; // NOTE: 'marked' with DOMPurify is at least 14kB smaller (gzipped) than 'micromark' or 'markdown-it' without DOMPurify. Measured June 2, 2026.
import { SendHorizonalIcon } from 'lucide-vue-next';
import { ChatClient, fetchServerSentEvents } from '@tanstack/ai-client';
import { onMounted, onUnmounted, ref } from 'vue';

// ─── Local Components - Static
import Button from '@/components/ui/button/Button.vue';
import KnowledgeHeader from '@/components/framework/header/KnowledgeHeader.vue';
import ScrollArea from '@/components/ui/ScrollArea.vue';
import Separator from '@/components/ui/Separator.vue';

// ─── Options, Properties, Slots & Emits ──────────────────────────────────────────────────────────────────────────────

const { title } = defineProps<{ title: string }>();

// ─── Constants ───────────────────────────────────────────────────────────────────────────────────────────────────────

const PROMPT = 'What should I search for to find the latest developments in renewable energy?';

// ─── State ───────────────────────────────────────────────────────────────────────────────────────────────────────────

const input = ref(PROMPT);
const scrollElement = ref<HTMLElement | null>(null);
let scrollObserver: MutationObserver | null = null;

const chatMessages = ref<LibraryChatMessage[]>([]);
const chatErrorsByUserMessageId = ref<Record<string, string[]>>({});
const chatStatus = ref('idle');

let client: ChatClient | null = null;

// ─── Types ───────────────────────────────────────────────────────────────────────────────────────────────────────────

interface LibraryChatPart {
    type: string;
    content: string;
}

interface LibraryChatMessage {
    id: string;
    role: string;
    parts: LibraryChatPart[];
}

type AssistantStep = { type: 'thinking'; parts: LibraryChatPart[]; isLast: boolean } | { type: 'text'; parts: LibraryChatPart[]; isLast: boolean };

// ─── Derived State ───────────────────────────────────────────────────────────────────────────────────────────────────

function isTextPart(part: LibraryChatPart): boolean {
    return part.type === 'text';
}

function isThinkingPart(part: LibraryChatPart): boolean {
    return part.type === 'thinking';
}

function renderText(text: string): string {
    return DOMPurify.sanitize(marked.parse(text, { async: false }));
}

function extractErrorMessage(error: Error): string {
    try {
        const payload = JSON.parse(error.message.slice(4)) as { error?: { message?: string } };
        const parsedMessage = payload.error?.message?.trim();
        return parsedMessage != null && parsedMessage.length > 0 ? parsedMessage : error.message;
    } catch {
        return error.message;
    }
}

function getMessageErrors(messageId: string): string[] {
    return chatErrorsByUserMessageId.value[messageId] ?? [];
}

function appendErrorForLatestUserMessage(errorText: string): void {
    const latestUserMessage = chatMessages.value.toReversed().find((message) => message.role === 'user');
    const targetMessageId = latestUserMessage?.id;
    if (targetMessageId == null) return;
    const existingErrors = chatErrorsByUserMessageId.value[targetMessageId] ?? [];
    chatErrorsByUserMessageId.value = {
        ...chatErrorsByUserMessageId.value,
        [targetMessageId]: [...existingErrors, errorText]
    };
}

function getMessageSteps(message: LibraryChatMessage): AssistantStep[] {
    const steps: AssistantStep[] = [];
    const thinkingParts = message.parts.filter((part) => isThinkingPart(part));
    const textParts = message.parts.filter((part) => isTextPart(part));
    if (thinkingParts.length > 0) steps.push({ type: 'thinking', parts: thinkingParts, isLast: false });
    if (textParts.length > 0) steps.push({ type: 'text', parts: textParts, isLast: false });
    if (steps.length > 0) steps.at(-1)!.isLast = true;
    return steps;
}

// ─── Side Effects ────────────────────────────────────────────────────────────────────────────────────────────────────

onMounted(() => {
    client = new ChatClient({
        connection: fetchServerSentEvents('https://api.dpuse.app/ai/chat/tanstack'),
        forwardedProps: {
            providerId: 'anthropic',
            modelId: 'claude-sonnet-4-6',
            options: {
                effort: 'medium',
                maxTokens: 1024,
                temperature: 1,
                thinking: { type: 'enabled', budget_tokens: 1024 }
            }
        },
        initialMessages: [],
        onMessagesChange: (messages): void => {
            console.log('onMessagesChange', messages);
            chatMessages.value = messages as unknown as LibraryChatMessage[];
        },
        onLoadingChange: (isLoading): void => {
            console.log('onLoadingChange', isLoading);
        },
        onStatusChange: (status): void => {
            console.log('onStatusChange', status);
            chatStatus.value = status;
        },
        onErrorChange: (error): void => {
            console.log('onErrorChange', error?.message);
        },
        onResponse: (response): void => {
            console.log('onResponse', response);
        },
        onSubscriptionChange: (isSubscribed): void => {
            console.log('onSubscriptionChange', isSubscribed);
        },
        onConnectionStatusChange: (status): void => {
            console.log('onConnectionStatusChange', status);
        },
        onChunk: (chunk): void => {
            console.log('onChunk', chunk);
        },
        onError: (error): void => {
            console.log('onError 1', error);
            const extractedMessage = extractErrorMessage(error);
            console.log('onError 2', extractedMessage);
            appendErrorForLatestUserMessage(extractedMessage);
        },
        onSessionGeneratingChange: (isGenerating): void => {
            console.log('onSessionGeneratingChange', isGenerating);
        },
        onFinish: (message): void => {
            console.log('onFinish', message);
        }
    });
});

onUnmounted(() => scrollObserver?.disconnect());

// ─── UI Handlers ─────────────────────────────────────────────────────────────────────────────────────────────────────

async function handleSendMessage(): Promise<void> {
    if (client == null) return;
    const text = input.value.trim();
    if (!text) return;
    input.value = '';
    await client.sendMessage(text);
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
                <template v-for="message in chatMessages" :key="message.id">
                    <template v-if="message.role === 'user'">
                        <div v-for="(part, index) in message.parts.filter((part) => isTextPart(part))" :key="`${message.id}-user-${index}`" class="mt-3 flex pr-4">
                            <div class="w-full rounded-md bg-blue-50 px-3 py-2 text-sm">{{ part.content }}</div>
                        </div>

                        <div v-for="(errorText, errorIndex) in getMessageErrors(message.id)" :key="`${message.id}-error-${errorIndex}`" class="mt-3 pr-4">
                            <div class="flex gap-3">
                                <div class="flex w-4 shrink-0 flex-col items-center">
                                    <div class="mt-1.25 h-2 w-2 shrink-0 rounded-full bg-rose-600"></div>
                                </div>
                                <div class="min-w-0 flex-1 pb-4">
                                    <div class="mb-1 text-xs font-medium tracking-wide text-rose-700">Error</div>
                                    <div class="text-sm whitespace-pre-line text-rose-700">{{ errorText }}</div>
                                </div>
                            </div>
                        </div>
                    </template>

                    <template v-else-if="message.role === 'assistant'">
                        <div class="mt-3 pr-4">
                            <div v-for="step in getMessageSteps(message)" :key="step.type" class="flex gap-3">
                                <div class="flex w-4 shrink-0 flex-col items-center">
                                    <div class="mt-1.25 h-2 w-2 shrink-0 rounded-full" :class="step.type === 'thinking' ? 'bg-subtle' : 'bg-content'"></div>
                                    <div v-if="!step.isLast" class="mt-1 w-px flex-1 bg-separator"></div>
                                </div>
                                <div class="min-w-0 flex-1 pb-4">
                                    <template v-if="step.type === 'thinking'">
                                        <div class="mb-1 text-xs font-medium tracking-wide text-subtle">Thinking</div>
                                        <div v-for="(part, index) in step.parts" :key="`${message.id}-thinking-${index}`" class="text-sm text-subtle">{{ part.content }}</div>
                                    </template>
                                    <template v-else>
                                        <div class="mb-1 text-xs font-medium tracking-wide text-subtle">Response</div>
                                        <div v-for="(part, index) in step.parts" :key="`${message.id}-text-${index}`" class="text-sm" v-html="renderText(part.content)" />
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
                            'block h-18.25 max-h-40 w-full resize-none border-y border-separator bg-surface py-1.5 pr-3  text-base',
                            'sm:text-sm/6 dark:bg-white/5 dark:text-white',
                            'placeholder:text-gray-400 dark:placeholder:text-gray-500'
                        ]"
                        rows="2"
                    />
                </div>

                <div class="absolute right-4.25 bottom-px">
                    <Button shape="minimal" @click="handleSendMessage">
                        <SendHorizonalIcon stroke-width="1.25" />
                    </Button>
                </div>
            </div>

            <div class="flex h-(--status-bar-height) items-center text-xs text-muted">Status: {{ chatStatus }}; Provider: {{ 'Anthropic' }}; Model: {{ 'claude-sonnet-4-6' }}</div>
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
