// ── External Dependencies & Registrations
import { computed, type ComputedRef, type MaybeRefOrGetter, ref, toValue } from 'vue';
import { useMutation, type UseMutationReturnType, useQuery, type UseQueryReturnType } from '@tanstack/vue-query';

// ── DPUse Framework
import { AppError } from '@dpuse/dpuse-shared';
import type { AuditObjectContentOptions, AuditObjectContentResult, DataViewConfig } from '@dpuse/dpuse-shared';

// ── Local Framework
import { assertDefined } from '@/utilities/index.ts';
import { constructAppliedReading } from './_dataViewColumns';
import { constructItemPath } from './dataViewSummary';
import { draftDataViewConfig } from './_dataViewDraft';
import { establishEngineWorker } from '@/services/engine';
import { findConnectionLocalisedConfig } from '@/state/configs';
import { forgetDataViewLoads } from './_dataViewStore';
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

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

const DATA_VIEW_LIST_KEY = constructWorkspaceStoreListKey('dataViews');
export const DATA_VIEW_ADD_ACTION_ID = 'dpuse-data-view-add-action'; // Where a step's list places its add segment when the list fills the pane, before Discard.
export const DATA_VIEW_SCROLL_ACTIONS_ID = 'dpuse-data-view-scroll-actions'; // Where a step places its scroll segments, at the start of the pill.
export const DATA_VIEW_STEP_ACTION_ID = 'dpuse-data-view-step-action'; // Where a step places its action, at the end of the pill.
export const NEW_DATA_VIEW_ID = 'new'; // Stands in the URL for the id of a data view being added, which has none until it is saved.
const UNTITLED_DATA_VIEW_LABEL = { en: 'Untitled Data View', es: 'Vista de datos sin título' }; // Stored with the record, so it carries every language rather than reading the current one.

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

// Set by a step whose bottom row is too wide for its detail pane, so the pill shows icons only. The row's own width
// cannot tell, because it runs across both panes.
export const dataViewActionLabelsAreHidden = ref(false);

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
        readingConfig: undefined,
        sampleConfig: undefined,
        contentAuditConfig: undefined,
        columnChoiceConfigs: undefined,
        storeConnectorId: undefined,
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
// A header that was detected as absent, rather than chosen, is checked again by the audit, which reads more records than
// the preview and can find one it missed.
export async function auditDataViewContent(
    dataViewConfig: DataViewConfig,
    byteLimit: number | undefined,
    onProgress: (recordCount: number, byteCount: number) => void,
    headersAreChosen = true
): Promise<AuditObjectContentResult> {
    const connectionLocalisedConfig = assertDefined(findConnectionLocalisedConfig(dataViewConfig.connectionId), 'No connection for this data view.');
    const connectionNodeConfig = assertDefined(dataViewConfig.connectionNodeConfig, 'No item for this data view.');
    const appliedReading = constructAppliedReading(assertDefined(dataViewConfig.sampleConfig, 'No sample for this data view.'));
    const itemIsFile = connectionLocalisedConfig.connectorConfig.itemTypeId === 'file'; // Only a file has an encoding and a value delimiter.
    const options: Omit<AuditObjectContentOptions, 'stopSignal' | 'supportsTransferableStreams'> = {
        byteLimit,
        chunkSize: undefined,
        dataFormatId: appliedReading.dataFormatId,
        encodingId: itemIsFile ? assertDefined(appliedReading.encodingId, 'No encoding in the sample.') : undefined,
        hasHeaders: headersAreChosen || appliedReading.hasHeaders === true ? appliedReading.hasHeaders === true : undefined,
        parserId: appliedReading.parserId, // The tool that read the sample, so the audit reads it the same way.
        path: constructItemPath(connectionNodeConfig),
        valueDelimiterId: itemIsFile ? assertDefined(appliedReading.valueDelimiterId, 'No value delimiter in the sample.') : undefined
    }; // The engine adds 'stopSignal' and 'supportsTransferableStreams', because they only exist in the worker.
    const { processRequest } = await establishEngineWorker();
    return (await processRequest('auditObjectContent', connectionLocalisedConfig, options, (callbackData) => {
        if (callbackData.typeId === 'progress') onProgress(Number(callbackData.properties.recordCount), Number(callbackData.properties.byteCount));
    })) as AuditObjectContentResult;
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
        const dataViewConfigs = await retrieveWorkspaceStoreRecords<DataViewConfig>('dataViews', signal);
        return dataViewConfigs.map((config) => restoreDataViewConfig(config));
    } catch (error) {
        if (signal.aborted) throw error; // A cancelled read is not a failure, so it keeps its abort reason.
        throw new AppError('Failed to retrieve data views.', 'dpuse-app.dataViews.retrieveDataViewConfigs', { typeId: 'handled' }, { cause: error });
    }
}

async function getDataViewConfig(id: string): Promise<DataViewConfig> {
    try {
        const dataViewConfig = await getWorkspaceStoreRecord<DataViewConfig>('dataViews', id);
        return restoreDataViewConfig(dataViewConfig);
    } catch (error) {
        throw new AppError('Failed to open this data view.', 'dpuse-app.dataViews.getDataViewConfig', { typeId: 'handled' }, { cause: error });
    }
}

// A stored record gets back the icon, which is not stored.
function restoreDataViewConfig(storedDataViewConfig: DataViewConfig): DataViewConfig {
    return { ...storedDataViewConfig, icon: dataViewIcon };
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
