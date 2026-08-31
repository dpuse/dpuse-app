// The shape the session normalises its messages to, so the chat UI renders a conversation without knowing how the
// SDK beneath it represents one.

export interface AssistantChatPart {
    type: 'text' | 'thinking';
    content: string;
}

export interface AssistantChatMessage {
    id: string;
    role: 'assistant' | 'user';
    parts: AssistantChatPart[];
    errors: string[];
}

export interface AssistantChatStep {
    type: 'text' | 'thinking';
    parts: AssistantChatPart[];
}

// Only user and assistant turns are part of the conversation. The server prepends a system turn carrying the RAG
// prompt, and the client keeps it in its message list, so without this it is normalised to 'assistant' and rendered
// as the thread's first response — the whole prompt shown above the question that triggered it.
export function isConversationMessage(message: { role: string }): boolean {
    return message.role === 'assistant' || message.role === 'user';
}

export function getMessageSteps(message: AssistantChatMessage): AssistantChatStep[] {
    const steps: AssistantChatStep[] = [];
    const thinkingParts = message.parts.filter((part) => part.type === 'thinking');
    const textParts = message.parts.filter((part) => part.type === 'text');
    if (thinkingParts.length > 0) steps.push({ type: 'thinking', parts: thinkingParts });
    if (textParts.length > 0) steps.push({ type: 'text', parts: textParts });
    return steps;
}
