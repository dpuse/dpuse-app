<script setup lang="ts">
// ── External Dependencies & Registrations
import { ChatClient, fetchServerSentEvents, type MessagePart, type TextPart, type ThinkingPart, type UIMessage } from '@tanstack/ai-client';
import { computed, onMounted, onUnmounted, ref, shallowRef, watch } from 'vue';

// ── Local Framework
import type { AssistantChatMessage } from './assistantChat';
import type { AssistantModelConfig } from './modelConfigs';
import { isConversationMessage } from './assistantChat';
import { tanstackClientTools } from './tools/tanstackClientTools';

// ── Options, Props, Slots & Emits ────────────────────────────────────────────────────────────────────────────────────

const { modelConfig } = defineProps<{ modelConfig: AssistantModelConfig }>();

const emit = defineEmits<{ messagesChange: [messages: AssistantChatMessage[]]; sendFailure: [message: string]; statusChange: [status: string] }>();

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

// Errors are held against the user message that provoked them, so the thread can show a failed turn where it happened.
const chatErrorsByUserMessageId = ref<Record<string, string[]>>({});
// 'shallowRef' because the client replaces this array wholesale on every chunk — deep reactivity would proxy every
// message and part of the transcript on each token for nothing.
const rawMessages = shallowRef<UIMessage[]>([]);

const state: { client: ChatClient | null } = { client: null };

// ── Derived State ────────────────────────────────────────────────────────────────────────────────────────────────────

const normalizedMessages = computed<AssistantChatMessage[]>(() =>
    rawMessages.value.filter((message) => isConversationMessage(message)).map((message) => ({
        id: message.id,
        role: message.role === 'user' ? 'user' : 'assistant',
        parts: message.parts.filter((part) => isRenderablePart(part)).map((part) => ({ type: part.type, content: part.content })),
        errors: message.role === 'user' ? (chatErrorsByUserMessageId.value[message.id] ?? []) : []
    }))
);

// ── Event Handlers ───────────────────────────────────────────────────────────────────────────────────────────────────

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

// ── Side Effects ─────────────────────────────────────────────────────────────────────────────────────────────────────

watch(
    normalizedMessages,
    (newMessages) => {
        emit('messagesChange', newMessages);
    },
    { immediate: true }
);

// The model is read once, when the client is built, so a change has to be pushed into the live client. Updating it in
// place rather than rebuilding is what lets the conversation outlast a model change: a new client starts from an empty
// transcript, so rebuilding would silently throw the thread away.
watch(
    () => modelConfig,
    (newModelConfig) => {
        state.client?.updateOptions({ forwardedProps: buildForwardedProperties(newModelConfig) });
    }
);

onMounted(() => {
    const client = new ChatClient({
        connection: fetchServerSentEvents('https://api.dpuse.app/ai/chat'),
        tools: tanstackClientTools,
        forwardedProps: buildForwardedProperties(modelConfig),
        initialMessages: [],
        onMessagesChange: (messages): void => {
            rawMessages.value = messages;
        },
        onStatusChange: (status): void => {
            emit('statusChange', status);
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
    emit('statusChange', client.getStatus());
});

onUnmounted(() => {
    // 'dispose' rather than 'detach': this client is not coming back. A model change updates it in place, so an
    // unmount means the panel itself is gone — 'detach' would leave the client alive for a return that never happens.
    state.client?.dispose();
    state.client = null;
});

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

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

// ── Exposed API ──────────────────────────────────────────────────────────────────────────────────────────────────────

// Awaited internally rather than returned: 'sendMessage' rejects on its own account — a send while interrupts are
// pending, for one — and those rejections reach 'onError' for nobody, so leaving one unhandled was an unhandled
// rejection rather than something the thread could show.
async function sendMessage(text: string): Promise<void> {
    if (state.client == null) return;
    try {
        await state.client.sendMessage(text);
    } catch (error) {
        // Reported against the thread, not a message: the send was refused before it appended one, so the only
        // message to hang this on would be the previous question — which is how a failure ended up above the
        // conversation instead of at the end of it.
        emit('sendFailure', error instanceof Error ? extractErrorMessage(error) : 'Failed to send the message.');
    }
}

// Ends the run the user is watching, as opposed to 'dispose' (the client is finished with) or 'detach' (nobody is
// watching just now).
function stop(): void {
    state.client?.stop();
}

defineExpose({ sendMessage, stop });
</script>

<template><div /></template>
