<script setup lang="ts">
// ─── External Dependencies & Registrations
import { Chat } from '@ai-sdk/vue';
import DOMPurify from 'dompurify';
import { marked } from 'marked'; // NOTE: 'marked' with DOMPurify is at least 14kB smaller (gzipped) than 'micromark' or 'markdown-it' without DOMPurify. Measured June 2, 2026.
import { ArrowUpIcon, EllipsisVerticalIcon } from 'lucide-vue-next';
import { DefaultChatTransport, isReasoningUIPart, isTextUIPart, lastAssistantMessageIsCompleteWithToolCalls, type ReasoningUIPart, type TextUIPart, type UIMessage } from 'ai';
import { onMounted, onUnmounted, ref } from 'vue';

// ─── Tools ───────────────────────────────────────────────────────────────────────────────────────────────────────────
import { toolExecutors } from './tools';

// ─── Local Components - Static
import Button from '@/components/ui/button/Button.vue';
import KnowledgeHeader from '@/components/framework/header/KnowledgeHeader.vue';
import ScrollArea from '@/components/ui/ScrollArea.vue';
import Separator from '@/components/ui/Separator.vue';

// ─── Options, Properties, Slots & Emits ──────────────────────────────────────────────────────────────────────────────

const { title } = defineProps<{ title: string }>();

// ─── State ───────────────────────────────────────────────────────────────────────────────────────────────────────────

const input = ref('What should I search for to find the latest developments in renewable energy?');
const isInputExpanded = ref(false);
const scrollElement = ref<HTMLElement | null>(null);
let scrollObserver: MutationObserver | null = null;
const chatErrorsByUserMessageId = ref<Record<string, string[]>>({});

const chat = new Chat({
    transport: new DefaultChatTransport({
        api: 'https://api.dpuse.app/ai/chat',
        body: {
            providerId: 'anthropic',
            modelId: 'claude-sonnet-4-6',
            options: {
                effort: 'medium',
                maxOutputTokens: 4096,
                temperature: 1,
                thinking: { type: 'adaptive' }
            }
        }
    }),
    onError: (error): void => {
        console.log('onError 1', error);
        const extractedError = error.message;
        const extractedMessage = typeof extractedError === 'string' ? extractedError : JSON.stringify(extractedError);
        console.log('onError 2', extractedMessage);
        appendErrorForLatestUserMessage(extractedMessage);
    },
    onData: (data): void => {
        console.log('onData', data);
    },
    sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls,
    onToolCall: async ({ toolCall }): Promise<void> => {
        const executor = toolExecutors[toolCall.toolName];
        if (!executor) return;
        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO
            const arguments_ = (toolCall as any).args ?? (toolCall as any).input;
            chat.addToolOutput({
                tool: toolCall.toolName,
                toolCallId: toolCall.toolCallId,
                output: await executor(arguments_)
            });
        } catch (error) {
            chat.addToolOutput({
                tool: toolCall.toolName,
                toolCallId: toolCall.toolCallId,
                output: { error: error instanceof Error ? error.message : 'Tool execution failed' }
            });
        }
    },
    onFinish: (properties): void => {
        console.log('onFinish', properties);
    }
});

// ─── Derived State ───────────────────────────────────────────────────────────────────────────────────────────────────

function renderText(text: string): string {
    return DOMPurify.sanitize(marked.parse(text, { async: false }));
}

function getMessageErrors(messageId: string): string[] {
    return chatErrorsByUserMessageId.value[messageId] ?? [];
}

function appendErrorForLatestUserMessage(errorText: string): void {
    const latestUserMessage = chat.messages.toReversed().find((message: UIMessage) => message.role === 'user');
    const targetMessageId = latestUserMessage?.id;
    if (targetMessageId == null) return;
    const existingErrors = chatErrorsByUserMessageId.value[targetMessageId] ?? [];
    chatErrorsByUserMessageId.value = {
        ...chatErrorsByUserMessageId.value,
        [targetMessageId]: [...existingErrors, errorText]
    };
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

let singleRowHeight = 0;

onMounted(() => {
    const element = document.querySelector<HTMLTextAreaElement>('#comment');
    if (!element) return;
    const savedValue = element.value;
    element.value = '';
    singleRowHeight = element.clientHeight;
    element.value = savedValue;
    isInputExpanded.value = element.clientHeight > singleRowHeight;
});
onUnmounted(() => scrollObserver?.disconnect());

// ─── UI Handlers ─────────────────────────────────────────────────────────────────────────────────────────────────────

function onTextareaInput(event: Event): void {
    isInputExpanded.value = (event.target as HTMLTextAreaElement).clientHeight > singleRowHeight;
}

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

        <div class="relative flex min-h-0 flex-1 flex-col pl-4">
            <ScrollArea class="flex flex-1 flex-col" variant="none" scroll-area-padding="embedded" @initialised="handleScrollAreaInitialised">
                <template v-for="message in chat.messages" :key="message.id">
                    <template v-if="message.role === 'user'">
                        <div v-for="part in message.parts.filter(isTextUIPart)" :key="part.text" class="mt-3 flex">
                            <div class="w-full rounded-md bg-blue-50 px-3 py-2 text-sm">{{ part.text }}</div>
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
                        <div class="mt-3">
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

            <div
                :class="[
                    'absolute right-4 bottom-(--safe-bottom-offset) left-16 flex flex-none flex-col border border-separator bg-surface py-1 pl-2 sm:min-h-10 sm:flex-row sm:items-center',
                    isInputExpanded ? 'rounded-2xl' : 'rounded-full'
                ]"
            >
                <textarea
                    id="comment"
                    v-model="input"
                    name="comment"
                    class="field-sizing-content max-h-24 w-full resize-none overflow-y-auto rounded-r-2xl px-2 text-sm text-muted outline-none"
                    @input="onTextareaInput"
                />

                <div class="flex w-full items-center justify-end gap-x-1.5 pr-1 sm:absolute sm:right-3 sm:w-auto sm:self-end sm:pr-0">
                    <Button class="rounded-full bg-zinc-200 p-1.25" shape="minimal">
                        <EllipsisVerticalIcon class="size-5" stroke-width="1.5" />
                    </Button>

                    <Button class="rounded-full bg-blue-400 p-1 text-white" shape="minimal" @click="handleSendMessage">
                        <ArrowUpIcon class="size-5.5" stroke-width="2.5" />
                    </Button>
                </div>
            </div>

            <div class="mr-4 flex h-(--status-bar-height) items-center border-t border-separator text-xs text-muted">
                Status: {{ chat.status }}; Provider: {{ 'Anthropic' }}; Model: {{ 'claude-sonnet-4-6' }}
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
:deep(table) {
    width: 100%;
    border-collapse: collapse;
    margin-top: 12px;
    margin-bottom: 12px;
    font-size: 0.8125rem;
}
:deep(th) {
    text-align: left;
    font-weight: 500;
    padding: 6px 10px;
    border-bottom: 1px solid var(--color-separator);
    white-space: nowrap;
}
:deep(td) {
    padding: 6px 10px;
    border-bottom: 1px solid var(--color-separator);
    vertical-align: top;
}
:deep(tr:last-child td) {
    border-bottom: none;
}
</style>
