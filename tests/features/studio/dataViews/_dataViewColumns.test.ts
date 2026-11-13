// ── External Dependencies & Registrations
import { describe, expect, it } from 'vitest';

// ── DPUse Framework
import type { ColumnAuditConfig, ColumnChoiceConfig, ColumnChoiceConfigs, ContentAuditConfig, DataViewConfig } from '@dpuse/dpuse-shared';

// ── Local Framework
import {
    type AppliedReading,
    constructAppliedReading,
    constructChosenColumnTypes,
    constructChosenDateOrders,
    constructChosenDecimalSeparators,
    constructChosenIgnoredColumns,
    constructChosenNullWords,
    constructColumnChoiceConfigs,
    constructColumnsVersion,
    constructDataTypeCellClass,
    constructIgnoredColumnIndexes,
    constructItemReading,
    constructLoadColumnConfigs,
    constructPreviewContentAuditConfig,
    constructSampleConfig,
    establishFileValueDelimiterId,
    isDerivedColumn,
    isEmptyUnitColumn,
    type ItemReading,
    placeLoadedValues,
    resolveColumnConfig,
    restoreItemReading
} from '@/features/studio/dataViews/_dataViewColumns';

// ── Tests ────────────────────────────────────────────────────────────────────────────────────────────────────────────

describe('constructItemReading', () => {
    it('brings how the item is read, its sample and its audit’s columns together', () => {
        const columns = [buildColumn({})];

        const itemReading = constructItemReading({
            contentAuditConfig: { columns } as ContentAuditConfig,
            readingConfig: { dataFormatId: 'dtv' } as never,
            sampleConfig: { issues: [], parsedRecords: [], size: 4, text: 'a' }
        });

        expect(itemReading).toMatchObject({ columnConfigs: columns, dataFormatId: 'dtv', size: 4, text: 'a' });
    });
});

describe('the parts of an item saved with a data view', () => {
    const itemReading = {
        columnConfigs: [],
        dataFormatId: 'dtv',
        issues: [],
        parsedRecords: [
            [
                { value: 'a', valueWasQuoted: true },
                { value: null, valueWasQuoted: false }
            ]
        ],
        size: 4,
        text: '"a",'
    } as unknown as ItemReading;

    it('keeps the text with the records it was parsed into, each value with whether it was quoted', () => {
        expect(constructSampleConfig(itemReading)).toStrictEqual({
            dataFormatId: 'dtv',
            decodedEncodingId: undefined,
            hasHeaders: undefined,
            issues: [],
            parserId: undefined,
            recordDelimiterId: undefined,
            replacementCharacterCount: undefined,
            structurePath: undefined,
            valueDelimiterId: undefined,
            parsedRecords: [
                [
                    { value: 'a', valueWasQuoted: true },
                    { value: null, valueWasQuoted: false }
                ]
            ],
            size: 4,
            text: '"a",'
        });
    });

    it('reads the item the way its sample was read, with the encoding the sample was decoded with', () => {
        const sampleConfig = {
            ...constructSampleConfig(itemReading),
            decodedEncodingId: 'utf-8',
            hasHeaders: true,
            parserId: 'dpuse-tool-adaltas-csv-parser',
            valueDelimiterId: ';' as const
        };

        expect(constructAppliedReading(sampleConfig)).toStrictEqual({
            dataFormatId: 'dtv',
            encodingId: 'utf-8',
            hasHeaders: true,
            parserId: 'dpuse-tool-adaltas-csv-parser',
            structurePath: undefined,
            valueDelimiterId: ';'
        });
    });

    // A nested item, such as a JSON file, is read from the part chosen as the table, so an audit and a load read the same
    // part as the sample.
    it('keeps the part of a nested item its sample was read from', () => {
        const sampleConfig = constructSampleConfig({ ...itemReading, dataFormatId: 'json', structurePath: ['orders', 0, 'lines'] });

        expect(sampleConfig.structurePath).toEqual(['orders', 0, 'lines']);
        expect(constructAppliedReading(sampleConfig).structurePath).toEqual(['orders', 0, 'lines']);
    });
});

