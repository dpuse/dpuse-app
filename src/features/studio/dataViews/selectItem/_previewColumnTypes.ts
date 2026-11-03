// ── DPUse Framework
import type { DecimalSeparatorId, ObjectColumnConfig } from '@dpuse/dpuse-shared';

// ── Local Framework
import type { ChosenColumnTypes, ChosenDecimalSeparators, ChosenNullWords, ColumnType, ItemReading } from '@/features/studio/dataViews/_dataViewColumns';

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
// such as '.0' for 50 in a column that holds 87.1. A value with more, after a partial audit, needs nothing. Only the
// digits after the decimal point are decimals, so the '%' of '12.5%' or the ' €' of '12,50 €' are not counted. A value
// with no ending, such as 7 in a column of percentages or 3.25 beside (3.25), also needs room for its column's ending.
// Room is the same width wherever it goes, so it can all follow the value.
export function constructDecimalPadding(
    value: string,
    { decimalSeparatorId: decimalSeparator = '.', maxDecimals }: Pick<ObjectColumnConfig, 'decimalSeparatorId' | 'maxDecimals'>,
    columnEnding = ''
): string {
    const { decimalCount, ending, hasSeparator } = measureWrittenNumber(value.trim(), decimalSeparator);
    const endingPadding = ending === '' ? columnEnding : '';
    if (maxDecimals == null || maxDecimals === 0) return endingPadding;
    const decimalPadding = hasSeparator ? '0'.repeat(Math.max(0, maxDecimals - decimalCount)) : decimalSeparator + '0'.repeat(maxDecimals);
    return decimalPadding + endingPadding;
}

// The ending a column's numbers most often have after their last digit, such as '%', ' €' or the ')' of an accounting
// negative, from the formats the audit counted. Numbers with no ending are left out of the count, because they are the
// ones that need room for it. Empty when no number has one.
export function constructColumnEnding(formats: Record<string, number>): string {
    const endingCounts = new Map<string, number>();
    for (const [formatId, count] of Object.entries(formats)) {
        const lastDigitIndex = formatId.lastIndexOf('9');
        const ending = lastDigitIndex === -1 ? '' : formatId.slice(lastDigitIndex + 1);
        if (ending !== '') endingCounts.set(ending, (endingCounts.get(ending) ?? 0) + count);
    }
    return [...endingCounts].toSorted((left, right) => right[1] - left[1])[0]?.[0] ?? '';
}

// Splits a number as written into its digits and what follows them, such as '%', ' €', ')' or an exponent.
function measureWrittenNumber(trimmedValue: string, decimalSeparator: string): { decimalCount: number; ending: string; hasSeparator: boolean } {
    const lastDigitIndex = trimmedValue.search(/\p{Nd}(?!.*\p{Nd})/u);
    const digitsEnd = lastDigitIndex === -1 ? trimmedValue.length : lastDigitIndex + 1;
    const exponentIndex = trimmedValue.slice(0, digitsEnd).search(/e[+-]?\p{Nd}+$/iu);
    const numberEnd = exponentIndex === -1 ? digitsEnd : exponentIndex;
    const numberText = trimmedValue.slice(0, numberEnd);
    const separatorIndex = numberText.lastIndexOf(decimalSeparator);
    return { decimalCount: separatorIndex === -1 ? 0 : numberEnd - separatorIndex - 1, ending: trimmedValue.slice(numberEnd), hasSeparator: separatorIndex !== -1 };
}

// The preview with every type the user chose put back, for after its columns are counted again.
export function applyPreviewColumnTypes(itemReading: ItemReading, chosenColumnTypes: ChosenColumnTypes, detectedColumnTypes: DetectedColumnType[]): ItemReading {
    let typedItemReading = itemReading;
    for (const [columnIndex, detectedColumnType] of detectedColumnTypes.entries())
        typedItemReading = applyPreviewColumnType(typedItemReading, columnIndex, chosenColumnTypes[String(columnIndex)], detectedColumnType);
    return typedItemReading;
}

