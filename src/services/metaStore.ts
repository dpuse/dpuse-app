// The meta store holds the user's own work, one node per kind of record (only data views so far). TanStack Query's
// cache holds the app's only copy: these functions fetch and store, and the keys place each result in the cache.
//
// Each account has its own store in the browser, and use without an account has one more, shared by everyone who uses
// this browser signed out. Separate stores keep one account's work out of another's lists. They do not secure it: the
// browser lets the app read every store it has created.

// ── External Dependencies & Registrations
import { until } from '@vueuse/core';
import { computed, watch } from 'vue';

// ── DPUse Framework
import { AppError } from '@dpuse/dpuse-shared';
import type {
    ConnectionConfig,
    CreateObjectOptions,
    EngineCallbackData,
    FindObjectOptions,
    FindObjectResult,
    GetRecordOptions,
    GetRecordResult,
    RemoveRecordsOptions,
    RetrieveRecordsOptions,
    UpsertRecordsOptions
} from '@dpuse/dpuse-shared';

// ── Local Framework
import { establishEngineWorker } from '@/services/engine';
import { hasReportedAppError } from '@/observability/errorTracking';
import { metaStoreConnectionConfig } from '@/state/configs';
import { queryClient } from '@/services/queryClient';
import { accountId, sessionIsAuthenticated } from '@/state/session';
import { assertDefined, shareLoad } from '@/utilities/index.ts';

// ── Types ────────────────────────────────────────────────────────────────────────────────────────────────────────────

export type MetaStoreNodeId = 'dataViews';

type MetaStoreListKey = readonly ['metaStore', MetaStoreNodeId, 'list'];
type MetaStoreRecordKey = readonly ['metaStore', MetaStoreNodeId, 'record', string | undefined];

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

const GUEST_META_STORE_ID = 'dpuMetaStore'; // The name the only store had before each account got its own, so work saved then is kept as guest work.
const META_STORE_NODE_IDS: MetaStoreNodeId[] = ['dataViews'];
const META_STORE_QUERY_KEY = ['metaStore'] as const;

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

const nodeCreationsByNodePath = new Map<string, () => Promise<void>>(); // Shared, so callers that arrive together on a new store create a node once.

// ── Derived State ────────────────────────────────────────────────────────────────────────────────────────────────────

// The store for whoever is using the app. Undefined while the session is being checked, because until then a signed-in
// user would be taken for a guest and read or write the guest store.
export const metaStoreId = computed(() => {
    if (sessionIsAuthenticated.value == null) return;
    return accountId.value == null ? GUEST_META_STORE_ID : `${GUEST_META_STORE_ID}-${accountId.value}`;
});

// ── Side Effects ─────────────────────────────────────────────────────────────────────────────────────────────────────

// Without its connection the meta store cannot be read, so everything read from it is dropped and its nodes are
// checked again on the next connection. Registered once at import and app-lifetime, as with the watcher in
// '@/state/session'.
// eslint-disable-next-line unicorn/no-top-level-side-effects -- see comment above
watch(
    () => metaStoreConnectionConfig.value == null,
    (newMetaStoreIsGone) => {
        if (!newMetaStoreIsGone) return;
        nodeCreationsByNodePath.clear();
        void queryClient.resetQueries({ queryKey: META_STORE_QUERY_KEY });
    }
);

// Signing in or out moves to another store, so everything read from the last one is dropped and read again from the new
// one. The first store chosen after the session check needs nothing dropped, because nothing could be read before it.
// eslint-disable-next-line unicorn/no-top-level-side-effects -- see comment above
watch(metaStoreId, (_newMetaStoreId, oldMetaStoreId) => {
    if (oldMetaStoreId == null) return;
    void queryClient.resetQueries({ queryKey: META_STORE_QUERY_KEY });
});

// ── Actions ──────────────────────────────────────────────────────────────────────────────────────────────────────────

// ── Query Keys ─ A list and its records sit on separate branches under their node, so refreshing a list leaves open
// records alone.
export function constructMetaStoreListKey(nodeId: MetaStoreNodeId): MetaStoreListKey {
    return [...META_STORE_QUERY_KEY, nodeId, 'list'];
}

export function constructMetaStoreRecordKey(nodeId: MetaStoreNodeId, id: string | undefined): MetaStoreRecordKey {
    return [...META_STORE_QUERY_KEY, nodeId, 'record', id];
}