describe('establishFileValueDelimiterId', () => {
    it('gives the value delimiter delimited text was read with', () => {
        expect(establishFileValueDelimiterId(buildAppliedReading({ valueDelimiterId: ';' }))).toBe(';');
    });

    it('fails for delimited text read without a value delimiter', () => {
        expect(() => establishFileValueDelimiterId(buildAppliedReading({}))).toThrow('No value delimiter in the sample.');
    });

    it('needs none for a nested format', () => {
        expect(establishFileValueDelimiterId(buildAppliedReading({ dataFormatId: 'json' }))).toBeUndefined();
    });
});

describe('constructPreviewContentAuditConfig', () => {
    it('counts the preview’s records, leaving out a header record, and keeps the columns counted', () => {
        const columnConfigs = [buildColumn({})];
        const auditConfig = constructPreviewContentAuditConfig({ columnConfigs, hasHeaders: true, parsedRecords: [[], [], []], size: 40 }, 7, false);

        expect(auditConfig).toMatchObject({ asAt: 7, byteCount: 40, columns: columnConfigs, isComplete: false, recordCount: 2 });
    });

    it('has no bytes for an item not read as bytes', () => {
        expect(constructPreviewContentAuditConfig({ columnConfigs: [], hasHeaders: false, parsedRecords: [[]], size: undefined }, 7, true)).toMatchObject({
            byteCount: 0,
            recordCount: 1
        });
    });
});

describe('constructColumnChoiceConfigs', () => {
    it('keeps only the columns with something chosen, by position', () => {
        expect(constructColumnChoiceConfigs({ 0: { dataSubtypeId: 'decimal', dataTypeId: 'numeric' } }, { 2: ',' }, { 3: true }, { 4: 'dayFirst' }, { 5: true })).toStrictEqual({
            0: { dataSubtypeId: 'decimal', dataTypeId: 'numeric', dateOrderId: undefined, decimalSeparatorId: undefined, isIgnored: undefined, nullWordsAreEmpty: undefined },
            2: { dataSubtypeId: undefined, dataTypeId: undefined, dateOrderId: undefined, decimalSeparatorId: ',', isIgnored: undefined, nullWordsAreEmpty: undefined },
            3: { dataSubtypeId: undefined, dataTypeId: undefined, dateOrderId: undefined, decimalSeparatorId: undefined, isIgnored: undefined, nullWordsAreEmpty: true },
            4: { dataSubtypeId: undefined, dataTypeId: undefined, dateOrderId: 'dayFirst', decimalSeparatorId: undefined, isIgnored: undefined, nullWordsAreEmpty: undefined },
            5: { dataSubtypeId: undefined, dataTypeId: undefined, dateOrderId: undefined, decimalSeparatorId: undefined, isIgnored: true, nullWordsAreEmpty: undefined }
        });
    });

    it('is empty with nothing chosen', () => {
        expect(constructColumnChoiceConfigs({})).toStrictEqual({});
    });
});

