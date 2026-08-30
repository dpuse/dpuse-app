import { describe, expect, it } from 'vitest';
import { getMessageSteps, isConversationMessage } from '@/features/assistant/chat/assistantChat';

// The RAG system turn reaches the client's message list intact (the TanStack processor keeps the 'system' role), and
// the normalisers map every non-user role to 'assistant'. Without this filter the prompt rendered as the thread's
// first response, above the question.
describe('isConversationMessage', () => {
    it('keeps user and assistant turns', () => {
        expect(isConversationMessage({ role: 'user' })).toBe(true);
        expect(isConversationMessage({ role: 'assistant' })).toBe(true);
    });

    it('drops the system turn and anything else a vendor client carries', () => {
        expect(isConversationMessage({ role: 'system' })).toBe(false);
        expect(isConversationMessage({ role: 'tool' })).toBe(false);
    });
});

describe('getMessageSteps', () => {
    it('puts thinking before the response', () => {
        const steps = getMessageSteps({
            id: 'a1',
            role: 'assistant',
            parts: [
                { type: 'text', content: 'answer' },
                { type: 'thinking', content: 'reasoning' }
            ],
            errors: []
        });

        expect(steps.map((step) => step.type)).toEqual(['thinking', 'text']);
    });

    it('returns no steps for a message with nothing to show, so it renders as nothing', () => {
        expect(getMessageSteps({ id: 'a2', role: 'assistant', parts: [], errors: [] })).toEqual([]);
    });
});
