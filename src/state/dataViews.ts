// ── External Dependencies & Registrations
import type { RouteLocationNormalizedLoadedGeneric } from 'vue-router';
import { computed, ref, shallowRef, watch } from 'vue';

// ── DPUse Framework
import { AppError } from '@dpuse/dpuse-shared/errors';
import type { EngineCallbackData } from '@dpuse/dpuse-shared/component/module/engine';
import type { ConnectionConfig, ConnectionNodeConfig } from '@dpuse/dpuse-shared/component/connection';
import type { ContentAuditConfig, DataViewConfig, PreviewConfig } from '@dpuse/dpuse-shared/component/dataView';
import type {
    CreateObjectOptions,
    FindObjectOptions,
    FindObjectResult,
    GetRecordOptions,
    GetRecordResult,
    RemoveRecordsOptions,
    RetrieveRecordsOptions,
    UpsertRecordsOptions
} from '@dpuse/dpuse-shared/component/module/connector';
import { localiseConfigs, type LocalisedConfig } from '@dpuse/dpuse-shared/locale';

// ── Local Framework
import { localeId } from '@/state/locale';
import { type AppFailure, raiseFailure } from '@/state/errors';
import { useEngine } from '@/services/useEngine';
import { useOptions } from '@/features/studio/options/useOptions';
import { activeMetaStoreConnectionConfig, connectionConfigs } from '@/state/session';

// const options: UpsertRecordsOptions = {
//     path: '/dpuMetaStore/dataViews',
//     records: [
//         {
//             id: '1',
//             label: { en: 'Data View 1' },
//             description: {
//                 en: 'This is a description that is clamped to two lines so we can test how it is truncated. This is a second sentence just to make absolutely certain it will be truncated.'
//             }
//         },
//         {
//             id: '2',
//             label: { en: 'Data View 2' },
//             description: {
//                 en: 'This is a description that is clamped to two lines so we can test how it is truncated. This is a second sentence just to make absolutely certain it will be truncated.'
//             }
//         },
//         {
//             id: '3',
//             label: { en: 'Data View 3' },
//             description: {
//                 en: 'This is a description that is clamped to two lines so we can test how it is truncated. This is a second sentence just to make absolutely certain it will be truncated.'
//             }
//         },
//         {
//             id: '4',
//             label: { en: 'Data View 4' },
//             description: {
//                 en: 'This is a description that is clamped to two lines so we can test how it is truncated. This is a second sentence just to make absolutely certain it will be truncated.'
//             }
//         },
//         {
//             id: '5',
//             label: { en: 'Data View 5' },
//             description: {
//                 en: 'This is a description that is clamped to two lines so we can test how it is truncated. This is a second sentence just to make absolutely certain it will be truncated.'
//             }
//         }
//     ]
// };

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

export const NEW_DATA_VIEW_ID = '_new_';

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

const workflowOptionConfigs = useOptions();
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

        // await processRequest('upsertRecords', metaStoreConnectionConfig, options, (data: EngineCallbackData) => {
        //     console.log('UPSERT RECORDS', data);
        // });

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

        if (dataViewId === NEW_DATA_VIEW_ID) {
            return setActiveDataViewConfig();
        }
        const { processRequest } = await useEngine();
        const getRecordOptions: GetRecordOptions = { path: '/dpuMetaStore/dataViews', id: dataViewId }; // TODO: Implement paging.
        const getRecordResult = (await processRequest('getRecord', metaStoreConnectionConfig, getRecordOptions)) as GetRecordResult;
        return setActiveDataViewConfig(getRecordResult.record as unknown as DataViewConfig);
    } catch (error) {
        throw new AppError('Failed to retrieve data views.', 'dpuse-app.dataViews.retrieveDataViewConfigs', { typeId: 'handled' }, { cause: error });
    }
}

export async function removeDataViewRecord(metaStoreConnectionConfig: ConnectionConfig | undefined, id: string): Promise<void> {
    try {
        if (metaStoreConnectionConfig == null) throw new Error('Unable to establish Data View, no connection configuration.');

        await establishDataViewObject(metaStoreConnectionConfig);

        const { processRequest } = await useEngine();
        const removeRecordOptions: RemoveRecordsOptions = { path: '/dpuMetaStore/dataViews', keys: [id] }; // TODO: Implement paging.
        await processRequest('removeRecords', metaStoreConnectionConfig, removeRecordOptions);
    } catch (error) {
        throw new AppError('Failed to remove data view.', 'dpuse-app.dataViews.removeDataViewRecord', { typeId: 'handled' }, { cause: error });
    }
}

export function setActiveDataViewConfig(dataViewConfig?: DataViewConfig): DataViewConfig {
    activeDataViewConfig.value = dataViewConfig ?? {
        id: NEW_DATA_VIEW_ID,
        label: { en: 'My New Data View' },
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
    };
    return activeDataViewConfig.value;
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
    if (findObjectResult.path == null) {
        const createObjectOptions: CreateObjectOptions = { path: '/dpuMetaStore/dataViews', structure: 'id' };
        await processRequest('createObject', metaStoreConnectionConfig, createObjectOptions);
    }
}

function getActiveDataViewConfig(): DataViewConfig {
    if (!activeDataViewConfig.value) throw new Error("'activeDataViewConfig' is not initialized.");
    return activeDataViewConfig.value;
}
