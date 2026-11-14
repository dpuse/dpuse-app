// ── External Dependencies & Registrations
import { nextTick } from 'vue';
import { beforeEach, describe, expect, it } from 'vitest';

// ── Local Framework
import {
    constructLoadKey,
    forgetAllLoads,
    forgetStoreLoads,
    loadedColumnsVersions,
    loadInvalidValueCounts,
    loadTablePaths,
    unwantedTablePaths
} from '@/state/dataViewLoads';

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

const SQLITE_KEY = constructLoadKey('sqlite', 'dataView1', false);
const SQLITE_DRAFT_KEY = constructLoadKey('sqlite', 'dataView1', true);
const DUCKDB_KEY = constructLoadKey('duckdb', 'dataView2', false);

// ── Tests ────────────────────────────────────────────────────────────────────────────────────────────────────────────

// Each record is written to local storage after a tick, so the writes settle before a test reads what the last one left.
beforeEach(async () => {
    loadedColumnsVersions.value = { [DUCKDB_KEY]: 'v2', [SQLITE_DRAFT_KEY]: 'v1d', [SQLITE_KEY]: 'v1' };
    loadInvalidValueCounts.value = { [DUCKDB_KEY]: [0], [SQLITE_KEY]: [1] };
    loadTablePaths.value = { [DUCKDB_KEY]: 'tableD', [SQLITE_DRAFT_KEY]: 'tableSd', [SQLITE_KEY]: 'tableS' };
    unwantedTablePaths.value = { duckdb: ['oldD'], sqlite: ['oldS'] };
    await nextTick();
});

describe('dataViewLoads', () => {
    it("forgets every load in a store whose database was deleted, and nothing in any other store", () => {
        forgetStoreLoads('sqlite');

        expect(loadedColumnsVersions.value).toStrictEqual({ [DUCKDB_KEY]: 'v2' });
        expect(loadInvalidValueCounts.value).toStrictEqual({ [DUCKDB_KEY]: [0] });
        expect(loadTablePaths.value).toStrictEqual({ [DUCKDB_KEY]: 'tableD' });
        expect(unwantedTablePaths.value).toStrictEqual({ duckdb: ['oldD'] }); // Its tables went with the database.
    });

    it('marks every loaded table to be dropped when its store next opens, after local storage was cleared', async () => {
        forgetAllLoads();
        await nextTick();

        expect(loadedColumnsVersions.value).toStrictEqual({});
        expect(loadInvalidValueCounts.value).toStrictEqual({});
        expect(loadTablePaths.value).toStrictEqual({});
        expect(unwantedTablePaths.value).toStrictEqual({ duckdb: ['oldD', 'tableD'], sqlite: ['oldS', 'tableSd', 'tableS'] });
        expect(JSON.parse(localStorage.getItem('dpuse-investigate-unwanted-tables') ?? '{}')).toStrictEqual(unwantedTablePaths.value); // Written again, so a reload still drops them.
    });
});
