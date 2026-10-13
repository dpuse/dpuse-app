// The meta store holds the user's own work, one node per kind of record (only data views so far). TanStack Query's
// cache holds the app's only copy: these functions fetch and store, and the keys place each result in the cache.

// ── External Dependencies & Registrations
import { watch } from 'vue';

// ── DPUse Framework
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
import { metaStoreConnectionConfig } from '@/state/configs';
import { queryClient } from '@/services/queryClient';
import { assertDefined, shareLoad } from '@/utilities/index.ts';

// ── Types ────────────────────────────────────────────────────────────────────────────────────────────────────────────

export type MetaStoreNodeId = 'dataViews';

type MetaStoreListKey = readonly ['metaStore', MetaStoreNodeId, 'list'];
type MetaStoreRecordKey = readonly ['metaStore', MetaStoreNodeId, 'record', string | undefined];

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

const META_STORE_ID = 'dpuMetaStore';
const META_STORE_QUERY_KEY = ['metaStore'] as const;

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

const nodeCreationsByNodeId = new Map<MetaStoreNodeId, () => Promise<void>>(); // Shared, so callers that arrive together on a new store create a node once.

// ── Side Effects ─────────────────────────────────────────────────────────────────────────────────────────────────────

// Without its connection the meta store cannot be read, so everything read from it is dropped and its nodes are
// checked again on the next connection. Registered once at import and app-lifetime, as with the watcher in
// '@/state/session'.
// eslint-disable-next-line unicorn/no-top-level-side-effects -- see comment above
watch(
    () => metaStoreConnectionConfig.value == null,
    (newMetaStoreIsGone) => {
        if (!newMetaStoreIsGone) return;
        nodeCreationsByNodeId.clear();
        void queryClient.resetQueries({ queryKey: META_STORE_QUERY_KEY });
    }
);

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

// The engine sends the records in chunks; they are gathered here and returned as one list.
export async function retrieveMetaStoreRecords<T>(nodeId: MetaStoreNodeId): Promise<T[]> {
    const connectionConfig = await establishMetaStoreNode(nodeId);
    const { processRequest } = await establishEngineWorker();
    const records: T[] = [];
    const retrieveRecordsOptions: RetrieveRecordsOptions = { encodingId: '', path: constructNodePath(nodeId), valueDelimiterId: '', chunkSize: undefined }; // TODO: Implement paging.
    await processRequest('retrieveRecords', connectionConfig, retrieveRecordsOptions, (data: EngineCallbackData) => {
        if (data.typeId === 'chunk') records.push(...(data.properties.records as T[]));
    });
    return records;
}

export async function getMetaStoreRecord<T>(nodeId: MetaStoreNodeId, id: string): Promise<T> {
    const connectionConfig = await establishMetaStoreNode(nodeId);
    const { processRequest } = await establishEngineWorker();
    const getRecordOptions: GetRecordOptions = { path: constructNodePath(nodeId), id };
    const getRecordResult = (await processRequest('getRecord', connectionConfig, getRecordOptions)) as GetRecordResult;
    return assertDefined(getRecordResult.record as T | undefined, `No record '${id}' in '${nodeId}'.`);
}

export async function upsertMetaStoreRecord(nodeId: MetaStoreNodeId, record: object): Promise<void> {
    const connectionConfig = await establishMetaStoreNode(nodeId);
    const { processRequest } = await establishEngineWorker();
    const upsertRecordsOptions: UpsertRecordsOptions = { path: constructNodePath(nodeId), records: [record as Record<string, unknown>] };
    await processRequest('upsertRecords', connectionConfig, upsertRecordsOptions);
}

export async function removeMetaStoreRecord(nodeId: MetaStoreNodeId, id: string): Promise<void> {
    const connectionConfig = await establishMetaStoreNode(nodeId);
    const { processRequest } = await establishEngineWorker();
    const removeRecordsOptions: RemoveRecordsOptions = { path: constructNodePath(nodeId), keys: [id] };
    await processRequest('removeRecords', connectionConfig, removeRecordsOptions);
}

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

function constructNodePath(nodeId: MetaStoreNodeId): string {
    return `/${META_STORE_ID}/${nodeId}`;
}

// Creates the node the first time it is used, so a new store needs no setup step.
async function establishMetaStoreNode(nodeId: MetaStoreNodeId): Promise<ConnectionConfig> {
    const connectionConfig = assertDefined(metaStoreConnectionConfig.value, 'No meta store connection configuration.');
    const createNode = nodeCreationsByNodeId.get(nodeId) ?? shareLoad(() => createMetaStoreNode(nodeId, connectionConfig));
    nodeCreationsByNodeId.set(nodeId, createNode);
    await createNode();
    return connectionConfig;
}

async function createMetaStoreNode(nodeId: MetaStoreNodeId, connectionConfig: ConnectionConfig): Promise<void> {
    const { processRequest } = await establishEngineWorker();
    const findObjectOptions: FindObjectOptions = { storeId: META_STORE_ID, nodeId };
    const findObjectResult = (await processRequest('findObject', connectionConfig, findObjectOptions)) as FindObjectResult;
    if (findObjectResult.path != null) return;
    const createObjectOptions: CreateObjectOptions = { path: constructNodePath(nodeId), structure: 'id' };
    await processRequest('createObject', connectionConfig, createObjectOptions);
}
