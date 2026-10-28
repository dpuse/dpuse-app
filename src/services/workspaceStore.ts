// The workspace store holds the user's own work, one table for each kind of config (only data views so far). TanStack
// Query's cache holds the app's only copy: these functions read and write the store, and the keys place each result in
// the cache.
//
// Each account has its own store in the browser, and use without an account has one more, shared by everyone who uses
// this browser signed out. Separate stores keep one account's work out of another's lists. They do not secure it: the
// browser lets the app read every store it has created.
//
// Each store is a TinyBase 'MergeableStore' saved to its own IndexedDB database. TinyBase saves a store whole, and
// loading replaces what is in memory. So every operation loads the store first and saves its change at once, one
// operation at a time, and work another tab has saved is read rather than overwritten. Two tabs saving at the same
// moment can still lose one of the changes.

// ── External Dependencies & Registrations
import { until } from '@vueuse/core';
import { computed, watch } from 'vue';
import { createIndexedDbPersister, type IndexedDbPersister } from 'tinybase/persisters/persister-indexed-db';
import { createMergeableStore, type MergeableStore } from 'tinybase';

// ── Local Framework
import { queryClient } from '@/services/queryClient';
import { accountId, sessionIsAuthenticated } from '@/state/session';
import { assertDefined, shareLoad } from '@/utilities/index.ts';

// ── Types ────────────────────────────────────────────────────────────────────────────────────────────────────────────

export type WorkspaceStoreTableId = 'dataViews';

type WorkspaceStoreListKey = readonly ['workspaceStore', WorkspaceStoreTableId, 'list'];
type WorkspaceStoreRecordKey = readonly ['workspaceStore', WorkspaceStoreTableId, 'record', string | undefined];

interface WorkspaceStore {
    persistenceErrors: unknown[]; // TinyBase passes load and save failures to a callback rather than rejecting, so they are gathered here and thrown.
    persister: IndexedDbPersister;
    store: MergeableStore;
}

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

const CONFIG_CELL_ID = 'config'; // Each config is one cell holding the whole object, so the later save of a config wins.
const GUEST_META_STORE_ID = 'dpuMetaStore'; // The Dexie database guest work was saved in before the workspace store. Each account's was this name, a hyphen and the account id.
const GUEST_WORKSPACE_STORE_ID = 'dpuseWorkspaceStore';
const META_STORE_IS_MOVED_VALUE_ID = 'metaStoreIsMoved';
const WORKSPACE_STORE_QUERY_KEY = ['workspaceStore'] as const;
const WORKSPACE_STORE_TABLE_IDS: WorkspaceStoreTableId[] = ['dataViews'];

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

const operationQueuesByStoreId = new Map<string, Promise<unknown>>(); // Each store's last operation, which the next one waits for.
const workspaceStoreOpeningsByStoreId = new Map<string, () => Promise<WorkspaceStore>>(); // Shared, so callers that arrive together on a store open it once.

// ── Derived State ────────────────────────────────────────────────────────────────────────────────────────────────────

// The store for whoever is using the app. Undefined while the session is being checked, because until then a signed-in
// user would be taken for a guest and read or write the guest store.
export const workspaceStoreId = computed(() => {
    if (sessionIsAuthenticated.value == null) return;
    return accountId.value == null ? GUEST_WORKSPACE_STORE_ID : `${GUEST_WORKSPACE_STORE_ID}-${accountId.value}`;
});

// ── Side Effects ─────────────────────────────────────────────────────────────────────────────────────────────────────

// Signing in or out moves to another store, so everything read from the last one is dropped and read again from the new
// one. The first store chosen after the session check needs nothing dropped, because nothing could be read before it.
// Registered once at import and app-lifetime, as with the watcher in '@/state/session'.
watch(workspaceStoreId, (_newWorkspaceStoreId, oldWorkspaceStoreId) => {
    if (oldWorkspaceStoreId == null) return;
    workspaceStoreOpeningsByStoreId.delete(oldWorkspaceStoreId); // The last account's work is not kept in memory. An operation still under way keeps its own copy.
    void queryClient.resetQueries({ queryKey: WORKSPACE_STORE_QUERY_KEY });
});

// ── Actions ──────────────────────────────────────────────────────────────────────────────────────────────────────────

// ── Query Keys ─ A list and its records sit on separate branches under their table, so refreshing a list leaves open
// records alone.
export function constructWorkspaceStoreListKey(tableId: WorkspaceStoreTableId): WorkspaceStoreListKey {
    return [...WORKSPACE_STORE_QUERY_KEY, tableId, 'list'];
}

export function constructWorkspaceStoreRecordKey(tableId: WorkspaceStoreTableId, id: string | undefined): WorkspaceStoreRecordKey {
    return [...WORKSPACE_STORE_QUERY_KEY, tableId, 'record', id];
}

// ── Records

// Stops waiting when 'signal' aborts.
export async function retrieveWorkspaceStoreRecords<T>(tableId: WorkspaceStoreTableId, signal?: AbortSignal): Promise<T[]> {
    return stopWaitingOnAbort(retrieveCurrentStoreRecords<T>(tableId), signal);
}

