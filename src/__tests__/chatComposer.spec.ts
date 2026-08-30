import { defineComponent, nextTick, ref } from 'vue';
import { describe, expect, it, vi } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';

const sessionSpies = { sendMessage: vi.fn(), stop: vi.fn() };

vi.mock('@/services/useMarkedTool', () => ({
    useMarkedTool: () => ({ markedTool: ref(undefined), failure: ref(undefined), initialise: () => Promise.resolve(undefined) })
}));

// Stands in for a vendor session: publishes the same imperative API and drives the status the composer reads.
// '__esModule' marks the mock as a module namespace, which is what makes 'defineAsyncComponent' unwrap 'default'.
function buildStubSession() {
    return {
        __esModule: true,
        default: defineComponent({
            emits: ['messagesChange', 'statusChange'],
            setup(_properties, { emit, expose }) {
                expose(sessionSpies);
                emit('statusChange', 'ready');
            },
            template: '<div />'
        })
    };
}
vi.mock('@/features/assistant/chat/ChatTanstackInterface.vue', () => buildStubSession());
vi.mock('@/features/assistant/chat/ChatVercelInterface.vue', () => buildStubSession());

// Found by its own label rather than by position: the composer shares the bar with the vendor menu, and the text box
// contributes a clear button of its own.
function composerButton(wrapper: ReturnType<typeof mount>): ReturnType<ReturnType<typeof mount>['get']> {
    const button = wrapper.findAll('button').find((candidate) => ['Send the message', 'Stop the response'].includes(candidate.attributes('aria-label') ?? ''));
    if (!button) throw new Error('The composer button is not rendered.');
    return button;
}

async function mountPanel(): Promise<ReturnType<typeof mount>> {
    const panelModule = await import('@/features/assistant/chat/ChatPanel.vue');
    const wrapper = mount(panelModule.default, {
        props: {
            modelConfig: { id: 'm', providerId: 'anthropic', providerLabel: 'Anthropic', modelId: 'claude-sonnet-4-6', options: {} },
            vendorConfigs: [],
            vendorId: 'tanstack'
        }
    });
    for (let index = 0; index < 8; index++) {
        await flushPromises();
        await nextTick();
    }
    return wrapper;
}

