// ── External Dependencies & Registrations
import { computed, type ComputedRef, type MaybeRefOrGetter, toValue } from 'vue';
import { useMutation, type UseMutationReturnType, useQuery, type UseQueryReturnType } from '@tanstack/vue-query';

// ── DPUse Framework
import { AppError } from '@dpuse/dpuse-shared';
import type {
    AuditObjectContentOptions,
    AuditObjectContentResult,
    ContentAuditConfig,
    DataViewConfig,
    PreviewConfig,
    ReadConfig,
    StoredContentAuditConfig
} from '@dpuse/dpuse-shared';

// ── Local Framework
import { assertDefined } from '@/utilities/index.ts';
import { constructItemPath } from './dataViewSummary';
import { draftDataViewConfig } from './_dataViewDraft';
import { establishEngineWorker } from '@/services/engine';
import { findConnectionLocalisedConfig } from '@/state/configs';
import { forgetDataViewLoads } from './_dataViewStore';
import { queryClient } from '@/services/queryClient';
import { useStudioOptions } from '@/features/studio/options/useStudioOptions';
import { constructAuditColumnSetConfig, constructPreviewContentAuditConfig } from './_dataViewColumns';
import {
    constructWorkspaceStoreListKey,
    constructWorkspaceStoreRecordKey,
    getWorkspaceStoreRecord,
    removeWorkspaceStoreRecord,
    retrieveWorkspaceStoreRecords,
    upsertWorkspaceStoreRecord,
    workspaceStoreId
} from '@/services/workspaceStore';

// ── Types ────────────────────────────────────────────────────────────────────────────────────────────────────────────

// A record saved by an older build can lack its label and description. It can also hold how it is read and its columns in
// its preview, and its audit under 'auditSummaryConfig' or with its columns, because a preview and an audit were once apart.
type OlderPreviewConfig = Omit<PreviewConfig, 'size'> & ReadConfig & { asAt: number; columnConfigs?: ContentAuditConfig['columns']; duration: number; size: number | undefined };
type OlderContentAuditConfig = Omit<StoredContentAuditConfig, 'byteCount' | 'isComplete'> & { columns?: ContentAuditConfig['columns'] };
type StoredDataViewConfig = Omit<DataViewConfig, 'columnSetConfig' | 'contentAuditConfig' | 'description' | 'label' | 'previewConfig' | 'readConfig'> &
    Partial<Pick<DataViewConfig, 'columnSetConfig' | 'description' | 'label' | 'readConfig'>> & {
        auditSummaryConfig?: OlderContentAuditConfig;
        contentAuditConfig?: OlderContentAuditConfig | StoredContentAuditConfig;
        previewConfig: OlderPreviewConfig | PreviewConfig | undefined;
    };

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

const DATA_VIEW_LIST_KEY = constructWorkspaceStoreListKey('dataViews');
export const DATA_VIEW_SCROLL_ACTIONS_ID = 'dpuse-data-view-scroll-actions'; // Where a step places its scroll buttons, left of the pill.
export const DATA_VIEW_SIDE_ACTION_ID = 'dpuse-data-view-side-action'; // Where a step places a control of its own, right of the pill.
export const DATA_VIEW_STEP_ACTION_ID = 'dpuse-data-view-step-action'; // Where a step places its action, at the end of the pill.
export const NEW_DATA_VIEW_ID = 'new'; // Stands in the URL for the id of a data view being added, which has none until it is saved.
const UNTITLED_DATA_VIEW_LABEL = { en: 'Untitled Data View', es: 'Vista de datos sin título' }; // Stored with the record, so it carries every language rather than reading the current one.

// ── Composables ──────────────────────────────────────────────────────────────────────────────────────────────────────

// Read once and then kept current by the data view mutations, which write every change into the cache as it is saved.
// The read takes TanStack Query's abort signal, so cancelling it, or leaving the list while it loads, stops the wait.
export function useDataViews(): UseQueryReturnType<DataViewConfig[], Error> {
    return useQuery({
        queryKey: DATA_VIEW_LIST_KEY,
        queryFn: ({ signal }) => retrieveDataViewConfigs(signal),
        staleTime: Infinity
    });
}

