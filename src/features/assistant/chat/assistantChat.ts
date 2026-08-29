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
    isLast: boolean;
}

export function getMessageSteps(message: AssistantChatMessage): AssistantChatStep[] {
    const steps: AssistantChatStep[] = [];
    const thinkingParts = message.parts.filter((part) => part.type === 'thinking');
    const textParts = message.parts.filter((part) => part.type === 'text');
    if (thinkingParts.length > 0) steps.push({ type: 'thinking', parts: thinkingParts, isLast: false });
    if (textParts.length > 0) steps.push({ type: 'text', parts: textParts, isLast: false });
    const lastStep = steps.at(-1);
    if (lastStep) lastStep.isLast = true;
    return steps;
}
