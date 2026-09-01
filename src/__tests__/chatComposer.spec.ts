import { defineComponent, nextTick, ref } from 'vue';
import { describe, expect, it, vi } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';
import type { AssistantChatMessage } from '@/features/assistant/chat/assistantChat';

// The panel reads its session from the composable, so the spec drives that directly rather than standing up a fake
// component: the refs below are the session, and the tests move them the way a real run would.
vi.mock('@/services/useChatSession', async (importOriginal) => {
    const actual = await importOriginal<typeof import('@/services/useChatSession')>();
    const { ref } = await import('vue');
    const session = {
        messages: ref([] as AssistantChatMessage[]),
        status: ref('ready'),
        sendFailure: ref<string | undefined>(undefined),
        runWasStopped: ref(false),
        runHasFinished: ref(false),
        answerlessQuestionIds: ref([] as string[]),
        sendMessage: vi.fn(),
        stop: vi.fn()
    };
    // The run-state helper is real; only the session itself is stood in for.
    return { ...actual, useChatSession: () => session, sessionForTest: session };
});

vi.mock('@/services/useMarkedTool', async () => {
    const { ref } = await import('vue');
    // Real refs: a plain object is truthy in the template, which puts the panel into its load-failure branch.
    const markedTool = ref(undefined);
    const failure = ref(undefined);
    return { useMarkedTool: () => ({ markedTool, failure, initialise: () => Promise.resolve(undefined) }) };
});

interface SessionForTest {
    messages: { value: AssistantChatMessage[] };
    status: { value: string };
    sendFailure: { value: string | undefined };
    runWasStopped: { value: boolean };
    runHasFinished: { value: boolean };
    answerlessQuestionIds: { value: string[] };
    sendMessage: ReturnType<typeof vi.fn>;
    stop: ReturnType<typeof vi.fn>;
}

async function getSession(): Promise<SessionForTest> {
    const module_ = (await import('@/services/useChatSession')) as unknown as { sessionForTest: SessionForTest };
    return module_.sessionForTest;
}

