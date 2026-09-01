<script setup lang="ts">
// ── External Dependencies & Registrations
import DOMPurify from 'dompurify';
import { ArrowUpIcon, SquareIcon } from '@lucide/vue';
import { computed, onMounted, onUnmounted, ref, useTemplateRef } from 'vue';

// ── Local Framework
import type { AssistantChatMessage } from './assistantChat';
import type { AssistantModelConfig } from './modelConfigs';
import { getMessageSteps } from './assistantChat';
import { useMarkedTool } from '@/services/useMarkedTool';
import { isRunningStatus, useChatSession } from '@/services/useChatSession';

// ── Static Components
import AssistantModelMenu from '../_components/AssistantModelMenu.vue';
import Button from '@/components/ui/button/Button.vue';
import ErrorDisplay from '@/components/ui/error/ErrorDisplay.vue';
import PendingLabel from '../_components/PendingLabel.vue';
import ScrollArea from '@/components/ui/scroll/ScrollArea.vue';
import TextArea from '@/components/ui/text/TextArea.vue';

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

const PROMPT = 'List the connectors.';

// ── Options, Props, Slots & Emits ────────────────────────────────────────────────────────────────────────────────────

const { modelConfig, modelConfigs } = defineProps<{ modelConfig: AssistantModelConfig; modelConfigs: AssistantModelConfig[] }>();

const emit = defineEmits<{ modelChange: [modelConfig: AssistantModelConfig] }>();

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

const input = ref(PROMPT);
const scrollElement = ref<HTMLElement | null>(null);
const inputContainerHeight = ref(0);
const { markedTool, failure: markedToolFailure, initialise: initialiseMarkedTool } = useMarkedTool();
// The model is passed as a getter so a change reaches the live session rather than rebuilding it, which would start
// the conversation again from nothing.
const { messages, status, sendFailure, unansweredQuestionIds, sendMessage, stop } = useChatSession(() => modelConfig);

const inputContainer = useTemplateRef<HTMLElement>('inputContainer');

const state: { inputContainerResizeObserver: ResizeObserver | null; scrollObserver: MutationObserver | null } = { inputContainerResizeObserver: null, scrollObserver: null };

// ── Derived State ────────────────────────────────────────────────────────────────────────────────────────────────────

// 'submitted' counts: the run is the user's to cancel from the moment it is accepted, not only once tokens arrive.
const responseIsRunning = computed(() => isRunningStatus(status.value));

// A finished run that produced nothing to read. The cause is not knowable here: the adapter maps every stop reason
// other than a tool call or a token limit to a plain finish, so a model that declined the request arrives looking
// exactly like one that answered with silence. Saying so is still better than the alternative, which is a heading over
// an empty space. Which questions those were is decided by the session, at the moment each run ends; here it is only
// looked up, so an unanswered turn keeps its notice as the conversation goes on past it.
function hasNoAnswer(message: AssistantChatMessage): boolean {
    return message.role === 'user' && unansweredQuestionIds.value.includes(message.id);
}

// The gaps in a run where the thread has nothing to show: between the question and the first token, and again while a
// tool call is in flight — a tool-only assistant message normalises to no parts, so it renders as nothing at all.
// Both are silences the placeholder speaks for, and the first content to arrive ends it.
const responseIsPending = computed(() => {
    if (!responseIsRunning.value) return false;
    const lastMessage = messages.value.at(-1);
    return lastMessage?.role !== 'assistant' || lastMessage.parts.length === 0;
});

// mb-4 (16px) on the input container isn't part of its own height, so it's added on top to keep messages clear of it.
const scrollPaddingBottom = computed(() => `${String(inputContainerHeight.value + 32)}px`);

// Only the thread's last message can still be running; everything above it is settled.
function isResponseStreaming(message: AssistantChatMessage): boolean {
    return responseIsRunning.value && message.id === messages.value.at(-1)?.id;
}

// Only reached once the step is complete: 'Done' for the answer to the question, 'Response' for the turns that were
// steps on the way to it.
function responseHeading(message: AssistantChatMessage): string {
    return message.id === messages.value.at(-1)?.id ? 'Done' : 'Response';
}

