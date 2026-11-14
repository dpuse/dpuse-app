// ── External Dependencies & Registrations
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ChatClient, stream } from '@tanstack/ai-client';
import { convertMessagesToModelMessages, EventType, uiMessagesToWire } from '@tanstack/ai/client';
import type { ModelMessage, StreamChunk, UIMessage } from '@tanstack/ai/client';

// ── DPUse Framework
import type { ConnectionNodeConfig, ListNodesOptions, ListNodesResult } from '@dpuse/dpuse-shared';

// ── Local Framework
import { assertDefined } from '@/utilities/index.ts';
import { executeListConnectorItems } from '@/features/assistant/chat/tools/listConnectorItems';
import { tanstackClientTools } from '@/features/assistant/chat/tools/tanstackClientTools';

// ── Mocks ────────────────────────────────────────────────────────────────────────────────────────────────────────────

vi.mock('@/services/engine', () => ({ establishEngineWorker: vi.fn(() => Promise.resolve({ processRequest: processRequestSpy })) }));
vi.mock('@/state/configs', () => ({ findConnectionLocalisedConfig: vi.fn((id: string) => (id === CONNECTION_ID ? { connectorConfig: { actionNames: [] }, id } : undefined)) }));
vi.mock('@/state/errors', () => ({ raiseFailure: vi.fn((error: Error) => ({ error })) }));

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

const CONNECTION_ID = 'dpuse-connector-file-store-emulator';
const ROOT_FOLDER_NAMES = ['Application', 'Encoding Samples', 'Type Samples', 'World Bank Data'];

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

const processRequestSpy = vi.fn(fakeProcessRequest);

// ── Tests ────────────────────────────────────────────────────────────────────────────────────────────────────────────

describe('executeListConnectorItems', () => {
    beforeEach(() => {
        processRequestSpy.mockClear();
    });

    it('lists the root folders when the folder path is empty', async () => {
        const result = await executeListConnectorItems({ connectionId: CONNECTION_ID, folderPath: '' });

        expect(processRequestSpy).toHaveBeenCalledWith('listNodes', expect.objectContaining({ id: CONNECTION_ID }), { folderPath: '' });
        expect(result).toEqual({ items: ROOT_FOLDER_NAMES.map((name) => buildExpectedItem(name)) });
    });

    it('lists the root folders when the folder path is left out', async () => {
        const result = await executeListConnectorItems({ connectionId: CONNECTION_ID });

        expect(processRequestSpy).toHaveBeenCalledWith('listNodes', expect.objectContaining({ id: CONNECTION_ID }), { folderPath: '' });
        expect(result).toEqual({ items: ROOT_FOLDER_NAMES.map((name) => buildExpectedItem(name)) });
    });

    it('lists nothing for a folder path the connector does not hold', async () => {
        const result = await executeListConnectorItems({ connectionId: CONNECTION_ID, folderPath: '/' });

        expect(result).toEqual({ items: [] });
    });

    it('returns the failure message when the engine fails', async () => {
        processRequestSpy.mockRejectedValueOnce(new Error('Engine failed.'));

        const result = await executeListConnectorItems({ connectionId: CONNECTION_ID, folderPath: '' });

        expect(result).toEqual({ error: `Failed to list items for connection '${CONNECTION_ID}'.` });
    });
});

describe('listConnectorItems through the TanStack chat client', () => {
    it.each([
        { case: 'an empty folder path', input: { connectionId: CONNECTION_ID, folderPath: '' }, expectedNames: ROOT_FOLDER_NAMES },
        { case: 'no folder path', input: { connectionId: CONNECTION_ID }, expectedNames: ROOT_FOLDER_NAMES },
        { case: "the folder path '/'", input: { connectionId: CONNECTION_ID, folderPath: '/' }, expectedNames: [] }
    ])('gives the model the listed items for $case', async ({ input, expectedNames }) => {
        const continuationMessages = await runToolCallThroughClient(input);

        // Converted as the SSE connection sends them and as the API turns them into the model's messages.
        const modelMessages = convertMessagesToModelMessages(uiMessagesToWire(continuationMessages) as ModelMessage[]); // The API receives the wire messages as model messages.
        const toolMessage = modelMessages.find((message) => message.role === 'tool');
        expect(toolMessage).toBeDefined();
        expect(toolMessage).not.toHaveProperty('error');
        expect(typeof toolMessage?.content).toBe('string');
        const output = JSON.parse(toolMessage?.content as string) as { items: { name: string }[] };
        expect(output.items.map((item) => item.name)).toEqual(expectedNames);
    });
});

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

// Mirrors the file-store emulator's index, whose root folder is keyed by an empty path.
function fakeProcessRequest(_action: string, _connection: unknown, options: ListNodesOptions): Promise<ListNodesResult> {
    const connectionNodeConfigs = options.folderPath === '' ? ROOT_FOLDER_NAMES.map((name) => buildFolderNodeConfig(name)) : [];
    return Promise.resolve({ cursor: undefined, connectionNodeConfigs, isMore: false, totalCount: connectionNodeConfigs.length });
}

function buildFolderNodeConfig(name: string): ConnectionNodeConfig {
    return {
        childCount: 1,
        description: '',
        extension: undefined,
        folderPath: '',
        icon: null,
        iconDark: null,
        id: name,
        label: name,
        lastModifiedAt: undefined,
        mimeType: undefined,
        name,
        size: undefined,
        typeId: 'folder'
    };
}

function buildExpectedItem(name: string): Record<string, unknown> {
    return { name, label: name, typeId: 'folder', folderPath: '', extension: null, size: null };
}

// The first run asks the client to call the tool, as the model does. The client runs it and starts a second run that
// carries the tool's result, which is what the server would pass on to the model.
async function runToolCallThroughClient(input: Record<string, unknown>): Promise<UIMessage[]> {
    const runs: (UIMessage[] | ModelMessage[])[] = [];
    const connection = stream((messages, _data, _signal, runInput) => {
        runs.push(messages);
        return runs.length === 1 ? yieldToolCallRun(runInput.threadId, runInput.runId, input) : yieldFinishedRun(runInput.threadId, runInput.runId);
    });
    const client = new ChatClient({ connection, threadId: 'thread-1', tools: tanstackClientTools });

    await client.sendMessage('List the root folder.');
    const continuationMessages = await vi.waitFor(() => assertDefined(runs[1], 'The client never sent the tool result back.'));
    client.stop();
    return continuationMessages as UIMessage[]; // The client always sends its own UI messages.
}

async function* yieldToolCallRun(threadId: string, runId: string, input: Record<string, unknown>): AsyncGenerator<StreamChunk> {
    await Promise.resolve();
    const timestamp = Date.now();
    yield { type: EventType.RUN_STARTED, threadId, runId, timestamp };
    yield { type: EventType.TOOL_CALL_START, toolCallId: 'call-1', toolCallName: 'listConnectorItems', parentMessageId: 'assistant-1', timestamp };
    yield { type: EventType.TOOL_CALL_ARGS, toolCallId: 'call-1', delta: JSON.stringify(input), timestamp };
    yield { type: EventType.TOOL_CALL_END, toolCallId: 'call-1', timestamp };
    yield { type: EventType.RUN_FINISHED, threadId, runId, finishReason: 'tool_calls', timestamp };
}

async function* yieldFinishedRun(threadId: string, runId: string): AsyncGenerator<StreamChunk> {
    await Promise.resolve();
    const timestamp = Date.now();
    yield { type: EventType.RUN_STARTED, threadId, runId, timestamp };
    yield { type: EventType.RUN_FINISHED, threadId, runId, finishReason: 'stop', timestamp };
}

