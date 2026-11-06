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
import { constructColumnsVersion, constructLoadColumnConfigs } from './_dataViewColumns';

// ── Types ────────────────────────────────────────────────────────────────────────────────────────────────────────────

export type DataViewRecordQuery = Pick<QueryRecordsOptions, 'aggregates' | 'filters' | 'groupColumnIndexes' | 'limit' | 'offset' | 'sorts'>;

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

// The stores a data view can load into, in the order the store select lists them. A data view saved before it had a
// choice loads into the default, SQLite, because it needs far less memory and a much smaller download than DuckDB.
export const INVESTIGATE_STORE_CONNECTOR_ID = 'dpuse-connector-sqlite-wasm';
//export const INVESTIGATE_STORE_CONNECTOR_ID = 'dpuse-connector-duckdb-wasm';
const INVESTIGATE_STORE_CONNECTOR_IDS = ['dpuse-connector-sqlite-wasm', 'dpuse-connector-duckdb-wasm'];

const DRAFT_LOAD_SUFFIX = '|draft';
const OLDER_DRAFT_LOAD_SUFFIX = '|working'; // Left by a build that stored drafts.
const LOAD_FORMAT_VERSION = 2; // Raised when stored values change meaning, so that what is already loaded is loaded again. 2 stores dates in UTC, as true dates and times.

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

// The columns each data view was loaded with, by store and data view, kept in this browser because the store is too. A
// data view whose columns have changed since is loaded again.
const loadedColumnsVersions = useLocalStorage<Partial<Record<string, number | string>>>('dpuse-investigate-loads', {});

// The table each load went into. A saved data view with no entry is in the table named by its id. A draft has a table
// of its own, so loading it leaves the saved data view's records alone. Save makes that table the saved one.
const loadTablePaths = useLocalStorage<Partial<Record<string, string>>>('dpuse-investigate-tables', {});

// Tables no longer needed, by store. Opening a store only to drop a table would download its engine, so they wait until
// the store is next opened.
const unwantedTablePaths = useLocalStorage<Partial<Record<string, string[]>>>('dpuse-investigate-unwanted-tables', {});

// ── Actions ──────────────────────────────────────────────────────────────────────────────────────────────────────────

// Only one tab can open the store, so a tab that cannot have it is told so rather than kept waiting. A draft lives only
// in the page's memory, so a load for any draft but the open one was left by a reload or crash, and its table goes.
export async function openDataViewStore(storeConnectorId: string, openDraftDataViewId?: string): Promise<StoreStateId> {
    const { processRequest } = await establishEngineWorker();
    const { storeStateId } = (await processRequest('openStore', findStoreConnectionLocalisedConfig(storeConnectorId), {})) as OpenStoreResult;
    if (storeStateId === 'ready') {
        forgetAbandonedDraftLoads(openDraftDataViewId);
        await dropUnwantedTables(storeConnectorId);
    }
    return storeStateId;
}

// Closing releases the store for other tabs, and frees the memory the store's engine holds.
export async function closeDataViewStore(storeConnectorId: string): Promise<void> {
    const { processRequest } = await establishEngineWorker();
    await processRequest('closeStore', findStoreConnectionLocalisedConfig(storeConnectorId), {});
}

export function isDataViewLoaded(dataViewConfig: Pick<DataViewConfig, 'columnChoiceConfigs' | 'contentAuditConfig' | 'id' | 'storeConnectorId'>, isDraft: boolean): boolean {
    const columnsVersion = constructColumnsVersion(dataViewConfig);
    return columnsVersion != null && loadedColumnsVersions.value[constructDataViewLoadKey(dataViewConfig, isDraft)] === columnsVersion;
}

// Reads the data view from its source again, the way its preview read it, and stores each value as its column's type.
// The records go from the source connector to the store inside the engine, never through the app. An item whose columns
// have moved since the preview loads nothing, so the earlier load stays.
export async function loadDataViewRecords(dataViewConfig: DataViewConfig, isDraft: boolean, onProgress: (recordCount: number) => void): Promise<EngineLoadObjectRecordsResult> {
    const columnsVersion = assertDefined(constructColumnsVersion(dataViewConfig), 'No columns for this data view.');
    const connectionNodeConfig = assertDefined(dataViewConfig.connectionNodeConfig, 'No item for this data view.');
    const readingConfig = assertDefined(dataViewConfig.readingConfig, 'No reading configuration for this data view.');
    const sourceConnectionConfig = assertDefined(findConnectionLocalisedConfig(dataViewConfig.connectionId), 'No connection for this data view.');
    const storeConnectorId = resolveStoreConnectorId(dataViewConfig);
    const loadKey = constructLoadKey(storeConnectorId, dataViewConfig.id, isDraft);
    const options: EngineLoadObjectRecordsOptions = {
        columnConfigs: constructLoadColumnConfigs(dataViewConfig),
        hasHeaders: readingConfig.hasHeaders === true,
        headerValues: readingConfig.hasHeaders === true ? dataViewConfig.sampleConfig?.parsedRecords[0]?.map((parsedValue) => parsedValue.value) : undefined,
        path: establishTablePath(storeConnectorId, dataViewConfig.id, isDraft),
        sourceConnectionConfig,
        sourceOptions: {
            chunkSize: undefined,
            dataFormatId: readingConfig.dataFormatId,
            encodingId: assertDefined(readingConfig.encodingId, 'No encoding in the reading configuration.'),
            parserId: readingConfig.parserId,
            path: constructItemPath(connectionNodeConfig),
            valueDelimiterId: assertDefined(readingConfig.valueDelimiterId, 'No value delimiter in the reading configuration.')
        }
    };
    const { processRequest } = await establishEngineWorker();
    const loadResult = (await processRequest('loadObjectRecords', findStoreConnectionLocalisedConfig(storeConnectorId), options, (callbackData) => {
        if (callbackData.typeId === 'progress') onProgress(Number(callbackData.properties.recordCount));
    })) as EngineLoadObjectRecordsResult;
    if (!loadResult.columnsHaveChanged) loadedColumnsVersions.value = { ...loadedColumnsVersions.value, [loadKey]: columnsVersion };
    return loadResult;
}

