// ── External Dependencies & Registrations
import type { RouteLocationNormalizedLoadedGeneric } from 'vue-router';
import { computed, ref, shallowRef, watch } from 'vue';

// ── DPUse Framework
import { AppError, localiseConfigs } from '@dpuse/dpuse-shared';
import type {
    ConnectionConfig,
    ConnectionNodeConfig,
    ContentAuditConfig,
    CreateObjectOptions,
    DataViewConfig,
    EngineCallbackData,
    FindObjectOptions,
    FindObjectResult,
    GetRecordOptions,
    GetRecordResult,
    LocalisedConfig,
    PreviewConfig,
    RemoveRecordsOptions,
    RetrieveRecordsOptions,
    UpsertRecordsOptions
} from '@dpuse/dpuse-shared';

// ── Local Framework
import { localeId } from '@/state/locale';
import { useEngine } from '@/services/useEngine';
import { useStudioOptions } from '@/features/studio/options/useStudioOptions';
import { activeMetaStoreConnectionConfig, connectionConfigs } from '@/state/session';
import { type AppFailure, raiseFailure } from '@/state/errors';

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

const UNTITLED_DATA_VIEW_LABEL = { en: 'Untitled Data View', es: 'Vista de Datos sin Título' }; // Stored with the record, so it carries every language rather than reading the current one.

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

export const activeConnectionConfig = shallowRef<LocalisedConfig<ConnectionConfig> | undefined>();
export const activeConnectionNodeConfigs = shallowRef<ConnectionNodeConfig[]>([]);

export const activeDataViewConfig = shallowRef<DataViewConfig | undefined>();

export const dataViewConfigs = shallowRef<DataViewConfig[]>([]);
// True once a retrieval has completed — distinct from 'dataViewConfigs' being empty, since the configurations start
// empty (busy) rather than confirmed-empty. Await 'useDataViewsReady' rather than watching this directly.
export const dataViewRetrievalSucceeded = ref(false);
// True once a retrieval has failed, letting the UI show a real failure rather than leaving the list stuck in its busy
// state forever. Both flags are reset when the meta store connection is cleared.
export const dataViewRetrievalFailed = ref(false);
// The failure behind the flag above. The flag settles the grid and releases the awaits gated on retrieval; this is
// what tells the user why the list they are looking at came back empty. Cleared whenever a retrieval starts.
export const dataViewRetrievalFailure = shallowRef<AppFailure | undefined>();

// ── Derived State ────────────────────────────────────────────────────────────────────────────────────────────────────

export const connectionLocalisedConfigs = computed((): LocalisedConfig<ConnectionConfig>[] => localiseConfigs<ConnectionConfig>(connectionConfigs.value, localeId.value, true));

export const dataViewLocalisedConfigs = computed((): LocalisedConfig<DataViewConfig>[] => localiseConfigs<DataViewConfig>(dataViewConfigs.value, localeId.value));

// ── Composables ──────────────────────────────────────────────────────────────────────────────────────────────────────

const workflowOptionConfigs = useStudioOptions();
const dataViewIcon = workflowOptionConfigs.value[0].icon;

// ── Side Effects ─────────────────────────────────────────────────────────────────────────────────────────────────────

// Retrieval is driven from this module rather than from a component so that every consumer — 'useDataViewsReady'
// included — shares one retrieval regardless of which of them mounts first, mirroring how configMonitor drives the
// session configurations. Registered once at import and app-lifetime, as with the watchers in '@/state/session'.
//
// On a page refresh the meta store connection configuration is not available until the configurations arrive, so this
// waits for it rather than retrieving immediately.
// eslint-disable-next-line unicorn/no-top-level-side-effects -- see comment above
watch(
    activeMetaStoreConnectionConfig,
    (newActiveMetaStoreConnectionConfig) => {
        if (newActiveMetaStoreConnectionConfig) {
            if (!dataViewRetrievalSucceeded.value) void retrieveDataViewConfigs(newActiveMetaStoreConnectionConfig);
        } else {
            dataViewConfigs.value = [];
            dataViewRetrievalSucceeded.value = false;
            dataViewRetrievalFailed.value = false;
            dataViewRetrievalFailure.value = undefined;
        }
    },
    { immediate: true }
);

