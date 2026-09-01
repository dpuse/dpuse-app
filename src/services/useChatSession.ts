// ── External Dependencies & Registrations
import { ChatClient, fetchServerSentEvents, type MessagePart, type TextPart, type ThinkingPart, type UIMessage } from '@tanstack/ai-client';
import { computed, type ComputedRef, onMounted, onUnmounted, ref, type Ref, shallowRef, watch } from 'vue';

// ── Local Framework
import type { AssistantChatMessage } from '@/features/assistant/chat/assistantChat';
import type { AssistantModelConfig } from '@/features/assistant/chat/modelConfigs';
import { isConversationMessage } from '@/features/assistant/chat/assistantChat';
import { tanstackClientTools } from '@/features/assistant/chat/tools/tanstackClientTools';

// ── Types ────────────────────────────────────────────────────────────────────────────────────────────────────────────

interface ChatSessionState {
    // The conversation, in the shape the thread renders.
    messages: ComputedRef<AssistantChatMessage[]>;
    // The run state the composer reads: 'ready' | 'submitted' | 'streaming' | 'error'.
    status: Ref<string>;
    // A send that never became a message, so it belongs to no turn. Cleared by the next send.
    sendFailure: Ref<string | undefined>;
    // Whether the last run ended because the user stopped it, which is the one silent ending that needs no comment.
    runWasStopped: Ref<boolean>;
    // Whether a run has started and ended since the last send. What distinguishes 'the model said nothing' from 'the
    // run has not begun' — the two look identical in the transcript, and the second is the moment just after a send.
    runHasFinished: Ref<boolean>;
    // The questions whose run ended having produced nothing to read, so the thread can say so where it happened. Held
    // per question rather than derived from the tail of the conversation: derived, it describes only the run that just
    // ended, so asking again would erase the previous unanswered turn instead of leaving it standing in the history.
    unansweredQuestionIds: Ref<string[]>;
    // Sends, and reports its own refusal rather than throwing at the call site.
    sendMessage: (text: string) => Promise<void>;
    // Ends the run being watched.
    stop: () => void;
}

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

const CHAT_API_URL = 'https://api.dpuse.app/ai/chat';

// ── Composables ──────────────────────────────────────────────────────────────────────────────────────────────────────

