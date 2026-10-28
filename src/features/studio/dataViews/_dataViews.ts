// ── External Dependencies & Registrations
import { type MaybeRefOrGetter, toValue } from 'vue';
import { useMutation, type UseMutationReturnType, useQuery, type UseQueryReturnType } from '@tanstack/vue-query';

// ── DPUse Framework
import { AppError } from '@dpuse/dpuse-shared';
import type { AuditObjectContentOptions, AuditObjectContentResult, ContentAuditConfig, DataViewConfig } from '@dpuse/dpuse-shared';

// ── Local Framework
import { assertDefined } from '@/utilities/index.ts';
import { constructItemPath } from './dataViewSummary';
import { establishEngineWorker } from '@/services/engine';
import { findConnectionLocalisedConfig } from '@/state/configs';
import { queryClient } from '@/services/queryClient';
import { useStudioOptions } from '@/features/studio/options/useStudioOptions';
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

type StoredDataViewConfig = Omit<DataViewConfig, 'description' | 'label'> & Partial<Pick<DataViewConfig, 'description' | 'label'>>; // A record saved by an older build can lack its label and description.

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

const DATA_VIEW_LIST_KEY = constructWorkspaceStoreListKey('dataViews');
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

// Saved once its connection is chosen, because a data view can do nothing without one, and an add the user backs out
// of leaves no empty record behind. From then on every step's URL holds a real id and a reload has a record to restore.
export function useCreateDataView(): UseMutationReturnType<DataViewConfig, Error, string, unknown> {
    return useMutation({ mutationFn: createDataViewConfig });
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

// A data view with its connection chosen but not saved yet. The connection step shows it as the user's pick while a data
// view is added, and saving it creates the data view.
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
        previewConfig: undefined,
        contentAuditConfig: undefined,
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

// Reads the whole item the way its saved preview read it, so it can take minutes. 'onProgress' receives the number of
// records audited so far. Nothing is stored: the result describes each column, ready for loading the records later.
export async function auditDataViewContent(dataViewConfig: DataViewConfig, onProgress: (recordCount: number) => void): Promise<ContentAuditConfig> {
    const connectionLocalisedConfig = assertDefined(findConnectionLocalisedConfig(dataViewConfig.connectionId), 'No connection for this data view.');
    const connectionNodeConfig = assertDefined(dataViewConfig.connectionNodeConfig, 'No item for this data view.');
    const previewConfig = assertDefined(dataViewConfig.previewConfig, 'No preview for this data view.');
    const options: Omit<AuditObjectContentOptions, 'supportsTransferableStreams'> = {
        chunkSize: undefined,
        dataFormatId: previewConfig.dataFormatId,
        encodingId: assertDefined(previewConfig.encodingId, 'No encoding in the preview.'),
        hasHeaders: previewConfig.hasHeaders === true,
        parserId: previewConfig.parserId, // The tool that read the preview, so the audit reads the item the same way.
        path: constructItemPath(connectionNodeConfig),
        valueDelimiterId: assertDefined(previewConfig.valueDelimiterId, 'No value delimiter in the preview.')
    }; // The engine adds 'supportsTransferableStreams', because only the worker can test for it.
    const { processRequest } = await establishEngineWorker();
    const { contentAuditConfig } = (await processRequest('auditObjectContent', connectionLocalisedConfig, options, (callbackData) => {
        if (callbackData.typeId === 'progress') onProgress(Number(callbackData.properties.recordCount));
    })) as AuditObjectContentResult;
    return contentAuditConfig;
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
// without them, because the list cannot show a data view that has none.
function restoreDataViewConfig(storedDataViewConfig: StoredDataViewConfig): DataViewConfig {
    return {
        ...storedDataViewConfig,
        label: storedDataViewConfig.label ?? UNTITLED_DATA_VIEW_LABEL,
        description: storedDataViewConfig.description ?? {},
        icon: dataViewIcon
    };
}

function createDataViewConfig(connectionId: string): Promise<DataViewConfig> {
    return saveDataViewConfig(constructNewDataViewConfig(connectionId));
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