// ── Records

// Stops waiting when 'signal' aborts, and asks the engine to abort the read too.
export async function retrieveMetaStoreRecords<T>(nodeId: MetaStoreNodeId, signal?: AbortSignal): Promise<T[]> {
    return stopWaitingOnAbort(retrieveCurrentStoreRecords<T>(nodeId), signal);
}

export async function getMetaStoreRecord<T>(nodeId: MetaStoreNodeId, id: string): Promise<T> {
    const { connectionConfig, nodePath } = await establishMetaStoreNode(await establishCurrentMetaStoreId(), nodeId);
    const { processRequest } = await establishEngineWorker();
    const getRecordOptions: GetRecordOptions = { path: nodePath, id };
    const getRecordResult = (await processRequest('getRecord', connectionConfig, getRecordOptions)) as GetRecordResult;
    return assertDefined(getRecordResult.record as T | undefined, `No record '${id}' in '${nodeId}'.`);
}

// The changes return the store they were made in. Signing in or out while one is under way moves to another store, and
// the caller then keeps the change out of the new store's cached lists.
export async function upsertMetaStoreRecord(nodeId: MetaStoreNodeId, record: object): Promise<string> {
    const storeId = await establishCurrentMetaStoreId();
    await upsertStoreRecords(storeId, nodeId, [record]);
    return storeId;
}

export async function removeMetaStoreRecord(nodeId: MetaStoreNodeId, id: string): Promise<string> {
    const storeId = await establishCurrentMetaStoreId();
    await removeStoreRecords(storeId, nodeId, [id]);
    return storeId;
}

// ── Guest Work ─ Work saved while signed out stays in the guest store. Once signed in, the user can move it into their
// account, which also takes it out of reach of the next person to use this browser signed out.
export async function countGuestMetaStoreRecords(): Promise<number> {
    let count = 0;
    for (const nodeId of META_STORE_NODE_IDS) {
        const records = await retrieveStoreRecords(GUEST_META_STORE_ID, nodeId);
        count += records.length;
    }
    return count;
}

// Copied before it is removed, so a failure part way leaves the work in at least one store.
export async function moveGuestMetaStoreRecords(): Promise<void> {
    const accountMetaStoreId = await establishCurrentMetaStoreId();
    if (accountMetaStoreId === GUEST_META_STORE_ID) return; // Signed out again before the move started.

    for (const nodeId of META_STORE_NODE_IDS) {
        const records = await retrieveStoreRecords<{ id: string }>(GUEST_META_STORE_ID, nodeId);
        if (records.length === 0) continue;
        await upsertStoreRecords(accountMetaStoreId, nodeId, records);
        await removeStoreRecords(
            GUEST_META_STORE_ID,
            nodeId,
            records.map((record) => record.id)
        );
    }
    await queryClient.invalidateQueries({ queryKey: META_STORE_QUERY_KEY });
}

// ── Account Work ─ Removes the signed-in account's work from this browser, for a user leaving a shared computer. Each
// node is emptied rather than the store deleted, because the meta store connector can only drop nodes.
export async function removeAccountMetaStoreRecords(): Promise<void> {
    const accountMetaStoreId = await establishCurrentMetaStoreId();
    if (accountMetaStoreId === GUEST_META_STORE_ID) return;

    for (const nodeId of META_STORE_NODE_IDS) await removeStoreRecords(accountMetaStoreId, nodeId, []); // No keys removes every record.
}

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

function constructNodePath(storeId: string, nodeId: MetaStoreNodeId): string {
    return `/${storeId}/${nodeId}`;
}

// Waits for the session check, so a signed-in user's first read goes to their own store.
async function establishCurrentMetaStoreId(): Promise<string> {
    await until(metaStoreId).not.toBeUndefined();
    return assertDefined(metaStoreId.value, 'No meta store identifier.');
}

// Creates the node the first time it is used, so a new store needs no setup step.
async function establishMetaStoreNode(storeId: string, nodeId: MetaStoreNodeId): Promise<{ connectionConfig: ConnectionConfig; nodePath: string }> {
    const connectionConfig = assertDefined(metaStoreConnectionConfig.value, 'No meta store connection configuration.');
    const nodePath = constructNodePath(storeId, nodeId);
    const createNode = nodeCreationsByNodePath.get(nodePath) ?? shareLoad(() => createMetaStoreNode(storeId, nodeId, connectionConfig));
    nodeCreationsByNodePath.set(nodePath, createNode);
    await createNode();
    return { connectionConfig, nodePath };
}