// The composer button carries both actions, so which one it is has to follow the run state exactly: a send that fires
// mid-run reaches a session that cannot take it, and a stop the user cannot reach leaves a run they cannot end.
describe('chat composer send/stop button', () => {
    it('sends while the thread is idle', async () => {
        sessionSpies.sendMessage.mockClear();
        const wrapper = await mountPanel();
        const button = composerButton(wrapper);

        expect(button.attributes('aria-label')).toBe('Send the message');
        await button.trigger('click');

        expect(sessionSpies.sendMessage).toHaveBeenCalledOnce();
    });

    it('becomes a stop button while a response is running, and cancels rather than sending', async () => {
        sessionSpies.sendMessage.mockClear();
        sessionSpies.stop.mockClear();
        const wrapper = await mountPanel();

        await wrapper.findComponent({ name: 'ChatTanstackInterfaceHost' }).vm.$emit('statusChange', 'streaming');
        await nextTick();

        const button = composerButton(wrapper);
        expect(button.attributes('aria-label')).toBe('Stop the response');
        expect(button.classes()).toContain('bg-red-400');
        expect(button.classes()).not.toContain('bg-blue-400');

        await button.trigger('click');
        expect(sessionSpies.stop).toHaveBeenCalledOnce();
        expect(sessionSpies.sendMessage).not.toHaveBeenCalled();
    });

    it('stands in with a placeholder until the response has something to show', async () => {
        const wrapper = await mountPanel();
        const session = wrapper.findComponent({ name: 'ChatTanstackInterfaceHost' });

        expect(wrapper.text()).not.toContain('Working…');

        // Sent, nothing back yet.
        await session.vm.$emit('statusChange', 'submitted');
        await session.vm.$emit('messagesChange', [{ id: 'u1', role: 'user', parts: [{ type: 'text', content: 'A question' }], errors: [] }]);
        await nextTick();
        expect(wrapper.text()).toContain('Working…');

        // A tool round: the assistant turn exists but normalises to nothing renderable, so the silence continues.
        await session.vm.$emit('messagesChange', [
            { id: 'u1', role: 'user', parts: [{ type: 'text', content: 'A question' }], errors: [] },
            { id: 'a1', role: 'assistant', parts: [], errors: [] }
        ]);
        await nextTick();
        expect(wrapper.text()).toContain('Working…');

        // First content — the standalone placeholder gives way to the answer, and the heading carries the wait on
        // while the rest of the text is still arriving.
        await session.vm.$emit('messagesChange', [
            { id: 'u1', role: 'user', parts: [{ type: 'text', content: 'A question' }], errors: [] },
            { id: 'a1', role: 'assistant', parts: [{ type: 'text', content: 'An answer' }], errors: [] }
        ]);
        await session.vm.$emit('statusChange', 'streaming');
        await nextTick();
        expect(wrapper.text()).toContain('An answer');
        expect(wrapper.text()).toContain('Working…');

        // Step complete: the heading settles and the wait is over.
        await session.vm.$emit('statusChange', 'ready');
        await nextTick();
        expect(wrapper.text()).not.toContain('Working…');
        expect(wrapper.text()).toContain('An answer');
    });

    // 'Done' marks the answer to the question, so it belongs to the last message alone — the earlier turns are steps
    // on the way to it, and nothing is finished while the run is still going.
    it('heads only the final answer with Done, and only once the run has ended', async () => {
        const wrapper = await mountPanel();
        const session = wrapper.findComponent({ name: 'ChatTanstackInterfaceHost' });
        const thread = [
            { id: 'a1', role: 'assistant', parts: [{ type: 'text', content: 'An interim answer' }], errors: [] },
            { id: 'u2', role: 'user', parts: [{ type: 'text', content: 'A second question' }], errors: [] },
            { id: 'a2', role: 'assistant', parts: [{ type: 'text', content: 'The final answer' }], errors: [] }
        ];

        await session.vm.$emit('messagesChange', thread);
        await session.vm.$emit('statusChange', 'streaming');
        await nextTick();
        expect(wrapper.text()).not.toContain('Done'); // Still running: nothing is finished.
        expect(wrapper.text()).toContain('Working…'); // The live step says so until it completes.

        await session.vm.$emit('statusChange', 'ready');
        await nextTick();

        const text = wrapper.text();
        expect(text.match(/Done/g)).toHaveLength(1);
        expect(text.indexOf('Done')).toBeGreaterThan(text.indexOf('An interim answer'));
        expect(text.indexOf('Done')).toBeLessThan(text.indexOf('The final answer'));
        expect(text).toContain('Response'); // The interim answer keeps the plain heading.
    });

    // A refused send appends no message, so hanging its error on the latest user message put it against the previous
    // question — above the conversation rather than at the end of it.
    it('shows a refused send at the end of the thread rather than against an earlier question', async () => {
        const wrapper = await mountPanel();
        const session = wrapper.findComponent({ name: 'ChatTanstackInterfaceHost' });

        await session.vm.$emit('messagesChange', [
            { id: 'u1', role: 'user', parts: [{ type: 'text', content: 'The earlier question' }], errors: [] },
            { id: 'a1', role: 'assistant', parts: [{ type: 'text', content: 'The earlier answer' }], errors: [] }
        ]);
        await session.vm.$emit('sendFailure', 'The session refused the message.');
        await nextTick();

        const text = wrapper.text();
        expect(text).toContain('The session refused the message.');
        expect(text.indexOf('The session refused the message.')).toBeGreaterThan(text.indexOf('The earlier answer'));
    });

    it('stays available while a run is in flight, even with an empty composer', async () => {
        const wrapper = await mountPanel();
        await wrapper.findComponent({ name: 'ChatTanstackInterfaceHost' }).vm.$emit('statusChange', 'submitted');
        await nextTick();

        expect(composerButton(wrapper).attributes('disabled')).toBeUndefined();
    });
});