// Each id has its own entry in the cache, so a data view that arrives after the user has moved on to another one lands
// in its own entry and never replaces what is on screen. Opened from the list, it starts from the list's copy rather
// than reading the store again.
export function useDataView(dataViewId: MaybeRefOrGetter<string | undefined>): UseQueryReturnType<DataViewConfig, Error> {
    return useQuery(() => {
        const id = toValue(dataViewId);
        return {
            queryKey: constructWorkspaceStoreRecordKey('dataViews', id),
            queryFn: () => getDataViewConfig(assertDefined(id)),
            enabled: id != null,
            initialData: () => queryClient.getQueryData<DataViewConfig[]>(DATA_VIEW_LIST_KEY)?.find((config) => config.id === id),
            initialDataUpdatedAt: () => queryClient.getQueryState(DATA_VIEW_LIST_KEY)?.dataUpdatedAt,
            staleTime: Infinity
        };
    });
}

// The data view the steps work on: the user's draft when it is the one open, otherwise the saved one. A data view being
// added has only a draft, with 'new' in the URL until Save.
export function useCurrentDataView(dataViewIdParameter: MaybeRefOrGetter<unknown>): {
    data: ComputedRef<DataViewConfig | undefined>;
    draftIsCurrent: ComputedRef<boolean>;
    error: UseQueryReturnType<DataViewConfig, Error>['error'];
    refetch: UseQueryReturnType<DataViewConfig, Error>['refetch'];
    savedData: UseQueryReturnType<DataViewConfig, Error>['data'];
} {
    const { data: savedData, error, refetch } = useDataView(() => resolveDataViewIdParameter(toValue(dataViewIdParameter)));
    const draftIsCurrent = computed(() => {
        const parameter = toValue(dataViewIdParameter);
        return draftDataViewConfig.value != null && (parameter === NEW_DATA_VIEW_ID || parameter === draftDataViewConfig.value.id);
    });
    return { data: computed(() => (draftIsCurrent.value ? draftDataViewConfig.value : savedData.value)), draftIsCurrent, error, refetch, savedData };
}

export function useUpdateDataView(): UseMutationReturnType<DataViewConfig, Error, DataViewConfig, unknown> {
    return useMutation({ mutationFn: saveDataViewConfig });
}

export function useDeleteDataView(): UseMutationReturnType<void, Error, string, unknown> {
    return useMutation({ mutationFn: removeDataViewConfig });
}

// ── Derived State ────────────────────────────────────────────────────────────────────────────────────────────────────

// Read once, as an icon does not change with the language.
const dataViewIcon = assertDefined(
    useStudioOptions().value.find((config) => config.id === 'dataViews'),
    "Expected a 'dataViews' entry from useStudioOptions()."
).icon;

// ── Actions ──────────────────────────────────────────────────────────────────────────────────────────────────────────

// Stops a list read that is taking too long. The list goes back to not loaded, rather than failed, until it is read
// again.
export async function cancelDataViewRetrieval(): Promise<void> {
    await queryClient.cancelQueries({ queryKey: DATA_VIEW_LIST_KEY });
}

// A data view with its connection chosen but not saved yet. It stays a draft until Save creates the data view.
export function constructNewDataViewConfig(connectionId: string): DataViewConfig {
    return {
        id: crypto.randomUUID(),
        label: UNTITLED_DATA_VIEW_LABEL,
        description: {},
        icon: null,
        iconDark: null,
        typeId: 'dataView',
        connectionId,
        connectionNodeConfig: undefined,
        readConfig: undefined,
        previewConfig: undefined,
        contentAuditConfig: undefined,
        columnSetConfig: undefined,
        relationshipsAuditConfig: undefined,
        status: null,
        statusId: null,
        firstCreatedAt: null,
        lastUpdatedAt: null
    };
}

// The data view id in the URL, or undefined while a data view is added and has no id yet.
export function resolveDataViewIdParameter(dataViewIdParameter: unknown): string | undefined {
    return typeof dataViewIdParameter === 'string' && dataViewIdParameter !== NEW_DATA_VIEW_ID ? dataViewIdParameter : undefined;
}

