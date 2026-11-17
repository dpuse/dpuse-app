// ── External Dependencies & Registrations
import { computed, ref } from 'vue';

// ── DPUse Framework
import type {
    ColumnAuditConfig,
    ConnectionConfig,
    DataViewConfig,
    DropObjectOptions,
    EngineLoadObjectRecordsOptions,
    EngineLoadObjectRecordsResult,
    LoadTiming,
    LocalisedConfig,
    ObjectColumnConfig,
    QueryRecordsOptions,
    QueryRecordsResult,
    StoreRecord,
    StoreStateId
} from '@dpuse/dpuse-shared';

// ── Local Framework
import { assertDefined } from '@/utilities/index.ts';
import { constructItemPath } from './dataViewSummary';
import { establishEngineWorker } from '@/services/engine';
import { establishFileValueDelimiterId } from './_dataViewColumns';
import { findConnectionLocalisedConfig } from '@/state/configs';
import { openStore } from '@/services/storeUse';
import pgliteIcon from './_data/pgliteIcon.svg?raw';
import pgliteIconDark from './_data/pgliteIconDark.svg?raw';
import {
    addUnwantedTablePaths,
    constructLoadKey,
    DRAFT_LOAD_SUFFIX,
    forgetLoad,
    loadedColumnsVersions,
    loadInvalidValueCounts,
    loadTablePaths,
    removeUnwantedTablePath,
    unwantedTablePaths
} from '@/state/dataViewLoads';
import { constructAppliedReading, constructColumnsVersion, constructIgnoredColumnIndexes, constructLoadColumnConfigs } from './_dataViewColumns';

// ── Types ────────────────────────────────────────────────────────────────────────────────────────────────────────────

export type DataViewRecordQuery = Pick<QueryRecordsOptions, 'aggregates' | 'filters' | 'groupColumnIndexes' | 'limit' | 'offset' | 'sorts'>;

// A column's valid values as the store holds them, counted in full, in the shape the audit gives them.
export type DataViewColumnValueCounts = Required<Pick<ColumnAuditConfig, 'validDistinctValueCount' | 'validFrequentValues' | 'validLeastFrequentValues' | 'validValueCount'>>;

// A store as the store select lists it. A planned store has no connector yet, so it is listed but cannot be chosen.
export type DataViewStoreConfig = Pick<LocalisedConfig<ConnectionConfig>, 'icon' | 'iconDark' | 'id' | 'label'> & { isPlanned: boolean };

// The engine's timing of a load, and the whole load as the user waits for it. In milliseconds.
export interface DataViewLoadTiming extends LoadTiming {
    totalDuration: number; // Also starting the engine's connectors, and dropping the table the load replaces.
}

// A load's time in parts that add up to 'total', in milliseconds. A part is undefined when the source does not have it.
export interface LoadTimingParts {
    total: number;
    reading: number; // The source handing over the records. The next three parts add up to it.
    waiting: number | undefined; // Waiting for the item's bytes.
    starting: number | undefined; // The source's work before its parser starts, such as opening the item and loading the parser.
    parsing: number | undefined; // A source that holds typed values, such as a database, has no parser.
    converting: number;
    storing: number;
    other: number; // Starting the engine's connectors, reporting progress and dropping the table the load replaces.
}

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

// A data view saved before it had a choice of store loads into the default, SQLite, because it needs far less memory and a
// much smaller download than DuckDB.
export const INVESTIGATE_STORE_CONNECTOR_ID = 'dpuse-connector-sqlite-wasm';
//export const INVESTIGATE_STORE_CONNECTOR_ID = 'dpuse-connector-duckdb-wasm';
// PGlite is planned and has no connector yet. Its icons are PGlite's own, from its repository (Apache-2.0).
const PGLITE_STORE_CONFIG: DataViewStoreConfig = { icon: pgliteIcon, iconDark: pgliteIconDark, id: 'dpuse-connector-pglite', isPlanned: true, label: 'PGlite' };
const STORE_SELECT_IDS = ['dpuse-connector-duckdb-wasm', 'dpuse-connector-dexie-js', PGLITE_STORE_CONFIG.id, 'dpuse-connector-sqlite-wasm']; // In the order the store select lists them, by name.
const INVESTIGATE_STORE_CONNECTOR_IDS = STORE_SELECT_IDS.filter((storeId) => storeId !== PGLITE_STORE_CONFIG.id); // The stores a data view can load into.

