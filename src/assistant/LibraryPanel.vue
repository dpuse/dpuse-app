<script setup lang="ts">
// ── External Dependencies & Registrations
import DOMPurify from 'dompurify';
import { SendHorizonalIcon } from '@lucide/vue';
import { ChatClient, fetchServerSentEvents } from '@tanstack/ai-client';
import { onMounted, onUnmounted, ref, shallowRef, watch } from 'vue';

// ── DPUse Framework
import type { MarkedTool as MarkedToolType } from '@dpuse/dpuse-tool-marked-markdown-parser';

// ── Local Framework
import { tanstackClientTools } from './tools/tanstackClientTools';
import { toolConfigs } from '@/state/session';

// ── Local Components - Static
import AssistantHeader from '@/components/framework/header/AssistantHeader.vue';
import Button from '@/components/ui/button/Button.vue';
import ScrollArea from '@/components/ui/ScrollArea.vue';
import Separator from '@/components/ui/Separator.vue';

// ── Options, Properties, Model Value, Slots & Emits ──────────────────────────────────────────────────────────────────

const { title } = defineProps<{ title: string }>();

// ── Types ────────────────────────────────────────────────────────────────────────────────────────────────────────────

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

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

const PROMPT = 'What should I search for to find the latest developments in renewable energy?';

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

const input = ref(PROMPT);
const scrollElement = ref<HTMLElement | null>(null);

const chatMessages = ref<LibraryChatMessage[]>([]);
const chatErrorsByUserMessageId = ref<Record<string, string[]>>({});
const chatStatus = ref('idle');
const markedTool = shallowRef<MarkedToolType>();

const state: { client: ChatClient | null; scrollObserver: MutationObserver | null } = { client: null, scrollObserver: null };

// ── Derived State ────────────────────────────────────────────────────────────────────────────────────────────────────

function isTextPart(part: LibraryChatPart): boolean {
    return part.type === 'text';
}

function isThinkingPart(part: LibraryChatPart): boolean {
    return part.type === 'thinking';
}

function renderText(text: string): string {
    if (!markedTool.value) return '';
    return DOMPurify.sanitize(markedTool.value.render(text));
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
    const latestUserMessage = chatMessages.value.findLast((message) => message.role === 'user');
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

// ── Side Effects ─────────────────────────────────────────────────────────────────────────────────────────────────────

const toolReady = new Promise<void>((resolve) => {
    watch(
        toolConfigs,
        (newToolConfigs) => {
            if (newToolConfigs.length === 0) return;
            resolve();
        },
        { immediate: true }
    );
});

onMounted(async () => {
    await toolReady;
    markedTool.value = await loadMarkedTool();
});

onMounted(() => {
    state.client = new ChatClient({
        connection: fetchServerSentEvents('https://api.dpuse.app/ai/chat/tanstack'),
        tools: tanstackClientTools,
        forwardedProps: {
            providerId: 'anthropic',
            modelId: 'claude-haiku-4-5',
            options: {
                maxTokens: 1024,
                temperature: 1
            },
            rag: true
            // providerId: 'anthropic',
            // modelId: 'claude-sonnet-4-6',
            // options: {
            //     effort: 'medium',
            //     maxTokens: 1024,
            //     temperature: 1,
            //     thinking: { type: 'adaptive' }
            // },
            // rag: true
            // providerId: 'openAI',
            // modelId: 'gpt-4.1',
            // options: {
            //     maxOutputTokens: 1024,
            //     temperature: 1
            // },
            // rag: true
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

onUnmounted(() => state.scrollObserver?.disconnect());

// ── Event Handlers ───────────────────────────────────────────────────────────────────────────────────────────────────

async function handleSendMessage(): Promise<void> {
    if (state.client == null) return;
    const text = input.value.trim();
    if (!text) return;
    input.value = '';
    await state.client.sendMessage(text);
}

function handleScrollAreaInitialised(element: HTMLElement): void {
    scrollElement.value = element;
    state.scrollObserver = new MutationObserver(() => {
        element.scrollTop = element.scrollHeight;
    });
    state.scrollObserver.observe(element, { childList: true, subtree: true, characterData: true });
}

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

async function loadMarkedTool(): Promise<MarkedToolType> {
    const toolModuleConfig = toolConfigs.value.find((config) => config.id === 'dpuse-tool-marked-markdown-parser');
    if (!toolModuleConfig) throw new Error('No Marked tool module configuration.');

    const url = `https://engine-eu.dpuse.app/tools/marked-markdown-parser_v${toolModuleConfig.version}/dpuse-tool-marked-markdown-parser.es.js`;
    const module = (await import(/* @vite-ignore */ url)) as { MarkedTool: new () => MarkedToolType };
    const MarkedTool = module.MarkedTool;
    return new MarkedTool();
}
</script>

<template>
    <div class="flex h-full flex-col">
        <AssistantHeader class="mx-4 flex-none" :title="title" />

        <Separator class="mx-4" />

        <div class="dpuse-prose flex min-h-0 flex-1 flex-col pl-4">
            <ScrollArea class="flex flex-1 flex-col" variant="none" @initialised="handleScrollAreaInitialised">
                <template v-for="message in chatMessages" :key="message.id">
                    <template v-if="message.role === 'user'">
                        <div v-for="(part, index) in message.parts.filter((part) => isTextPart(part))" :key="`${message.id}-user-${index}`" class="mt-3 flex pr-4">
                            <div class="w-full rounded-md bg-blue-50 px-3 py-2 text-sm">{{ part.content }}</div>
                        </div>

                        <div v-for="(errorText, errorIndex) in getMessageErrors(message.id)" :key="`${message.id}-error-${errorIndex}`" class="mt-3 pr-4">
                            <div class="flex gap-3">
                                <div class="flex w-4 shrink-0 flex-col items-center">
                                    <div class="mt-1.25 size-2 shrink-0 rounded-full bg-rose-600"></div>
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
                                    <div class="mt-1.25 size-2 shrink-0 rounded-full" :class="step.type === 'thinking' ? 'bg-subtle' : 'bg-content'"></div>
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

            <div class="flex h-(--status-bar-height) items-center text-xs text-muted">Status: {{ chatStatus }}; Provider: {{ 'Anthropic' }}; Model: {{ 'claude-haiku-4-5' }}</div>
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
