// ── External Dependencies & Registrations
import { computed, type MaybeRefOrGetter, toValue } from 'vue';
import { useMutation, type UseMutationReturnType, useQuery, type UseQueryReturnType } from '@tanstack/vue-query';

// ── DPUse Framework
import { AppError, localiseConfigs } from '@dpuse/dpuse-shared';
import type { ConnectionConfig, DataViewConfig, LocalisedConfig } from '@dpuse/dpuse-shared';

// ── Local Framework
import { assertDefined } from '@/utilities/index.ts';
import { localeId } from '@/state/locale';
import { queryClient } from '@/services/queryClient';
import { useStudioOptions } from '@/features/studio/options/useStudioOptions';
import { activeMetaStoreConnectionConfig, connectionConfigs } from '@/state/session';
import {
    constructMetaStoreListKey,
    constructMetaStoreRecordKey,
    getMetaStoreRecord,
    removeMetaStoreRecord,
    retrieveMetaStoreRecords,
    upsertMetaStoreRecord
} from '@/services/metaStore';

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

const DATA_VIEW_LIST_KEY = constructMetaStoreListKey('dataViews');
const UNTITLED_DATA_VIEW_LABEL = { en: 'Untitled Data View', es: 'Vista de Datos sin Título' }; // Stored with the record, so it carries every language rather than reading the current one.

// ── Derived State ────────────────────────────────────────────────────────────────────────────────────────────────────

export const connectionLocalisedConfigs = computed((): LocalisedConfig<ConnectionConfig>[] => localiseConfigs<ConnectionConfig>(connectionConfigs.value, localeId.value, true));

// ── Composables ──────────────────────────────────────────────────────────────────────────────────────────────────────

const workflowOptionConfigs = useStudioOptions();
const dataViewIcon = workflowOptionConfigs.value[0].icon;

// Read once and then kept current by the mutations below, which write every change into the cache as it is saved.
export function useDataViews(): UseQueryReturnType<DataViewConfig[], Error> {
    return useQuery({
        queryKey: DATA_VIEW_LIST_KEY,
        queryFn: retrieveDataViewConfigs,
        enabled: () => activeMetaStoreConnectionConfig.value != null,
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
            enabled: id != null && activeMetaStoreConnectionConfig.value != null,
            initialData: () => queryClient.getQueryData<DataViewConfig[]>(DATA_VIEW_LIST_KEY)?.find((config) => config.id === id),
            initialDataUpdatedAt: () => queryClient.getQueryState(DATA_VIEW_LIST_KEY)?.dataUpdatedAt,
            staleTime: Infinity
        };
    });
}

// Saved as soon as it is added, so every step's URL holds a real id and a reload always has a record to restore.
export function useCreateDataView(): UseMutationReturnType<DataViewConfig, Error, void, unknown> {
    return useMutation({ mutationFn: createDataViewConfig, onSuccess: writeDataViewConfigToCache });
}

export function useUpdateDataView(): UseMutationReturnType<DataViewConfig, Error, DataViewConfig, unknown> {
    return useMutation({ mutationFn: saveDataViewConfig, onSuccess: writeDataViewConfigToCache });
}

export function useDeleteDataView(): UseMutationReturnType<void, Error, string, unknown> {
    return useMutation({
        mutationFn: removeDataViewConfig,
        onSuccess: (_result, id) => {
            removeDataViewConfigFromCache(id);
        }
    });
}

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

async function retrieveDataViewConfigs(): Promise<DataViewConfig[]> {
    try {
        const dataViewConfigs = await retrieveMetaStoreRecords<DataViewConfig>('dataViews');
        return dataViewConfigs.map((config) => ({ ...config, icon: dataViewIcon }));
    } catch (error) {
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

async function saveDataViewConfig(dataViewConfig: DataViewConfig): Promise<DataViewConfig> {
    try {
        await upsertMetaStoreRecord('dataViews', { ...dataViewConfig, icon: null, iconDark: null }); // The icon is added on reading, so it is not stored.
        return { ...dataViewConfig, icon: dataViewIcon };
    } catch (error) {
        throw new AppError('Failed to save data view.', 'dpuse-app.dataViews.saveDataViewConfig', { typeId: 'handled' }, { cause: error });
    }
}

async function removeDataViewConfig(id: string): Promise<void> {
    try {
        await removeMetaStoreRecord('dataViews', id);
    } catch (error) {
        throw new AppError('Failed to remove data view.', 'dpuse-app.dataViews.removeDataViewConfig', { typeId: 'handled' }, { cause: error });
    }
}

// A list not read yet is left unread: it will hold the change when it is read.
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
