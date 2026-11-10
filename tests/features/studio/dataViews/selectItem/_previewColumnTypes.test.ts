// ── External Dependencies & Registrations
import { describe, expect, it } from 'vitest';

// ── DPUse Framework
import { constructColumnTypeId, type ItemReading } from '@/features/studio/dataViews/_dataViewColumns';

// ── Local Framework
import {
    applyPreviewColumnType,
    applyPreviewColumnTypes,
    applyPreviewDateOrder,
    applyPreviewDateOrders,
    applyPreviewDecimalSeparator,
    applyPreviewDecimalSeparators,
    applyPreviewNullWordChoice,
    CHOOSABLE_COLUMN_TYPES,
    constructColumnEnding,
    constructDecimalPadding
} from '@/features/studio/dataViews/selectItem/_previewColumnTypes';

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

const DETECTED_COLUMN_TYPE = { dataSubtypeId: 'integer', dataTypeId: 'numeric' } as const;
const ITEM_READING = {
    columnConfigs: [
        { ...DETECTED_COLUMN_TYPE, label: { en: 'id' } },
        { dataSubtypeId: 'plain', dataTypeId: 'string', label: { en: 'city' } }
    ]
} as unknown as ItemReading;

// ── Tests ────────────────────────────────────────────────────────────────────────────────────────────────────────────

describe('applyPreviewColumnType', () => {
    it('reads only the chosen column as the chosen type and subtype', () => {
        const { columnConfigs } = applyPreviewColumnType(ITEM_READING, 0, { dataSubtypeId: 'email', dataTypeId: 'string' }, DETECTED_COLUMN_TYPE);

        expect(columnConfigs[0]).toMatchObject({ dataSubtypeId: 'email', dataTypeId: 'string', label: { en: 'id' } });
        expect(columnConfigs[1]).toBe(ITEM_READING.columnConfigs[1]);
    });

    it('returns to the detected type and subtype when none is chosen', () => {
        const chosenItemReading = applyPreviewColumnType(ITEM_READING, 0, { dataSubtypeId: 'plain', dataTypeId: 'string' }, DETECTED_COLUMN_TYPE);

        expect(applyPreviewColumnType(chosenItemReading, 0, undefined, DETECTED_COLUMN_TYPE).columnConfigs[0]).toMatchObject(DETECTED_COLUMN_TYPE);
    });

    it('takes another subtype of the detected type', () => {
        const chosenColumnType = { dataSubtypeId: 'decimal', dataTypeId: 'numeric' } as const;

        expect(applyPreviewColumnType(ITEM_READING, 0, chosenColumnType, DETECTED_COLUMN_TYPE).columnConfigs[0]).toMatchObject(chosenColumnType);
    });
});

describe('CHOOSABLE_COLUMN_TYPES', () => {
    it('gives every type its own id', () => {
        const columnTypeIds = CHOOSABLE_COLUMN_TYPES.map((columnType) => constructColumnTypeId(columnType));

        expect(new Set(columnTypeIds).size).toBe(columnTypeIds.length);
    });
});

describe('applyPreviewColumnTypes', () => {
    it('puts back the chosen types, and leaves the other columns as detected', () => {
        const detectedColumnTypes = [DETECTED_COLUMN_TYPE, { dataSubtypeId: 'plain', dataTypeId: 'string' } as const];

        const itemReading = applyPreviewColumnTypes(ITEM_READING, { 0: { dataSubtypeId: 'url', dataTypeId: 'string' } }, detectedColumnTypes);

        expect(itemReading.columnConfigs[0]).toMatchObject({ dataSubtypeId: 'url', dataTypeId: 'string' });
        expect(itemReading.columnConfigs[1]).toMatchObject({ dataSubtypeId: 'plain', dataTypeId: 'string' });
    });
});

describe('applyPreviewDecimalSeparators', () => {
    it('reads only the chosen columns with the chosen separator', () => {
        const { columnConfigs } = applyPreviewDecimalSeparators(ITEM_READING, { 0: ',' });

        expect(columnConfigs.map((columnConfig) => columnConfig.decimalSeparatorId)).toEqual([',', undefined]);
    });

    it('puts back the detected separator when given it', () => {
        const chosenItemReading = applyPreviewDecimalSeparator(ITEM_READING, 0, ',');

        expect(applyPreviewDecimalSeparator(chosenItemReading, 0, '.').columnConfigs[0]?.decimalSeparatorId).toBe('.');
    });
});

