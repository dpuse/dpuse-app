// The common shape both vendor sessions (Tanstack, Vercel) normalise their messages to, so the shared chat UI
// can render either vendor's conversation identically without knowing which one produced it.

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
// prompt, and a vendor client that keeps it in its message list would otherwise have it normalised to 'assistant' and
// rendered as the thread's first response — the whole prompt shown above the question that triggered it.
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