describe('chosen column types', () => {
    it('round trip through the saved choices, by position', () => {
        const chosenColumnTypes = { 1: { dataSubtypeId: 'decimal', dataTypeId: 'numeric' } } as const;
        const auditedColumns = buildAuditedColumns([buildColumn({}), buildColumn({})], constructColumnChoiceConfigs(chosenColumnTypes));

        expect(constructChosenColumnTypes(auditedColumns)).toStrictEqual(chosenColumnTypes);
    });

    it('fill in the subtype of a type saved without one', () => {
        const auditedColumns = buildAuditedColumns(
            [
                buildColumn({ dataSubtypeId: 'decimal', dataTypeId: 'numeric' }),
                buildColumn({ dataSubtypeId: 'plain', dataTypeId: 'string' }),
                buildColumn({ dataSubtypeId: 'plain', dataTypeId: 'string' }),
                buildColumn({ dataSubtypeId: 'plain', dataTypeId: 'string' })
            ],
            {
                0: buildColumnChoice({ dataTypeId: 'numeric' }),
                1: buildColumnChoice({ dataTypeId: 'numeric' }),
                2: buildColumnChoice({ dataTypeId: 'temporal' }),
                3: buildColumnChoice({ dataTypeId: 'boolean' })
            }
        );

        expect(constructChosenColumnTypes(auditedColumns)).toStrictEqual({
            0: { dataSubtypeId: 'decimal', dataTypeId: 'numeric' },
            1: { dataSubtypeId: 'integer', dataTypeId: 'numeric' },
            2: { dataSubtypeId: 'dateTime', dataTypeId: 'temporal' },
            3: { dataSubtypeId: undefined, dataTypeId: 'boolean' }
        });
    });

    it('are empty without a data view', () => {
        expect(constructChosenColumnTypes(undefined)).toStrictEqual({});
    });

    it('give back the decimal separators, readings of null words and date orders chosen', () => {
        const columnChoiceConfigs = constructColumnChoiceConfigs({}, { 0: ',' }, { 1: true }, { 2: 'dayFirst' });

        expect(constructChosenDecimalSeparators(columnChoiceConfigs)).toEqual({ 0: ',' });
        expect(constructChosenNullWords(columnChoiceConfigs)).toEqual({ 1: true });
        expect(constructChosenDateOrders(columnChoiceConfigs)).toEqual({ 2: 'dayFirst' });
    });
});

describe('resolveColumnConfig', () => {
    it('uses the chosen type and subtype in place of the detected ones', () => {
        expect(
            resolveColumnConfig(buildColumn({ dataSubtypeId: 'integer', dataTypeId: 'numeric' }), buildColumnChoice({ dataSubtypeId: 'email', dataTypeId: 'string' }))
        ).toMatchObject({
            dataSubtypeId: 'email',
            dataTypeId: 'string'
        });
    });

    it('uses the figures measured for the chosen decimal separator', () => {
        const numericReadings = {
            ',': { dataSubtypeId: 'integer', validMaxDecimals: 0 },
            '.': { dataSubtypeId: 'decimal', validMaxDecimals: 3 }
        } as ColumnAuditConfig['numericReadings'];

        expect(resolveColumnConfig(buildColumn({ dataTypeId: 'numeric', decimalSeparatorId: '.', numericReadings }), buildColumnChoice({ decimalSeparatorId: ',' }))).toMatchObject(
            {
                dataSubtypeId: 'integer',
                validMaxDecimals: 0
            }
        );
    });

    it('uses the chosen decimal separator in place of the detected one', () => {
        expect(resolveColumnConfig(buildColumn({ dataTypeId: 'numeric', decimalSeparatorId: '.' }), buildColumnChoice({ decimalSeparatorId: ',' })).decimalSeparatorId).toBe(',');
        expect(resolveColumnConfig(buildColumn({ dataTypeId: 'numeric', decimalSeparatorId: '.' }), undefined).decimalSeparatorId).toBe('.');
    });

    it('uses the chosen date order, with the figures measured for it', () => {
        const dateReadings = {
            dayFirst: { validFormats: { 'dd/MM/yyyy': 2 } },
            monthFirst: { validFormats: { 'MM/dd/yyyy': 2 } }
        } as unknown as ColumnAuditConfig['dateReadings']; // Only the formats matter here.
        const columnConfig = buildColumn({ dataTypeId: 'temporal', dateOrderId: 'monthFirst', dateReadings });

        expect(resolveColumnConfig(columnConfig, buildColumnChoice({ dateOrderId: 'dayFirst' }))).toMatchObject({
            dateOrderId: 'dayFirst',
            validFormats: { 'dd/MM/yyyy': 2 }
        });
        expect(resolveColumnConfig(columnConfig, undefined).dateOrderId).toBe('monthFirst');
    });

    it('uses the chosen reading of null words', () => {
        expect(resolveColumnConfig(buildColumn({}), buildColumnChoice({ nullWordsAreEmpty: true })).nullWordsAreEmpty).toBe(true);
    });

    it('keeps the detected type and subtype otherwise', () => {
        expect(resolveColumnConfig(buildColumn({ dataSubtypeId: 'integer', dataTypeId: 'numeric' }), undefined)).toMatchObject({ dataSubtypeId: 'integer', dataTypeId: 'numeric' });
        expect(resolveColumnConfig(buildColumn({ dataSubtypeId: 'integer', dataTypeId: 'numeric' }), buildColumnChoice({ dataTypeId: 'numeric' }))).toMatchObject({
            dataSubtypeId: 'integer'
        });
    });
});