const LISTED_VALUE_COUNT = 10; // Values in each of the most and least frequent lists, as many as the audit lists.

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

const runningLoadCount = ref(0);
const lastLoadTimings = ref<Partial<Record<string, DataViewLoadTiming>>>({}); // By data view id. Kept in page memory only, so a data view's details can show where its last load's time went.

// ── Derived State ────────────────────────────────────────────────────────────────────────────────────────────────────

// Save and Discard wait for a load to finish, because the load records its table under the data view as it was when the
// load started. Saving or discarding in the middle would leave the table recorded under the wrong one.
export const dataViewRecordsAreLoading = computed(() => runningLoadCount.value > 0);

// ── Actions ──────────────────────────────────────────────────────────────────────────────────────────────────────────

// Only one tab can open the store, so a tab that cannot have it is told so rather than kept waiting. Taking it over opens
// it here anyway, and the tab that had it closes its store. A draft lives only in the page's memory, so a load for any
// draft but the open one was left by a reload or crash, and its table goes.
export async function openDataViewStore(storeConnectorId: string, openDraftDataViewId?: string, shouldTakeOver = false): Promise<StoreStateId> {
    const storeStateId = await openStore(storeConnectorId, shouldTakeOver);
    if (storeStateId === 'ready') {
        forgetAbandonedDraftLoads(openDraftDataViewId);
        await dropUnwantedTables(storeConnectorId);
    }
    return storeStateId;
}

// A load is known only by its record of the table it went into, so a load with no such record is not loaded.
export function isDataViewLoaded(dataViewConfig: Pick<DataViewConfig, 'columnChoiceConfigs' | 'contentAuditConfig' | 'id' | 'storeConnectorId'>, isDraft: boolean): boolean {
    const columnsVersion = constructColumnsVersion(dataViewConfig);
    const loadKey = constructDataViewLoadKey(dataViewConfig, isDraft);
    return columnsVersion != null && loadedColumnsVersions.value[loadKey] === columnsVersion && loadTablePaths.value[loadKey] != null;
}