describe('applyPreviewDecimalSeparator', () => {
    const NUMERIC_READINGS = {
        ',': { dataSubtypeId: 'integer', validMaxDecimals: 0 },
        '.': { dataSubtypeId: 'decimal', validMaxDecimals: 3 }
    };
    const READ_ITEM = {
        columnConfigs: [
            { dataSubtypeId: 'decimal', dataTypeId: 'numeric', decimalSeparatorId: '.', label: { en: 'amount' }, validMaxDecimals: 3, numericReadings: NUMERIC_READINGS }
        ]
    } as unknown as ItemReading;

    it('swaps in the figures measured for the separator chosen', () => {
        expect(applyPreviewDecimalSeparator(READ_ITEM, 0, ',').columnConfigs[0]).toMatchObject({
            dataSubtypeId: 'integer',
            decimalSeparatorId: ',',
            validMaxDecimals: 0
        });
    });

    it('keeps a subtype the user chose', () => {
        expect(applyPreviewDecimalSeparator(READ_ITEM, 0, ',', true).columnConfigs[0]?.dataSubtypeId).toBe('decimal');
    });
});

describe('applyPreviewDateOrder', () => {
    const DATE_READINGS = {
        dayFirst: { validFormats: { 'dd/MM/yyyy': 2 } },
        monthFirst: { validFormats: { 'MM/dd/yyyy': 2 } }
    };
    const READ_ITEM = {
        columnConfigs: [
            { dataSubtypeId: 'date', dataTypeId: 'temporal', dateOrderId: 'monthFirst', dateReadings: DATE_READINGS, validFormats: { 'MM/dd/yyyy': 2 }, label: { en: 'when' } },
            { dataSubtypeId: 'plain', dataTypeId: 'string', label: { en: 'city' } }
        ]
    } as unknown as ItemReading;

    it('swaps in the figures measured for the order chosen', () => {
        expect(applyPreviewDateOrder(READ_ITEM, 0, 'dayFirst').columnConfigs[0]).toMatchObject({ dateOrderId: 'dayFirst', validFormats: { 'dd/MM/yyyy': 2 } });
    });

    it('reads only the chosen columns in the chosen order', () => {
        const { columnConfigs } = applyPreviewDateOrders(READ_ITEM, { 0: 'dayFirst' });

        expect(columnConfigs.map((columnConfig) => columnConfig.dateOrderId)).toEqual(['dayFirst', undefined]);
    });
});

describe('constructColumnEnding', () => {
    it('is the most common ending after the digits, leaving out numbers with none', () => {
        expect(constructColumnEnding({ '99': 5, '99.9%': 2, '9%': 1 })).toBe('%');
        expect(constructColumnEnding({ '99,99 €': 3 })).toBe(' €');
        expect(constructColumnEnding({ '99.9': 2, '(9.99)': 1 })).toBe(')');
        expect(constructColumnEnding({ $99: 2, '99': 1 })).toBe('');
    });
});

describe('applyPreviewNullWordChoice', () => {
    const TEXT_ITEM = {
        columnConfigs: [
            {
                dataTypeId: 'string',
                inferenceCounts: { 'string.plain': 4 },
                isComplete: true,
                label: { en: 'country' },
                missingValueCount: 0,
                nullWordValueCount: 2,
                validValueCount: 4
            }
        ]
    } as unknown as ItemReading;

    it('moves the null words from values to missing values', () => {
        expect(applyPreviewNullWordChoice(TEXT_ITEM, 0, true).columnConfigs[0]).toMatchObject({
            inferenceCounts: { 'string.plain': 2 },
            isComplete: false,
            missingValueCount: 2,
            nullWordsAreEmpty: true,
            validValueCount: 2
        });
    });

    it('moves them back, and never moves them twice', () => {
        const emptyItemReading = applyPreviewNullWordChoice(applyPreviewNullWordChoice(TEXT_ITEM, 0, true), 0, true);

        expect(emptyItemReading.columnConfigs[0]?.validValueCount).toBe(2);
        expect(applyPreviewNullWordChoice(emptyItemReading, 0, false).columnConfigs[0]).toMatchObject({ isComplete: true, missingValueCount: 0, validValueCount: 4 });
    });
});

