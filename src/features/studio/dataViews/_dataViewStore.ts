// ── External Dependencies & Registrations
import { useLocalStorage } from '@vueuse/core';

// ── DPUse Framework
import type {
    ConnectionConfig,
    DataViewConfig,
    EngineLoadObjectRecordsOptions,
    LocalisedConfig,
    OpenStoreResult,
    QueryRecordsOptions,
    QueryRecordsResult,
    StoreStateId
} from '@dpuse/dpuse-shared';

// ── Local Framework
import { assertDefined } from '@/utilities/index.ts';
import { constructItemPath } from './dataViewSummary';
import { establishEngineWorker } from '@/services/engine';
import { findConnectionLocalisedConfig } from '@/state/configs';

// ── Types ────────────────────────────────────────────────────────────────────────────────────────────────────────────

export type DataViewRecordQuery = Pick<QueryRecordsOptions, 'aggregates' | 'filters' | 'groupColumnIndexes' | 'limit' | 'offset' | 'sorts'>;

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

// The store that investigate loads data views into. SQLite is the default, because it needs far less memory and a much
// smaller download than DuckDB. Set it to 'dpuse-connector-duckdb-wasm' for DuckDB until the app has a setting for it.
// export const INVESTIGATE_STORE_CONNECTOR_ID = 'dpuse-connector-sqlite-wasm';
export const INVESTIGATE_STORE_CONNECTOR_ID = 'dpuse-connector-duckdb-wasm';

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

// The audit each data view was loaded from, by store and data view, kept in this browser because the store is too. A
// data view whose audit has changed since is loaded again.
const loadedAuditTimes = useLocalStorage<Record<string, number>>('dpuse-investigate-loads', {});

// ── Actions ──────────────────────────────────────────────────────────────────────────────────────────────────────────

// Only one tab can open the store, so a tab that cannot have it is told so rather than kept waiting.
export async function openDataViewStore(): Promise<StoreStateId> {
    const { processRequest } = await establishEngineWorker();
    const { storeStateId } = (await processRequest('openStore', findStoreConnectionLocalisedConfig(), {})) as OpenStoreResult;
    return storeStateId;
}

// Closing releases the store for other tabs, and frees the memory the store's engine holds.
export async function closeDataViewStore(): Promise<void> {
    const { processRequest } = await establishEngineWorker();
    await processRequest('closeStore', findStoreConnectionLocalisedConfig(), {});
}

export function isDataViewLoaded(dataViewConfig: DataViewConfig): boolean {
    const auditTime = dataViewConfig.contentAuditConfig?.asAt;
    return auditTime != null && loadedAuditTimes.value[constructLoadKey(dataViewConfig.id)] === auditTime;
}

// Reads the data view from its source again, the way the audit read it, and stores each value as its audited type. The
// records go from the source connector to the store inside the engine, never through the app.
export async function loadDataViewRecords(dataViewConfig: DataViewConfig, onProgress: (recordCount: number) => void): Promise<void> {
    const contentAuditConfig = assertDefined(dataViewConfig.contentAuditConfig, 'No audit for this data view.');
    const connectionNodeConfig = assertDefined(dataViewConfig.connectionNodeConfig, 'No item for this data view.');
    const previewConfig = assertDefined(dataViewConfig.previewConfig, 'No preview for this data view.');
    const sourceConnectionConfig = assertDefined(findConnectionLocalisedConfig(dataViewConfig.connectionId), 'No connection for this data view.');
    const options: EngineLoadObjectRecordsOptions = {
        columnConfigs: contentAuditConfig.columns,
        hasHeaders: previewConfig.hasHeaders === true,
        path: dataViewConfig.id,
        sourceConnectionConfig,
        sourceOptions: {
            chunkSize: undefined,
            dataFormatId: previewConfig.dataFormatId,
            encodingId: assertDefined(previewConfig.encodingId, 'No encoding in the preview.'),
            parserId: previewConfig.parserId,
            path: constructItemPath(connectionNodeConfig),
            valueDelimiterId: assertDefined(previewConfig.valueDelimiterId, 'No value delimiter in the preview.')
        }
    };
    const { processRequest } = await establishEngineWorker();
    await processRequest('loadObjectRecords', findStoreConnectionLocalisedConfig(), options, (callbackData) => {
        if (callbackData.typeId === 'progress') onProgress(Number(callbackData.properties.recordCount));
    });
    loadedAuditTimes.value = { ...loadedAuditTimes.value, [constructLoadKey(dataViewConfig.id)]: contentAuditConfig.asAt };
}

// A load is stopped at its source, which then stops the store, so the earlier load is kept.
export async function abortDataViewRecordLoad(dataViewConfig: DataViewConfig): Promise<void> {
    const sourceConnectionConfig = findConnectionLocalisedConfig(dataViewConfig.connectionId);
    if (sourceConnectionConfig == null) return;
    const { processRequest } = await establishEngineWorker();
    await processRequest('abort', sourceConnectionConfig, {});
}

export async function queryDataViewRecords(dataViewId: string, query: DataViewRecordQuery): Promise<QueryRecordsResult> {
    const options: QueryRecordsOptions = { ...query, path: dataViewId };
    const { processRequest } = await establishEngineWorker();
    return (await processRequest('queryRecords', findStoreConnectionLocalisedConfig(), options)) as QueryRecordsResult;
}

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

function constructLoadKey(dataViewId: string): string {
    return `${INVESTIGATE_STORE_CONNECTOR_ID}|${dataViewId}`;
}

// The store connector needs no sign-in, so its connection is known by the connector's own id.
function findStoreConnectionLocalisedConfig(): LocalisedConfig<ConnectionConfig> {
    return assertDefined(findConnectionLocalisedConfig(INVESTIGATE_STORE_CONNECTOR_ID), `The store '${INVESTIGATE_STORE_CONNECTOR_ID}' is not available.`);
}