export async function getWorkspaceStoreRecord<T>(tableId: WorkspaceStoreTableId, id: string): Promise<T> {
    const storeId = await establishCurrentWorkspaceStoreId();
    const record = await readStore(storeId, (store) => store.getCell(tableId, id, CONFIG_CELL_ID));
    return assertDefined(record as T | undefined, `No record '${id}' in '${tableId}'.`);
}

// The changes return the store they were made in. Signing in or out while one is under way moves to another store, and
// the caller then keeps the change out of the new store's cached lists.
export async function upsertWorkspaceStoreRecord(tableId: WorkspaceStoreTableId, record: { [key: string]: unknown; id: string }): Promise<string> {
    const storeId = await establishCurrentWorkspaceStoreId();
    await changeStore(storeId, (store) => {
        setStoreRecords(store, tableId, [record]);
    });
    return storeId;
}

export async function removeWorkspaceStoreRecord(tableId: WorkspaceStoreTableId, id: string): Promise<string> {
    const storeId = await establishCurrentWorkspaceStoreId();
    await changeStore(storeId, (store) => {
        store.delRow(tableId, id);
    });
    return storeId;
}

// ── Guest Work ─ Work saved while signed out stays in the guest store. Once signed in, the user can move it into their
// account, which also takes it out of reach of the next person to use this browser signed out.
export async function countGuestWorkspaceStoreRecords(): Promise<number> {
    return readStore(GUEST_WORKSPACE_STORE_ID, (store) => WORKSPACE_STORE_TABLE_IDS.reduce((count, tableId) => count + store.getRowCount(tableId), 0));
}

// Copied before it is removed, so a failure part way leaves the work in at least one store.
export async function moveGuestWorkspaceStoreRecords(): Promise<void> {
    const accountWorkspaceStoreId = await establishCurrentWorkspaceStoreId();
    if (accountWorkspaceStoreId === GUEST_WORKSPACE_STORE_ID) return; // Signed out again before the move started.

    for (const tableId of WORKSPACE_STORE_TABLE_IDS) {
        const records = await retrieveStoreRecords<{ id: string }>(GUEST_WORKSPACE_STORE_ID, tableId);
        if (records.length === 0) continue;
        await changeStore(accountWorkspaceStoreId, (store) => {
            setStoreRecords(store, tableId, records);
        });
        await changeStore(GUEST_WORKSPACE_STORE_ID, (store) => {
            for (const record of records) store.delRow(tableId, record.id);
        });
    }
    await queryClient.invalidateQueries({ queryKey: WORKSPACE_STORE_QUERY_KEY });
}

// ── Account Work ─ Removes the signed-in account's work from this browser, for a user leaving a shared computer. The
// tables are emptied rather than the database deleted, so the note that the meta store was moved stays and a later
// sign-in does not copy the old work back. The account's meta store database is left in place, so work saved before
// the workspace store stays in this browser until that database is deleted.
export async function removeAccountWorkspaceStoreRecords(): Promise<void> {
    const accountWorkspaceStoreId = await establishCurrentWorkspaceStoreId();
    if (accountWorkspaceStoreId === GUEST_WORKSPACE_STORE_ID) return;

    await changeStore(accountWorkspaceStoreId, (store) => {
        store.delTables();
    });
}

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

// Waits for the session check, so a signed-in user's first read goes to their own store.
async function establishCurrentWorkspaceStoreId(): Promise<string> {
    await until(workspaceStoreId).not.toBeUndefined();
    return assertDefined(workspaceStoreId.value, 'No workspace store identifier.');
}

async function retrieveCurrentStoreRecords<T>(tableId: WorkspaceStoreTableId): Promise<T[]> {
    return retrieveStoreRecords<T>(await establishCurrentWorkspaceStoreId(), tableId);
}

async function retrieveStoreRecords<T>(storeId: string, tableId: WorkspaceStoreTableId): Promise<T[]> {
    return readStore(storeId, (store) => store.getRowIds(tableId).map((rowId) => store.getCell(tableId, rowId, CONFIG_CELL_ID) as T));
}

function setStoreRecords(store: MergeableStore, tableId: WorkspaceStoreTableId, records: { id: string }[]): void {
    store.transaction(() => {
        for (const record of records) store.setCell(tableId, record.id, CONFIG_CELL_ID, record);
    });
}

// Rejects with the abort reason as soon as 'signal' aborts. A TinyBase read cannot be stopped, so it may still finish,
// and its result is then ignored. Without a signal, the operation is simply awaited.
async function stopWaitingOnAbort<T>(operation: Promise<T>, signal: AbortSignal | undefined): Promise<T> {
    if (!signal) return operation;
    signal.throwIfAborted();

    const aborted = new Promise<never>((_resolve, reject) => {
        signal.addEventListener(
            'abort',
            () => {
                reject(signal.reason as Error);
            },
            { once: true }
        );
    });
    return Promise.race([operation, aborted]);
}

