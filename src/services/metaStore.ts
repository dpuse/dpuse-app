// The records the app keeps about the user's own work — data views now; event queries, dimensions and contexts to follow
// — each in its own node of the meta store. Read and written only through TanStack Query, whose cache is the one copy
// the app holds: the functions here fetch and store, the keys say where each result lives in the cache.

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
import { activeMetaStoreConnectionConfig } from '@/state/session';
import { assertDefined } from '@/utilities/index.ts';
import { queryClient } from '@/services/queryClient';
import { useEngine } from '@/services/useEngine';

// ── Types ────────────────────────────────────────────────────────────────────────────────────────────────────────────

export type MetaStoreNodeId = 'dataViews';

type MetaStoreListKey = readonly ['metaStore', MetaStoreNodeId, 'list'];
type MetaStoreRecordKey = readonly ['metaStore', MetaStoreNodeId, 'record', string | undefined];

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

const META_STORE_ID = 'dpuMetaStore';
const META_STORE_QUERY_KEY = ['metaStore'] as const;

// ── Side Effects ─────────────────────────────────────────────────────────────────────────────────────────────────────

// Without its connection the meta store cannot be read, so everything read from it is dropped, as the configurations it
// came with were. Registered once at import and app-lifetime, as with the watchers in '@/state/session'.
// eslint-disable-next-line unicorn/no-top-level-side-effects -- see comment above
watch(
    () => activeMetaStoreConnectionConfig.value == null,
    (newMetaStoreIsGone) => {
        if (newMetaStoreIsGone) void queryClient.resetQueries({ queryKey: META_STORE_QUERY_KEY });
    }
);

// ── Actions - Query Keys ─────────────────────────────────────────────────────────────────────────────────────────────

// A list and its records sit on separate branches under their node, so refreshing a list leaves open records alone.
export function constructMetaStoreListKey(nodeId: MetaStoreNodeId): MetaStoreListKey {
    return ['metaStore', nodeId, 'list'];
}

export function constructMetaStoreRecordKey(nodeId: MetaStoreNodeId, id: string | undefined): MetaStoreRecordKey {
    return ['metaStore', nodeId, 'record', id];
}

// ── Actions - Records ────────────────────────────────────────────────────────────────────────────────────────────────

// The engine sends the records in chunks; they are gathered here and returned as one list.
export async function retrieveMetaStoreRecords<T>(nodeId: MetaStoreNodeId): Promise<T[]> {
    const connectionConfig = await establishMetaStoreNode(nodeId);
    const { processRequest } = await useEngine();
    const records: T[] = [];
    const retrieveRecordsOptions: RetrieveRecordsOptions = { encodingId: '', path: constructNodePath(nodeId), valueDelimiterId: '', chunkSize: undefined }; // TODO: Implement paging.
    await processRequest('retrieveRecords', connectionConfig, retrieveRecordsOptions, (data: EngineCallbackData) => {
        if (data.typeId === 'chunk') records.push(...(data.properties.records as T[]));
    });
    return records;
}

export async function getMetaStoreRecord<T>(nodeId: MetaStoreNodeId, id: string): Promise<T> {
    const connectionConfig = await establishMetaStoreNode(nodeId);
    const { processRequest } = await useEngine();
    const getRecordOptions: GetRecordOptions = { path: constructNodePath(nodeId), id };
    const getRecordResult = (await processRequest('getRecord', connectionConfig, getRecordOptions)) as GetRecordResult;
    return assertDefined(getRecordResult.record as T | undefined, `No record '${id}' in '${nodeId}'.`);
}

export async function upsertMetaStoreRecord(nodeId: MetaStoreNodeId, record: object): Promise<void> {
    const connectionConfig = await establishMetaStoreNode(nodeId);
    const { processRequest } = await useEngine();
    const upsertRecordsOptions: UpsertRecordsOptions = { path: constructNodePath(nodeId), records: [record as Record<string, unknown>] };
    await processRequest('upsertRecords', connectionConfig, upsertRecordsOptions);
}

export async function removeMetaStoreRecord(nodeId: MetaStoreNodeId, id: string): Promise<void> {
    const connectionConfig = await establishMetaStoreNode(nodeId);
    const { processRequest } = await useEngine();
    const removeRecordsOptions: RemoveRecordsOptions = { path: constructNodePath(nodeId), keys: [id] };
    await processRequest('removeRecords', connectionConfig, removeRecordsOptions);
}

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

function constructNodePath(nodeId: MetaStoreNodeId): string {
    return `/${META_STORE_ID}/${nodeId}`;
}

// Creates the node the first time it is used, so a new store needs no setup step.
async function establishMetaStoreNode(nodeId: MetaStoreNodeId): Promise<ConnectionConfig> {
    const connectionConfig = assertDefined(activeMetaStoreConnectionConfig.value, 'No meta store connection configuration.');
    const { processRequest } = await useEngine();
    const findObjectOptions: FindObjectOptions = { storeId: META_STORE_ID, nodeId };
    const findObjectResult = (await processRequest('findObject', connectionConfig, findObjectOptions)) as FindObjectResult;
    if (findObjectResult.path == null) {
        const createObjectOptions: CreateObjectOptions = { path: constructNodePath(nodeId), structure: 'id' };
        await processRequest('createObject', connectionConfig, createObjectOptions);
    }
    return connectionConfig;
}