describe('constructLoadColumnConfigs', () => {
    it('loads an unknown column as text after a partial audit, because it may only be blank in the part read', () => {
        expect(constructLoadColumnConfigs(buildDataView(false))[0]?.dataTypeId).toBe('string');
        expect(constructLoadColumnConfigs(buildDataView(undefined))[0]?.dataTypeId).toBe('string');
    });

    it('leaves an unknown column after a whole audit, because the whole item was read', () => {
        expect(constructLoadColumnConfigs(buildDataView(true))[0]?.dataTypeId).toBe('unknown');
    });

    it('has no columns without an audit', () => {
        expect(constructLoadColumnConfigs({ columnChoiceConfigs: undefined, contentAuditConfig: undefined })).toStrictEqual([]);
    });
});

describe('isDerivedColumn', () => {
    it('tells a column worked out from another apart from a column of the item', () => {
        expect(isDerivedColumn(buildColumn({ derivedFromColumnIndex: 0 }))).toBe(true);
        expect(isDerivedColumn(buildColumn({}))).toBe(false);
    });
});

describe('isEmptyUnitColumn', () => {
    it('is a unit column that found no unit', () => {
        expect(isEmptyUnitColumn(buildColumn({ derivedFromColumnIndex: 0, validValueCount: 0 }))).toBe(true);
        expect(isEmptyUnitColumn(buildColumn({ derivedFromColumnIndex: 0, validValueCount: 2 }))).toBe(false);
        expect(isEmptyUnitColumn(buildColumn({ validValueCount: 0 }))).toBe(false);
    });
});

describe('constructColumnsVersion', () => {
    it('is the time alone with no chosen type, as loads recorded earlier hold', () => {
        expect(constructColumnsVersion(buildOneAuditedColumn())).toBe(5);
    });

    it('changes with a chosen type', () => {
        expect(constructColumnsVersion(buildOneAuditedColumn({ dataTypeId: 'numeric' }))).toBe('5|{"0":"numeric"}');
        expect(constructColumnsVersion(buildOneAuditedColumn({ dataSubtypeId: 'decimal', dataTypeId: 'numeric' }))).toBe('5|{"0":"numeric.decimal"}');
    });

    it('changes with a chosen reading of null words', () => {
        expect(constructColumnsVersion(buildOneAuditedColumn({ nullWordsAreEmpty: true }))).toBe('5|{"0.nullWordsAreEmpty":"true"}');
    });

    it('changes with a chosen date order', () => {
        expect(constructColumnsVersion(buildOneAuditedColumn({ dateOrderId: 'dayFirst' }))).toBe('5|{"0.dateOrder":"dayFirst"}');
    });

    it('changes with a column chosen to be ignored', () => {
        expect(constructColumnsVersion(buildOneAuditedColumn({ isIgnored: true }))).toBe('5|{"0.isIgnored":"true"}');
    });

    it('changes with a chosen decimal separator', () => {
        expect(constructColumnsVersion(buildOneAuditedColumn({ decimalSeparatorId: ',' }))).toBe('5|{"0.decimalSeparator":","}');
    });

    it('is undefined without an audit', () => {
        expect(constructColumnsVersion(undefined)).toBeUndefined();
        expect(constructColumnsVersion({ columnChoiceConfigs: {}, contentAuditConfig: undefined })).toBeUndefined();
    });
});