// The preview with each decimal separator the user chose put back, after its types are put back.
export function applyPreviewDecimalSeparators(itemReading: ItemReading, chosenDecimalSeparators: ChosenDecimalSeparators, chosenColumnTypes: ChosenColumnTypes = {}): ItemReading {
    let separatedItemReading = itemReading;
    for (const [columnId, decimalSeparatorId] of Object.entries(chosenDecimalSeparators)) {
        if (decimalSeparatorId != null)
            separatedItemReading = applyPreviewDecimalSeparator(separatedItemReading, Number(columnId), decimalSeparatorId, chosenColumnTypes[columnId] != null);
    }
    return separatedItemReading;
}

// The preview with one column's numbers read with the decimal separator given, and the figures the audit measured for
// that separator in place of the others. A subtype the user chose stays, because a chosen type outranks a measured one.
export function applyPreviewDecimalSeparator(itemReading: ItemReading, columnIndex: number, decimalSeparatorId: DecimalSeparatorId | undefined, isSubtypeChosen = false): ItemReading {
    return {
        ...itemReading,
        columnConfigs: itemReading.columnConfigs.map((columnConfig, index) =>
            index === columnIndex ? applyNumericReading(columnConfig, decimalSeparatorId, isSubtypeChosen) : columnConfig
        )
    };
}

// The figures an audit measured for one decimal separator. A column whose values read only one way has none, because
// its figures are the same either way.
function applyNumericReading<T extends ObjectColumnConfig>(columnConfig: T, decimalSeparatorId: DecimalSeparatorId | undefined, isSubtypeChosen = false): T {
    const numericReading = decimalSeparatorId == null ? undefined : columnConfig.numericReadings?.[decimalSeparatorId];
    if (numericReading == null) return { ...columnConfig, decimalSeparatorId };
    return { ...columnConfig, ...numericReading, dataSubtypeId: isSubtypeChosen ? columnConfig.dataSubtypeId : numericReading.dataSubtypeId, decimalSeparatorId };
}

// The preview with each text column's reading of null words that the user chose put back.
export function applyPreviewNullWordChoices(itemReading: ItemReading, chosenNullWords: ChosenNullWords): ItemReading {
    let chosenItemReading = itemReading;
    for (const [columnId, areNullWordsEmpty] of Object.entries(chosenNullWords)) {
        if (areNullWordsEmpty != null) chosenItemReading = applyPreviewNullWordChoice(chosenItemReading, Number(columnId), areNullWordsEmpty);
    }
    return chosenItemReading;
}

// The preview with one text column reading null words such as 'NA' as empty, or as text. The audit counted them as
// values, so the counts move between values and missing values without the item being read again.
export function applyPreviewNullWordChoice(itemReading: ItemReading, columnIndex: number, areNullWordsEmpty: boolean): ItemReading {
    return {
        ...itemReading,
        columnConfigs: itemReading.columnConfigs.map((columnConfig, index) => (index === columnIndex ? applyNullWordChoice(columnConfig, areNullWordsEmpty) : columnConfig))
    };
}

// Applying the same choice twice changes nothing, so the counts never move twice.
function applyNullWordChoice(columnConfig: ObjectColumnConfig, areNullWordsEmpty: boolean): ObjectColumnConfig {
    if (columnConfig.dataTypeId !== 'string' || (columnConfig.nullWordsAreEmpty === true) === areNullWordsEmpty) return columnConfig;
    const movedCount = (columnConfig.nullWordValueCount ?? 0) * (areNullWordsEmpty ? 1 : -1);
    const voidValueCount = (columnConfig.voidValueCount ?? 0) + movedCount;
    return {
        ...columnConfig,
        inferenceCounts: { ...columnConfig.inferenceCounts, 'string.plain': (columnConfig.inferenceCounts['string.plain'] ?? 0) - movedCount },
        isRequired: voidValueCount === 0,
        missingValueCount: (columnConfig.missingValueCount ?? 0) + movedCount,
        nullWordsAreEmpty: areNullWordsEmpty,
        validValueCount: (columnConfig.validValueCount ?? 0) - movedCount,
        voidValueCount
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
