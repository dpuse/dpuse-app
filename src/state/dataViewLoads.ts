// What this browser knows about the records loaded into its stores for investigating data views: the table each load
// went into, the columns it was loaded with, and the tables waiting to be dropped. Kept in local storage because the
// stores are kept in this browser too. Data views read and change these records. Manage Data also changes them, when
// it removes a store's database or clears local storage, so they stay true to what the stores hold.

// ── External Dependencies & Registrations
import { useLocalStorage } from '@vueuse/core';

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

export const DRAFT_LOAD_SUFFIX = '|draft';
const LOAD_FORMAT_VERSION = 3; // Raised when stored values change meaning, so that what is already loaded is loaded again. 2 stores dates in UTC, as true dates and times. 3 keeps no column types in the store, because every query brings them.

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

// The columns each data view was loaded with, by store and data view. A data view whose columns have changed since is
// loaded again.
export const loadedColumnsVersions = useLocalStorage<Partial<Record<string, number | string>>>('dpuse-investigate-loads', {});

// How many values in each column did not fit its type and loaded as empty, by load. The store holds them only as empty
// values, the same as values missing from the source, so a later visit can only tell them apart from these counts.
export const loadInvalidValueCounts = useLocalStorage<Partial<Record<string, number[]>>>('dpuse-investigate-invalid-counts', {});

// The table each load went into. A draft has a table of its own, so loading it leaves the saved data view's records
// alone. Save makes that table the saved one.
export const loadTablePaths = useLocalStorage<Partial<Record<string, string>>>('dpuse-investigate-tables', {});

// Tables no longer needed, by store. Opening a store only to drop a table would download its engine, so they wait until
// the store is next opened.
export const unwantedTablePaths = useLocalStorage<Partial<Record<string, string[]>>>('dpuse-investigate-unwanted-tables', {});

// ── Actions ──────────────────────────────────────────────────────────────────────────────────────────────────────────

// Each key starts with its store's id, so a store's loads can be found from their keys.
export function constructLoadKey(storeConnectorId: string, dataViewId: string, isDraft: boolean): string {
    return `${storeConnectorId}|${String(LOAD_FORMAT_VERSION)}|${dataViewId}${isDraft ? DRAFT_LOAD_SUFFIX : ''}`;
}

export function forgetLoad(storeConnectorId: string, loadKey: string): void {
    const tablePath = loadTablePaths.value[loadKey];
    if (tablePath != null) addUnwantedTablePaths(storeConnectorId, [tablePath]);
    removeLoadKeys([loadKey]);
}

export function addUnwantedTablePaths(storeConnectorId: string, tablePaths: string[]): void {
    const storeTablePaths = unwantedTablePaths.value[storeConnectorId] ?? [];
    unwantedTablePaths.value = { ...unwantedTablePaths.value, [storeConnectorId]: [...new Set([...storeTablePaths, ...tablePaths])] };
}

// A table that cannot be dropped stays on the list for the next time, because it only takes up space.
export function removeUnwantedTablePath(storeConnectorId: string, tablePath: string): void {
    const storeTablePaths = unwantedTablePaths.value[storeConnectorId] ?? [];
    unwantedTablePaths.value = { ...unwantedTablePaths.value, [storeConnectorId]: storeTablePaths.filter((candidate) => candidate !== tablePath) };
}

// For a store whose database has been deleted. Its tables went with it, so none is left to drop.
export function forgetStoreLoads(storeConnectorId: string): void {
    const loadKeys = [...Object.keys(loadedColumnsVersions.value), ...Object.keys(loadInvalidValueCounts.value), ...Object.keys(loadTablePaths.value)];
    removeLoadKeys(loadKeys.filter((loadKey) => loadKey.startsWith(`${storeConnectorId}|`)));
    const { [storeConnectorId]: _storeTablePaths, ...otherUnwantedTablePaths } = unwantedTablePaths.value;
    unwantedTablePaths.value = otherUnwantedTablePaths;
}

// For after local storage has been cleared. This tab still holds the records in memory, so every loaded table is marked
// to be dropped when its store is next opened, rather than being left taking up space with nothing pointing at it. Each
// record is written again, because the clear removed them from storage without this tab's copies hearing of it.
export function forgetAllLoads(): void {
    const tablePathsByStore: Partial<Record<string, string[]>> = { ...unwantedTablePaths.value };
    for (const [loadKey, tablePath] of Object.entries(loadTablePaths.value)) {
        const storeConnectorId = loadKey.split('|', 1)[0] ?? '';
        if (tablePath != null) tablePathsByStore[storeConnectorId] = [...new Set([...(tablePathsByStore[storeConnectorId] ?? []), tablePath])];
    }
    unwantedTablePaths.value = tablePathsByStore;
    loadedColumnsVersions.value = {};
    loadInvalidValueCounts.value = {};
    loadTablePaths.value = {};
}

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

function removeLoadKeys(loadKeys: string[]): void {
    const isRemoved = (loadKey: string): boolean => loadKeys.includes(loadKey);
    loadedColumnsVersions.value = Object.fromEntries(Object.entries(loadedColumnsVersions.value).filter(([loadKey]) => !isRemoved(loadKey)));
    loadInvalidValueCounts.value = Object.fromEntries(Object.entries(loadInvalidValueCounts.value).filter(([loadKey]) => !isRemoved(loadKey)));
    loadTablePaths.value = Object.fromEntries(Object.entries(loadTablePaths.value).filter(([loadKey]) => !isRemoved(loadKey)));
}