// Reads the item the way the data view reads it, from its start, so a whole item can take minutes. 'onProgress' receives
// the records and bytes audited so far. Nothing is stored: the result describes each column, ready for loading the records
// later. Undefined 'byteLimit' reads the whole item.
export async function auditDataViewContent(
    dataViewConfig: DataViewConfig,
    byteLimit: number | undefined,
    onProgress: (recordCount: number, byteCount: number) => void
): Promise<ContentAuditConfig> {
    const connectionLocalisedConfig = assertDefined(findConnectionLocalisedConfig(dataViewConfig.connectionId), 'No connection for this data view.');
    const connectionNodeConfig = assertDefined(dataViewConfig.connectionNodeConfig, 'No item for this data view.');
    const readConfig = assertDefined(dataViewConfig.readConfig, 'No read configuration for this data view.');
    const options: Omit<AuditObjectContentOptions, 'stopSignal' | 'supportsTransferableStreams'> = {
        byteLimit,
        chunkSize: undefined,
        dataFormatId: readConfig.dataFormatId,
        encodingId: assertDefined(readConfig.encodingId, 'No encoding in the read configuration.'),
        hasHeaders: readConfig.hasHeaders === true,
        parserId: readConfig.parserId, // The tool that read the item first, so the audit reads it the same way.
        path: constructItemPath(connectionNodeConfig),
        valueDelimiterId: assertDefined(readConfig.valueDelimiterId, 'No value delimiter in the read configuration.')
    }; // The engine adds 'stopSignal' and 'supportsTransferableStreams', because they only exist in the worker.
    const { processRequest } = await establishEngineWorker();
    const { contentAuditConfig } = (await processRequest('auditObjectContent', connectionLocalisedConfig, options, (callbackData) => {
        if (callbackData.typeId === 'progress') onProgress(Number(callbackData.properties.recordCount), Number(callbackData.properties.byteCount));
    })) as AuditObjectContentResult;
    return contentAuditConfig;
}

// Ends the audit at the next record, and the audit still returns what it read.
export async function stopDataViewContentAudit(connectionId: string): Promise<void> {
    const connectionLocalisedConfig = findConnectionLocalisedConfig(connectionId);
    if (connectionLocalisedConfig == null) return;
    const { processRequest } = await establishEngineWorker();
    await processRequest('stopAudit', connectionLocalisedConfig, {});
}

// A connector keeps one abort controller, so this stops whichever operation it started last.
export async function abortDataViewContentAudit(connectionId: string): Promise<void> {
    const connectionLocalisedConfig = findConnectionLocalisedConfig(connectionId);
    if (connectionLocalisedConfig == null) return;
    const { processRequest } = await establishEngineWorker();
    await processRequest('abort', connectionLocalisedConfig, {});
}

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

async function retrieveDataViewConfigs(signal: AbortSignal): Promise<DataViewConfig[]> {
    try {
        const dataViewConfigs = await retrieveWorkspaceStoreRecords<StoredDataViewConfig>('dataViews', signal);
        return dataViewConfigs.map((config) => restoreDataViewConfig(config));
    } catch (error) {
        if (signal.aborted) throw error; // A cancelled read is not a failure, so it keeps its abort reason.
        throw new AppError('Failed to retrieve data views.', 'dpuse-app.dataViews.retrieveDataViewConfigs', { typeId: 'handled' }, { cause: error });
    }
}

async function getDataViewConfig(id: string): Promise<DataViewConfig> {
    try {
        const dataViewConfig = await getWorkspaceStoreRecord<StoredDataViewConfig>('dataViews', id);
        return restoreDataViewConfig(dataViewConfig);
    } catch (error) {
        throw new AppError('Failed to open this data view.', 'dpuse-app.dataViews.getDataViewConfig', { typeId: 'handled' }, { cause: error });
    }
}

// A stored record gets back the icon, which is not stored, and a label and description if an older build saved it
// without them, because the list cannot show a data view that has none. A record from an older build also moves to the
// current layout.
function restoreDataViewConfig(storedDataViewConfig: StoredDataViewConfig): DataViewConfig {
    const { auditSummaryConfig: _auditSummaryConfig, contentAuditConfig: _contentAuditConfig, previewConfig, ...dataViewConfig } = storedDataViewConfig;
    return {
        ...dataViewConfig,
        ...(previewConfig != null && 'dataFormatId' in previewConfig ? restoreOlderReading(storedDataViewConfig, previewConfig) : restoreCurrentReading(storedDataViewConfig)),
        label: storedDataViewConfig.label ?? UNTITLED_DATA_VIEW_LABEL,
        description: storedDataViewConfig.description ?? {},
        icon: dataViewIcon
    };
}

function restoreCurrentReading({
    columnSetConfig,
    contentAuditConfig,
    previewConfig,
    readConfig
}: StoredDataViewConfig): Pick<DataViewConfig, 'columnSetConfig' | 'contentAuditConfig' | 'previewConfig' | 'readConfig'> {
    return {
        columnSetConfig,
        contentAuditConfig: contentAuditConfig as StoredContentAuditConfig | undefined,
        previewConfig,
        readConfig
    };
}

