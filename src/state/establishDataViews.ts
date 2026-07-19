// ── External Dependencies & Registrations
import type { RouteLocationNormalizedLoadedGeneric } from 'vue-router';
import { shallowRef } from 'vue';

// ── DPUse Framework
import { AppError } from '@dpuse/dpuse-shared/errors';
import type { LocalisedConfig } from '@dpuse/dpuse-shared/locale';
import type { ConnectionConfig, ConnectionNodeConfig } from '@dpuse/dpuse-shared/component/connection';
import type { ContentAuditConfig, DataViewConfig, PreviewConfig, RelationshipsAuditConfig } from '@dpuse/dpuse-shared/component/dataView';
import type { CreateObjectOptions, FindObjectOptions, FindObjectResult, GetRecordOptions, GetRecordResult } from '@dpuse/dpuse-shared/component/module/connector';

// ── Local Framework
import { useEngine } from '@/services/useEngine';

// const options: UpsertRecordsOptions = {
//     path: '/dpuMetaStore/dataViews',
//     records: [
//         {
//             id: '1',
//             label: 'Data View 1',
//             icon: "<svg viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='1.25' stroke-linecap='round' stroke-linejoin='round' class='lucide lucide-database-zap-icon lucide-database-zap'><ellipse cx='12' cy='5' rx='9' ry='3'/><path d='M3 5V19A9 3 0 0 0 15 21.84'/><path d='M21 5V8'/><path d='M21 12L18 17H22L19 22'/><path d='M3 12A9 3 0 0 0 14.59 14.87'/></svg>",
//             iconColor: '#4d83e0'
//         },
//         {
//             id: '2',
//             label: 'Data View 2',
//             icon: "<svg viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='1.25' stroke-linecap='round' stroke-linejoin='round' class='lucide lucide-database-zap-icon lucide-database-zap'><ellipse cx='12' cy='5' rx='9' ry='3'/><path d='M3 5V19A9 3 0 0 0 15 21.84'/><path d='M21 5V8'/><path d='M21 12L18 17H22L19 22'/><path d='M3 12A9 3 0 0 0 14.59 14.87'/></svg>",
//             iconColor: '#4d83e0'
//         },
//         {
//             id: '3',
//             label: 'Data View 3',
//             icon: "<svg viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='1.25' stroke-linecap='round' stroke-linejoin='round' class='lucide lucide-database-zap-icon lucide-database-zap'><ellipse cx='12' cy='5' rx='9' ry='3'/><path d='M3 5V19A9 3 0 0 0 15 21.84'/><path d='M21 5V8'/><path d='M21 12L18 17H22L19 22'/><path d='M3 12A9 3 0 0 0 14.59 14.87'/></svg>",
//             iconColor: '#4d83e0'
//         },
//         {
//             id: '4',
//             label: 'Data View 4',
//             icon: "<svg viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='1.25' stroke-linecap='round' stroke-linejoin='round' class='lucide lucide-database-zap-icon lucide-database-zap'><ellipse cx='12' cy='5' rx='9' ry='3'/><path d='M3 5V19A9 3 0 0 0 15 21.84'/><path d='M21 5V8'/><path d='M21 12L18 17H22L19 22'/><path d='M3 12A9 3 0 0 0 14.59 14.87'/></svg>",
//             iconColor: '#4d83e0'
//         },
//         {
//             id: '5',
//             label: 'Data View 5',
//             icon: "<svg viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='1.25' stroke-linecap='round' stroke-linejoin='round' class='lucide lucide-database-zap-icon lucide-database-zap'><ellipse cx='12' cy='5' rx='9' ry='3'/><path d='M3 5V19A9 3 0 0 0 15 21.84'/><path d='M21 5V8'/><path d='M21 12L18 17H22L19 22'/><path d='M3 12A9 3 0 0 0 14.59 14.87'/></svg>",
//             iconColor: '#4d83e0'
//         }
//     ]
// };
// await processRequest('upsertRecords', connectionConfig, options, (data: EngineCallbackData) => {
//     console.log('UPSERT RECORDS', data);
// });

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

export const NEW_DATA_VIEW_ID = '_new_';

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

export const activeConnectionConfig = shallowRef<LocalisedConfig<ConnectionConfig> | undefined>();
export const activeConnectionNodeConfigs = shallowRef<ConnectionNodeConfig[]>([]);

export const activeDataViewConfig = shallowRef<DataViewConfig | undefined>();

export const connectionLocalisedConfigs = shallowRef<LocalisedConfig<ConnectionConfig>[]>([]);

// ── Actions ──────────────────────────────────────────────────────────────────────────────────────────────────────────

export async function establishDataView(metaStoreConnectionConfig: ConnectionConfig | undefined, route: RouteLocationNormalizedLoadedGeneric): Promise<DataViewConfig> {
    try {
        if (metaStoreConnectionConfig == null) throw new Error('Unable to establish Data View, no connection configuration.');

        await establishDataViewsObject(metaStoreConnectionConfig);

        const dataViewId = route.params.dataViewId as string;

        if (dataViewId === NEW_DATA_VIEW_ID) {
            return setActiveDataViewConfig();
        }
        const { processRequest } = await useEngine();
        const getRecordOptions: GetRecordOptions = { path: '/dpuMetaStore/dataViews', id: dataViewId as string }; // TODO: Implement paging.
        const getRecordResult = (await processRequest('getRecord', metaStoreConnectionConfig, getRecordOptions)) as GetRecordResult;
        return setActiveDataViewConfig(getRecordResult.record as unknown as DataViewConfig);
    } catch (error) {
        throw new AppError('Failed to retrieve data views.', 'dpuse-app.DataViewList.retrieveDataViews', { typeId: 'handled' }, { cause: error });
    }
}

export async function establishDataViewsObject(metaStoreConnectionConfig: ConnectionConfig): Promise<void> {
    const { processRequest } = await useEngine();
    const findObjectOptions: FindObjectOptions = { storeId: 'dpuMetaStore', nodeId: 'dataViews' };
    const findObjectResult = (await processRequest('findObject', metaStoreConnectionConfig, findObjectOptions)) as FindObjectResult;
    if (findObjectResult.path == null) {
        const createObjectOptions: CreateObjectOptions = { path: '/dpuMetaStore/dataViews', structure: 'id' };
        await processRequest('createObject', metaStoreConnectionConfig, createObjectOptions);
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

export function setRelationshipsAuditConfig(relationshipsAuditConfig?: RelationshipsAuditConfig): void {
    const activeDataViewConfig = getActiveDataViewConfig();
    activeDataViewConfig.relationshipsAuditConfig = relationshipsAuditConfig;
}

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

function getActiveDataViewConfig(): DataViewConfig {
    if (!activeDataViewConfig.value) throw new Error("'activeDataViewConfig' is not initialized.");
    return activeDataViewConfig.value;
}
