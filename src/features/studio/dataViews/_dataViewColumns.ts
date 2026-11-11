// ── DPUse Framework
import { DATA_TYPE_CONFIGS } from '@dpuse/dpuse-shared';
import type {
    ColumnAuditConfig,
    ColumnChoiceConfig,
    ColumnChoiceConfigs,
    ContentAuditConfig,
    DataFormatId,
    DataViewConfig,
    DateOrderId,
    DecimalSeparatorId,
    PreviewObjectResult,
    ReadingConfig,
    SampleConfig,
    StoreRecord,
    ValueDelimiterId
} from '@dpuse/dpuse-shared';

// ── Types ────────────────────────────────────────────────────────────────────────────────────────────────────────────

// An item as it shows on screen: how it is read, its sample and its columns, kept together so a change of one stays in
// step with the others.
export type ItemReading = SampleConfig & ReadingConfig & { columnConfigs: ColumnAuditConfig[] };

// How an item is actually read: the way its sample was read, which follows the user's choices. An audit and a load read
// the item this way.
export interface AppliedReading {
    dataFormatId: DataFormatId;
    encodingId: string | undefined;
    hasHeaders: boolean | undefined;
    parserId: string | undefined;
    valueDelimiterId: ValueDelimiterId | undefined;
}

export type ColumnType = Pick<ColumnAuditConfig, 'dataSubtypeId' | 'dataTypeId'>;

export type ChosenColumnTypes = Partial<Record<string, ColumnType>>; // Keyed by the column's position, as a string.

export type ChosenDateOrders = Partial<Record<string, DateOrderId>>; // Keyed by the column's position, as a string.

export type ChosenDecimalSeparators = Partial<Record<string, DecimalSeparatorId>>; // Keyed by the column's position, as a string.

export type ChosenIgnoredColumns = Partial<Record<string, boolean>>; // Whether a column is left out of the load, keyed by its position, as a string.

export type ChosenNullWords = Partial<Record<string, boolean>>; // Whether a text column reads null words as empty, keyed by its position, as a string.

// ── Actions ──────────────────────────────────────────────────────────────────────────────────────────────────────────

export function constructItemReading({ contentAuditConfig, readingConfig, sampleConfig }: PreviewObjectResult): ItemReading {
    return { ...readingConfig, ...sampleConfig, columnConfigs: contentAuditConfig.columns };
}

// The text is saved with the records it was parsed into, so the two always match. The sample also keeps how it was read,
// so an audit and a load read the item the same way.
export function constructSampleConfig(itemReading: ItemReading): SampleConfig {
    const { dataFormatId, decodedEncodingId, hasHeaders, issues, parsedRecords, parserId, recordDelimiterId, replacementCharacterCount, size, text, valueDelimiterId } =
        itemReading;
    return { dataFormatId, decodedEncodingId, hasHeaders, issues, parsedRecords, parserId, recordDelimiterId, replacementCharacterCount, size, text, valueDelimiterId };
}

export function constructAppliedReading(sampleConfig: SampleConfig): AppliedReading {
    const { dataFormatId = 'unknown', decodedEncodingId, hasHeaders, parserId, valueDelimiterId } = sampleConfig;
    return { dataFormatId, encodingId: decodedEncodingId, hasHeaders, parserId, valueDelimiterId };
}