// An older audit always read the whole item. Without one, the record's figures are those of its preview. A column set from
// an older build keeps its extra 'sourceId', which nothing reads.
function restoreOlderReading(
    storedDataViewConfig: StoredDataViewConfig,
    olderPreviewConfig: OlderPreviewConfig
): Pick<DataViewConfig, 'columnSetConfig' | 'contentAuditConfig' | 'previewConfig' | 'readConfig'> {
    const { asAt, columnConfigs, duration, errorMessage: _errorMessage, issues, parsedRecords, size, text, ...readConfig } = olderPreviewConfig;
    const previewConfig: PreviewConfig = { ...(issues != null && { issues }), parsedRecords, size, text };
    const { columns, ...olderContentAuditConfig } = (storedDataViewConfig.contentAuditConfig ?? storedDataViewConfig.auditSummaryConfig ?? {}) as Partial<OlderContentAuditConfig>;
    const itemSize = storedDataViewConfig.connectionNodeConfig?.size;
    const contentAuditConfig: StoredContentAuditConfig =
        'asAt' in olderContentAuditConfig
            ? { byteCount: itemSize ?? 0, ...(olderContentAuditConfig as OlderContentAuditConfig), isComplete: true }
            : { ...constructPreviewContentAuditConfig({ hasHeaders: readConfig.hasHeaders, parsedRecords, size }, asAt, size != null && size === itemSize), duration };
    const auditColumns = columns != null && columns.length > 0 ? constructAuditColumnSetConfig({ ...contentAuditConfig, columns }, undefined) : undefined;
    const previewColumnSetConfig = columnConfigs == null ? undefined : { asAt, columnConfigs };
    return { columnSetConfig: storedDataViewConfig.columnSetConfig ?? auditColumns ?? previewColumnSetConfig, contentAuditConfig, previewConfig, readConfig };
}

// The cache is written here rather than in 'onSuccess', because only here is the store the change went to known.
async function saveDataViewConfig(dataViewConfig: DataViewConfig): Promise<DataViewConfig> {
    try {
        const storeId = await upsertWorkspaceStoreRecord('dataViews', { ...dataViewConfig, icon: null, iconDark: null }); // The icon is added on reading, so it is not stored.
        const savedDataViewConfig = { ...dataViewConfig, icon: dataViewIcon };
        if (storeId === workspaceStoreId.value) writeDataViewConfigToCache(savedDataViewConfig); // A save that finishes after signing in or out stays out of the next user's lists.
        return savedDataViewConfig;
    } catch (error) {
        throw new AppError('Failed to save data view.', 'dpuse-app.dataViews.saveDataViewConfig', { typeId: 'handled' }, { cause: error });
    }
}

async function removeDataViewConfig(id: string): Promise<void> {
    try {
        const storeId = await removeWorkspaceStoreRecord('dataViews', id);
        if (storeId === workspaceStoreId.value) removeDataViewConfigFromCache(id); // As for a save.
        forgetDataViewLoads(id);
    } catch (error) {
        throw new AppError('Failed to remove data view.', 'dpuse-app.dataViews.removeDataViewConfig', { typeId: 'handled' }, { cause: error });
    }
}

// A list not loaded yet is left alone. Loading it later picks up the change.
function writeDataViewConfigToCache(dataViewConfig: DataViewConfig): void {
    queryClient.setQueryData(constructWorkspaceStoreRecordKey('dataViews', dataViewConfig.id), dataViewConfig);
    queryClient.setQueryData<DataViewConfig[]>(DATA_VIEW_LIST_KEY, (dataViewConfigs) => {
        if (dataViewConfigs == null) return dataViewConfigs;
        return dataViewConfigs.some((config) => config.id === dataViewConfig.id)
            ? dataViewConfigs.map((config) => (config.id === dataViewConfig.id ? dataViewConfig : config))
            : [...dataViewConfigs, dataViewConfig];
    });
}

function removeDataViewConfigFromCache(id: string): void {
    queryClient.setQueryData<DataViewConfig[]>(DATA_VIEW_LIST_KEY, (dataViewConfigs) => dataViewConfigs?.filter((config) => config.id !== id));
    queryClient.removeQueries({ queryKey: constructWorkspaceStoreRecordKey('dataViews', id), exact: true });
}