// Found by its own label rather than by position: the composer shares the bar with the model menu, and the text box
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
            modelConfigs: []
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
        const session = await getSession();
        session.sendMessage.mockClear();
        session.status.value = 'ready';
        const wrapper = await mountPanel();
        const button = composerButton(wrapper);

        expect(button.attributes('aria-label')).toBe('Send the message');
        await button.trigger('click');

        expect(session.sendMessage).toHaveBeenCalledOnce();
    });

    it('becomes a stop button while a response is running, and cancels rather than sending', async () => {
        const session = await getSession();
        session.sendMessage.mockClear();
        session.stop.mockClear();
        const wrapper = await mountPanel();

        session.status.value = 'streaming';
        await nextTick();

        const button = composerButton(wrapper);
        expect(button.attributes('aria-label')).toBe('Stop the response');
        expect(button.classes()).toContain('bg-red-400');
        expect(button.classes()).not.toContain('bg-blue-400');

        await button.trigger('click');
        expect(session.stop).toHaveBeenCalledOnce();
        expect(session.sendMessage).not.toHaveBeenCalled();
    });

    it('stands in with a placeholder until the response has something to show', async () => {
        const session = await getSession();
        session.status.value = 'ready';
        session.messages.value = [];
        const wrapper = await mountPanel();

        expect(wrapper.text()).not.toContain('Working…');

        // Sent, nothing back yet.
        session.status.value = 'submitted';
        session.messages.value = [{ id: 'u1', role: 'user', parts: [{ type: 'text', content: 'A question' }], errors: [] }];
        await nextTick();
        expect(wrapper.text()).toContain('Working…');

        // A tool round: the assistant turn exists but normalises to nothing renderable, so the silence continues.
        session.messages.value = [
            { id: 'u1', role: 'user', parts: [{ type: 'text', content: 'A question' }], errors: [] },
            { id: 'a1', role: 'assistant', parts: [], errors: [] }
        ];
        await nextTick();
        expect(wrapper.text()).toContain('Working…');

        // First content — the standalone placeholder gives way to the answer, and the heading carries the wait on
        // while the rest of the text is still arriving.
        session.messages.value = [
            { id: 'u1', role: 'user', parts: [{ type: 'text', content: 'A question' }], errors: [] },
            { id: 'a1', role: 'assistant', parts: [{ type: 'text', content: 'An answer' }], errors: [] }
        ];
        session.status.value = 'streaming';
        await nextTick();
        expect(wrapper.text()).toContain('An answer');
        expect(wrapper.text()).toContain('Working…');

        // Step complete: the heading settles and the wait is over.
        session.status.value = 'ready';
        await nextTick();
        expect(wrapper.text()).not.toContain('Working…');
        expect(wrapper.text()).toContain('An answer');
    });

    // 'Done' marks the answer to the question, so it belongs to the last message alone — the earlier turns are steps
    // on the way to it, and nothing is finished while the run is still going.
    it('heads only the final answer with Done, and only once the run has ended', async () => {
        const session = await getSession();
        const wrapper = await mountPanel();
        const thread: AssistantChatMessage[] = [
            { id: 'a1', role: 'assistant', parts: [{ type: 'text', content: 'An interim answer' }], errors: [] },
            { id: 'u2', role: 'user', parts: [{ type: 'text', content: 'A second question' }], errors: [] },
            { id: 'a2', role: 'assistant', parts: [{ type: 'text', content: 'The final answer' }], errors: [] }
        ];

        session.messages.value = thread;
        session.status.value = 'streaming';
        await nextTick();
        expect(wrapper.text()).not.toContain('Done'); // Still running: nothing is finished.
        expect(wrapper.text()).toContain('Working…'); // The live step says so until it completes.

        session.status.value = 'ready';
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
        const session = await getSession();
        const wrapper = await mountPanel();

        session.messages.value = [
            { id: 'u1', role: 'user', parts: [{ type: 'text', content: 'The earlier question' }], errors: [] },
            { id: 'a1', role: 'assistant', parts: [{ type: 'text', content: 'The earlier answer' }], errors: [] }
        ];
        session.sendFailure.value = 'The session refused the message.';
        await nextTick();

        const text = wrapper.text();
        expect(text).toContain('The session refused the message.');
        expect(text.indexOf('The session refused the message.')).toBeGreaterThan(text.indexOf('The earlier answer'));
    });

    // Which runs came back empty is the session's call, made as each one ends; the panel only renders what it is told.
    // The adapter reports a declined request as an ordinary finish, so an empty turn is all either of them ever sees.
    it('says so for a question the session recorded as answerless', async () => {
        const session = await getSession();
        session.answerlessQuestionIds.value = [];
        session.status.value = 'streaming';
        session.messages.value = [
            { id: 'u1', role: 'user', parts: [{ type: 'text', content: 'A question' }], errors: [] },
            { id: 'a1', role: 'assistant', parts: [], errors: [] }
        ];
        const wrapper = await mountPanel();

        // Mid-run an empty assistant turn is just a tool round, so the placeholder speaks for it.
        expect(wrapper.text()).toContain('Working…');
        expect(wrapper.text()).not.toContain('No answer');

        session.status.value = 'ready';
        session.answerlessQuestionIds.value = ['u1'];
        await nextTick();
        expect(wrapper.text()).toContain('No answer');
    });

    // The empty turn the user stopped themselves never reaches the list, so nothing here has to know about stopping.
    it('stays quiet about an empty turn the session did not record', async () => {
        const session = await getSession();
        session.status.value = 'ready';
        session.answerlessQuestionIds.value = [];
        session.messages.value = [
            { id: 'u1', role: 'user', parts: [{ type: 'text', content: 'A question' }], errors: [] },
            { id: 'a1', role: 'assistant', parts: [], errors: [] }
        ];
        const wrapper = await mountPanel();

        expect(wrapper.text()).not.toContain('No answer');
    });

    // A refusal may produce no assistant message at all, leaving the question as the last thing in the thread. That is
    // still an answer that never came, and it has to say so rather than leave the question hanging.
    it('says so when a run ends without producing any assistant turn', async () => {
        const session = await getSession();
        session.status.value = 'ready';
        session.answerlessQuestionIds.value = ['u1'];
        session.messages.value = [{ id: 'u1', role: 'user', parts: [{ type: 'text', content: 'A question' }], errors: [] }];
        const wrapper = await mountPanel();

        expect(wrapper.text()).toContain('No answer');
    });

    // The notice belongs to the turn that earned it. Derived from the tail of the conversation it described only the
    // most recent run, so asking again wiped the previous turn's outcome out of the history.
    it('keeps an answerless turn marked once the conversation moves past it', async () => {
        const session = await getSession();
        session.status.value = 'ready';
        session.answerlessQuestionIds.value = ['u1'];
        session.messages.value = [{ id: 'u1', role: 'user', parts: [{ type: 'text', content: 'A question' }], errors: [] }];
        const wrapper = await mountPanel();
        expect(wrapper.text()).toContain('No answer');

        session.messages.value = [
            ...session.messages.value,
            { id: 'u2', role: 'user', parts: [{ type: 'text', content: 'Another question' }], errors: [] },
            { id: 'a2', role: 'assistant', parts: [{ type: 'text', content: 'An answer' }], errors: [] }
        ];
        await nextTick();
        expect(wrapper.text()).toContain('No answer');
        expect(wrapper.text()).toContain('An answer');
    });

    // The session withholds the question from the list when an error already sits under it, so the two never stack.
    it('leaves a question that already carries an error alone', async () => {
        const session = await getSession();
        session.status.value = 'ready';
        session.answerlessQuestionIds.value = [];
        session.messages.value = [{ id: 'u1', role: 'user', parts: [{ type: 'text', content: 'A question' }], errors: ['The model is overloaded.'] }];
        const wrapper = await mountPanel();

        expect(wrapper.text()).toContain('The model is overloaded.');
        expect(wrapper.text()).not.toContain('No answer');
    });

    it('stays available while a run is in flight, even with an empty composer', async () => {
        const session = await getSession();
        const wrapper = await mountPanel();
        session.status.value = 'submitted';
        await nextTick();

        expect(composerButton(wrapper).attributes('disabled')).toBeUndefined();
    });
});