// Reads the data view from its source again, the way its preview read it, and stores each value as its column's type.
// The records go from the source connector to the store inside the engine, never through the app. An item whose columns
// have moved since the preview loads nothing, so the earlier load stays.
// 'requestId' names the load, so 'abortDataViewRecordLoad' can stop it. Undefined when it is never stopped.
export async function loadDataViewRecords(
    dataViewConfig: DataViewConfig,
    isDraft: boolean,
    onProgress: (recordCount: number, byteCount: number | undefined) => void, // Undefined bytes from a source not read as bytes, or an engine that does not count them.
    requestId?: string
): Promise<EngineLoadObjectRecordsResult> {
    const columnsVersion = assertDefined(constructColumnsVersion(dataViewConfig), 'No columns for this data view.');
    const connectionNodeConfig = assertDefined(dataViewConfig.connectionNodeConfig, 'No item for this data view.');
    const appliedReading = constructAppliedReading(assertDefined(dataViewConfig.sampleConfig, 'No sample for this data view.'));
    const sourceConnectionConfig = assertDefined(findConnectionLocalisedConfig(dataViewConfig.connectionId), 'No connection for this data view.');
    const sourceIsFile = sourceConnectionConfig.connectorConfig.itemTypeId === 'file'; // Only a file has an encoding and a value delimiter.
    const storeConnectorId = resolveStoreConnectorId(dataViewConfig);
    const loadKey = constructLoadKey(storeConnectorId, dataViewConfig.id, isDraft);
    const tablePath = `${dataViewConfig.id}-${crypto.randomUUID()}`;
    addUnwantedTablePaths(storeConnectorId, [tablePath]); // Until the load succeeds, so a table left by a failure, reload or crash is dropped.
    const options: EngineLoadObjectRecordsOptions = {
        columnConfigs: constructLoadColumnConfigs(dataViewConfig),
        hasHeaders: appliedReading.hasHeaders === true,
        ignoredColumnIndexes: constructIgnoredColumnIndexes(dataViewConfig),
        headerValues: appliedReading.hasHeaders === true ? dataViewConfig.sampleConfig?.parsedRecords[0] : undefined,
        path: tablePath,
        requestId,
        sourceConnectionConfig,
        sourceOptions: {
            chunkSize: undefined,
            dataFormatId: appliedReading.dataFormatId,
            encodingId: sourceIsFile ? assertDefined(appliedReading.encodingId, 'No encoding in the sample.') : undefined,
            parserId: appliedReading.parserId,
            path: constructItemPath(connectionNodeConfig),
            structurePath: appliedReading.structurePath,
            valueDelimiterId: sourceIsFile ? establishFileValueDelimiterId(appliedReading) : undefined
        }
    };
    const loadStartedAt = performance.now();
    let loadTiming: LoadTiming | undefined;
    runningLoadCount.value++;
    try {
        const { processRequest } = await establishEngineWorker();
        const loadResult = (await processRequest('loadObjectRecords', findStoreConnectionLocalisedConfig(storeConnectorId), options, (callbackData) => {
            if (callbackData.typeId !== 'progress') return;
            const { byteCount, recordCount } = callbackData.properties;
            onProgress(Number(recordCount), byteCount == null ? undefined : Number(byteCount));
        })) as EngineLoadObjectRecordsResult;
        if (!loadResult.columnsHaveChanged) {
            const earlierTablePath = isDraft ? loadTablePaths.value[loadKey] : resolveSavedTablePath(storeConnectorId, dataViewConfig.id);
            loadTablePaths.value = { ...loadTablePaths.value, [loadKey]: tablePath };
            removeUnwantedTablePath(storeConnectorId, tablePath);
            if (earlierTablePath != null) addUnwantedTablePaths(storeConnectorId, [earlierTablePath]);
            loadedColumnsVersions.value = { ...loadedColumnsVersions.value, [loadKey]: columnsVersion };
            loadInvalidValueCounts.value = { ...loadInvalidValueCounts.value, [loadKey]: loadResult.invalidValueCounts };
            loadTiming = loadResult.timing;
        }
        return loadResult;
    } finally {
        runningLoadCount.value--; // The table is recorded by now, so Save and Discard can go ahead.
        await dropUnwantedTables(storeConnectorId); // The earlier table after a success, or the new one after a failure.
        if (loadTiming != null) {
            lastLoadTimings.value = { ...lastLoadTimings.value, [dataViewConfig.id]: { ...loadTiming, totalDuration: performance.now() - loadStartedAt } };
        }
    }
}

// Stops only the load the request id names. Its source and its store both stop, so the earlier load is kept.
export async function abortDataViewRecordLoad(dataViewConfig: DataViewConfig, requestId: string): Promise<void> {
    const sourceConnectionConfig = findConnectionLocalisedConfig(dataViewConfig.connectionId);
    if (sourceConnectionConfig == null) return;
    const { processRequest } = await establishEngineWorker();
    await processRequest('abort', sourceConnectionConfig, { requestId });
}

// 'columnConfigs' are the columns the table was loaded with, from 'constructStoredColumnConfigs', because the store keeps
// no column types of its own.
export async function queryDataViewRecords(
    storeConnectorId: string,
    tablePath: string,
    columnConfigs: ObjectColumnConfig[],
    query: DataViewRecordQuery
): Promise<QueryRecordsResult> {
    const options: QueryRecordsOptions = { ...query, columnConfigs, path: tablePath };
    const { processRequest } = await establishEngineWorker();
    return (await processRequest('queryRecords', findStoreConnectionLocalisedConfig(storeConnectorId), options)) as QueryRecordsResult;
}