function renderText(text: string): string {
    // Formatter unavailable: fall back to sanitized plain text rather than blanking the message.
    if (!markedTool.value) return DOMPurify.sanitize(text);
    return DOMPurify.sanitize(markedTool.value.render(text));
}

// ── Side Effects ─────────────────────────────────────────────────────────────────────────────────────────────────────

onMounted(() => {
    void initialiseMarkedTool();
});

onMounted(() => {
    if (!inputContainer.value) return;
    inputContainerHeight.value = inputContainer.value.offsetHeight;
    state.inputContainerResizeObserver = new ResizeObserver(() => {
        inputContainerHeight.value = inputContainer.value?.offsetHeight ?? 0;
    });
    state.inputContainerResizeObserver.observe(inputContainer.value);
});

onUnmounted(() => {
    state.scrollObserver?.disconnect();
    state.inputContainerResizeObserver?.disconnect();
});

// ── Event Handlers ───────────────────────────────────────────────────────────────────────────────────────────────────

function handleSelectModel(newModelConfig: AssistantModelConfig): void {
    emit('modelChange', newModelConfig);
}

// The one composer action: the same button sends while the thread is idle and cancels while a response is running.
function handleComposerAction(): void {
    if (responseIsRunning.value) {
        stop();
        return;
    }
    handleSendMessage();
}

function handleSendMessage(): void {
    // Guarded rather than queued: Enter during a run would otherwise reach a session that cannot take a second send.
    if (responseIsRunning.value) return;
    const text = input.value.trim();
    if (!text) return;
    input.value = '';
    void sendMessage(text);
}

function handleScrollAreaInitialised(element: HTMLElement): void {
    scrollElement.value = element;
    state.scrollObserver = new MutationObserver(() => {
        element.scrollTop = element.scrollHeight;
    });
    state.scrollObserver.observe(element, { childList: true, subtree: true, characterData: true });
}

function handleRetryMarkedTool(): void {
    void initialiseMarkedTool();
}
</script>

