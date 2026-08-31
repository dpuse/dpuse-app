import { defineComponent, h, nextTick, ref } from 'vue';
import { describe, expect, it, vi } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';
import type { AssistantModelConfig } from '@/features/assistant/chat/modelConfigs';
import { useChatSession } from '@/services/useChatSession';

const clientSpies = { attach: vi.fn(), dispose: vi.fn(), getStatus: vi.fn(() => 'ready'), updateOptions: vi.fn() };
const constructed: Record<string, unknown>[] = [];

async function resolveNothing(): Promise<void> {
    // A send is not what this spec is about.
}

function buildConnection(): Record<string, unknown> {
    return {};
}

function passThroughTools(...tools: unknown[]): unknown[] {
    return tools;
}

vi.mock('@tanstack/ai-client', () => ({
    ChatClient: class {
        attach = clientSpies.attach;
        dispose = clientSpies.dispose;
        getStatus = clientSpies.getStatus;
        updateOptions = clientSpies.updateOptions;
        stop = vi.fn();
        sendMessage = vi.fn(resolveNothing);

        constructor(options: Record<string, unknown>) {
            constructed.push(options);
        }
    },
    fetchServerSentEvents: buildConnection,
    clientTools: passThroughTools
}));

// The composable owns mount and unmount hooks, so it needs a component to live in.
function buildHarness(getModelConfig: () => AssistantModelConfig): ReturnType<typeof defineComponent> {
    return defineComponent({
        setup() {
            useChatSession(getModelConfig);
            return renderNothing;
        }
    });
}

function renderNothing(): ReturnType<typeof h> {
    return h('div');
}

function buildModelConfig(id: string, modelId: string): AssistantModelConfig {
    return { id, providerId: 'anthropic', providerLabel: 'Anthropic', modelId, options: {} };
}

// A rebuilt client starts from an empty transcript, so rebuilding on a model change silently discards the
// conversation. The session has to take the new model in place instead.
describe('changing model mid-conversation', () => {
    it('updates the live client rather than replacing it', async () => {
        const modelConfig = ref(buildModelConfig('a', 'claude-sonnet-4-6'));
        mount(buildHarness(() => modelConfig.value));
        await flushPromises();
        expect(constructed).toHaveLength(1);

        modelConfig.value = buildModelConfig('b', 'claude-opus-4-8');
        await nextTick();

        expect(constructed).toHaveLength(1); // No second client, so the transcript survives.
        expect(clientSpies.dispose).not.toHaveBeenCalled();
        expect(clientSpies.updateOptions).toHaveBeenCalledWith({
            forwardedProps: { providerId: 'anthropic', modelId: 'claude-opus-4-8', options: {}, rag: true }
        });
    });
});
