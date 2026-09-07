<script setup lang="ts">
// ── External Dependencies & Registrations
import DOMPurify from 'dompurify';
import { ArrowUpIcon, PlusIcon, SquareIcon } from '@lucide/vue';
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
import ChatEmptyState from './ChatEmptyState.vue';
import ErrorShell from '@/components/ui/error/ErrorShell.vue';
import PendingLabel from '../_components/PendingLabel.vue';
import ScrollArea from '@/components/ui/scroll/ScrollArea.vue';
import TextArea from '@/components/ui/text/TextArea.vue';

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

const PROMPT = 'List the connectors.';

// A control floats over each end of the thread, so the scroller reserves their space by hand. Both reservations are the
// same sum — the control's own offset from the pane's edge, its height, and one shared gap — which is what brings the
// thread to rest the same distance from each.
const CONTENT_GAP_PX = 16;
const COMPOSER_BOTTOM_INSET_PX = 35; // 'mb-8.75' on the composer, which sits outside the height measured below.
const TOGGLE_HEIGHT_PX = 36; // 'ChatPaneToggle' is a 'size="sm"' icon button: 'py-2' either side of a 20px glyph.
const TOGGLE_TOP_INSET_PX = 8; // 'top-2' on that same toggle.

// ── Options, Props, Slots & Emits ────────────────────────────────────────────────────────────────────────────────────

const {
    modelConfig,
    modelConfigs,
    // Whether the assistant reaches the left edge of the screen, which is the only case where the session button
    // overlaps this pane. Declared rather than left to fall through: it was already being passed, and an undeclared
    // prop lands on the root element as a stray DOM attribute instead of being read.
    studioPaneIsHidden
} = defineProps<{ modelConfig: AssistantModelConfig; modelConfigs: AssistantModelConfig[]; studioPaneIsHidden?: boolean }>();

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

// Measured rather than stated: the composer grows with the text typed into it. Its bottom margin is not part of that
// measurement, so it is added back here.
const scrollPaddingBottom = computed(() => `${String(inputContainerHeight.value + COMPOSER_BOTTOM_INSET_PX + CONTENT_GAP_PX)}px`);

// The mirror of the padding above. Stated rather than measured, because the toggle is a fixed shape owned by the layout
// rather than by this panel, and plumbing a measurement across that boundary would cost more than the constants do.
const scrollPaddingTop = `${String(TOGGLE_TOP_INSET_PX + TOGGLE_HEIGHT_PX + CONTENT_GAP_PX)}px`;

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

// TODO: Attach files and add context to the conversation. The control is placed now so the composer's layout is settled;
// what it opens is not built yet.
function handleAddToConversation(): void {
    // Intentionally empty until there is something to add.
}

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
    <div class="@container relative flex min-h-0 min-w-0 flex-1 flex-col" data-region="ChatPanel">
        <!-- The composer below is positioned against this element, and its '@md:' width is measured against it: this
             pane is one half of a split nested inside another split, so its width changes whenever either splitter
             moves, which no viewport breakpoint ever reports. -->

        <!-- Covers the region: 'purifyMarkdown' returns an empty string without the formatter, so every message in the
             thread renders blank. The chat is not degraded by this, it is unreadable, so the thread and the composer
             give way to the failure rather than sitting beneath it. The session component stays mounted throughout,
             holding the messages a retry brings back. -->
        <ErrorShell v-if="markedToolFailure" covers-region :failures="[markedToolFailure]" @retry="handleRetryMarkedTool" />

        <template v-else>
            <ScrollArea
                class="flex flex-1 flex-col pl-4"
                :scroll-area-padding-bottom="scrollPaddingBottom"
                :scroll-area-padding-top="scrollPaddingTop"
                @initialised="handleScrollAreaInitialised"
            >
                <!-- Inside the scroller rather than beside it, so the first answer pushes it up the thread the way any
                     other content would, instead of the pane swapping one layout for another. -->
                <ChatEmptyState v-if="messages.length === 0 && !responseIsRunning" />

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

            <!-- Input - in-flow, always rounded, with an action bar (add, model, send) attached below the text box. -->
            <div
                ref="inputContainer"
                :class="[
                    'absolute bottom-0 mb-8.75 flex flex-none flex-col bg-surface shadow-md',
                    'rounded-2xl border border-selected-border',
                    'focus-within:ring-1 focus-within:ring-selected-ring',
                    // Two separate questions, and one breakpoint used to answer both — which is what made this wrong.
                    //
                    // Where the composer may start is about the session button, which is fixed to the viewport's
                    // bottom-left corner and so reaches this pane only when the assistant runs to the left edge of the
                    // screen. That is true at every width, so it is a bound rather than a breakpoint: nothing below may
                    // reset it, which is why the centring keeps the insets instead of overriding them with 'inset-x-0'.
                    studioPaneIsHidden ? 'right-4 left-16' : 'inset-x-4',
                    // How wide it then gets is about the room this pane has, which is a container query. Capping with
                    // 'max-w' rather than setting a width leaves the element free to fill the inset box when it is
                    // narrow, and the auto margins centre it within that box once the cap bites.
                    '@md:mx-auto @md:max-w-[65ch]'
                ]"
            >
                <TextArea v-model="input" class="max-h-40 rounded-t-2xl" placeholder="Ask a question" @keydown.enter.exact.prevent="handleSendMessage" />

                <!-- Grid rather than flex: the add and send buttons sit in max-content tracks they never give up or stretch into, while
                     the model menu between them takes the rest and ellipsises once the bar genuinely runs short. -->
                <div
                    class="grid grid-cols-[max-content_minmax(0,auto)_max-content] items-center gap-x-2 rounded-b-2xl border-t border-selected-border bg-selected p-2 text-selected-text"
                >
                    <!-- Shaped like the send button at the other end of the row, so the pair reads as the composer's two actions. Neutral
                         rather than tinted: sending is the thing this bar is for, and two filled circles would put them on equal footing. -->
                    <Button
                        aria-label="Add to the conversation"
                        class="flex size-7 items-center justify-center rounded-full border border-boundary bg-surface text-content"
                        shape="minimal"
                        @click="handleAddToConversation"
                    >
                        <PlusIcon class="size-4" stroke-width="2.5" />
                    </Button>

                    <AssistantModelMenu class="min-w-0 justify-self-start" :model-config="modelConfig" :model-configs="modelConfigs" @select="handleSelectModel" />

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