// The audit stops counting a column's values past a limit, so it holds every value in memory for no column. The store
// holds every value already, so it counts them in full. Values that did not fit the column's type loaded as empty, so
// they are not counted, the same as in the audit's valid values. The least frequent list leaves out the most frequent
// values, as the audit's does.
export async function queryDataViewColumnValueCounts(
    storeConnectorId: string,
    tablePath: string,
    columnConfigs: ObjectColumnConfig[],
    columnIndex: number
): Promise<DataViewColumnValueCounts> {
    const filters = [{ columnIndex, operatorId: 'isNotEmpty' as const, value: null }];
    const groupedQuery = { aggregates: [{ columnIndex: undefined, functionId: 'count' as const }], filters, groupColumnIndexes: [columnIndex], offset: 0 };
    const mostFrequent = await queryDataViewRecords(storeConnectorId, tablePath, columnConfigs, {
        ...groupedQuery,
        limit: LISTED_VALUE_COUNT,
        sorts: [
            { columnIndex: 1, directionId: 'descending' },
            { columnIndex: 0, directionId: 'ascending' }
        ]
    });
    const distinctCount = mostFrequent.totalCount;
    const frequentValues = constructValueCounts(mostFrequent.records);
    const leastLimit = Math.min(LISTED_VALUE_COUNT, distinctCount - LISTED_VALUE_COUNT);
    const leastFrequent =
        leastLimit > 0
            ? await queryDataViewRecords(storeConnectorId, tablePath, columnConfigs, {
                  ...groupedQuery,
                  limit: leastLimit,
                  sorts: [
                      { columnIndex: 1, directionId: 'ascending' },
                      { columnIndex: 0, directionId: 'ascending' }
                  ]
              })
            : undefined;
    const leastFrequentValues = Object.fromEntries(Object.entries(constructValueCounts(leastFrequent?.records ?? [])).filter(([value]) => !Object.hasOwn(frequentValues, value)));
    const valued = await queryDataViewRecords(storeConnectorId, tablePath, columnConfigs, { aggregates: [], filters, groupColumnIndexes: [], limit: 1, offset: 0, sorts: [] });
    return { validDistinctValueCount: distinctCount, validFrequentValues: frequentValues, validLeastFrequentValues: leastFrequentValues, validValueCount: valued.totalCount };
}

// Undefined for a load made before the counts were kept, or when there is no load.
export function findDataViewInvalidValueCounts(dataViewConfig: Pick<DataViewConfig, 'id' | 'storeConnectorId'>, isDraft: boolean): number[] | undefined {
    return loadInvalidValueCounts.value[constructDataViewLoadKey(dataViewConfig, isDraft)];
}

// Undefined until the data view has loaded since the page opened.
export function findDataViewLoadTiming(dataViewId: string): DataViewLoadTiming | undefined {
    return lastLoadTimings.value[dataViewId];
}

// Each part is measured, except starting and other, which are what is left of reading and of the total.
export function constructLoadTimingParts(loadTiming: DataViewLoadTiming): LoadTimingParts {
    const { conversionDuration, parseDuration, retrieveDuration, sourceWaitDuration, storeDuration, totalDuration } = loadTiming;
    return {
        total: totalDuration,
        reading: retrieveDuration,
        waiting: sourceWaitDuration,
        starting: parseDuration == null ? undefined : Math.max(0, retrieveDuration - (sourceWaitDuration ?? 0) - parseDuration),
        parsing: parseDuration,
        converting: conversionDuration,
        storing: storeDuration,
        other: Math.max(0, totalDuration - retrieveDuration - conversionDuration - storeDuration)
    };
}

export function hasDataViewLoad(dataViewConfig: Pick<DataViewConfig, 'id' | 'storeConnectorId'>, isDraft: boolean): boolean {
    return loadedColumnsVersions.value[constructDataViewLoadKey(dataViewConfig, isDraft)] != null;
}

// The columns a data view's table holds, for its queries. Ignored columns are not stored, and only the type and label
// are sent, so each query stays small.
export function constructStoredColumnConfigs(dataViewConfig: Pick<DataViewConfig, 'columnChoiceConfigs' | 'contentAuditConfig'>): ObjectColumnConfig[] {
    const ignoredColumnIndexes = new Set(constructIgnoredColumnIndexes(dataViewConfig));
    return constructLoadColumnConfigs(dataViewConfig)
        .filter((_columnConfig, columnIndex) => !ignoredColumnIndexes.has(columnIndex))
        .map(({ dataSubtypeId, dataTypeId, label }) => ({ dataSubtypeId, dataTypeId, label }));
}