// What the sample's records alone show, for when the columns have to be counted again from them. The columns are the
// ones counted, before any choice of the user's is put on them.
export function constructPreviewContentAuditConfig(
    itemReading: Pick<ItemReading, 'columnConfigs' | 'hasHeaders' | 'parsedRecords' | 'size'>,
    asAt: number,
    isComplete: boolean
): ContentAuditConfig {
    return {
        asAt,
        byteCount: itemReading.size ?? 0,
        columns: itemReading.columnConfigs,
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

// The user's choices as a data view saves them, one entry for each column with anything chosen.
export function constructColumnChoiceConfigs(
    chosenColumnTypes: ChosenColumnTypes,
    chosenDecimalSeparators: ChosenDecimalSeparators = {},
    chosenNullWords: ChosenNullWords = {},
    chosenDateOrders: ChosenDateOrders = {},
    chosenIgnoredColumns: ChosenIgnoredColumns = {}
): ColumnChoiceConfigs {
    const columnIds = new Set([
        ...Object.keys(chosenColumnTypes),
        ...Object.keys(chosenDecimalSeparators),
        ...Object.keys(chosenNullWords),
        ...Object.keys(chosenDateOrders),
        ...Object.keys(chosenIgnoredColumns)
    ]);
    const entries = [...columnIds].map((columnId): [string, ColumnChoiceConfig] => {
        const columnChoiceConfig: ColumnChoiceConfig = {
            dataSubtypeId: chosenColumnTypes[columnId]?.dataSubtypeId,
            dataTypeId: chosenColumnTypes[columnId]?.dataTypeId,
            dateOrderId: chosenDateOrders[columnId],
            decimalSeparatorId: chosenDecimalSeparators[columnId],
            isIgnored: chosenIgnoredColumns[columnId],
            nullWordsAreEmpty: chosenNullWords[columnId]
        };
        return [columnId, columnChoiceConfig];
    });
    return Object.fromEntries(entries.filter(([, columnChoiceConfig]) => Object.values(columnChoiceConfig).some((choice) => choice != null)));
}

export function constructChosenColumnTypes(dataViewConfig: Pick<DataViewConfig, 'columnChoiceConfigs' | 'contentAuditConfig'> | undefined): ChosenColumnTypes {
    const columnConfigs = dataViewConfig?.contentAuditConfig?.columns ?? [];
    const entries = Object.entries(dataViewConfig?.columnChoiceConfigs ?? {}).map(
        ([columnId, columnChoiceConfig]) => [columnId, constructChosenColumnType(columnChoiceConfig, columnConfigs[Number(columnId)])] as const
    );
    return Object.fromEntries(entries.filter(([, chosenColumnType]) => chosenColumnType != null));
}

export function constructChosenDateOrders(columnChoiceConfigs: ColumnChoiceConfigs | undefined): ChosenDateOrders {
    const entries = Object.entries(columnChoiceConfigs ?? {}).map(([columnId, columnChoiceConfig]) => [columnId, columnChoiceConfig?.dateOrderId] as const);
    return Object.fromEntries(entries.filter(([, dateOrderId]) => dateOrderId != null));
}

export function constructChosenDecimalSeparators(columnChoiceConfigs: ColumnChoiceConfigs | undefined): ChosenDecimalSeparators {
    const entries = Object.entries(columnChoiceConfigs ?? {}).map(([columnId, columnChoiceConfig]) => [columnId, columnChoiceConfig?.decimalSeparatorId] as const);
    return Object.fromEntries(entries.filter(([, decimalSeparatorId]) => decimalSeparatorId != null));
}

export function constructChosenIgnoredColumns(columnChoiceConfigs: ColumnChoiceConfigs | undefined): ChosenIgnoredColumns {
    const entries = Object.entries(columnChoiceConfigs ?? {}).map(([columnId, columnChoiceConfig]) => [columnId, columnChoiceConfig?.isIgnored] as const);
    return Object.fromEntries(entries.filter(([, isIgnored]) => isIgnored === true));
}

// A column the item does not hold, such as the currencies of a column of numbers in several, worked out when it loads.
export function isDerivedColumn({ derivedFromColumnIndex }: ColumnAuditConfig): boolean {
    return derivedFromColumnIndex != null;
}

export function constructChosenNullWords(columnChoiceConfigs: ColumnChoiceConfigs | undefined): ChosenNullWords {
    const entries = Object.entries(columnChoiceConfigs ?? {}).map(([columnId, columnChoiceConfig]) => [columnId, columnChoiceConfig?.nullWordsAreEmpty] as const);
    return Object.fromEntries(entries.filter(([, nullWordsAreEmpty]) => nullWordsAreEmpty != null));
}

// A unit column that found no unit in the part of the item audited. It is kept, because a unit can appear past that
// part, but it is hidden at first so a file of plain numbers does not show a column of nothing beside each one.
export function isEmptyUnitColumn(columnConfig: ColumnAuditConfig): boolean {
    return isDerivedColumn(columnConfig) && (columnConfig.validValueCount ?? 0) === 0;
}

// A column as the user wants it read: the type, date order, decimal separator and reading of null words they chose,
// otherwise the detected ones.
export function resolveColumnConfig(columnConfig: ColumnAuditConfig, columnChoiceConfig: ColumnChoiceConfig | undefined): ColumnAuditConfig {
    const dateOrderId = columnChoiceConfig?.dateOrderId;
    const dateReading = dateOrderId == null ? undefined : columnConfig.dateReadings?.[dateOrderId]; // The figures for the chosen order.
    const decimalSeparatorId = columnChoiceConfig?.decimalSeparatorId;
    const numericReading = decimalSeparatorId == null ? undefined : columnConfig.numericReadings?.[decimalSeparatorId]; // The figures for the chosen separator.
    return {
        ...columnConfig,
        ...dateReading,
        ...numericReading,
        ...constructChosenColumnType(columnChoiceConfig, columnConfig),
        dateOrderId: dateOrderId ?? columnConfig.dateOrderId,
        decimalSeparatorId: decimalSeparatorId ?? columnConfig.decimalSeparatorId,
        nullWordsAreEmpty: columnChoiceConfig?.nullWordsAreEmpty ?? columnConfig.nullWordsAreEmpty
    };
}

// The audit's columns, each as the user wants it read.
export function resolveColumnConfigs({ columnChoiceConfigs, contentAuditConfig }: Pick<DataViewConfig, 'columnChoiceConfigs' | 'contentAuditConfig'>): ColumnAuditConfig[] {
    return (contentAuditConfig?.columns ?? []).map((columnConfig, index) => resolveColumnConfig(columnConfig, columnChoiceConfigs?.[String(index)]));
}

// The columns the user chose to ignore, by position. A derived column is ignored with the column it comes from, because
// it only holds values for that column.
export function constructIgnoredColumnIndexes({ columnChoiceConfigs, contentAuditConfig }: Pick<DataViewConfig, 'columnChoiceConfigs' | 'contentAuditConfig'>): number[] {
    return (contentAuditConfig?.columns ?? [])
        .map((columnConfig, index) => (columnChoiceConfigs?.[String(columnConfig.derivedFromColumnIndex ?? index)]?.isIgnored === true ? index : undefined))
        .filter((index) => index !== undefined);
}

// A loaded record holds no value for an ignored column, so its values are put back at their columns' positions, with
// null for each ignored column.
export function placeLoadedValues(storeRecord: StoreRecord, columnCount: number, ignoredColumnIndexes: ReadonlySet<number>): StoreRecord {
    const placedRecord: StoreRecord = Array.from({ length: columnCount }, () => null);
    const loadedColumnIndexes = placedRecord.map((_value, index) => index).filter((index) => !ignoredColumnIndexes.has(index));
    for (const [position, columnIndex] of loadedColumnIndexes.entries()) placedRecord[columnIndex] = storeRecord[position] ?? null;
    return placedRecord;
}

// An 'unknown' column may only be blank in the part audited, and an unknown column loads as nothing, so it loads as text.
// An audit that reached the end of the item has read the column in full, so an 'unknown' column there really is empty.
export function constructLoadColumnConfigs(dataViewConfig: Pick<DataViewConfig, 'columnChoiceConfigs' | 'contentAuditConfig'>): ColumnAuditConfig[] {
    const { contentAuditConfig } = dataViewConfig;
    return resolveColumnConfigs(dataViewConfig).map((resolvedColumnConfig) => {
        return contentAuditConfig?.isComplete !== true && resolvedColumnConfig.dataTypeId === 'unknown' ? { ...resolvedColumnConfig, dataTypeId: 'string' } : resolvedColumnConfig;
    });
}

// What a load depends on, so a change to the columns or to anything chosen for them asks for a new load. New columns
// always come with a new audit, so the audit's time stands for them.
// A number when nothing is chosen, which is what loads recorded before types could be chosen hold. Built from the stored
// fields, so a load recorded before subtypes could be chosen still matches its data view.
export function constructColumnsVersion(dataViewConfig: Pick<DataViewConfig, 'columnChoiceConfigs' | 'contentAuditConfig'> | undefined): number | string | undefined {
    const contentAuditConfig = dataViewConfig?.contentAuditConfig;
    if (contentAuditConfig == null) return;
    const chosenEntries = Object.entries(dataViewConfig?.columnChoiceConfigs ?? {}).flatMap(([columnId, columnChoiceConfig]) => {
        const { dataSubtypeId, dataTypeId, dateOrderId, decimalSeparatorId, isIgnored, nullWordsAreEmpty } = columnChoiceConfig ?? {};
        return [
            ...(dataTypeId == null ? [] : [[columnId, constructColumnTypeId({ dataSubtypeId, dataTypeId })]]),
            ...(dateOrderId == null ? [] : [[`${columnId}.dateOrder`, dateOrderId]]),
            ...(decimalSeparatorId == null ? [] : [[`${columnId}.decimalSeparator`, decimalSeparatorId]]),
            ...(isIgnored == null ? [] : [[`${columnId}.isIgnored`, String(isIgnored)]]),
            ...(nullWordsAreEmpty == null ? [] : [[`${columnId}.nullWordsAreEmpty`, String(nullWordsAreEmpty)]])
        ];
    });
    return chosenEntries.length === 0 ? contentAuditConfig.asAt : `${String(contentAuditConfig.asAt)}|${JSON.stringify(Object.fromEntries(chosenEntries))}`;
}

// A column type as one id, in the form the engine counts types under, e.g. 'numeric.integer'.
export function constructColumnTypeId({ dataSubtypeId, dataTypeId }: ColumnType): string {
    return dataSubtypeId == null ? dataTypeId : `${dataTypeId}.${dataSubtypeId}`;
}

// Numbers sit on the right so their digits line up by place. Tabular figures only even out digit widths, so they suit a
// date column of any format and leave its letters alone.
export function constructDataTypeCellClass(dataTypeId: ColumnType['dataTypeId'] | undefined): string | undefined {
    if (dataTypeId === 'numeric') return 'justify-end tabular-nums';
    return dataTypeId === 'temporal' ? 'tabular-nums' : undefined;
}

// The saved item with its columns put back, for what shows an item, each column as the user wants it read.
export function restoreItemReading(dataViewConfig: Pick<DataViewConfig, 'columnChoiceConfigs' | 'contentAuditConfig' | 'readingConfig' | 'sampleConfig'>): ItemReading | undefined {
    const { readingConfig, sampleConfig } = dataViewConfig;
    if (sampleConfig == null || readingConfig == null) return;
    return { ...readingConfig, ...sampleConfig, columnConfigs: resolveColumnConfigs(dataViewConfig) };
}

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

// A type saved without a subtype keeps the detected subtype when it is the detected type, as detection's subtype only
// describes detection's type. Otherwise it takes the subtype the engine stored it as.
function constructChosenColumnType(columnChoiceConfig: ColumnChoiceConfig | undefined, columnConfig: ColumnAuditConfig | undefined): ColumnType | undefined {
    const chosenDataTypeId = columnChoiceConfig?.dataTypeId;
    if (chosenDataTypeId == null) return;
    const detectedDataSubtypeId = chosenDataTypeId === columnConfig?.dataTypeId ? columnConfig.dataSubtypeId : undefined;
    const defaultDataSubtypeId = DATA_TYPE_CONFIGS.find(({ id }) => id === chosenDataTypeId)?.defaultSubtypeId; // How the engine stores a type with no subtype, which is what a type chosen before subtypes could be chosen means.
    return { dataSubtypeId: columnChoiceConfig?.dataSubtypeId ?? detectedDataSubtypeId ?? defaultDataSubtypeId, dataTypeId: chosenDataTypeId };
}
