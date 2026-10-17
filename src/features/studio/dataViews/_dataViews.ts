// ── External Dependencies & Registrations
import { type MaybeRefOrGetter, toValue } from 'vue';
import { useMutation, type UseMutationReturnType, useQuery, type UseQueryReturnType } from '@tanstack/vue-query';

// ── DPUse Framework
import { AppError } from '@dpuse/dpuse-shared';
import type { DataViewConfig } from '@dpuse/dpuse-shared';

// ── Local Framework
import { assertDefined } from '@/utilities/index.ts';
import { configStatus } from '@/state/configs';
import { queryClient } from '@/services/queryClient';
import { useStudioOptions } from '@/features/studio/options/useStudioOptions';
import {
    constructMetaStoreListKey,
    constructMetaStoreRecordKey,
    getMetaStoreRecord,
    metaStoreId,
    removeMetaStoreRecord,
    retrieveMetaStoreRecords,
    upsertMetaStoreRecord
} from '@/services/metaStore';

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

const DATA_VIEW_LIST_KEY = constructMetaStoreListKey('dataViews');
const UNTITLED_DATA_VIEW_LABEL = { en: 'Untitled Data View', es: 'Vista de datos sin título' }; // Stored with the record, so it carries every language rather than reading the current one.

// ── Composables ──────────────────────────────────────────────────────────────────────────────────────────────────────

// Read once and then kept current by the data view mutations, which write every change into the cache as it is saved.
// The read takes TanStack Query's abort signal, so cancelling it, or leaving the list while it loads, stops the wait.
export function useDataViews(): UseQueryReturnType<DataViewConfig[], Error> {
    return useQuery({
        queryKey: DATA_VIEW_LIST_KEY,
        queryFn: ({ signal }) => retrieveDataViewConfigs(signal),
        enabled: () => configStatus.value.typeId === 'ready', // Fails, rather than waits, when the meta store connector is missing.
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
            queryKey: constructMetaStoreRecordKey('dataViews', id),
            queryFn: () => getDataViewConfig(assertDefined(id)),
            enabled: id != null && configStatus.value.typeId === 'ready',
            initialData: () => queryClient.getQueryData<DataViewConfig[]>(DATA_VIEW_LIST_KEY)?.find((config) => config.id === id),
            initialDataUpdatedAt: () => queryClient.getQueryState(DATA_VIEW_LIST_KEY)?.dataUpdatedAt,
            staleTime: Infinity
        };
    });
}

// Saved as soon as it is added, so every step's URL holds a real id and a reload always has a record to restore.
export function useCreateDataView(): UseMutationReturnType<DataViewConfig, Error, void, unknown> {
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

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

async function retrieveDataViewConfigs(signal: AbortSignal): Promise<DataViewConfig[]> {
    try {
        const dataViewConfigs = await retrieveMetaStoreRecords<DataViewConfig>('dataViews', signal);
        return dataViewConfigs.map((config) => ({ ...config, icon: dataViewIcon }));
    } catch (error) {
        if (signal.aborted) throw error; // A cancelled read is not a failure, so it keeps its abort reason.
        throw new AppError('Failed to retrieve data views.', 'dpuse-app.dataViews.retrieveDataViewConfigs', { typeId: 'handled' }, { cause: error });
    }
}

async function getDataViewConfig(id: string): Promise<DataViewConfig> {
    try {
        const dataViewConfig = await getMetaStoreRecord<DataViewConfig>('dataViews', id);
        return { ...dataViewConfig, icon: dataViewIcon };
    } catch (error) {
        throw new AppError('Failed to open this data view.', 'dpuse-app.dataViews.getDataViewConfig', { typeId: 'handled' }, { cause: error });
    }
}

function createDataViewConfig(): Promise<DataViewConfig> {
    return saveDataViewConfig({
        id: crypto.randomUUID(),
        label: UNTITLED_DATA_VIEW_LABEL,
        description: {},
        icon: null,
        iconDark: null,
        typeId: 'dataView',
        connectionId: undefined,
        connectionNodeConfig: undefined,
        previewConfig: undefined,
        contentAuditConfig: undefined,
        relationshipsAuditConfig: undefined,
        status: null,
        statusId: null,
        firstCreatedAt: null,
        lastUpdatedAt: null
    });
}

// The cache is written here rather than in 'onSuccess', because only here is the store the change went to known.
async function saveDataViewConfig(dataViewConfig: DataViewConfig): Promise<DataViewConfig> {
    try {
        const storeId = await upsertMetaStoreRecord('dataViews', { ...dataViewConfig, icon: null, iconDark: null }); // The icon is added on reading, so it is not stored.
        const savedDataViewConfig = { ...dataViewConfig, icon: dataViewIcon };
        if (storeId === metaStoreId.value) writeDataViewConfigToCache(savedDataViewConfig); // A save that finishes after signing in or out stays out of the next user's lists.
        return savedDataViewConfig;
    } catch (error) {
        throw new AppError('Failed to save data view.', 'dpuse-app.dataViews.saveDataViewConfig', { typeId: 'handled' }, { cause: error });
    }
}

async function removeDataViewConfig(id: string): Promise<void> {
    try {
        const storeId = await removeMetaStoreRecord('dataViews', id);
        if (storeId === metaStoreId.value) removeDataViewConfigFromCache(id); // As for a save.
    } catch (error) {
        throw new AppError('Failed to remove data view.', 'dpuse-app.dataViews.removeDataViewConfig', { typeId: 'handled' }, { cause: error });
    }
}

// A list not loaded yet is left alone. Loading it later picks up the change.
function writeDataViewConfigToCache(dataViewConfig: DataViewConfig): void {
    queryClient.setQueryData(constructMetaStoreRecordKey('dataViews', dataViewConfig.id), dataViewConfig);
    queryClient.setQueryData<DataViewConfig[]>(DATA_VIEW_LIST_KEY, (dataViewConfigs) => {
        if (dataViewConfigs == null) return dataViewConfigs;
        return dataViewConfigs.some((config) => config.id === dataViewConfig.id)
            ? dataViewConfigs.map((config) => (config.id === dataViewConfig.id ? dataViewConfig : config))
            : [...dataViewConfigs, dataViewConfig];
    });
}

function removeDataViewConfigFromCache(id: string): void {
    queryClient.setQueryData<DataViewConfig[]>(DATA_VIEW_LIST_KEY, (dataViewConfigs) => dataViewConfigs?.filter((config) => config.id !== id));
    queryClient.removeQueries({ queryKey: constructMetaStoreRecordKey('dataViews', id), exact: true });
}
