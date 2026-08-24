<script setup lang="ts">
// ── External Dependencies & Registrations
import { useChat } from '@ai-sdk/vue';
import { computed, ref, watch } from 'vue';
import { DefaultChatTransport, isReasoningUIPart, isTextUIPart, lastAssistantMessageIsCompleteWithToolCalls, type UIMessage } from 'ai';

// ── Local Framework
import type { AssistantChatMessage } from './assistantChat';
import type { AssistantModelConfig } from './modelConfigs';
import { toolExecutors } from './tools';

// ── Options, Props, Slots & Emits ────────────────────────────────────────────────────────────────────────────────────

const { modelConfig } = defineProps<{ modelConfig: AssistantModelConfig }>();

const emit = defineEmits<{ messagesChange: [messages: AssistantChatMessage[]]; statusChange: [status: string] }>();

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

const chatErrorsByUserMessageId = ref<Record<string, string[]>>({});

const {
    messages,
    status,
    sendMessage: sendChatMessage,
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
        console.log('onError 1', error);
        const extractedError = error.message;
        const extractedMessage = typeof extractedError === 'string' ? extractedError : JSON.stringify(extractedError);
        console.log('onError 2', extractedMessage);
        appendErrorForLatestUserMessage(extractedMessage);
    },
    onData: (data: unknown): void => {
        console.log('onData', data);
    },
    sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls,
    onToolCall: async ({ toolCall }: { toolCall: { toolName: string; toolCallId: string } }): Promise<void> => {
        const executor = toolExecutors[toolCall.toolName];
        if (!executor) return;
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
    onFinish: (properties: unknown): void => {
        console.log('onFinish', properties);
    }
});

// ── Derived State ────────────────────────────────────────────────────────────────────────────────────────────────────

const normalizedMessages = computed<AssistantChatMessage[]>(() =>
    messages.value.map((message) => ({
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

watch(normalizedMessages, (newMessages) => emit('messagesChange', newMessages), { immediate: true });
watch(status, (newStatus) => emit('statusChange', newStatus), { immediate: true });

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

async function sendMessage(text: string): Promise<void> {
    await sendChatMessage({ text });
}

defineExpose({ sendMessage });
</script>