// A load is stopped at its source, which then stops the store, so the earlier load is kept.
export async function abortDataViewRecordLoad(dataViewConfig: DataViewConfig): Promise<void> {
    const sourceConnectionConfig = findConnectionLocalisedConfig(dataViewConfig.connectionId);
    if (sourceConnectionConfig == null) return;
    const { processRequest } = await establishEngineWorker();
    await processRequest('abort', sourceConnectionConfig, {});
}

export async function queryDataViewRecords(storeConnectorId: string, tablePath: string, query: DataViewRecordQuery): Promise<QueryRecordsResult> {
    const options: QueryRecordsOptions = { ...query, path: tablePath };
    const { processRequest } = await establishEngineWorker();
    return (await processRequest('queryRecords', findStoreConnectionLocalisedConfig(storeConnectorId), options)) as QueryRecordsResult;
}

export function hasDataViewLoad(dataViewConfig: Pick<DataViewConfig, 'id' | 'storeConnectorId'>, isDraft: boolean): boolean {
    return loadedColumnsVersions.value[constructDataViewLoadKey(dataViewConfig, isDraft)] != null;
}

export function resolveDataViewTablePath(dataViewConfig: Pick<DataViewConfig, 'id' | 'storeConnectorId'>, isDraft: boolean): string {
    return loadTablePaths.value[constructDataViewLoadKey(dataViewConfig, isDraft)] ?? dataViewConfig.id;
}

// Save: the draft's load, if it has one, becomes the saved data view's load, and the saved table goes. The draft can name
// a different store, so loads left in the other stores go too, because the saved data view no longer reads them.
export function promoteDraftLoad(dataViewConfig: Pick<DataViewConfig, 'id' | 'storeConnectorId'>): void {
    const dataViewId = dataViewConfig.id;
    const storeConnectorId = resolveStoreConnectorId(dataViewConfig);
    for (const otherStoreConnectorId of INVESTIGATE_STORE_CONNECTOR_IDS) {
        if (otherStoreConnectorId === storeConnectorId) continue;
        forgetLoad(otherStoreConnectorId, constructLoadKey(otherStoreConnectorId, dataViewId, true));
        forgetSavedLoad(otherStoreConnectorId, dataViewId);
    }
    const draftKey = constructLoadKey(storeConnectorId, dataViewId, true);
    const draftTablePath = loadTablePaths.value[draftKey];
    if (draftTablePath == null) return;

    const savedKey = constructLoadKey(storeConnectorId, dataViewId, false);
    addUnwantedTablePaths(storeConnectorId, [resolveSavedTablePath(storeConnectorId, dataViewId)]);
    const draftVersion = loadedColumnsVersions.value[draftKey];
    const { [savedKey]: _savedVersion, [draftKey]: _draftVersion, ...otherVersions } = loadedColumnsVersions.value;
    loadedColumnsVersions.value = draftVersion == null ? otherVersions : { ...otherVersions, [savedKey]: draftVersion };
    const { [draftKey]: _draftTablePath, ...otherTablePaths } = loadTablePaths.value;
    loadTablePaths.value = { ...otherTablePaths, [savedKey]: draftTablePath };
}

// Discard: the saved data view's load is untouched. The draft can have loaded into any store.
export function forgetDraftLoad(dataViewId: string): void {
    for (const storeConnectorId of INVESTIGATE_STORE_CONNECTOR_IDS) forgetLoad(storeConnectorId, constructLoadKey(storeConnectorId, dataViewId, true));
}

export function forgetDataViewLoads(dataViewId: string): void {
    forgetDraftLoad(dataViewId);
    for (const storeConnectorId of INVESTIGATE_STORE_CONNECTOR_IDS) forgetSavedLoad(storeConnectorId, dataViewId);
}

export function findDataViewStoreLabel(storeConnectorId: string): string {
    return findStoreConnectionLocalisedConfig(storeConnectorId).label;
}