describe('ignored columns', () => {
    it('round trip through the saved choices, by position', () => {
        expect(constructChosenIgnoredColumns(constructColumnChoiceConfigs({}, {}, {}, {}, { 1: true }))).toStrictEqual({ 1: true });
        expect(constructChosenIgnoredColumns(undefined)).toStrictEqual({});
    });

    it('take a derived column with the column it comes from', () => {
        const auditedColumns = buildAuditedColumns([buildColumn({ dataTypeId: 'numeric' }), buildColumn({}), buildColumn({ derivedFromColumnIndex: 0 })], {
            0: buildColumnChoice({ isIgnored: true })
        });

        expect(constructIgnoredColumnIndexes(auditedColumns)).toStrictEqual([0, 2]);
    });

    it('get null in a loaded record, which holds no value for them', () => {
        expect(placeLoadedValues(['a', 'c'], 3, new Set([1]))).toStrictEqual(['a', null, 'c']);
    });
});

describe('restoreItemReading', () => {
    it('puts the audit’s columns back as the user wants them read', () => {
        const itemReading = restoreItemReading({
            ...buildOneAuditedColumn({ dataTypeId: 'numeric' }),
            readingConfig: { dataFormatId: 'dtv' } as never,
            sampleConfig: { issues: [], parsedRecords: [[{ value: 'a', valueWasQuoted: false }]], size: 1, text: 'a' }
        });

        expect(itemReading).toMatchObject({ dataFormatId: 'dtv', parsedRecords: [[{ value: 'a', valueWasQuoted: false }]], text: 'a' });
        expect(itemReading?.columnConfigs[0]?.dataTypeId).toBe('numeric');
    });

    it('is undefined without a sample', () => {
        expect(restoreItemReading({ columnChoiceConfigs: undefined, contentAuditConfig: undefined, readingConfig: undefined, sampleConfig: undefined })).toBeUndefined();
    });
});

describe('constructDataTypeCellClass', () => {
    it('right aligns numbers with even digits', () => {
        expect(constructDataTypeCellClass('numeric')).toBe('justify-end tabular-nums');
    });

    it('keeps dates on the left with even digits', () => {
        expect(constructDataTypeCellClass('temporal')).toBe('tabular-nums');
    });

    it('adds nothing for other columns', () => {
        expect(constructDataTypeCellClass('string')).toBeUndefined();
        expect(constructDataTypeCellClass(undefined)).toBeUndefined();
    });
});

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

function buildAppliedReading(overrides: Partial<AppliedReading>): AppliedReading {
    return { dataFormatId: 'dtv', encodingId: 'utf-8', hasHeaders: true, parserId: undefined, structurePath: undefined, valueDelimiterId: undefined, ...overrides };
}

function buildColumn(overrides: Partial<ColumnAuditConfig>): ColumnAuditConfig {
    return { dataSubtypeId: undefined, dataTypeId: 'string', label: { en: 'Column' }, ...overrides } as ColumnAuditConfig;
}

function buildColumnChoice(overrides: Partial<ColumnChoiceConfig>): ColumnChoiceConfig {
    return {
        dataSubtypeId: undefined,
        dataTypeId: undefined,
        dateOrderId: undefined,
        decimalSeparatorId: undefined,
        isIgnored: undefined,
        nullWordsAreEmpty: undefined,
        ...overrides
    };
}

function buildAuditedColumns(
    columnConfigs: ColumnAuditConfig[],
    columnChoiceConfigs: ColumnChoiceConfigs = {}
): Pick<DataViewConfig, 'columnChoiceConfigs' | 'contentAuditConfig'> {
    return { columnChoiceConfigs, contentAuditConfig: { asAt: 5, columns: columnConfigs } as unknown as ContentAuditConfig };
}

function buildOneAuditedColumn(columnChoice?: Partial<ColumnChoiceConfig>): Pick<DataViewConfig, 'columnChoiceConfigs' | 'contentAuditConfig'> {
    return buildAuditedColumns([buildColumn({})], columnChoice == null ? {} : { 0: buildColumnChoice(columnChoice) });
}

function buildDataView(isComplete: boolean | undefined): Pick<DataViewConfig, 'columnChoiceConfigs' | 'contentAuditConfig'> {
    return { columnChoiceConfigs: undefined, contentAuditConfig: { columns: [buildColumn({ dataTypeId: 'unknown' })], isComplete } as unknown as ContentAuditConfig };
}