// Undefined when there is no load, so nothing is read from a table that was never there.
export function resolveDataViewTablePath(dataViewConfig: Pick<DataViewConfig, 'id' | 'storeConnectorId'>, isDraft: boolean): string | undefined {
    return loadTablePaths.value[constructDataViewLoadKey(dataViewConfig, isDraft)];
}

// For a load whose table the store no longer has, such as after its database was deleted, so the data view asks to be
// loaded again.
export function forgetDataViewLoad(dataViewConfig: Pick<DataViewConfig, 'id' | 'storeConnectorId'>, isDraft: boolean): void {
    forgetLoad(resolveStoreConnectorId(dataViewConfig), constructDataViewLoadKey(dataViewConfig, isDraft));
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
    const draftInvalidValueCounts = loadInvalidValueCounts.value[draftKey];
    const { [savedKey]: _savedCounts, [draftKey]: _draftCounts, ...otherInvalidValueCounts } = loadInvalidValueCounts.value;
    loadInvalidValueCounts.value = draftInvalidValueCounts == null ? otherInvalidValueCounts : { ...otherInvalidValueCounts, [savedKey]: draftInvalidValueCounts };
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

// The stores for the store select, with the planned ones that cannot be chosen yet. A store whose connector is not
// available is left out.
export function listDataViewStoreConfigs(): DataViewStoreConfig[] {
    return STORE_SELECT_IDS.map((storeId): DataViewStoreConfig | undefined => {
        if (storeId === PGLITE_STORE_CONFIG.id) return PGLITE_STORE_CONFIG;
        const connectionConfig = findConnectionLocalisedConfig(storeId);
        return connectionConfig == null ? undefined : { icon: connectionConfig.icon, iconDark: connectionConfig.iconDark, id: connectionConfig.id, isPlanned: false, label: connectionConfig.label };
    }).filter((storeConfig) => storeConfig != null);
}

export function resolveStoreConnectorId(dataViewConfig: Pick<DataViewConfig, 'storeConnectorId'> | undefined): string {
    return dataViewConfig?.storeConnectorId ?? INVESTIGATE_STORE_CONNECTOR_ID;
}

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

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

// Every store's, because a draft can load into any of them. Each key starts with its store's id.
function forgetAbandonedDraftLoads(openDraftDataViewId: string | undefined): void {
    for (const storeConnectorId of INVESTIGATE_STORE_CONNECTOR_IDS) {
        const openLoadKey = openDraftDataViewId == null ? undefined : constructLoadKey(storeConnectorId, openDraftDataViewId, true);
        for (const loadKey of Object.keys(loadTablePaths.value)) {
            if (loadKey !== openLoadKey && loadKey.endsWith(DRAFT_LOAD_SUFFIX) && loadKey.startsWith(`${storeConnectorId}|`)) forgetLoad(storeConnectorId, loadKey);
        }
    }
}

async function dropUnwantedTables(storeConnectorId: string): Promise<void> {
    const { processRequest } = await establishEngineWorker();
    const tablePaths = unwantedTablePaths.value[storeConnectorId] ?? [];
    for (const tablePath of tablePaths) {
        try {
            const options: DropObjectOptions = { path: tablePath };
            await processRequest('dropObject', findStoreConnectionLocalisedConfig(storeConnectorId), options);
            removeUnwantedTablePath(storeConnectorId, tablePath);
        } catch (error) {
            console.warn(`Failed to drop store table '${tablePath}'.`, error);
        }
    }
}

// Each grouped record holds the value, then its count. A value is listed as its text, as the audit lists it.
function constructValueCounts(records: StoreRecord[]): Record<string, number> {
    return Object.fromEntries(records.map(([value, count]) => [value instanceof Date ? value.toISOString() : String(value), Number(count)]));
}

// The store connector needs no sign-in, so its connection is known by the connector's own id.
function findStoreConnectionLocalisedConfig(storeConnectorId: string): LocalisedConfig<ConnectionConfig> {
    return assertDefined(findConnectionLocalisedConfig(storeConnectorId), `The store '${storeConnectorId}' is not available.`);
}
