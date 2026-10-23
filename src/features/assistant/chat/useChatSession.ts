// ── External Dependencies & Registrations
import { ChatClient, type ChatClientState, fetchServerSentEvents, type MessagePart, type TextPart, type ThinkingPart, type UIMessage } from '@tanstack/ai-client';
import { computed, type ComputedRef, onMounted, onUnmounted, ref, type Ref, shallowRef, watch } from 'vue';

// ── Local Framework
import type { AssistantChatMessage } from '@/features/assistant/chat/assistantChat';
import type { AssistantModelConfig } from '@/features/assistant/chat/modelConfigs';
import { isConversationMessage } from '@/features/assistant/chat/assistantChat';
import { t } from '@/state/locale';
import { tanstackClientTools } from '@/features/assistant/chat/tools/tanstackClientTools';
import { TEXT } from './useChatSession_.json';

// ── Types ────────────────────────────────────────────────────────────────────────────────────────────────────────────

interface ChatSessionState {
    messages: ComputedRef<AssistantChatMessage[]>; // The conversation, in the shape the thread renders.
    status: Ref<ChatClientState>;
    sendFailure: ComputedRef<string | undefined>; // A send that never became a message, so it belongs to no turn. Cleared by the next send.
    runWasStopped: Ref<boolean>; // The user stopped the last run, so its silence needs no notice.
    runHasFinished: Ref<boolean>; // Tells 'the model said nothing' apart from 'the run has not begun', which look the same just after a send.
    unansweredQuestionIds: Ref<string[]>; // Kept per question, so asking again does not erase an earlier unanswered turn from the history.
    sendMessage: (text: string) => Promise<void>; // Shows its own refusal in 'sendFailure' rather than throwing.
    stop: () => void;
}

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

const CHAT_API_URL = 'https://api.dpuse.app/ai/chat';

// ── Composables ──────────────────────────────────────────────────────────────────────────────────────────────────────

// Owns the chat client, so the panel only renders. 'getModelConfig' is a getter so a model change reaches the live
// client, because rebuilding the client would start a new conversation.
export function useChatSession(getModelConfig: () => AssistantModelConfig): ChatSessionState {
    // ── State

    // Errors are held against the user message that provoked them, so the thread shows a failed turn where it happened.
    const chatErrorsByUserMessageId = ref<Record<string, string[]>>({});
    const unansweredQuestionIds = ref<string[]>([]);
    const rawMessages = shallowRef<UIMessage[]>([]); // The client replaces this array on every chunk, so deep reactivity would proxy the whole transcript per token.
    const runHasFinished = ref(false);
    const runWasStopped = ref(false);
    const sendRefusal = shallowRef<{ message: string | undefined }>(); // 'message' is missing when the refusal was not an 'Error'.
    const status = ref<ChatClientState>('ready');

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

    const sendFailure = computed(() => sendRefusal.value && (sendRefusal.value.message ?? t(TEXT, 'send.error')));

    // ── Side Effects

    // The client reads the model only when it is built, so a change is pushed into it. Rebuilding instead would throw the
    // conversation away.
    watch(getModelConfig, (newModelConfig) => {
        state.client?.updateOptions({ forwardedProps: buildForwardedProperties(newModelConfig) });
    });

    // Checked when a run ends, the only moment the transcript is final and the next send has not reset the flags. A run
    // the user stopped is skipped, because they know why it is empty.
    watch(runHasFinished, (hasFinished) => {
        if (!hasFinished || runWasStopped.value) return;
        const lastMessage = messages.value.at(-1);
        if (lastMessage == null) return;
        // Unanswered means the question is still the last message with no error under it, or the assistant turn has no
        // text parts (a tool call alone renders as nothing).
        const hasNoAnswer = (lastMessage.role === 'user' ? lastMessage.errors : lastMessage.parts).length === 0;
        if (!hasNoAnswer) return;
        const question = messages.value.findLast((message) => message.role === 'user');
        if (question == null || unansweredQuestionIds.value.includes(question.id)) return;
        unansweredQuestionIds.value = [...unansweredQuestionIds.value, question.id];
    });

    onMounted(() => {
        const client = new ChatClient({
            threadId: crypto.randomUUID(),
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

        // A client only follows a run once attached. The teardown on unmount closes the stream, because a browser allows
        // only about six connections per origin.
        client.attach();

        status.value = client.getStatus(); // The status callback fires only on a change, so the starting status is read here.
    });

    onUnmounted(() => {
        // 'dispose' rather than 'detach', because a model change updates the client in place, so an unmount means the
        // panel is gone for good.
        state.client?.dispose();
        state.client = null;
    });

    // ── Actions

    // Awaited here rather than returned, because the client's 'sendMessage' can reject without calling 'onError', and
    // the caller would leave that rejection unhandled.
    async function sendMessage(text: string): Promise<void> {
        if (state.client == null) return;
        // All three belong to the attempt before this one.
        runHasFinished.value = false;
        runWasStopped.value = false;
        sendRefusal.value = undefined;

        // A run that fails during a client tool leaves its interrupt standing, and the client then refuses every send.
        // 'stop' clears it, where 'cancelInterrupts' would send a new request to the failed run. On a healthy client
        // 'stop' does nothing, so it is safe to run before every send.
        if (!isRunningStatus(status.value)) state.client.stop();

        try {
            await state.client.sendMessage(text);
        } catch (error) {
            // Held apart from the messages, because a refused send added none, and the previous question is the wrong
            // place for it.
            sendRefusal.value = { message: error instanceof Error ? extractErrorMessage(error) : undefined };
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

// ── Actions ──────────────────────────────────────────────────────────────────────────────────────────────────────────

export function isRunningStatus(value: ChatClientState): boolean {
    return value === 'streaming' || value === 'submitted';
}

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

// What the server needs to pick a provider and model for the run. Shared by the first build and every model change.
function buildForwardedProperties(config: AssistantModelConfig): Record<string, unknown> {
    return { providerId: config.providerId, modelId: config.modelId, options: config.options, rag: true };
}

// Stream errors carry the server's JSON payload after a short status prefix. Any other error, including every transport
// and client-side failure, keeps its own message.
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
