// ── DPUse Framework
import { DATA_TYPE_CONFIGS } from '@dpuse/dpuse-shared';
import type { ColumnAuditConfig, DataSubtypeId, DateOrderId, DecimalSeparatorId } from '@dpuse/dpuse-shared';

// ── Local Framework
import type { ChosenColumnTypes, ChosenDateOrders, ChosenDecimalSeparators, ChosenNullWords, ColumnType, ItemReading } from '@/features/studio/dataViews/_dataViewColumns';

// ── Types ────────────────────────────────────────────────────────────────────────────────────────────────────────────

// The date order and decimal separator detected for a column are kept with its type, so Auto can return to them.
export type DetectedColumnType = ColumnType & Partial<Pick<ColumnAuditConfig, 'dateOrderId' | 'decimalSeparatorId'>>;

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

// What a column can be read as, in the order the type select lists them. A type with no subtypes, such as boolean, is
// offered on its own.
export const CHOOSABLE_COLUMN_TYPES: ColumnType[] = DATA_TYPE_CONFIGS.filter(({ isChoosable }) => isChoosable).flatMap(({ id, subtypeIds }): ColumnType[] => {
    const dataSubtypeIds: readonly DataSubtypeId[] = subtypeIds;
    return dataSubtypeIds.length === 0 ? [{ dataSubtypeId: undefined, dataTypeId: id }] : dataSubtypeIds.map((dataSubtypeId) => ({ dataSubtypeId, dataTypeId: id }));
});

// ── Actions ──────────────────────────────────────────────────────────────────────────────────────────────────────────

