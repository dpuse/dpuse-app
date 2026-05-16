// External Dependencies
import { shallowRef } from 'vue';

// DPUse Framework
import type { LocalisedConfig } from '@dpuse/dpuse-shared/locale';
import type { ConnectionConfig, ConnectionNodeConfig } from '@dpuse/dpuse-shared/component/connection';
import type { ContentAuditConfig, DataViewConfig, PreviewConfig, RelationshipsAuditConfig } from '@dpuse/dpuse-shared/component/dataView';

// Constants ───────────────────────────────────────────────────────────────────────────────────────────────────────────

const NEW_DATA_VIEW_ID = '_new_';

// State ───────────────────────────────────────────────────────────────────────────────────────────────────────────────

export const activeConnectionConfig = shallowRef<LocalisedConfig<ConnectionConfig> | undefined>();
export const activeDataViewConfig = shallowRef<DataViewConfig | undefined>();

// Actions ─────────────────────────────────────────────────────────────────────────────────────────────────────────────

export function setActiveDataViewConfig(dataViewConfig?: DataViewConfig): void {
    activeDataViewConfig.value = dataViewConfig || {
        id: NEW_DATA_VIEW_ID,
        label: {},
        description: {},
        icon: null,
        iconDark: null,
        iconNeutral: null,
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

// Helpers ─────────────────────────────────────────────────────────────────────────────────────────────────────────────

function getActiveDataViewConfig(): DataViewConfig {
    if (!activeDataViewConfig.value) throw new Error("'activeDataViewConfig' is not initialized.");
    return activeDataViewConfig.value;
}