// ── Operations ─ Each store runs one operation at a time, so one operation's load cannot replace another's change
// before it is saved.
async function readStore<T>(storeId: string, read: (store: MergeableStore) => T): Promise<T> {
    return queueStoreOperation(storeId, async (workspaceStore) => {
        await loadWorkspaceStore(workspaceStore);
        return read(workspaceStore.store);
    });
}

async function changeStore(storeId: string, change: (store: MergeableStore) => void): Promise<void> {
    await queueStoreOperation(storeId, async (workspaceStore) => {
        await loadWorkspaceStore(workspaceStore);
        change(workspaceStore.store);
        await saveWorkspaceStore(workspaceStore);
    });
}

async function queueStoreOperation<T>(storeId: string, operation: (workspaceStore: WorkspaceStore) => Promise<T>): Promise<T> {
    const previousOperation = operationQueuesByStoreId.get(storeId);
    const queuedOperation = (async (): Promise<T> => {
        await previousOperation;
        return operation(await establishWorkspaceStore(storeId));
    })();
    operationQueuesByStoreId.set(storeId, ignoreFailure(queuedOperation)); // A failed operation is the caller's to handle, and does not stop the next one.
    return queuedOperation;
}

async function ignoreFailure(operation: Promise<unknown>): Promise<void> {
    try {
        await operation;
    } catch {
        // The caller of the operation handles its failure.
    }
}

// ── Opening ─ A store is opened the first time it is used, so a new store needs no setup step.
async function establishWorkspaceStore(storeId: string): Promise<WorkspaceStore> {
    const openWorkspaceStore = workspaceStoreOpeningsByStoreId.get(storeId) ?? shareLoad(() => constructWorkspaceStore(storeId));
    workspaceStoreOpeningsByStoreId.set(storeId, openWorkspaceStore);
    return openWorkspaceStore();
}

async function constructWorkspaceStore(storeId: string): Promise<WorkspaceStore> {
    const store = createMergeableStore();
    const persistenceErrors: unknown[] = [];
    const persister = createIndexedDbPersister(store, storeId, undefined, (error: unknown) => {
        persistenceErrors.push(error);
    });
    const workspaceStore = { persistenceErrors, persister, store };
    await loadWorkspaceStore(workspaceStore);
    await moveMetaStoreRecords(workspaceStore, `${GUEST_META_STORE_ID}${storeId.slice(GUEST_WORKSPACE_STORE_ID.length)}`);
    return workspaceStore;
}

// A store that has never been saved has no TinyBase tables in its database, which IndexedDB reports as 'NotFoundError'.
// It is read as empty.
async function loadWorkspaceStore({ persistenceErrors, persister, store }: WorkspaceStore): Promise<void> {
    persistenceErrors.length = 0;
    await persister.load();
    const [persistenceError] = persistenceErrors;
    if (persistenceError == null) return;
    if (!(persistenceError instanceof DOMException && persistenceError.name === 'NotFoundError'))
        throw new Error('Failed to load the workspace store.', { cause: persistenceError });
    store.delTables().delValues();
}

async function saveWorkspaceStore({ persistenceErrors, persister }: WorkspaceStore): Promise<void> {
    persistenceErrors.length = 0;
    await persister.save();
    const [persistenceError] = persistenceErrors;
    if (persistenceError != null) throw new Error('Failed to save the workspace store.', { cause: persistenceError });
}

// ── Meta Store Move ─ Work saved before the workspace store is in the account's meta store, a Dexie database. It is
// copied across once, and only into an empty store, so work removed later does not come back. The meta store database
// is left in place.
async function moveMetaStoreRecords(workspaceStore: WorkspaceStore, metaStoreId: string): Promise<void> {
    const { store } = workspaceStore;
    if (store.getValue(META_STORE_IS_MOVED_VALUE_ID) === true) return;

    if (!store.hasTables()) {
        for (const tableId of WORKSPACE_STORE_TABLE_IDS) setStoreRecords(store, tableId, await retrieveMetaStoreRecords(metaStoreId, tableId));
    }
    store.setValue(META_STORE_IS_MOVED_VALUE_ID, true);
    await saveWorkspaceStore(workspaceStore);
}

// Read through IndexedDB itself, because the app no longer loads Dexie. Only a database that exists is opened, because
// opening one by name creates it.
async function retrieveMetaStoreRecords(metaStoreId: string, tableId: WorkspaceStoreTableId): Promise<{ id: string }[]> {
    const databaseInfos = await indexedDB.databases();
    if (databaseInfos.every((databaseInfo) => databaseInfo.name !== metaStoreId)) return [];

    const database = await completeRequest(indexedDB.open(metaStoreId));
    try {
        return database.objectStoreNames.contains(tableId) ? ((await completeRequest(database.transaction(tableId).objectStore(tableId).getAll())) as { id: string }[]) : [];
    } finally {
        database.close();
    }
}

async function completeRequest<T>(request: IDBRequest<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
        request.addEventListener('success', () => {
            resolve(request.result);
        });
        request.addEventListener('error', () => {
            reject(request.error ?? new Error('IndexedDB request failed.'));
        });
    });
}
