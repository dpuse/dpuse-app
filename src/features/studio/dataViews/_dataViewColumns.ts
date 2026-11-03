// ── DPUse Framework
import type {
    ColumnSetConfig,
    ContentAuditConfig,
    DataSubtypeId,
    DataTypeId,
    DataViewColumnConfig,
    DataViewConfig,
    DecimalSeparatorId,
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

export type ColumnType = Pick<ObjectColumnConfig, 'dataSubtypeId' | 'dataTypeId'>;

export type ChosenColumnTypes = Partial<Record<string, ColumnType>>; // Keyed by the column's position, as a string.

export type ChosenDecimalSeparators = Partial<Record<string, DecimalSeparatorId>>; // Keyed by the column's position, as a string.

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

// How the engine stores a type with no subtype, which is what a type chosen before subtypes could be chosen means.
const DEFAULT_DATA_SUBTYPE_IDS: Partial<Record<DataTypeId, DataSubtypeId>> = { numeric: 'integer', string: 'plain', temporal: 'dateTime' };

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

// The item's columns hold any chosen type and decimal separator in place of the detected ones, so the detected ones are
// passed in.
export function constructItemColumnSetConfig(
    itemReading: ItemReading,
    asAt: number,
    detectedColumnTypes: (ColumnType & Partial<Pick<ObjectColumnConfig, 'decimalSeparatorId'>>)[],
    chosenColumnTypes: ChosenColumnTypes,
    chosenDecimalSeparators: ChosenDecimalSeparators = {}
): ColumnSetConfig {
    return {
        asAt,
        columnConfigs: itemReading.columnConfigs.map((columnConfig, index) => ({
            ...columnConfig,
            ...detectedColumnTypes[index],
            ...constructChosenColumnFields(chosenColumnTypes[String(index)]),
            chosenDecimalSeparatorId: chosenDecimalSeparators[String(index)]
        }))
    };
}

// An audit replaces what was detected. Each type the user chose is kept, because the audit only advises.
export function constructAuditColumnSetConfig(contentAuditConfig: ContentAuditConfig, columnSetConfig: ColumnSetConfig | undefined): ColumnSetConfig {
    return {
        asAt: contentAuditConfig.asAt,
        columnConfigs: contentAuditConfig.columns.map((columnConfig, index) => {
            const { chosenDataSubtypeId, chosenDataTypeId, chosenDecimalSeparatorId } = columnSetConfig?.columnConfigs[index] ?? {};
            return { ...columnConfig, chosenDataSubtypeId, chosenDataTypeId, chosenDecimalSeparatorId };
        })
    };
}

export function applyChosenColumnTypes(columnSetConfig: ColumnSetConfig, chosenColumnTypes: ChosenColumnTypes): ColumnSetConfig {
    return {
        ...columnSetConfig,
        columnConfigs: columnSetConfig.columnConfigs.map((columnConfig, index) => ({ ...columnConfig, ...constructChosenColumnFields(chosenColumnTypes[String(index)]) }))
    };
}

export function constructChosenColumnTypes(columnSetConfig: ColumnSetConfig | undefined): ChosenColumnTypes {
    const entries = (columnSetConfig?.columnConfigs ?? []).map((columnConfig, index) => [String(index), constructChosenColumnType(columnConfig)] as const);
    return Object.fromEntries(entries.filter(([, chosenColumnType]) => chosenColumnType != null));
}

export function constructChosenDecimalSeparators(columnSetConfig: ColumnSetConfig | undefined): ChosenDecimalSeparators {
    const entries = (columnSetConfig?.columnConfigs ?? []).map(({ chosenDecimalSeparatorId }, index) => [String(index), chosenDecimalSeparatorId] as const);
    return Object.fromEntries(entries.filter(([, chosenDecimalSeparatorId]) => chosenDecimalSeparatorId != null));
}

// A column the item does not hold, such as the currencies of a column of numbers in several, worked out when it loads.
export function isDerivedColumn({ derivedFromColumnIndex }: ObjectColumnConfig): boolean {
    return derivedFromColumnIndex != null;
}

// A column as the user wants it read: the type and decimal separator they chose, otherwise the detected ones.
export function resolveColumnConfig(columnConfig: DataViewColumnConfig): ObjectColumnConfig {
    const { chosenDataSubtypeId: _chosenDataSubtypeId, chosenDataTypeId: _chosenDataTypeId, chosenDecimalSeparatorId, ...detectedColumnConfig } = columnConfig;
    return { ...detectedColumnConfig, ...constructChosenColumnType(columnConfig), decimalSeparatorId: chosenDecimalSeparatorId ?? detectedColumnConfig.decimalSeparatorId };
}

// An 'unknown' column may only be blank in the part audited, and an unknown column loads as nothing, so it loads as text.
// An audit that reached the end of the item has read the column in full, so an 'unknown' column there really is empty.
export function constructLoadColumnConfigs({ columnSetConfig, contentAuditConfig }: Pick<DataViewConfig, 'columnSetConfig' | 'contentAuditConfig'>): ObjectColumnConfig[] {
    return (columnSetConfig?.columnConfigs ?? []).map((columnConfig) => {
        const resolvedColumnConfig = resolveColumnConfig(columnConfig);
        return contentAuditConfig?.isComplete !== true && resolvedColumnConfig.dataTypeId === 'unknown' ? { ...resolvedColumnConfig, dataTypeId: 'string' } : resolvedColumnConfig;
    });
}

// What a load depends on, so a change to the columns, a chosen type or a chosen decimal separator asks for a new load.
// A number when nothing is chosen, which is what loads recorded before types could be chosen hold. Built from the stored
// fields, so a load recorded before subtypes could be chosen still matches its data view.
export function constructColumnSetVersion(columnSetConfig: ColumnSetConfig | undefined): number | string | undefined {
    if (columnSetConfig == null) return;
    const chosenEntries = columnSetConfig.columnConfigs.flatMap(({ chosenDataSubtypeId, chosenDataTypeId, chosenDecimalSeparatorId }, index) => [
        ...(chosenDataTypeId == null ? [] : [[String(index), constructColumnTypeId({ dataSubtypeId: chosenDataSubtypeId, dataTypeId: chosenDataTypeId })]]),
        ...(chosenDecimalSeparatorId == null ? [] : [[`${String(index)}.decimalSeparator`, chosenDecimalSeparatorId]])
    ]);
    return chosenEntries.length === 0 ? columnSetConfig.asAt : `${String(columnSetConfig.asAt)}|${JSON.stringify(Object.fromEntries(chosenEntries))}`;
}

// A column type as one id, in the form the engine counts types under, e.g. 'numeric.integer'.
export function constructColumnTypeId({ dataSubtypeId, dataTypeId }: ColumnType): string {
    return dataSubtypeId == null ? dataTypeId : `${dataTypeId}.${dataSubtypeId}`;
}

// The saved item with its columns put back, for what shows an item, each column as the user wants it read.
// Numbers sit on the right so their digits line up by place. Tabular figures only even out digit widths, so they suit a
// date column of any format and leave its letters alone.
export function constructDataTypeCellClass(dataTypeId: ColumnType['dataTypeId'] | undefined): string | undefined {
    if (dataTypeId === 'numeric') return 'justify-end tabular-nums';
    return dataTypeId === 'temporal' ? 'tabular-nums' : undefined;
}

export function restoreItemReading({
    columnSetConfig,
    previewConfig,
    readConfig
}: Pick<DataViewConfig, 'columnSetConfig' | 'previewConfig' | 'readConfig'>): ItemReading | undefined {
    if (previewConfig == null || readConfig == null) return;
    return { ...readConfig, ...previewConfig, columnConfigs: (columnSetConfig?.columnConfigs ?? []).map((columnConfig) => resolveColumnConfig(columnConfig)) };
}

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

function constructChosenColumnFields(chosenColumnType: ColumnType | undefined): Pick<DataViewColumnConfig, 'chosenDataSubtypeId' | 'chosenDataTypeId'> {
    return { chosenDataSubtypeId: chosenColumnType?.dataSubtypeId, chosenDataTypeId: chosenColumnType?.dataTypeId };
}

// A type saved without a subtype keeps the detected subtype when it is the detected type, as detection's subtype only
// describes detection's type. Otherwise it takes the subtype the engine stored it as.
function constructChosenColumnType({ chosenDataSubtypeId, chosenDataTypeId, dataSubtypeId, dataTypeId }: DataViewColumnConfig): ColumnType | undefined {
    if (chosenDataTypeId == null) return;
    const detectedDataSubtypeId = chosenDataTypeId === dataTypeId ? dataSubtypeId : undefined;
    return { dataSubtypeId: chosenDataSubtypeId ?? detectedDataSubtypeId ?? DEFAULT_DATA_SUBTYPE_IDS[chosenDataTypeId], dataTypeId: chosenDataTypeId };
}