// ── Actions ──────────────────────────────────────────────────────────────────────────────────────────────────────────

export async function retrieveDataViewConfigs(metaStoreConnectionConfig: ConnectionConfig): Promise<void> {
    dataViewRetrievalFailed.value = false;
    dataViewRetrievalFailure.value = undefined;
    try {
        await establishDataViewObject(metaStoreConnectionConfig);

        const { processRequest } = await useEngine();

        const pendingDataViewConfigs: DataViewConfig[] = [];
        const retrieveRecordOptions: RetrieveRecordsOptions = { encodingId: '', path: '/dpuMetaStore/dataViews', valueDelimiterId: '', chunkSize: undefined }; // TODO: Implement paging.
        await processRequest('retrieveRecords', metaStoreConnectionConfig, retrieveRecordOptions, (data: EngineCallbackData) => {
            if (data.typeId === 'chunk') {
                pendingDataViewConfigs.push(...(data.properties.records as DataViewConfig[]).map((config) => ({ ...config, icon: dataViewIcon })));
            } else {
                dataViewConfigs.value = pendingDataViewConfigs;
                dataViewRetrievalSucceeded.value = true;
            }
        });
    } catch (error) {
        dataViewConfigs.value = [];
        dataViewRetrievalFailed.value = true;
        dataViewRetrievalFailure.value = raiseFailure(
            new AppError('Failed to retrieve data views.', 'dpuse-app.dataViews.retrieveDataViewConfigs', { typeId: 'handled' }, { cause: error })
        );
    }
}

export async function getDataViewRecord(metaStoreConnectionConfig: ConnectionConfig | undefined, route: RouteLocationNormalizedLoadedGeneric): Promise<DataViewConfig> {
    try {
        if (metaStoreConnectionConfig == null) throw new Error('Unable to establish Data View, no connection configuration.');

        await establishDataViewObject(metaStoreConnectionConfig);

        const dataViewId = route.params.dataViewId as string;
        const { processRequest } = await useEngine();
        const getRecordOptions: GetRecordOptions = { path: '/dpuMetaStore/dataViews', id: dataViewId }; // TODO: Implement paging.
        const getRecordResult = (await processRequest('getRecord', metaStoreConnectionConfig, getRecordOptions)) as GetRecordResult;
        return setActiveDataViewConfig(getRecordResult.record as unknown as DataViewConfig);
    } catch (error) {
        throw new AppError('Failed to retrieve data view.', 'dpuse-app.dataViews.getDataViewRecord', { typeId: 'handled' }, { cause: error });
    }
}

