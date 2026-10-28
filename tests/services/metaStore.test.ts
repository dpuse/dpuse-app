// ── External Dependencies & Registrations
import { afterEach, describe, expect, it, vi } from 'vitest';

// ── Local Framework
import { establishEngineWorker } from '@/services/engine';
import { accountId, sessionIsAuthenticated } from '@/state/session';
import { constructMetaStoreListKey, constructMetaStoreRecordKey, establishDataViewRecordStore, retrieveDataViewRecordRange } from '@/services/metaStore';

// ── Mocks ────────────────────────────────────────────────────────────────────────────────────────────────────────────

// The meta store's connection comes from the connector list, which these tests do not load.
const META_STORE_CONNECTION_CONFIG = { id: 'meta-store' };
vi.mock('@/state/configs', async (importOriginal) => {
    const { ref } = await import('vue');
    // eslint-disable-next-line @typescript-eslint/consistent-type-imports -- Vitest's documented pattern for typing 'importOriginal'.
    return { ...(await importOriginal<typeof import('@/state/configs')>()), metaStoreConnectionConfig: ref({ id: 'meta-store' }) };
});

// The meta store is reached through the engine worker, which jsdom cannot run.
vi.mock('@/services/engine', () => ({ establishEngineWorker: vi.fn() }));

// ── Tests ────────────────────────────────────────────────────────────────────────────────────────────────────────────

afterEach(() => {
    accountId.value = undefined;
    sessionIsAuthenticated.value = undefined;
});

// A list and its records sit on separate branches under one node, so refreshing a list leaves open records alone, and
// everything shares the 'metaStore' root, so losing the store can drop it all at once.
describe('meta store query keys', () => {
    it('puts a list and its records on separate branches of the same node', () => {
        expect(constructMetaStoreListKey('dataViews')).toStrictEqual(['metaStore', 'dataViews', 'list']);
        expect(constructMetaStoreRecordKey('dataViews', 'a')).toStrictEqual(['metaStore', 'dataViews', 'record', 'a']);
    });
});

describe('establishDataViewRecordStore', () => {
    it("names the data view's table in the guest store while signed out", async () => {
        sessionIsAuthenticated.value = false;

        expect(await establishDataViewRecordStore('dataView1')).toStrictEqual({ connectionConfig: META_STORE_CONNECTION_CONFIG, nodeId: 'dataView1', storeId: 'dpuMetaStore' });
    });

    it("names the data view's table in the account's own store once signed in", async () => {
        accountId.value = 'account1';
        sessionIsAuthenticated.value = true;

        expect(await establishDataViewRecordStore('dataView1')).toMatchObject({ nodeId: 'dataView1', storeId: 'dpuMetaStore-account1' });
    });
});

describe('retrieveDataViewRecordRange', () => {
    it("reads the range from the data view's table, with the table's total", async () => {
        sessionIsAuthenticated.value = false;
        const processRequest = vi.fn((action: string, _config: unknown, _options: unknown, callback?: (data: unknown) => void) => {
            if (action === 'findObject') return Promise.resolve({ path: '/dpuMetaStore/dataView1' });
            callback?.({ typeId: 'chunk', properties: { records: [{ c1: 1 }, { c1: 2 }] } });
            callback?.({ typeId: 'complete', properties: { summary: { recordCount: 2, totalCount: 250 } } });
            return Promise.resolve();
        });
        vi.mocked(establishEngineWorker).mockResolvedValue({ processRequest } as never);

        expect(await retrieveDataViewRecordRange('dataView1', { limit: 2, offset: 100 })).toEqual({ records: [{ c1: 1 }, { c1: 2 }], totalCount: 250 });
        expect(processRequest).toHaveBeenCalledWith(
            'retrieveRecords',
            META_STORE_CONNECTION_CONFIG,
            expect.objectContaining({ path: '/dpuMetaStore/dataView1', range: { limit: 2, offset: 100 } }),
            expect.any(Function)
        );
    });

    it('returns no records for a data view whose table does not exist yet', async () => {
        sessionIsAuthenticated.value = false;
        const processRequest = vi.fn(() => Promise.resolve({ path: undefined }));
        vi.mocked(establishEngineWorker).mockResolvedValue({ processRequest } as never);

        expect(await retrieveDataViewRecordRange('dataView1', { limit: 100, offset: 0 })).toEqual({ records: [], totalCount: 0 });
        expect(processRequest).toHaveBeenCalledOnce(); // Only the look for the table.
    });
});
