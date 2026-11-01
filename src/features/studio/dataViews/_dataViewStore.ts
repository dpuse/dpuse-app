// ── External Dependencies & Registrations
import { useLocalStorage } from '@vueuse/core';

// ── DPUse Framework
import type {
    ConnectionConfig,
    DataViewConfig,
    DropObjectOptions,
    EngineLoadObjectRecordsOptions,
    EngineLoadObjectRecordsResult,
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
import { constructColumnSetVersion, constructLoadColumnConfigs } from './_dataViewColumns';

// ── Types ────────────────────────────────────────────────────────────────────────────────────────────────────────────

export type DataViewRecordQuery = Pick<QueryRecordsOptions, 'aggregates' | 'filters' | 'groupColumnIndexes' | 'limit' | 'offset' | 'sorts'>;

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

// The store that investigate loads data views into. SQLite is the default, because it needs far less memory and a much
// smaller download than DuckDB. Set it to 'dpuse-connector-duckdb-wasm' for DuckDB until the app has a setting for it.
export const INVESTIGATE_STORE_CONNECTOR_ID = 'dpuse-connector-sqlite-wasm';
//export const INVESTIGATE_STORE_CONNECTOR_ID = 'dpuse-connector-duckdb-wasm';

const LOAD_FORMAT_VERSION = 2; // Raised when stored values change meaning, so that what is already loaded is loaded again. 2 stores dates in UTC, as true dates and times.

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

// The columns each data view was loaded with, by store and data view, kept in this browser because the store is too. A
// data view whose columns have changed since is loaded again.
const loadedColumnSetVersions = useLocalStorage<Partial<Record<string, number | string>>>('dpuse-investigate-loads', {});

// The table each load went into. A saved data view with no entry is in the table named by its id. A working copy has a
// table of its own, so loading it leaves the saved data view's records alone. Save makes that table the saved one.
const loadTablePaths = useLocalStorage<Partial<Record<string, string>>>('dpuse-investigate-tables', {});

// Tables no longer needed, by store. Opening a store only to drop a table would download its engine, so they wait until
// the store is next opened.
const unwantedTablePaths = useLocalStorage<Partial<Record<string, string[]>>>('dpuse-investigate-unwanted-tables', {});

// ── Actions ──────────────────────────────────────────────────────────────────────────────────────────────────────────

// Only one tab can open the store, so a tab that cannot have it is told so rather than kept waiting.
export async function openDataViewStore(): Promise<StoreStateId> {
    const { processRequest } = await establishEngineWorker();
    const { storeStateId } = (await processRequest('openStore', findStoreConnectionLocalisedConfig(), {})) as OpenStoreResult;
    if (storeStateId === 'ready') await dropUnwantedTables();
    return storeStateId;
}

// Closing releases the store for other tabs, and frees the memory the store's engine holds.
export async function closeDataViewStore(): Promise<void> {
    const { processRequest } = await establishEngineWorker();
    await processRequest('closeStore', findStoreConnectionLocalisedConfig(), {});
}

export function isDataViewLoaded(dataViewConfig: DataViewConfig, isWorkingCopy: boolean): boolean {
    const columnSetVersion = constructColumnSetVersion(dataViewConfig.columnSetConfig);
    return columnSetVersion != null && loadedColumnSetVersions.value[constructLoadKey(dataViewConfig.id, isWorkingCopy)] === columnSetVersion;
}

// Reads the data view from its source again, the way its preview read it, and stores each value as its column's type.
// The records go from the source connector to the store inside the engine, never through the app. An item whose columns
// have moved since the preview loads nothing, so the earlier load stays.
export async function loadDataViewRecords(dataViewConfig: DataViewConfig, isWorkingCopy: boolean, onProgress: (recordCount: number) => void): Promise<EngineLoadObjectRecordsResult> {
    const columnSetVersion = assertDefined(constructColumnSetVersion(dataViewConfig.columnSetConfig), 'No columns for this data view.');
    const connectionNodeConfig = assertDefined(dataViewConfig.connectionNodeConfig, 'No item for this data view.');
    const previewConfig = assertDefined(dataViewConfig.previewConfig, 'No preview for this data view.');
    const sourceConnectionConfig = assertDefined(findConnectionLocalisedConfig(dataViewConfig.connectionId), 'No connection for this data view.');
    const loadKey = constructLoadKey(dataViewConfig.id, isWorkingCopy);
    const options: EngineLoadObjectRecordsOptions = {
        columnConfigs: constructLoadColumnConfigs(dataViewConfig.columnSetConfig),
        hasHeaders: previewConfig.hasHeaders === true,
        headerValues: previewConfig.hasHeaders === true ? previewConfig.parsedRecords[0]?.map((parsingValue) => parsingValue.value) : undefined,
        path: establishTablePath(dataViewConfig.id, isWorkingCopy),
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
    const loadResult = (await processRequest('loadObjectRecords', findStoreConnectionLocalisedConfig(), options, (callbackData) => {
        if (callbackData.typeId === 'progress') onProgress(Number(callbackData.properties.recordCount));
    })) as EngineLoadObjectRecordsResult;
    if (!loadResult.columnsHaveChanged) loadedColumnSetVersions.value = { ...loadedColumnSetVersions.value, [loadKey]: columnSetVersion };
    return loadResult;
}

// A load is stopped at its source, which then stops the store, so the earlier load is kept.
export async function abortDataViewRecordLoad(dataViewConfig: DataViewConfig): Promise<void> {
    const sourceConnectionConfig = findConnectionLocalisedConfig(dataViewConfig.connectionId);
    if (sourceConnectionConfig == null) return;
    const { processRequest } = await establishEngineWorker();
    await processRequest('abort', sourceConnectionConfig, {});
}

export async function queryDataViewRecords(tablePath: string, query: DataViewRecordQuery): Promise<QueryRecordsResult> {
    const options: QueryRecordsOptions = { ...query, path: tablePath };
    const { processRequest } = await establishEngineWorker();
    return (await processRequest('queryRecords', findStoreConnectionLocalisedConfig(), options)) as QueryRecordsResult;
}

export function hasDataViewLoad(dataViewId: string, isWorkingCopy: boolean): boolean {
    return loadedColumnSetVersions.value[constructLoadKey(dataViewId, isWorkingCopy)] != null;
}

export function resolveDataViewTablePath(dataViewId: string, isWorkingCopy: boolean): string {
    return loadTablePaths.value[constructLoadKey(dataViewId, isWorkingCopy)] ?? dataViewId;
}

// Save: the working copy's load, if it has one, becomes the saved data view's load, and the saved table goes.
export function promoteWorkingCopyLoad(dataViewId: string): void {
    const workingKey = constructLoadKey(dataViewId, true);
    const workingTablePath = loadTablePaths.value[workingKey];
    if (workingTablePath == null) return;

    const savedKey = constructLoadKey(dataViewId, false);
    addUnwantedTablePaths([resolveDataViewTablePath(dataViewId, false)]);
    const workingVersion = loadedColumnSetVersions.value[workingKey];
    const { [savedKey]: _savedVersion, [workingKey]: _workingVersion, ...otherVersions } = loadedColumnSetVersions.value;
    loadedColumnSetVersions.value = workingVersion == null ? otherVersions : { ...otherVersions, [savedKey]: workingVersion };
    const { [workingKey]: _workingTablePath, ...otherTablePaths } = loadTablePaths.value;
    loadTablePaths.value = { ...otherTablePaths, [savedKey]: workingTablePath };
}

// Discard: the saved data view's load is untouched.
export function forgetWorkingCopyLoad(dataViewId: string): void {
    forgetLoad(constructLoadKey(dataViewId, true));
}

export function forgetDataViewLoads(dataViewId: string): void {
    forgetWorkingCopyLoad(dataViewId);
    const savedKey = constructLoadKey(dataViewId, false);
    addUnwantedTablePaths([resolveDataViewTablePath(dataViewId, false)]);
    forgetLoad(savedKey);
}

export function findDataViewStoreLabel(): string {
    return findStoreConnectionLocalisedConfig().label;
}

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

function constructLoadKey(dataViewId: string, isWorkingCopy: boolean): string {
    return `${INVESTIGATE_STORE_CONNECTOR_ID}|${String(LOAD_FORMAT_VERSION)}|${dataViewId}${isWorkingCopy ? '|working' : ''}`;
}

function establishTablePath(dataViewId: string, isWorkingCopy: boolean): string {
    const loadKey = constructLoadKey(dataViewId, isWorkingCopy);
    const tablePath = loadTablePaths.value[loadKey];
    if (tablePath != null || !isWorkingCopy) return tablePath ?? dataViewId;

    const newTablePath = `${dataViewId}-${crypto.randomUUID()}`;
    loadTablePaths.value = { ...loadTablePaths.value, [loadKey]: newTablePath };
    return newTablePath;
}

function forgetLoad(loadKey: string): void {
    const tablePath = loadTablePaths.value[loadKey];
    if (tablePath != null) addUnwantedTablePaths([tablePath]);
    const { [loadKey]: _version, ...otherVersions } = loadedColumnSetVersions.value;
    loadedColumnSetVersions.value = otherVersions;
    const { [loadKey]: _tablePath, ...otherTablePaths } = loadTablePaths.value;
    loadTablePaths.value = otherTablePaths;
}

function addUnwantedTablePaths(tablePaths: string[]): void {
    const storeTablePaths = unwantedTablePaths.value[INVESTIGATE_STORE_CONNECTOR_ID] ?? [];
    unwantedTablePaths.value = { ...unwantedTablePaths.value, [INVESTIGATE_STORE_CONNECTOR_ID]: [...new Set([...storeTablePaths, ...tablePaths])] };
}

// A table that cannot be dropped stays on the list for the next time, because it only takes up space.
async function dropUnwantedTables(): Promise<void> {
    const { processRequest } = await establishEngineWorker();
    const tablePaths = unwantedTablePaths.value[INVESTIGATE_STORE_CONNECTOR_ID] ?? [];
    for (const tablePath of tablePaths) {
        try {
            const options: DropObjectOptions = { path: tablePath };
            await processRequest('dropObject', findStoreConnectionLocalisedConfig(), options);
            const storeTablePaths = unwantedTablePaths.value[INVESTIGATE_STORE_CONNECTOR_ID] ?? [];
            unwantedTablePaths.value = { ...unwantedTablePaths.value, [INVESTIGATE_STORE_CONNECTOR_ID]: storeTablePaths.filter((candidate) => candidate !== tablePath) };
        } catch (error) {
            console.warn(`Failed to drop store table '${tablePath}'.`, error);
        }
    }
}

// The store connector needs no sign-in, so its connection is known by the connector's own id.
function findStoreConnectionLocalisedConfig(): LocalisedConfig<ConnectionConfig> {
    return assertDefined(findConnectionLocalisedConfig(INVESTIGATE_STORE_CONNECTOR_ID), `The store '${INVESTIGATE_STORE_CONNECTOR_ID}' is not available.`);
}