// Owns the chat client and everything that follows from it, so the panel is left with rendering. A composable rather
// than a renderless component: with no markup of its own, being a component only bought an empty div, a template ref
// and three events to carry state back to the one place that reads it.
//
// 'getModelConfig' rather than the config itself, so a model change is seen without rebuilding the client — which
// would start a new conversation.
export function useChatSession(getModelConfig: () => AssistantModelConfig): ChatSessionState {
    // ── State

    // Errors are held against the user message that provoked them, so the thread can show a failed turn where it
    // happened.
    const chatErrorsByUserMessageId = ref<Record<string, string[]>>({});
    const unansweredQuestionIds = ref<string[]>([]);
    // 'shallowRef' because the client replaces this array wholesale on every chunk — deep reactivity would proxy every
    // message and part of the transcript on each token for nothing.
    const rawMessages = shallowRef<UIMessage[]>([]);
    const runHasFinished = ref(false);
    const runWasStopped = ref(false);
    const sendFailure = ref<string>();
    const status = ref('idle');

    const state: { client: ChatClient | null } = { client: null };

    // ── Derived State

    const messages = computed<AssistantChatMessage[]>(() =>
        rawMessages.value
            .filter((message) => isConversationMessage(message))
            .map((message) => ({
                id: message.id,
                role: message.role === 'user' ? 'user' : 'assistant',
                parts: message.parts.filter((part) => isRenderablePart(part)).map((part) => ({ type: part.type, content: part.content })),
                errors: message.role === 'user' ? (chatErrorsByUserMessageId.value[message.id] ?? []) : []
            }))
    );

    // ── Side Effects

    // The model is read once, when the client is built, so a change has to be pushed into the live client. Updating it
    // in place rather than rebuilding is what lets the conversation outlast a model change: a new client starts from an
    // empty transcript, so rebuilding would silently throw the thread away.
    watch(getModelConfig, (newModelConfig) => {
        state.client?.updateOptions({ forwardedProps: buildForwardedProperties(newModelConfig) });
    });

    // Read at the one moment it is knowable — the run has ended, so the transcript is final, and the next send has not
    // yet reset the state that says so. A run the user stopped is excluded: they know why that one is empty.
    watch(runHasFinished, (hasFinished) => {
        if (!hasFinished || runWasStopped.value) return;
        const lastMessage = messages.value.at(-1);
        if (lastMessage == null) return;
        // A question left standing as the last message is an answer that never arrived at all — unless an error is
        // already sitting under it, which says the same thing with more detail. An assistant turn that normalised to
        // no parts is the other shape of it: a tool call and nothing else, which renders as nothing.
        const hasNoAnswer = (lastMessage.role === 'user' ? lastMessage.errors : lastMessage.parts).length === 0;
        if (!hasNoAnswer) return;
        const question = messages.value.findLast((message) => message.role === 'user');
        if (question == null || unansweredQuestionIds.value.includes(question.id)) return;
        unansweredQuestionIds.value = [...unansweredQuestionIds.value, question.id];
    });

    onMounted(() => {
        const client = new ChatClient({
            connection: fetchServerSentEvents(CHAT_API_URL),
            tools: tanstackClientTools,
            forwardedProps: buildForwardedProperties(getModelConfig()),
            initialMessages: [],
            onMessagesChange: (newMessages): void => {
                rawMessages.value = newMessages;
            },
            onStatusChange: (newStatus): void => {
                const wasRunning = isRunningStatus(status.value);
                status.value = newStatus;
                if (wasRunning && !isRunningStatus(newStatus)) runHasFinished.value = true;
            },
            onError: (error): void => {
                appendErrorForLatestUserMessage(extractErrorMessage(error));
            }
        });

        state.client = client;

        // A client starts idle: it only tails a run once attached. Pairs with the teardown below, which is what stops a
        // stream when the panel goes — without it a panel that unmounts mid-answer abandons a live connection, and a
        // browser allows only about six per origin before everything else queues.
        client.attach();

        // The status callback only fires on a change, so the opening state has to be read out rather than waited for.
        status.value = client.getStatus();
    });

    onUnmounted(() => {
        // 'dispose' rather than 'detach': this client is not coming back. A model change updates it in place, so an
        // unmount means the panel itself is gone — 'detach' would leave the client alive for a return that never
        // happens.
        state.client?.dispose();
        state.client = null;
    });

    // ── Actions

    // Awaited internally rather than returned to the caller: 'sendMessage' rejects on its own account — a send while
    // interrupts are pending, for one — and those rejections reach 'onError' for nobody, so leaving one unhandled was
    // an unhandled rejection rather than something the thread could show.
    async function sendMessage(text: string): Promise<void> {
        if (state.client == null) return;
        // All three belong to the attempt before this one.
        runHasFinished.value = false;
        runWasStopped.value = false;
        sendFailure.value = undefined;

        // So does any interrupt left standing, and that one is not merely stale — it is disabling. A run that fails
        // partway through a client tool never clears its interrupt state: the client ignores a RUN_ERROR while an
        // interrupt submission is active, precisely so a failed submission can be retried, and nothing afterwards
        // takes that decision back. Every normal send is then refused, so one failed turn ends the conversation
        // until the panel remounts.
        //
        // 'stop' is what clears it, and 'cancelInterrupts' is not: cancelling stages a cancelled resolution and
        // submits it, firing a fresh request at the run that just failed. Nothing here is waiting on a person —
        // client tools run themselves — so an interrupt outliving its run is debris either way. On a healthy client
        // every step of 'stop' is a no-op, which is what makes it safe to run before each send rather than only
        // after a failure, where the state it has to clear is not observable yet.
        if (!isRunningStatus(status.value)) state.client.stop();

        try {
            await state.client.sendMessage(text);
        } catch (error) {
            // Held apart from the messages, not against one: the send was refused before it appended anything, so the
            // only message to hang this on would be the previous question — which is how a failure ended up above the
            // conversation instead of at the end of it.
            sendFailure.value = error instanceof Error ? extractErrorMessage(error) : 'Failed to send the message.';
        }
    }

    // Ends the run the user is watching, as opposed to 'dispose' (the client is finished with) or 'detach' (nobody is
    // watching just now).
    function stop(): void {
        runWasStopped.value = true;
        state.client?.stop();
    }

    // ── Helpers

    function appendErrorForLatestUserMessage(errorText: string): void {
        const latestUserMessage = rawMessages.value.findLast((message) => message.role === 'user');
        const targetMessageId = latestUserMessage?.id;
        if (targetMessageId == null) return;
        const existingErrors = chatErrorsByUserMessageId.value[targetMessageId] ?? [];
        chatErrorsByUserMessageId.value = {
            ...chatErrorsByUserMessageId.value,
            [targetMessageId]: [...existingErrors, errorText]
        };
    }

    return { messages, status, sendFailure, runWasStopped, runHasFinished, unansweredQuestionIds, sendMessage, stop };
}

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

// A run in progress, by either of the two states the session reports for one. Exported because the panel decides what
// to show from the same distinction, and two copies of it would be one too many.
export function isRunningStatus(value: string): boolean {
    return value === 'streaming' || value === 'submitted';
}

// What the server needs to pick a provider and model for the run. Shared by the initial build and every later model
// change so the two cannot drift.
function buildForwardedProperties(config: AssistantModelConfig): Record<string, unknown> {
    return { providerId: config.providerId, modelId: config.modelId, options: config.options, rag: true };
}

// Errors arriving from the stream carry the server's JSON payload behind a short status prefix; the message itself is
// the fallback whenever that shape does not hold, which includes every transport and client-side failure.
function extractErrorMessage(error: Error): string {
    const payloadStart = error.message.indexOf('{');
    if (payloadStart === -1) return error.message;
    try {
        const payload = JSON.parse(error.message.slice(payloadStart)) as { error?: { message?: string } };
        const parsedMessage = payload.error?.message?.trim();
        return parsedMessage != null && parsedMessage.length > 0 ? parsedMessage : error.message;
    } catch {
        return error.message;
    }
}

// Tool calls, results and attachments all reach the transcript as parts; only these two carry text the thread renders.
function isRenderablePart(part: MessagePart): part is TextPart | ThinkingPart {
    return part.type === 'text' || part.type === 'thinking';
}
