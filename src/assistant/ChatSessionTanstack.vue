<script setup lang="ts">
// ── External Dependencies & Registrations
import { ChatClient, fetchServerSentEvents } from '@tanstack/ai-client';
import { computed, onMounted, ref, watch } from 'vue';

// ── Local Framework
import type { AssistantChatMessage } from './assistantChat';
import type { AssistantModelConfig } from './modelConfigs';
import { tanstackClientTools } from './tools/tanstackClientTools';

// ── Options, Props, Slots & Emits ────────────────────────────────────────────────────────────────────────────────────

const { modelConfig } = defineProps<{ modelConfig: AssistantModelConfig }>();

const emit = defineEmits<{ messagesChange: [messages: AssistantChatMessage[]]; statusChange: [status: string] }>();

// ── Types ────────────────────────────────────────────────────────────────────────────────────────────────────────────

interface TanstackChatPart {
    type: string;
    content: string;
}

interface TanstackChatMessage {
    id: string;
    role: string;
    parts: TanstackChatPart[];
}

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

const rawMessages = ref<TanstackChatMessage[]>([]);
const chatErrorsByUserMessageId = ref<Record<string, string[]>>({});

const state: { client: ChatClient | null } = { client: null };

// ── Derived State ────────────────────────────────────────────────────────────────────────────────────────────────────

const normalizedMessages = computed<AssistantChatMessage[]>(() =>
    rawMessages.value.map((message) => ({
        id: message.id,
        role: message.role === 'user' ? 'user' : 'assistant',
        parts: message.parts.filter((part) => part.type === 'thinking' || part.type === 'text').map((part) => ({ type: part.type as 'text' | 'thinking', content: part.content })),
        errors: message.role === 'user' ? (chatErrorsByUserMessageId.value[message.id] ?? []) : []
    }))
);

// ── Event Handlers ───────────────────────────────────────────────────────────────────────────────────────────────────

function extractErrorMessage(error: Error): string {
    try {
        const payload = JSON.parse(error.message.slice(4)) as { error?: { message?: string } };
        const parsedMessage = payload.error?.message?.trim();
        return parsedMessage != null && parsedMessage.length > 0 ? parsedMessage : error.message;
    } catch {
        return error.message;
    }
}

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

onMounted(() => {
    state.client = new ChatClient({
        connection: fetchServerSentEvents('https://api.dpuse.app/ai/chat/tanstack'),
        tools: tanstackClientTools,
        forwardedProps: {
            providerId: modelConfig.providerId,
            modelId: modelConfig.modelId,
            options: modelConfig.options,
            rag: true
        },
        initialMessages: [],
        onMessagesChange: (messages): void => {
            console.log('onMessagesChange', messages);
            rawMessages.value = messages as unknown as TanstackChatMessage[];
        },
        onLoadingChange: (isLoading): void => {
            console.log('onLoadingChange', isLoading);
        },
        onStatusChange: (status): void => {
            console.log('onStatusChange', status);
            emit('statusChange', status);
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

// ── Exposed API ──────────────────────────────────────────────────────────────────────────────────────────────────────

function sendMessage(text: string): void {
    if (state.client == null) return;
    void state.client.sendMessage(text);
}

defineExpose({ sendMessage });
</script>

<template><div /></template>
