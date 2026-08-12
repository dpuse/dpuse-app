// ── Types ────────────────────────────────────────────────────────────────────────────────────────────────────────────

export interface AssistantModelConfig {
    id: string;
    providerId: string;
    providerLabel: string;
    modelId: string;
    options: Record<string, unknown>;
}

// ── Data ─────────────────────────────────────────────────────────────────────────────────────────────────────────────

// Library uses the Tanstack AI SDK. Both SDKs remain in parallel until a preferred one is chosen.
export const LIBRARY_MODEL_CONFIGS: AssistantModelConfig[] = [
    { id: 'anthropic-claude-haiku-4-5', providerId: 'anthropic', providerLabel: 'Anthropic', modelId: 'claude-haiku-4-5', options: { maxTokens: 1024, temperature: 1 } },
    {
        id: 'anthropic-claude-sonnet-4-6',
        providerId: 'anthropic',
        providerLabel: 'Anthropic',
        modelId: 'claude-sonnet-4-6',
        options: { effort: 'medium', maxTokens: 1024, temperature: 1, thinking: { type: 'adaptive' } }
    },
    { id: 'openai-gpt-4.1', providerId: 'openAI', providerLabel: 'OpenAI', modelId: 'gpt-4.1', options: { maxOutputTokens: 1024, temperature: 1 } }
];

// Chat uses the Vercel AI SDK. Both SDKs remain in parallel until a preferred one is chosen.
export const CHAT_MODEL_CONFIGS: AssistantModelConfig[] = [
    { id: 'openai-gpt-4.1', providerId: 'openai', providerLabel: 'OpenAI', modelId: 'gpt-4.1', options: { maxOutputTokens: 4096, temperature: 1 } },
    {
        id: 'anthropic-claude-sonnet-4-6',
        providerId: 'anthropic',
        providerLabel: 'Anthropic',
        modelId: 'claude-sonnet-4-6',
        options: { effort: 'medium', maxOutputTokens: 4096, temperature: 1, thinking: { type: 'adaptive' } }
    }
];
