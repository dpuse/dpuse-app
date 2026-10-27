// ── External Dependencies & Registrations
import { afterEach, describe, expect, it, vi } from 'vitest';

// ── Local Framework
import { accountId, sessionIsAuthenticated } from '@/state/session';
import { constructMetaStoreListKey, constructMetaStoreRecordKey, establishDataViewRecordStore } from '@/services/metaStore';

// ── Mocks ────────────────────────────────────────────────────────────────────────────────────────────────────────────

// The meta store's connection comes from the connector list, which these tests do not load.
const META_STORE_CONNECTION_CONFIG = { id: 'meta-store' };
vi.mock('@/state/configs', async (importOriginal) => {
    const { ref } = await import('vue');
    // eslint-disable-next-line @typescript-eslint/consistent-type-imports -- Vitest's documented pattern for typing 'importOriginal'.
    return { ...(await importOriginal<typeof import('@/state/configs')>()), metaStoreConnectionConfig: ref({ id: 'meta-store' }) };
});

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
