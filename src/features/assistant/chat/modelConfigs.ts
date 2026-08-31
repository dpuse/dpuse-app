// ── Types ────────────────────────────────────────────────────────────────────────────────────────────────────────────

export interface AssistantModelConfig {
    id: string;
    providerId: string;
    providerLabel: string;
    modelId: string;
    options: Record<string, unknown>;
}

// ── Data ─────────────────────────────────────────────────────────────────────────────────────────────────────────────

// The models the chat can run, in the order the selector lists them. Chat runs on the TanStack AI SDK; 'providerId'
// names the vendor behind the model, which is what the API uses to pick an adapter, and has nothing to do with the SDK.
export const ASSISTANT_MODEL_CONFIGS: AssistantModelConfig[] = [
    { id: 'anthropic-claude-haiku-4-5', providerId: 'anthropic', providerLabel: 'Anthropic', modelId: 'claude-haiku-4-5', options: { maxTokens: 4096, temperature: 1 } },
    {
        id: 'anthropic-claude-sonnet-4-6',
        providerId: 'anthropic',
        providerLabel: 'Anthropic',
        modelId: 'claude-sonnet-4-6',
        options: { effort: 'medium', maxTokens: 4096, temperature: 1, thinking: { type: 'adaptive' } }
    },
    { id: 'openai-gpt-4.1', providerId: 'openAI', providerLabel: 'OpenAI', modelId: 'gpt-4.1', options: { maxOutputTokens: 4096, temperature: 1 } }
];
