// ── External Dependencies & Registrations
import type { RouteLocationNormalizedLoadedGeneric } from 'vue-router';
import { ref, shallowRef } from 'vue';

// ── DPUse Framework
import { AppError } from '@dpuse/dpuse-shared/errors';
import type { EngineCallbackData } from '@dpuse/dpuse-shared/component/module/engine';
import type { LocalisedConfig } from '@dpuse/dpuse-shared/locale';
import type { ConnectionConfig, ConnectionNodeConfig } from '@dpuse/dpuse-shared/component/connection';
import type { ContentAuditConfig, DataViewConfig, PreviewConfig } from '@dpuse/dpuse-shared/component/dataView';
import type {
    CreateObjectOptions,
    FindObjectOptions,
    FindObjectResult,
    GetRecordOptions,
    GetRecordResult,
    RetrieveRecordsOptions,
    UpsertRecordsOptions
} from '@dpuse/dpuse-shared/component/module/connector';

// ── Local Framework
import { reportAppError } from '@/observability/errorTracking';
import { useEngine } from '@/services/useEngine';
import { useStudioOptions } from '@/studio/useStudioOptions';

const options: UpsertRecordsOptions = {
    path: '/dpuMetaStore/dataViews',
    records: [
        {
            id: '1',
            label: { en: 'Data View 1' }
        },
        {
            id: '2',
            label: { en: 'Data View 2' }
        },
        {
            id: '3',
            label: { en: 'Data View 3' }
        },
        {
            id: '4',
            label: { en: 'Data View 4' }
        },
        {
            id: '5',
            label: { en: 'Data View 5' }
        }
    ]
};

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

export const NEW_DATA_VIEW_ID = '_new_';

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

export const activeConnectionConfig = shallowRef<LocalisedConfig<ConnectionConfig> | undefined>();
export const activeConnectionNodeConfigs = shallowRef<ConnectionNodeConfig[]>([]);

export const activeDataViewConfig = shallowRef<DataViewConfig | undefined>();

export const connectionLocalisedConfigs = shallowRef<LocalisedConfig<ConnectionConfig>[]>([]);
export const dataViewConfigs = shallowRef<DataViewConfig[] | undefined>();
export const dataViewConfigsAreRetrieved = ref(false);

// ── Composables ──────────────────────────────────────────────────────────────────────────────────────────────────────

const workflowOptionConfigs = useStudioOptions();
const dataViewIcon = workflowOptionConfigs.value[0].icon;

// ── Actions ──────────────────────────────────────────────────────────────────────────────────────────────────────────

export async function retrieveDataViewConfigs(metaStoreConnectionConfig: ConnectionConfig): Promise<void> {
    try {
        await establishDataViewObject(metaStoreConnectionConfig);

        const { processRequest } = await useEngine();

        await processRequest('upsertRecords', metaStoreConnectionConfig, options, (data: EngineCallbackData) => {
            console.log('UPSERT RECORDS', data);
        });

        const pendingDataViewConfigs: DataViewConfig[] = [];
        const retrieveRecordOptions: RetrieveRecordsOptions = { encodingId: '', path: '/dpuMetaStore/dataViews', valueDelimiterId: '', chunkSize: undefined }; // TODO: Implement paging.
        await processRequest('retrieveRecords', metaStoreConnectionConfig, retrieveRecordOptions, (data: EngineCallbackData) => {
            if (data.typeId === 'chunk') {
                pendingDataViewConfigs.push(...(data.properties.records as DataViewConfig[]).map((config) => ({ ...config, icon: dataViewIcon })));
            } else {
                dataViewConfigs.value = pendingDataViewConfigs;
                dataViewConfigsAreRetrieved.value = true;
            }
        });
    } catch (error) {
        dataViewConfigs.value = undefined;
        dataViewConfigsAreRetrieved.value = true;
        reportAppError(new AppError('Failed to retrieve data views.', 'dpuse-app.DataViewList.retrieveDataViewConfigs', { typeId: 'handled' }, { cause: error }));
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
        const getRecordOptions: GetRecordOptions = { path: '/dpuMetaStore/dataViews', id: dataViewId as string }; // TODO: Implement paging.
        const getRecordResult = (await processRequest('getRecord', metaStoreConnectionConfig, getRecordOptions)) as GetRecordResult;
        console.log(333, getRecordResult.record);
        return setActiveDataViewConfig(getRecordResult.record as unknown as DataViewConfig);
    } catch (error) {
        throw new AppError('Failed to retrieve data views.', 'dpuse-app.DataViewList.retrieveDataViewConfigs', { typeId: 'handled' }, { cause: error });
    }
}

export function setActiveDataViewConfig(dataViewConfig?: DataViewConfig): DataViewConfig {
    activeDataViewConfig.value = dataViewConfig || {
        id: NEW_DATA_VIEW_ID,
        label: {},
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