// What a number written with fewer decimals than its column's longest needs after it for the decimal points to line up,
// such as '.0' for 50 in a column that holds 87.1. A value with more, after a partial audit, needs nothing. Only the
// digits after the decimal point are decimals, so the '%' of '12.5%' or the ' €' of '12,50 €' are not counted. A value
// with no ending, such as 7 in a column of percentages or 3.25 beside (3.25), also needs room for its column's ending.
// Room is the same width wherever it goes. The value comes back in display order: its number, the missing decimals,
// its own ending, then the room for a missing column ending. The missing decimals are shown as implied, so they go
// straight after the last digit, before any ending: '(3.2' + '0' + ')'. An exponent is the exception, because '1.50e3'
// would change how the value is written, so its decimals are hidden after it. The room for a column's ending is always
// hidden, because showing it would suggest a unit the value does not have.
export function constructDecimalPadding(
    value: string,
    { decimalSeparatorId: decimalSeparator = '.', validMaxDecimals: maxDecimals }: Pick<ColumnAuditConfig, 'decimalSeparatorId' | 'validMaxDecimals'>,
    columnEnding = ''
): { hiddenPadding: string; numberText: string; shownPadding: string; writtenEnding: string } {
    const { decimalCount, ending, hasSeparator, numberText } = measureWrittenNumber(value.trim(), decimalSeparator);
    const missingDecimals = constructMissingDecimals(decimalCount, hasSeparator, decimalSeparator, maxDecimals);
    if (/^e/iu.test(ending)) return { hiddenPadding: missingDecimals, numberText, shownPadding: '', writtenEnding: ending };
    return { hiddenPadding: ending === '' ? columnEnding : '', numberText, shownPadding: missingDecimals, writtenEnding: ending };
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
function measureWrittenNumber(trimmedValue: string, decimalSeparator: string): { decimalCount: number; ending: string; hasSeparator: boolean; numberText: string } {
    const lastDigitIndex = trimmedValue.search(/\p{Nd}(?!.*\p{Nd})/u);
    const digitsEnd = lastDigitIndex === -1 ? trimmedValue.length : lastDigitIndex + 1;
    const exponentIndex = trimmedValue.slice(0, digitsEnd).search(/e[+-]?\p{Nd}+$/iu);
    const numberEnd = exponentIndex === -1 ? digitsEnd : exponentIndex;
    const numberText = trimmedValue.slice(0, numberEnd);
    const separatorIndex = numberText.lastIndexOf(decimalSeparator);
    return { decimalCount: separatorIndex === -1 ? 0 : numberEnd - separatorIndex - 1, ending: trimmedValue.slice(numberEnd), hasSeparator: separatorIndex !== -1, numberText };
}

// The separator and zeros a number needs to have as many decimals as its column's longest.
function constructMissingDecimals(decimalCount: number, hasSeparator: boolean, decimalSeparator: string, maxDecimals: number | undefined): string {
    if (maxDecimals == null || maxDecimals === 0) return '';
    return hasSeparator ? '0'.repeat(Math.max(0, maxDecimals - decimalCount)) : decimalSeparator + '0'.repeat(maxDecimals);
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
export function applyPreviewDecimalSeparator(
    itemReading: ItemReading,
    columnIndex: number,
    decimalSeparatorId: DecimalSeparatorId | undefined,
    isSubtypeChosen = false
): ItemReading {
    return {
        ...itemReading,
        columnConfigs: itemReading.columnConfigs.map((columnConfig, index) =>
            index === columnIndex ? applyNumericReading(columnConfig, decimalSeparatorId, isSubtypeChosen) : columnConfig
        )
    };
}

// The figures an audit measured for one decimal separator. A column whose values read only one way has none, because
// its figures are the same either way.
function applyNumericReading<T extends ColumnAuditConfig>(columnConfig: T, decimalSeparatorId: DecimalSeparatorId | undefined, isSubtypeChosen = false): T {
    const numericReading = decimalSeparatorId == null ? undefined : columnConfig.numericReadings?.[decimalSeparatorId];
    if (numericReading == null) return { ...columnConfig, decimalSeparatorId };
    return { ...columnConfig, ...numericReading, dataSubtypeId: isSubtypeChosen ? columnConfig.dataSubtypeId : numericReading.dataSubtypeId, decimalSeparatorId };
}

// The preview with each date order the user chose put back.
export function applyPreviewDateOrders(itemReading: ItemReading, chosenDateOrders: ChosenDateOrders): ItemReading {
    let orderedItemReading = itemReading;
    for (const [columnId, dateOrderId] of Object.entries(chosenDateOrders)) {
        if (dateOrderId != null) orderedItemReading = applyPreviewDateOrder(orderedItemReading, Number(columnId), dateOrderId);
    }
    return orderedItemReading;
}

// The preview with one column's dates read in the order given, and the figures the audit measured for that order in
// place of the others. A column whose dates read only one way has none, because its figures are the same either way.
export function applyPreviewDateOrder(itemReading: ItemReading, columnIndex: number, dateOrderId: DateOrderId | undefined): ItemReading {
    return {
        ...itemReading,
        columnConfigs: itemReading.columnConfigs.map((columnConfig, index) => {
            if (index !== columnIndex) return columnConfig;
            const dateReading = dateOrderId == null ? undefined : columnConfig.dateReadings?.[dateOrderId];
            return { ...columnConfig, ...dateReading, dateOrderId };
        })
    };
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
function applyNullWordChoice(columnConfig: ColumnAuditConfig, areNullWordsEmpty: boolean): ColumnAuditConfig {
    if (columnConfig.dataTypeId !== 'string' || (columnConfig.nullWordsAreEmpty === true) === areNullWordsEmpty) return columnConfig;
    const movedCount = (columnConfig.nullWordValueCount ?? 0) * (areNullWordsEmpty ? 1 : -1);
    const nullValueCount = (columnConfig.nullValueCount ?? 0) + movedCount;
    return {
        ...columnConfig,
        hasMissingValues: (columnConfig.blankValueCount ?? 0) + (columnConfig.emptyValueCount ?? 0) + nullValueCount > 0,
        inferenceCounts: { ...columnConfig.inferenceCounts, 'string.plain': (columnConfig.inferenceCounts['string.plain'] ?? 0) - movedCount },
        nullValueCount,
        nullWordsAreEmpty: areNullWordsEmpty,
        validValueCount: (columnConfig.validValueCount ?? 0) - movedCount
    };
}

// The preview with one column read as the type the user chose, or as detected when they chose none.
export function applyPreviewColumnType(
    itemReading: ItemReading,
    columnIndex: number,
    chosenColumnType: ColumnType | undefined,
    detectedColumnType: DetectedColumnType
): ItemReading {
    const columnType = chosenColumnType ?? detectedColumnType;
    return {
        ...itemReading,
        columnConfigs: itemReading.columnConfigs.map((columnConfig, index) => (index === columnIndex ? { ...columnConfig, ...columnType } : columnConfig))
    };
}
