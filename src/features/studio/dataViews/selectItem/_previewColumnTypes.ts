// ── DPUse Framework
import type { DecimalSeparatorId, ObjectColumnConfig } from '@dpuse/dpuse-shared';

// ── Local Framework
import type { ChosenColumnTypes, ChosenDecimalSeparators, ColumnType, ItemReading } from '@/features/studio/dataViews/_dataViewColumns';

// ── Types ────────────────────────────────────────────────────────────────────────────────────────────────────────────

// The decimal separator detected for a column is kept with its type, so Auto can return to it.
export type DetectedColumnType = ColumnType & Partial<Pick<ObjectColumnConfig, 'decimalSeparatorId'>>;

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

// What a column can be read as, in the order the type select lists them. 'unknown' is only ever detected, so it is not
// offered. A boolean has no subtypes.
export const CHOOSABLE_COLUMN_TYPES: ColumnType[] = [
    { dataSubtypeId: 'plain', dataTypeId: 'string' },
    { dataSubtypeId: 'email', dataTypeId: 'string' },
    { dataSubtypeId: 'url', dataTypeId: 'string' },
    { dataSubtypeId: 'uuid', dataTypeId: 'string' },
    { dataSubtypeId: 'ulid', dataTypeId: 'string' },
    { dataSubtypeId: 'ipv4', dataTypeId: 'string' },
    { dataSubtypeId: 'ipv6', dataTypeId: 'string' },
    { dataSubtypeId: 'integer', dataTypeId: 'numeric' },
    { dataSubtypeId: 'decimal', dataTypeId: 'numeric' },
    { dataSubtypeId: 'bigint', dataTypeId: 'numeric' },
    { dataSubtypeId: 'date', dataTypeId: 'temporal' },
    { dataSubtypeId: 'dateTime', dataTypeId: 'temporal' },
    { dataSubtypeId: 'time', dataTypeId: 'temporal' },
    { dataSubtypeId: undefined, dataTypeId: 'boolean' }
];

// ── Actions ──────────────────────────────────────────────────────────────────────────────────────────────────────────

// What a number written with fewer decimals than its column's longest needs after it for the decimal points to line up,
// such as '.0' for 50 in a column that holds 87.1. A value with more, after a partial audit, needs nothing.
export function constructDecimalPadding(value: string, { decimalSeparatorId: decimalSeparator = '.', maxDecimals }: Pick<ObjectColumnConfig, 'decimalSeparatorId' | 'maxDecimals'>): string {
    if (maxDecimals == null || maxDecimals === 0) return '';
    const trimmedValue = value.trim();
    const separatorIndex = trimmedValue.lastIndexOf(decimalSeparator);
    return separatorIndex === -1 ? decimalSeparator + '0'.repeat(maxDecimals) : '0'.repeat(Math.max(0, maxDecimals - (trimmedValue.length - separatorIndex - 1)));
}

// The preview with every type the user chose put back, for after its columns are counted again.
export function applyPreviewColumnTypes(itemReading: ItemReading, chosenColumnTypes: ChosenColumnTypes, detectedColumnTypes: DetectedColumnType[]): ItemReading {
    let typedItemReading = itemReading;
    for (const [columnIndex, detectedColumnType] of detectedColumnTypes.entries())
        typedItemReading = applyPreviewColumnType(typedItemReading, columnIndex, chosenColumnTypes[String(columnIndex)], detectedColumnType);
    return typedItemReading;
}

// The preview with each decimal separator the user chose put back, after its types are put back.
export function applyPreviewDecimalSeparators(itemReading: ItemReading, chosenDecimalSeparators: ChosenDecimalSeparators): ItemReading {
    let separatedItemReading = itemReading;
    for (const [columnId, decimalSeparatorId] of Object.entries(chosenDecimalSeparators)) {
        if (decimalSeparatorId != null) separatedItemReading = applyPreviewDecimalSeparator(separatedItemReading, Number(columnId), decimalSeparatorId);
    }
    return separatedItemReading;
}

// The preview with one column's numbers read with the decimal separator given. Only how the values read changes, so the
// figures the audit measured stay as they were.
export function applyPreviewDecimalSeparator(itemReading: ItemReading, columnIndex: number, decimalSeparatorId: DecimalSeparatorId | undefined): ItemReading {
    return {
        ...itemReading,
        columnConfigs: itemReading.columnConfigs.map((columnConfig, index) => (index === columnIndex ? { ...columnConfig, decimalSeparatorId } : columnConfig))
    };
}

// The preview with one column read as the type the user chose, or as detected when they chose none.
export function applyPreviewColumnType(itemReading: ItemReading, columnIndex: number, chosenColumnType: ColumnType | undefined, detectedColumnType: DetectedColumnType): ItemReading {
    const columnType = chosenColumnType ?? detectedColumnType;
    return {
        ...itemReading,
        columnConfigs: itemReading.columnConfigs.map((columnConfig, index) => (index === columnIndex ? { ...columnConfig, ...columnType } : columnConfig))
    };
}
