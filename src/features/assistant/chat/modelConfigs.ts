// ── Types ────────────────────────────────────────────────────────────────────────────────────────────────────────────

export type AssistantVendorId = 'tanstack' | 'vercel';

export interface AssistantModelConfig {
    id: string;
    providerId: string;
    providerLabel: string;
    modelId: string;
    options: Record<string, unknown>;
}

export interface AssistantVendorConfig {
    id: AssistantVendorId;
    label: string;
    modelConfigs: AssistantModelConfig[];
}

// ── Data ─────────────────────────────────────────────────────────────────────────────────────────────────────────────

// Chat runs on either SDK, kept in parallel until a preferred one is chosen — swap vendor via the model selector.
export const ASSISTANT_VENDOR_CONFIGS: AssistantVendorConfig[] = [
    {
        id: 'tanstack',
        label: 'Tanstack',
        modelConfigs: [
            { id: 'anthropic-claude-haiku-4-5', providerId: 'anthropic', providerLabel: 'Anthropic', modelId: 'claude-haiku-4-5', options: { maxTokens: 1024, temperature: 1 } },
            {
                id: 'anthropic-claude-sonnet-4-6',
                providerId: 'anthropic',
                providerLabel: 'Anthropic',
                modelId: 'claude-sonnet-4-6',
                options: { effort: 'medium', maxTokens: 1024, temperature: 1, thinking: { type: 'adaptive' } }
            },
            { id: 'openai-gpt-4.1', providerId: 'openAI', providerLabel: 'OpenAI', modelId: 'gpt-4.1', options: { maxOutputTokens: 1024, temperature: 1 } }
        ]
    },
    {
        id: 'vercel',
        label: 'Vercel',
        modelConfigs: [
            { id: 'openai-gpt-4.1', providerId: 'openai', providerLabel: 'OpenAI', modelId: 'gpt-4.1', options: { maxOutputTokens: 4096, temperature: 1 } },
            {
                id: 'anthropic-claude-sonnet-4-6',
                providerId: 'anthropic',
                providerLabel: 'Anthropic',
                modelId: 'claude-sonnet-4-6',
                options: { effort: 'medium', maxOutputTokens: 4096, temperature: 1, thinking: { type: 'adaptive' } }
            }
        ]
    }
];