async function createMetaStoreNode(storeId: string, nodeId: MetaStoreNodeId, connectionConfig: ConnectionConfig): Promise<void> {
    const { processRequest } = await establishEngineWorker();
    const findObjectOptions: FindObjectOptions = { storeId, nodeId };
    const findObjectResult = (await processRequest('findObject', connectionConfig, findObjectOptions)) as FindObjectResult;
    if (findObjectResult.path != null) return;
    const createObjectOptions: CreateObjectOptions = { path: constructNodePath(storeId, nodeId), structure: 'id' };
    await processRequest('createObject', connectionConfig, createObjectOptions);
}

async function retrieveCurrentStoreRecords<T>(nodeId: MetaStoreNodeId): Promise<T[]> {
    return retrieveStoreRecords<T>(await establishCurrentMetaStoreId(), nodeId);
}

// Rejects with the abort reason as soon as 'signal' aborts, and asks the engine to abort the meta store connector's
// operation. The Dexie connector does not act on that yet, so the operation may still finish, and its result is then
// ignored. Without a signal, the operation is simply awaited.
async function stopWaitingOnAbort<T>(operation: Promise<T>, signal: AbortSignal | undefined): Promise<T> {
    if (!signal) return operation;
    signal.throwIfAborted();

    const aborted = new Promise<never>((_resolve, reject) => {
        signal.addEventListener(
            'abort',
            () => {
                void requestEngineAbort();
                reject(signal.reason as Error);
            },
            { once: true }
        );
    });
    return Promise.race([operation, aborted]);
}

// Logged and reported, but not shown: the caller has already stopped waiting, so a failed abort changes nothing the
// user can see.
async function requestEngineAbort(): Promise<void> {
    const connectionConfig = metaStoreConnectionConfig.value;
    if (connectionConfig == null) return;

    try {
        const { processRequest } = await establishEngineWorker();
        await processRequest('abort', connectionConfig, {});
    } catch (error) {
        void hasReportedAppError(new AppError('Failed to abort a meta store operation.', 'dpuse-app.metaStore.requestEngineAbort', { typeId: 'handled' }, { cause: error }));
    }
}

// The engine sends the records in chunks; they are gathered here and returned as one list.
async function retrieveStoreRecords<T>(storeId: string, nodeId: MetaStoreNodeId): Promise<T[]> {
    const { connectionConfig, nodePath } = await establishMetaStoreNode(storeId, nodeId);
    const { processRequest } = await establishEngineWorker();
    const records: T[] = [];
    const retrieveRecordsOptions: RetrieveRecordsOptions = {
        dataFormatId: 'unknown',
        encodingId: '',
        parserId: undefined,
        path: nodePath,
        valueDelimiterId: '',
        chunkSize: undefined
    }; // TODO: Implement paging. A store holds records rather than a file, so no format or parser applies.
    await processRequest('retrieveRecords', connectionConfig, retrieveRecordsOptions, (data: EngineCallbackData) => {
        if (data.typeId === 'chunk') records.push(...(data.properties.records as T[]));
    });
    return records;
}

async function upsertStoreRecords(storeId: string, nodeId: MetaStoreNodeId, records: object[]): Promise<void> {
    const { connectionConfig, nodePath } = await establishMetaStoreNode(storeId, nodeId);
    const { processRequest } = await establishEngineWorker();
    const upsertRecordsOptions: UpsertRecordsOptions = { path: nodePath, records: records as Record<string, unknown>[] };
    await processRequest('upsertRecords', connectionConfig, upsertRecordsOptions);
}

async function removeStoreRecords(storeId: string, nodeId: MetaStoreNodeId, keys: string[]): Promise<void> {
    const { connectionConfig, nodePath } = await establishMetaStoreNode(storeId, nodeId);
    const { processRequest } = await establishEngineWorker();
    const removeRecordsOptions: RemoveRecordsOptions = { path: nodePath, keys };
    await processRequest('removeRecords', connectionConfig, removeRecordsOptions);
}