// The stores this app can reach, for the store select. A store whose connector is not available is left out.
export function listDataViewStoreConnections(): LocalisedConfig<ConnectionConfig>[] {
    return INVESTIGATE_STORE_CONNECTOR_IDS.map((storeConnectorId) => findConnectionLocalisedConfig(storeConnectorId)).filter((connectionConfig) => connectionConfig != null);
}

export function resolveStoreConnectorId(dataViewConfig: Pick<DataViewConfig, 'storeConnectorId'> | undefined): string {
    return dataViewConfig?.storeConnectorId ?? INVESTIGATE_STORE_CONNECTOR_ID;
}

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

function constructLoadKey(storeConnectorId: string, dataViewId: string, isDraft: boolean): string {
    return `${storeConnectorId}|${String(LOAD_FORMAT_VERSION)}|${dataViewId}${isDraft ? DRAFT_LOAD_SUFFIX : ''}`;
}

function constructDataViewLoadKey(dataViewConfig: Pick<DataViewConfig, 'id' | 'storeConnectorId'>, isDraft: boolean): string {
    return constructLoadKey(resolveStoreConnectorId(dataViewConfig), dataViewConfig.id, isDraft);
}

function resolveSavedTablePath(storeConnectorId: string, dataViewId: string): string {
    return loadTablePaths.value[constructLoadKey(storeConnectorId, dataViewId, false)] ?? dataViewId;
}

function forgetSavedLoad(storeConnectorId: string, dataViewId: string): void {
    const savedKey = constructLoadKey(storeConnectorId, dataViewId, false);
    addUnwantedTablePaths(storeConnectorId, [resolveSavedTablePath(storeConnectorId, dataViewId)]);
    forgetLoad(storeConnectorId, savedKey);
}

function establishTablePath(storeConnectorId: string, dataViewId: string, isDraft: boolean): string {
    const loadKey = constructLoadKey(storeConnectorId, dataViewId, isDraft);
    const tablePath = loadTablePaths.value[loadKey];
    if (tablePath != null || !isDraft) return tablePath ?? dataViewId;

    const newTablePath = `${dataViewId}-${crypto.randomUUID()}`;
    loadTablePaths.value = { ...loadTablePaths.value, [loadKey]: newTablePath };
    return newTablePath;
}

// Every store's, because a draft can load into any of them. Each key starts with its store's id.
function forgetAbandonedDraftLoads(openDraftDataViewId: string | undefined): void {
    for (const storeConnectorId of INVESTIGATE_STORE_CONNECTOR_IDS) {
        const openLoadKey = openDraftDataViewId == null ? undefined : constructLoadKey(storeConnectorId, openDraftDataViewId, true);
        for (const loadKey of Object.keys(loadTablePaths.value)) {
            const isDraftLoadKey = loadKey.endsWith(DRAFT_LOAD_SUFFIX) || loadKey.endsWith(OLDER_DRAFT_LOAD_SUFFIX);
            if (isDraftLoadKey && loadKey !== openLoadKey && loadKey.startsWith(`${storeConnectorId}|`)) forgetLoad(storeConnectorId, loadKey);
        }
    }
}

function forgetLoad(storeConnectorId: string, loadKey: string): void {
    const tablePath = loadTablePaths.value[loadKey];
    if (tablePath != null) addUnwantedTablePaths(storeConnectorId, [tablePath]);
    const { [loadKey]: _version, ...otherVersions } = loadedColumnsVersions.value;
    loadedColumnsVersions.value = otherVersions;
    const { [loadKey]: _tablePath, ...otherTablePaths } = loadTablePaths.value;
    loadTablePaths.value = otherTablePaths;
}

function addUnwantedTablePaths(storeConnectorId: string, tablePaths: string[]): void {
    const storeTablePaths = unwantedTablePaths.value[storeConnectorId] ?? [];
    unwantedTablePaths.value = { ...unwantedTablePaths.value, [storeConnectorId]: [...new Set([...storeTablePaths, ...tablePaths])] };
}

// A table that cannot be dropped stays on the list for the next time, because it only takes up space.
async function dropUnwantedTables(storeConnectorId: string): Promise<void> {
    const { processRequest } = await establishEngineWorker();
    const tablePaths = unwantedTablePaths.value[storeConnectorId] ?? [];
    for (const tablePath of tablePaths) {
        try {
            const options: DropObjectOptions = { path: tablePath };
            await processRequest('dropObject', findStoreConnectionLocalisedConfig(storeConnectorId), options);
            const storeTablePaths = unwantedTablePaths.value[storeConnectorId] ?? [];
            unwantedTablePaths.value = { ...unwantedTablePaths.value, [storeConnectorId]: storeTablePaths.filter((candidate) => candidate !== tablePath) };
        } catch (error) {
            console.warn(`Failed to drop store table '${tablePath}'.`, error);
        }
    }
}

// The store connector needs no sign-in, so its connection is known by the connector's own id.
function findStoreConnectionLocalisedConfig(storeConnectorId: string): LocalisedConfig<ConnectionConfig> {
    return assertDefined(findConnectionLocalisedConfig(storeConnectorId), `The store '${storeConnectorId}' is not available.`);
}
