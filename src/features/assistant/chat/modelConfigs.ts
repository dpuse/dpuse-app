// ── Types ────────────────────────────────────────────────────────────────────────────────────────────────────────────

export interface AssistantModelConfig {
    id: string;
    providerId: string;
    providerLabel: string;
    modelId: string;
    options: Record<string, unknown>;
}

// ── Data ─────────────────────────────────────────────────────────────────────────────────────────────────────────────

// The models the chat can run, most capable first — the first entry is what a new user gets. Chat runs on the TanStack
// AI SDK; 'providerId' names the vendor behind the model, which is what the API uses to pick an adapter, and has
// nothing to do with the SDK. Every id here is one the installed adapter knows about, so a typo is a 404 at runtime
// rather than a compile error — the matching unions in the API's provider modules are the guard.
//
// The options are not interchangeable between models, and the differences are rejections rather than warnings:
//
//   - 'temperature' is removed on Anthropic's 5-series and 4.7/4.8, and returns a 400. It is still accepted on
//     Sonnet 4.6 and on Haiku 4.5.
//   - 'thinking: adaptive' replaces the old token budget on 4.6 and later. Haiku 4.5 predates it and takes neither
//     that nor 'effort'.
//   - 'effort' runs low → medium → high → xhigh → max, and only on models that carry it. It is the cost dial: it
//     decides how much thinking the model does before answering.
export const ASSISTANT_MODEL_CONFIGS: AssistantModelConfig[] = [
    {
        id: 'anthropic-claude-opus-5',
        providerId: 'anthropic',
        providerLabel: 'Anthropic',
        modelId: 'claude-opus-5',
        options: { effort: 'medium', maxTokens: 4096, thinking: { type: 'adaptive' } }
    },
    {
        id: 'anthropic-claude-sonnet-5',
        providerId: 'anthropic',
        providerLabel: 'Anthropic',
        modelId: 'claude-sonnet-5',
        options: { effort: 'medium', maxTokens: 4096, thinking: { type: 'adaptive' } }
    },
    { id: 'anthropic-claude-haiku-4-5', providerId: 'anthropic', providerLabel: 'Anthropic', modelId: 'claude-haiku-4-5', options: { maxTokens: 4096, temperature: 1 } }, // No 'effort' and no 'thinking': Haiku 4.5 predates both and rejects them.
    { id: 'openai-gpt-5.6', providerId: 'openAI', providerLabel: 'OpenAI', modelId: 'gpt-5.6', options: { maxOutputTokens: 4096 } },
    { id: 'openai-gpt-5.6-terra', providerId: 'openAI', providerLabel: 'OpenAI', modelId: 'gpt-5.6-terra', options: { maxOutputTokens: 4096 } },
    { id: 'openai-gpt-5.6-luna', providerId: 'openAI', providerLabel: 'OpenAI', modelId: 'gpt-5.6-luna', options: { maxOutputTokens: 4096 } }
];