// Saved as soon as it is added, so every step's URL holds a real id and a reload always has a record to restore.
export async function createDataViewRecord(metaStoreConnectionConfig: ConnectionConfig | undefined): Promise<DataViewConfig> {
    const dataViewConfig = await saveDataViewRecord(metaStoreConnectionConfig, {
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
    return setActiveDataViewConfig(dataViewConfig);
}

// Saves the data view as each step is committed or after an edit, so a reload restores it from the store.
export async function saveDataViewRecord(metaStoreConnectionConfig: ConnectionConfig | undefined, dataViewConfig: DataViewConfig): Promise<DataViewConfig> {
    try {
        if (metaStoreConnectionConfig == null) throw new Error('Unable to establish Data View, no connection configuration.');

        await establishDataViewObject(metaStoreConnectionConfig);

        const { processRequest } = await useEngine();
        const upsertRecordsOptions: UpsertRecordsOptions = { path: '/dpuMetaStore/dataViews', records: [{ ...dataViewConfig, icon: null, iconDark: null }] }; // The icon is added on retrieval, so it is not stored.
        await processRequest('upsertRecords', metaStoreConnectionConfig, upsertRecordsOptions);

        if (activeDataViewConfig.value?.id === dataViewConfig.id) activeDataViewConfig.value = dataViewConfig; // A data view edited from the list leaves the one being built alone.
        const listedDataViewConfig = { ...dataViewConfig, icon: dataViewIcon };
        dataViewConfigs.value = dataViewConfigs.value.some((config) => config.id === dataViewConfig.id)
            ? dataViewConfigs.value.map((config) => (config.id === dataViewConfig.id ? listedDataViewConfig : config))
            : [...dataViewConfigs.value, listedDataViewConfig];
        return dataViewConfig;
    } catch (error) {
        throw new AppError('Failed to save data view.', 'dpuse-app.dataViews.saveDataViewRecord', { typeId: 'handled' }, { cause: error });
    }
}

export async function removeDataViewRecord(metaStoreConnectionConfig: ConnectionConfig | undefined, id: string): Promise<void> {
    try {
        if (metaStoreConnectionConfig == null) throw new Error('Unable to establish Data View, no connection configuration.');

        await establishDataViewObject(metaStoreConnectionConfig);

        const { processRequest } = await useEngine();
        const removeRecordOptions: RemoveRecordsOptions = { path: '/dpuMetaStore/dataViews', keys: [id] }; // TODO: Implement paging.
        await processRequest('removeRecords', metaStoreConnectionConfig, removeRecordOptions);

        dataViewConfigs.value = dataViewConfigs.value.filter((config) => config.id !== id);
        if (activeDataViewConfig.value?.id === id) activeDataViewConfig.value = undefined;
    } catch (error) {
        throw new AppError('Failed to remove data view.', 'dpuse-app.dataViews.removeDataViewRecord', { typeId: 'handled' }, { cause: error });
    }
}

export function setActiveDataViewConfig(dataViewConfig: DataViewConfig): DataViewConfig {
    activeDataViewConfig.value = dataViewConfig;
    return dataViewConfig;
}

export function setConnectionId(connectionId?: string): void {
    const activeDataViewConfig = getActiveDataViewConfig();
    activeDataViewConfig.connectionId = connectionId;
    activeDataViewConfig.connectionNodeConfig = undefined;
    activeDataViewConfig.previewConfig = undefined;
    activeDataViewConfig.contentAuditConfig = undefined;
    activeDataViewConfig.relationshipsAuditConfig = undefined;
}

export function setConnectionNodeConfig(connectionNodeConfig?: ConnectionNodeConfig): void {
    const activeDataViewConfig = getActiveDataViewConfig();
    activeDataViewConfig.connectionNodeConfig = connectionNodeConfig;
    activeDataViewConfig.previewConfig = undefined;
    activeDataViewConfig.contentAuditConfig = undefined;
    activeDataViewConfig.relationshipsAuditConfig = undefined;
}

export function setPreviewConfig(previewConfig?: PreviewConfig): void {
    const activeDataViewConfig = getActiveDataViewConfig();
    activeDataViewConfig.previewConfig = previewConfig;
    activeDataViewConfig.contentAuditConfig = undefined;
    activeDataViewConfig.relationshipsAuditConfig = undefined;
}

export function setContentAuditConfig(contentAuditConfig?: ContentAuditConfig): void {
    const activeDataViewConfig = getActiveDataViewConfig();
    activeDataViewConfig.contentAuditConfig = contentAuditConfig;
    activeDataViewConfig.relationshipsAuditConfig = undefined;
}

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

async function establishDataViewObject(metaStoreConnectionConfig: ConnectionConfig): Promise<void> {
    const { processRequest } = await useEngine();
    const findObjectOptions: FindObjectOptions = { storeId: 'dpuMetaStore', nodeId: 'dataViews' };
    const findObjectResult = (await processRequest('findObject', metaStoreConnectionConfig, findObjectOptions)) as FindObjectResult;
    if (findObjectResult.path != null) return;

    const createObjectOptions: CreateObjectOptions = { path: '/dpuMetaStore/dataViews', structure: 'id' };
    await processRequest('createObject', metaStoreConnectionConfig, createObjectOptions);
}

function getActiveDataViewConfig(): DataViewConfig {
    if (!activeDataViewConfig.value) throw new Error("'activeDataViewConfig' is not initialized.");
    return activeDataViewConfig.value;
}
