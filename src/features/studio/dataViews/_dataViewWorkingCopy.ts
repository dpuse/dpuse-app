// ── DPUse Framework
import type { DataViewConfig } from '@dpuse/dpuse-shared';

// ── Local Framework
import { constructChosenColumnDataTypeIds } from './_dataViewColumns';
import { constructItemPath } from './dataViewSummary';

// ── Types ────────────────────────────────────────────────────────────────────────────────────────────────────────────

// The user's edits to a data view's definition, held apart from the saved data view until Save, so the saved one stays
// whole and Discard loses nothing. The label and description are left out, because they save at once.
export type DataViewWorkingCopy = Pick<DataViewConfig, 'auditSummaryConfig' | 'columnSetConfig' | 'connectionId' | 'connectionNodeConfig' | 'id' | 'previewConfig' | 'relationshipsAuditConfig'>;

// ── Actions ──────────────────────────────────────────────────────────────────────────────────────────────────────────

export function constructDataViewWorkingCopy(dataViewConfig: DataViewConfig): DataViewWorkingCopy {
    return {
        auditSummaryConfig: dataViewConfig.auditSummaryConfig,
        columnSetConfig: dataViewConfig.columnSetConfig,
        connectionId: dataViewConfig.connectionId,
        connectionNodeConfig: dataViewConfig.connectionNodeConfig,
        id: dataViewConfig.id,
        previewConfig: dataViewConfig.previewConfig,
        relationshipsAuditConfig: dataViewConfig.relationshipsAuditConfig
    };
}

// Every field is set by name, because a field cleared in the working copy is missing once stored, and spreading it would
// bring back the saved value.
export function applyDataViewWorkingCopy(dataViewConfig: DataViewConfig, workingCopy: DataViewWorkingCopy | undefined): DataViewConfig {
    if (workingCopy == null) return dataViewConfig;
    return {
        ...dataViewConfig,
        auditSummaryConfig: workingCopy.auditSummaryConfig,
        columnSetConfig: workingCopy.columnSetConfig,
        connectionId: workingCopy.connectionId,
        connectionNodeConfig: workingCopy.connectionNodeConfig,
        previewConfig: workingCopy.previewConfig,
        relationshipsAuditConfig: workingCopy.relationshipsAuditConfig
    };
}

// Compares what the user decides, not when things were read, so going through a step without changing anything leaves
// no unsaved changes behind.
export function isSameDataViewDefinition(leftDataViewConfig: DataViewConfig, rightDataViewConfig: DataViewConfig): boolean {
    return constructDefinitionKey(leftDataViewConfig) === constructDefinitionKey(rightDataViewConfig);
}

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

function constructDefinitionKey({ columnSetConfig, connectionId, connectionNodeConfig, previewConfig }: DataViewConfig): string {
    return JSON.stringify({
        auditTime: columnSetConfig?.sourceId === 'audit' ? columnSetConfig.asAt : undefined,
        chosenColumnDataTypeIds: constructChosenColumnDataTypeIds(columnSetConfig),
        connectionId,
        dataFormatId: previewConfig?.dataFormatId,
        encodingId: previewConfig?.encodingId,
        hasHeaders: previewConfig?.hasHeaders,
        itemPath: connectionNodeConfig ? constructItemPath(connectionNodeConfig) : undefined,
        lastModifiedAt: connectionNodeConfig?.lastModifiedAt,
        parserId: previewConfig?.parserId,
        recordDelimiterId: previewConfig?.recordDelimiterId,
        valueDelimiterId: previewConfig?.valueDelimiterId
    });
}
