// ── DPUse Framework
import type {
    AuditSummaryConfig,
    ColumnSetConfig,
    ContentAuditConfig,
    DataTypeId,
    DataViewColumnConfig,
    DataViewConfig,
    ObjectColumnConfig,
    PreviewConfig,
    StoredPreviewConfig
} from '@dpuse/dpuse-shared';

// ── Types ────────────────────────────────────────────────────────────────────────────────────────────────────────────

type ChosenColumnDataTypeIds = Partial<Record<string, DataTypeId>>; // Keyed by the column's position, as a string.

// ── Actions ──────────────────────────────────────────────────────────────────────────────────────────────────────────

export function constructStoredPreviewConfig(previewConfig: PreviewConfig): StoredPreviewConfig {
    const { columnConfigs: _columnConfigs, ...storedPreviewConfig } = previewConfig;
    return storedPreviewConfig;
}

export function constructAuditSummaryConfig(contentAuditConfig: ContentAuditConfig): AuditSummaryConfig {
    const { columns: _columns, ...auditSummaryConfig } = contentAuditConfig;
    return auditSummaryConfig;
}

// The preview's columns hold any chosen type in place of the detected one, so the detected types are passed in.
export function constructPreviewColumnSetConfig(
    previewConfig: PreviewConfig,
    detectedColumnTypes: Pick<ObjectColumnConfig, 'dataSubtypeId' | 'dataTypeId'>[],
    chosenColumnDataTypeIds: ChosenColumnDataTypeIds
): ColumnSetConfig {
    return {
        asAt: previewConfig.asAt,
        columnConfigs: previewConfig.columnConfigs.map((columnConfig, index) => ({
            ...columnConfig,
            ...detectedColumnTypes[index],
            chosenDataTypeId: chosenColumnDataTypeIds[String(index)]
        })),
        sourceId: 'preview'
    };
}

// An audit replaces what was detected. Each type the user chose is kept, because the audit only advises.
export function constructAuditColumnSetConfig(contentAuditConfig: ContentAuditConfig, columnSetConfig: ColumnSetConfig | undefined): ColumnSetConfig {
    return {
        asAt: contentAuditConfig.asAt,
        columnConfigs: contentAuditConfig.columns.map((columnConfig, index) => ({ ...columnConfig, chosenDataTypeId: columnSetConfig?.columnConfigs[index]?.chosenDataTypeId })),
        sourceId: 'audit'
    };
}

export function applyChosenColumnDataTypes(columnSetConfig: ColumnSetConfig, chosenColumnDataTypeIds: ChosenColumnDataTypeIds): ColumnSetConfig {
    return {
        ...columnSetConfig,
        columnConfigs: columnSetConfig.columnConfigs.map((columnConfig, index) => ({ ...columnConfig, chosenDataTypeId: chosenColumnDataTypeIds[String(index)] }))
    };
}

export function constructChosenColumnDataTypeIds(columnSetConfig: ColumnSetConfig | undefined): ChosenColumnDataTypeIds {
    const entries = (columnSetConfig?.columnConfigs ?? []).map((columnConfig, index) => [String(index), columnConfig.chosenDataTypeId]);
    return Object.fromEntries(entries.filter(([, chosenDataTypeId]) => chosenDataTypeId != null)) as ChosenColumnDataTypeIds;
}

// A column as the user wants it read: the type they chose, otherwise the detected one. Detection's subtype only describes
// detection's type, so a different type has none.
export function resolveColumnConfig(columnConfig: DataViewColumnConfig): ObjectColumnConfig {
    const { chosenDataTypeId, ...detectedColumnConfig } = columnConfig;
    return chosenDataTypeId == null || chosenDataTypeId === columnConfig.dataTypeId ? detectedColumnConfig : { ...detectedColumnConfig, dataSubtypeId: undefined, dataTypeId: chosenDataTypeId };
}

// A preview's 'unknown' column may only be blank in the sample, and an unknown column loads as nothing, so it loads as
// text. An audit's 'unknown' column has been read in full and really is empty.
export function constructLoadColumnConfigs(columnSetConfig: ColumnSetConfig | undefined): ObjectColumnConfig[] {
    return (columnSetConfig?.columnConfigs ?? []).map((columnConfig) => {
        const resolvedColumnConfig = resolveColumnConfig(columnConfig);
        return columnSetConfig?.sourceId === 'preview' && resolvedColumnConfig.dataTypeId === 'unknown' ? { ...resolvedColumnConfig, dataTypeId: 'string' } : resolvedColumnConfig;
    });
}

// What a load depends on, so a change to either the columns or a chosen type asks for a new load. A number when no type
// is chosen, which is what loads recorded before types could be chosen hold.
export function constructColumnSetVersion(columnSetConfig: ColumnSetConfig | undefined): number | string | undefined {
    if (columnSetConfig == null) return;
    const chosenColumnDataTypeIds = constructChosenColumnDataTypeIds(columnSetConfig);
    return Object.keys(chosenColumnDataTypeIds).length === 0 ? columnSetConfig.asAt : `${String(columnSetConfig.asAt)}|${JSON.stringify(chosenColumnDataTypeIds)}`;
}

// The preview with its columns put back, for what shows a preview, each column as the user wants it read.
export function restorePreviewConfig({ columnSetConfig, previewConfig }: Pick<DataViewConfig, 'columnSetConfig' | 'previewConfig'>): PreviewConfig | undefined {
    if (previewConfig == null) return;
    return { ...previewConfig, columnConfigs: (columnSetConfig?.columnConfigs ?? []).map((columnConfig) => resolveColumnConfig(columnConfig)) };
}
