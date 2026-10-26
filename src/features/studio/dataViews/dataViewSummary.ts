// What a data view's list card and detail panel both show: its progress through the steps and the connection behind it.
// Held in one place so the card, the panel, the connection's own panel and the open action always agree.

// ── DPUse Framework
import type { ConnectionConfig, ConnectionNodeConfig, ConnectorItemTypeId, DataViewConfig, LocaleId, LocalisedConfig } from '@dpuse/dpuse-shared';
import { constructConnectorCategoryConfig, constructConnectorItemTypeConfig, getComponentStatus, localiseConfig } from '@dpuse/dpuse-shared';

// ── Types ────────────────────────────────────────────────────────────────────────────────────────────────────────────

type DataViewProgress = Pick<DataViewConfig, 'connectionNodeConfig' | 'contentAuditConfig'>;

export interface DataViewStep {
    id: DataViewStepId;
    state: 'done' | 'pending';
}

export type DataViewStepId = 'connection' | 'content' | 'data' | 'item'; // Each id is also the route name of its step.

// A data view's connection, already localised. A connector such as Dropbox can have several connections ('Personal',
// 'Work'), so the connection's own name leads, and the connector's details describe what kind of connection it is.
export interface DataViewConnection {
    categoryLabel: string; // The connector's.
    connectorId: string; // Links to the connector in Setup.
    connectorLabel: string;
    icon?: null | string;
    iconDark?: null | string;
    itemTypeId: ConnectorItemTypeId | undefined; // The connector's kind of item. Undefined for a connector released before it said which.
    itemTypeLabel: string | undefined;
    label: string;
    status: ReturnType<typeof getComponentStatus> | undefined; // The connector's; undefined for general availability, which has no label.
    version: string; // The connector's.
}

// ── Actions ──────────────────────────────────────────────────────────────────────────────────────────────────────────

// The item's full path within its connection, as the engine takes it.
export function constructItemPath(connectionNodeConfig: ConnectionNodeConfig): string {
    const extension = connectionNodeConfig.extension == null ? '' : `.${connectionNodeConfig.extension}`;
    return `${connectionNodeConfig.folderPath}/${connectionNodeConfig.name}${extension}`;
}

export function constructDataViewConnection(connectionLocalisedConfig: LocalisedConfig<ConnectionConfig>, localeId: LocaleId): DataViewConnection {
    const { connectorConfig } = connectionLocalisedConfig;
    const itemTypeId = connectorConfig.itemTypeId as ConnectorItemTypeId | undefined; // Missing from a connector released before the field existed.
    return {
        categoryLabel: constructConnectorCategoryConfig(connectorConfig.categoryId, localeId).label,
        connectorId: connectorConfig.id,
        connectorLabel: localiseConfig(connectorConfig, localeId).label,
        icon: connectionLocalisedConfig.icon,
        iconDark: connectionLocalisedConfig.iconDark,
        itemTypeId,
        itemTypeLabel: itemTypeId ? constructConnectorItemTypeConfig(itemTypeId, localeId).label : undefined,
        label: connectionLocalisedConfig.label,
        status: connectorConfig.statusId ? getComponentStatus(connectorConfig.statusId, localeId) : undefined,
        version: connectorConfig.version
    };
}

// Exploring is left out: it never has to be finished, so it is never outstanding. The connection is always done, because
// a data view is only saved once its connection is chosen.
export function constructDataViewSteps(dataViewConfig: DataViewProgress): DataViewStep[] {
    return [
        { id: 'connection', state: 'done' },
        { id: 'item', state: dataViewConfig.connectionNodeConfig == null ? 'pending' : 'done' },
        { id: 'content', state: dataViewConfig.contentAuditConfig == null ? 'pending' : 'done' }
    ];
}

// The last step done, or exploring once every step is done. A data view opens on the last step done rather than the
// next one, because the audit is long-running and only starts when the user commits an item. Reopening an item that
// was never audited therefore lets the user check or change it first.
export function resolveCurrentDataViewStepId(dataViewConfig: DataViewProgress): DataViewStepId {
    const steps = constructDataViewSteps(dataViewConfig);
    return steps.every((step) => step.state === 'done') ? 'data' : (steps.findLast((step) => step.state === 'done')?.id ?? 'connection');
}
