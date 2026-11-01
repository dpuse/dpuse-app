// ── DPUse Framework
import type {
    ColumnSetConfig,
    ContentAuditConfig,
    DataTypeId,
    DataViewColumnConfig,
    DataViewConfig,
    ObjectColumnConfig,
    PreviewConfig,
    PreviewObjectResult,
    ReadConfig,
    StoredContentAuditConfig
} from '@dpuse/dpuse-shared';

// ── Types ────────────────────────────────────────────────────────────────────────────────────────────────────────────

// An item as it shows on screen: how it is read, its preview and its columns, kept together so a change of one stays in
// step with the others.
export type ItemReading = PreviewConfig & ReadConfig & { columnConfigs: ObjectColumnConfig[] };

type ChosenColumnDataTypeIds = Partial<Record<string, DataTypeId>>; // Keyed by the column's position, as a string.

// ── Actions ──────────────────────────────────────────────────────────────────────────────────────────────────────────

export function constructItemReading({ contentAuditConfig, previewConfig, readConfig }: PreviewObjectResult): ItemReading {
    return { ...readConfig, ...previewConfig, columnConfigs: contentAuditConfig.columns };
}

export function constructReadConfig(itemReading: ItemReading): ReadConfig {
    const { columnConfigs: _columnConfigs, errorMessage: _errorMessage, issues: _issues, parsedRecords: _parsedRecords, size: _size, text: _text, ...readConfig } = itemReading;
    return readConfig;
}

// The raw text is the same block as the parsed records, so it is not kept.
export function constructStoredPreviewConfig({ issues, parsedRecords, size }: ItemReading): PreviewConfig {
    return { ...(issues != null && { issues }), parsedRecords, size, text: undefined };
}

export function constructStoredContentAuditConfig(contentAuditConfig: ContentAuditConfig): StoredContentAuditConfig {
    const { columns: _columns, ...storedContentAuditConfig } = contentAuditConfig;
    return storedContentAuditConfig;
}

// What the preview's records alone show, for when the columns have to be counted again from them.
export function constructPreviewContentAuditConfig(
    itemReading: Pick<ItemReading, 'hasHeaders' | 'parsedRecords' | 'size'>,
    asAt: number,
    isComplete: boolean
): StoredContentAuditConfig {
    return {
        asAt,
        byteCount: itemReading.size ?? 0,
        commentLineCount: undefined,
        duration: 0,
        emptyLineCount: undefined,
        invalidFieldLengthCount: undefined,
        isComplete,
        lineCount: undefined,
        recordCount: Math.max(0, itemReading.parsedRecords.length - (itemReading.hasHeaders === true ? 1 : 0)),
        sourceWaitDuration: undefined
    };
}

// The item's columns hold any chosen type in place of the detected one, so the detected types are passed in.
export function constructItemColumnSetConfig(
    itemReading: ItemReading,
    asAt: number,
    detectedColumnTypes: Pick<ObjectColumnConfig, 'dataSubtypeId' | 'dataTypeId'>[],
    chosenColumnDataTypeIds: ChosenColumnDataTypeIds
): ColumnSetConfig {
    return {
        asAt,
        columnConfigs: itemReading.columnConfigs.map((columnConfig, index) => ({
            ...columnConfig,
            ...detectedColumnTypes[index],
            chosenDataTypeId: chosenColumnDataTypeIds[String(index)]
        }))
    };
}

// An audit replaces what was detected. Each type the user chose is kept, because the audit only advises.
export function constructAuditColumnSetConfig(contentAuditConfig: ContentAuditConfig, columnSetConfig: ColumnSetConfig | undefined): ColumnSetConfig {
    return {
        asAt: contentAuditConfig.asAt,
        columnConfigs: contentAuditConfig.columns.map((columnConfig, index) => ({ ...columnConfig, chosenDataTypeId: columnSetConfig?.columnConfigs[index]?.chosenDataTypeId }))
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
    return chosenDataTypeId == null || chosenDataTypeId === columnConfig.dataTypeId
        ? detectedColumnConfig
        : { ...detectedColumnConfig, dataSubtypeId: undefined, dataTypeId: chosenDataTypeId };
}

// An 'unknown' column may only be blank in the part audited, and an unknown column loads as nothing, so it loads as text.
// An audit that reached the end of the item has read the column in full, so an 'unknown' column there really is empty.
export function constructLoadColumnConfigs({ columnSetConfig, contentAuditConfig }: Pick<DataViewConfig, 'columnSetConfig' | 'contentAuditConfig'>): ObjectColumnConfig[] {
    return (columnSetConfig?.columnConfigs ?? []).map((columnConfig) => {
        const resolvedColumnConfig = resolveColumnConfig(columnConfig);
        return contentAuditConfig?.isComplete !== true && resolvedColumnConfig.dataTypeId === 'unknown' ? { ...resolvedColumnConfig, dataTypeId: 'string' } : resolvedColumnConfig;
    });
}

// What a load depends on, so a change to either the columns or a chosen type asks for a new load. A number when no type
// is chosen, which is what loads recorded before types could be chosen hold.
export function constructColumnSetVersion(columnSetConfig: ColumnSetConfig | undefined): number | string | undefined {
    if (columnSetConfig == null) return;
    const chosenColumnDataTypeIds = constructChosenColumnDataTypeIds(columnSetConfig);
    return Object.keys(chosenColumnDataTypeIds).length === 0 ? columnSetConfig.asAt : `${String(columnSetConfig.asAt)}|${JSON.stringify(chosenColumnDataTypeIds)}`;
}

// The saved item with its columns put back, for what shows an item, each column as the user wants it read.
export function restoreItemReading({
    columnSetConfig,
    previewConfig,
    readConfig
}: Pick<DataViewConfig, 'columnSetConfig' | 'previewConfig' | 'readConfig'>): ItemReading | undefined {
    if (previewConfig == null || readConfig == null) return;
    return { ...readConfig, ...previewConfig, columnConfigs: (columnSetConfig?.columnConfigs ?? []).map((columnConfig) => resolveColumnConfig(columnConfig)) };
}
