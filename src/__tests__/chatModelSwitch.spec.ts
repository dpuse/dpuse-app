import { describe, expect, it, vi } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';
import { nextTick } from 'vue';

const clientSpies = { attach: vi.fn(), dispose: vi.fn(), getStatus: vi.fn(() => 'ready'), updateOptions: vi.fn() };
const constructed: Record<string, unknown>[] = [];

async function resolveNothing(): Promise<void> {
    // A send is not what this spec is about.
}

function buildConnection(): Record<string, unknown> {
    return {};
}

// Used where the tool array is built, so the mock has to carry it too.
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

function buildModelConfig(id: string, modelId: string) {
    return { id, providerId: 'anthropic', providerLabel: 'Anthropic', modelId, options: {} };
}

// A rebuilt client starts from an empty transcript, so rebuilding on a model change silently discards the
// conversation. The session has to take the new model in place instead.
describe('changing model mid-conversation', () => {
    it('updates the live client rather than replacing it', async () => {
        const interfaceModule = await import('@/features/assistant/chat/ChatTanstackInterface.vue');
        const wrapper = mount(interfaceModule.default, { props: { modelConfig: buildModelConfig('a', 'claude-sonnet-4-6') } });
        await flushPromises();
        expect(constructed).toHaveLength(1);

        await wrapper.setProps({ modelConfig: buildModelConfig('b', 'claude-opus-4-8') });
        await nextTick();

        expect(constructed).toHaveLength(1); // No second client, so the transcript survives.
        expect(clientSpies.dispose).not.toHaveBeenCalled();
        expect(clientSpies.updateOptions).toHaveBeenCalledWith({
            forwardedProps: { providerId: 'anthropic', modelId: 'claude-opus-4-8', options: {}, rag: true }
        });
    });
});