describe('constructDecimalPadding', () => {
    const COLUMN = { decimalSeparatorId: '.', validMaxDecimals: 2 } as const;

    it('pads a whole number with the separator and zeros', () => {
        expect(constructDecimalPadding('50', COLUMN)).toEqual({ hiddenPadding: '', numberText: '50', shownPadding: '.00', writtenEnding: '' });
    });

    it('pads a number with fewer decimals than the column’s most', () => {
        expect(constructDecimalPadding(' 87.1 ', COLUMN)).toEqual({ hiddenPadding: '', numberText: '87.1', shownPadding: '0', writtenEnding: '' });
    });

    it('adds nothing to a number with as many or more decimals', () => {
        expect(constructDecimalPadding('87.12', COLUMN)).toEqual({ hiddenPadding: '', numberText: '87.12', shownPadding: '', writtenEnding: '' });
        expect(constructDecimalPadding('87.123', COLUMN)).toEqual({ hiddenPadding: '', numberText: '87.123', shownPadding: '', writtenEnding: '' });
    });

    it('lines decimals up however long the column’s longest', () => {
        const longDecimalColumn = { decimalSeparatorId: '.', validMaxDecimals: 15 } as const;

        expect(constructDecimalPadding('1960', longDecimalColumn).shownPadding).toBe('.000000000000000');
        expect(constructDecimalPadding('87.1', longDecimalColumn).shownPadding).toBe('0'.repeat(14));
        expect(constructDecimalPadding('88.96779015161066', longDecimalColumn).shownPadding).toBe('0');
    });

    it('puts the zeros straight after the last digit, before the value’s own ending', () => {
        expect(constructDecimalPadding('12.5%', COLUMN)).toEqual({ hiddenPadding: '', numberText: '12.5', shownPadding: '0', writtenEnding: '%' });
        expect(constructDecimalPadding('12,5 €', { decimalSeparatorId: ',', validMaxDecimals: 2 })).toEqual({
            hiddenPadding: '',
            numberText: '12,5',
            shownPadding: '0',
            writtenEnding: ' €'
        });
        expect(constructDecimalPadding('(3.2)', COLUMN)).toEqual({ hiddenPadding: '', numberText: '(3.2', shownPadding: '0', writtenEnding: ')' });
        expect(constructDecimalPadding('4.5-', { decimalSeparatorId: '.', validMaxDecimals: 3 })).toEqual({
            hiddenPadding: '',
            numberText: '4.5',
            shownPadding: '00',
            writtenEnding: '-'
        });
    });

    it('hides the zeros of a number with an exponent, after it', () => {
        expect(constructDecimalPadding('1.5e3', COLUMN)).toEqual({ hiddenPadding: '0', numberText: '1.5', shownPadding: '', writtenEnding: 'e3' });
    });

    it('makes room for the column’s ending on a number without one', () => {
        expect(constructDecimalPadding('7', { decimalSeparatorId: '.', validMaxDecimals: 1 }, '%')).toEqual({
            hiddenPadding: '%',
            numberText: '7',
            shownPadding: '.0',
            writtenEnding: ''
        });
        expect(constructDecimalPadding('7', { decimalSeparatorId: '.', validMaxDecimals: 0 }, '%')).toEqual({
            hiddenPadding: '%',
            numberText: '7',
            shownPadding: '',
            writtenEnding: ''
        });
        expect(constructDecimalPadding('7%', { decimalSeparatorId: '.', validMaxDecimals: 1 }, '%')).toEqual({
            hiddenPadding: '',
            numberText: '7',
            shownPadding: '.0',
            writtenEnding: '%'
        });
    });

    it('uses the column’s decimal separator', () => {
        expect(constructDecimalPadding('1.234,5', { decimalSeparatorId: ',', validMaxDecimals: 2 }).shownPadding).toBe('0');
    });

    it('adds nothing to a column with no decimals, or none known', () => {
        expect(constructDecimalPadding('50', { decimalSeparatorId: undefined, validMaxDecimals: 0 }).shownPadding).toBe('');
        expect(constructDecimalPadding('50', { decimalSeparatorId: undefined, validMaxDecimals: undefined }).shownPadding).toBe('');
    });
});
