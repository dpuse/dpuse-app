// ── External Dependencies & Registrations
import { describe, expect, it } from 'vitest';

// ── Local Framework
import { constructMetaStoreListKey, constructMetaStoreRecordKey } from '@/services/metaStore';

// ── Tests ────────────────────────────────────────────────────────────────────────────────────────────────────────────

// A list and its records sit on separate branches under one node, so refreshing a list leaves open records alone, and
// everything shares the 'metaStore' root, so losing the store can drop it all at once.
describe('meta store query keys', () => {
    it('puts a list and its records on separate branches of the same node', () => {
        expect(constructMetaStoreListKey('dataViews')).toStrictEqual(['metaStore', 'dataViews', 'list']);
        expect(constructMetaStoreRecordKey('dataViews', 'a')).toStrictEqual(['metaStore', 'dataViews', 'record', 'a']);
    });
});