<template>
    <div class="relative flex min-h-0 flex-1 flex-col">
        <!-- Covers the region: 'purifyMarkdown' returns an empty string without the formatter, so every message in the
             thread renders blank. The chat is not degraded by this, it is unreadable, so the thread and the composer
             give way to the failure rather than sitting beneath it. The session component stays mounted throughout,
             holding the messages a retry brings back. -->
        <ErrorDisplay v-if="markedToolFailure" covers-region :failures="[markedToolFailure]" @retry="handleRetryMarkedTool" />

        <template v-else>
            <ScrollArea class="flex flex-1 flex-col pl-4" :scroll-area-padding-bottom="scrollPaddingBottom" @initialised="handleScrollAreaInitialised">
                <template v-for="message in messages" :key="message.id">
                    <template v-if="message.role === 'user'">
                        <div v-for="part in message.parts.filter((part) => part.type === 'text')" :key="part.content" class="mx-auto mt-3 flex max-w-prose">
                            <div class="w-full rounded-md bg-info px-3 py-2 text-sm">{{ part.content }}</div>
                        </div>

                        <div v-for="(errorText, errorIndex) in message.errors" :key="`${message.id}-error-${errorIndex}`" class="mx-auto mt-3 max-w-prose pb-4">
                            <div class="mb-1 text-xs font-medium tracking-wide text-danger-text">Error</div>
                            <div class="text-sm whitespace-pre-line text-danger-text">{{ errorText }}</div>
                        </div>

                        <!-- Sits with the question it belongs to, so it stays put once the conversation moves past it.
                             Carries the step label's own classes, so it lands where a real answer would have. -->
                        <div v-if="hasNoAnswer(message)" class="mx-auto mt-3 max-w-prose pb-4">
                            <div class="mb-1 text-xs font-medium tracking-wide text-subtle">No answer</div>
                            <div class="text-sm text-subtle">
                                The model returned nothing for this turn. It may have declined the request. Try rephrasing it, or pick a different model.
                            </div>
                        </div>
                    </template>

                    <template v-else-if="message.role === 'assistant'">
                        <div class="mx-auto mt-3 max-w-prose">
                            <div v-for="step in getMessageSteps(message)" :key="step.type" class="pb-4">
                                <template v-if="step.type === 'thinking'">
                                    <div class="mb-3 text-xs font-medium tracking-wide text-subtle">Thinking</div>
                                    <div v-for="part in step.parts" :key="part.content" class="text-sm text-subtle">{{ part.content }}</div>
                                </template>
                                <template v-else>
                                    <PendingLabel v-if="isResponseStreaming(message)" class="mb-1 text-xs font-medium tracking-wide text-subtle" />
                                    <div v-else class="mb-3 text-xs font-medium tracking-wide text-subtle">{{ responseHeading(message) }}</div>
                                    <div v-for="part in step.parts" :key="part.content" class="text-sm" v-html="renderText(part.content)" />
                                </template>
                            </div>
                        </div>
                    </template>
                </template>

                <!-- Sits after the thread rather than inside it: a send that was refused never became a message, so
                     there is no message to key it to. Cleared by the next send, which is the attempt it describes. -->
                <div v-if="sendFailure" class="mx-auto mt-3 max-w-prose pb-4">
                    <div class="mb-1 text-xs font-medium tracking-wide text-danger-text">Error</div>
                    <div class="text-sm whitespace-pre-line text-danger-text">{{ sendFailure }}</div>
                </div>

                <div v-if="responseIsPending" class="mx-auto mt-3 max-w-prose pb-4">
                    <PendingLabel class="mb-1 text-xs font-medium tracking-wide text-subtle" />
                </div>
            </ScrollArea>

            <!-- Input - in-flow, always rounded, with an action bar (model, status, send) attached below the text box. -->
            <div
                ref="inputContainer"
                :class="[
                    'absolute right-4 bottom-0 left-16 mb-8.75 flex flex-none flex-col bg-surface shadow-md',
                    'rounded-2xl border border-selected-border',
                    'focus-within:ring-1 focus-within:ring-selected-ring',
                    'md:inset-x-0 md:mx-auto md:w-[min(65ch,calc(100%-32px))]'
                ]"
            >
                <TextArea v-model="input" class="max-h-40 rounded-t-2xl" placeholder="Ask a question" @keydown.enter.exact.prevent="handleSendMessage" />

                <!-- Grid rather than flex: the send button sits in a max-content track it never gives up or stretches into, while the menu
                     and status take content-sized tracks that stay at full width until the bar genuinely runs short, then ellipsise together. -->
                <div
                    class="grid grid-cols-[minmax(0,auto)_minmax(0,auto)_max-content] items-center gap-x-2 rounded-b-2xl border-t border-selected-border bg-selected p-2 text-selected-text"
                >
                    <AssistantModelMenu class="min-w-0 justify-self-start" :model-config="modelConfig" :model-configs="modelConfigs" @select="handleSelectModel" />

                    <!-- Fills its track and right-aligns instead of justify-self-end: nowrap makes the item's min-content the whole string, so a
                         fit-content item would never ellipsise and would spill left over the menu. -->
                    <span class="min-w-0 truncate text-right text-xs text-muted">{{ status }}</span>

                    <Button
                        :aria-label="responseIsRunning ? 'Stop the response' : 'Send the message'"
                        class="flex size-7 items-center justify-center rounded-full text-white disabled:opacity-40"
                        :class="responseIsRunning ? 'bg-red-400' : 'bg-blue-400'"
                        shape="minimal"
                        :disabled="!responseIsRunning && input.trim().length === 0"
                        @click="handleComposerAction"
                    >
                        <!-- Filled: an outlined square at this size reads as an empty box rather than a stop. -->
                        <SquareIcon v-if="responseIsRunning" class="size-3" fill="currentColor" stroke-width="2.5" />
                        <ArrowUpIcon v-else class="size-5" stroke-width="2.5" />
                    </Button>
                </div>
            </div>
        </template>
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
