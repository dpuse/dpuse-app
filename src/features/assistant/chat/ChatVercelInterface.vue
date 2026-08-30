<script setup lang="ts">
// ── External Dependencies & Registrations
import { useChat } from '@ai-sdk/vue';
import { computed, ref, watch } from 'vue';
import { DefaultChatTransport, isReasoningUIPart, isTextUIPart, lastAssistantMessageIsCompleteWithToolCalls, type UIMessage } from 'ai';

// ── Local Framework
import type { AssistantChatMessage } from './assistantChat';
import type { AssistantModelConfig } from './modelConfigs';
import { isConversationMessage } from './assistantChat';
import { toolExecutors } from './tools';

// ── Options, Props, Slots & Emits ────────────────────────────────────────────────────────────────────────────────────

const { modelConfig } = defineProps<{ modelConfig: AssistantModelConfig }>();

const emit = defineEmits<{ messagesChange: [messages: AssistantChatMessage[]]; sendFailure: [message: string]; statusChange: [status: string] }>();

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

const chatErrorsByUserMessageId = ref<Record<string, string[]>>({});

const {
    messages,
    status,
    sendMessage: sendChatMessage,
    stop: stopChat,
    addToolOutput
} = useChat({
    transport: new DefaultChatTransport({
        api: 'https://api.dpuse.app/ai/chat',
        body: {
            providerId: modelConfig.providerId,
            modelId: modelConfig.modelId,
            options: modelConfig.options,
            rag: true
        }
    }),
    onError: (error: Error): void => {
        appendErrorForLatestUserMessage(error.message);
    },
    sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls,
    onToolCall: async ({ toolCall }: { toolCall: { toolName: string; toolCallId: string } }): Promise<void> => {
        const executor = toolExecutors[toolCall.toolName];
        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO
            const arguments_ = (toolCall as any).args ?? (toolCall as any).input;
            addToolOutput({
                tool: toolCall.toolName,
                toolCallId: toolCall.toolCallId,
                output: await executor(arguments_)
            });
        } catch (error) {
            addToolOutput({
                tool: toolCall.toolName,
                toolCallId: toolCall.toolCallId,
                output: { error: error instanceof Error ? error.message : 'Tool execution failed' }
            });
        }
    },
});

// ── Derived State ────────────────────────────────────────────────────────────────────────────────────────────────────

const normalizedMessages = computed<AssistantChatMessage[]>(() =>
    messages.value.filter((message) => isConversationMessage(message)).map((message) => ({
        id: message.id,
        role: message.role === 'user' ? 'user' : 'assistant',
        parts: [
            ...message.parts.filter(isReasoningUIPart).map((part) => ({ type: 'thinking' as const, content: part.text })),
            ...message.parts.filter(isTextUIPart).map((part) => ({ type: 'text' as const, content: part.text }))
        ],
        errors: message.role === 'user' ? (chatErrorsByUserMessageId.value[message.id] ?? []) : []
    }))
);

// ── Side Effects ─────────────────────────────────────────────────────────────────────────────────────────────────────

watch(
    normalizedMessages,
    (newMessages) => {
        emit('messagesChange', newMessages);
    },
    { immediate: true }
);
watch(
    status,
    (newStatus) => {
        emit('statusChange', newStatus);
    },
    { immediate: true }
);

// ── Event Handlers ───────────────────────────────────────────────────────────────────────────────────────────────────

function appendErrorForLatestUserMessage(errorText: string): void {
    const latestUserMessage = messages.value.findLast((message: UIMessage) => message.role === 'user');
    const targetMessageId = latestUserMessage?.id;
    if (targetMessageId == null) return;
    const existingErrors = chatErrorsByUserMessageId.value[targetMessageId] ?? [];
    chatErrorsByUserMessageId.value = {
        ...chatErrorsByUserMessageId.value,
        [targetMessageId]: [...existingErrors, errorText]
    };
}

// ── Exposed API ──────────────────────────────────────────────────────────────────────────────────────────────────────

// Awaited internally rather than returned: a rejection here never reaches 'onError', so voiding it made an unhandled
// rejection out of a failure the thread is able to show.
async function sendMessage(text: string): Promise<void> {
    try {
        await sendChatMessage({ text });
    } catch (error) {
        // Reported against the thread, not a message: the send was refused before it appended one, so the only
        // message to hang this on would be the previous question — which is how a failure ended up above the
        // conversation instead of at the end of it.
        emit('sendFailure', error instanceof Error ? error.message : 'Failed to send the message.');
    }
}

async function stop(): Promise<void> {
    try {
        await stopChat();
    } catch {
        // Ignore — a run that has already settled is not a failure the user needs telling about.
    }
}

defineExpose({ sendMessage, stop });
</script>

<template><div /></template>
