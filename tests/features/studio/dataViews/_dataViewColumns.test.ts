// ── External Dependencies & Registrations
import { describe, expect, it } from 'vitest';

// ── DPUse Framework
import type { ColumnChoiceConfigs, ContentAuditConfig, DataViewConfig, ObjectColumnConfig } from '@dpuse/dpuse-shared';

// ── Local Framework
import {
    constructChosenColumnTypes,
    constructChosenDecimalSeparators,
    constructChosenNullWords,
    constructColumnChoiceConfigs,
    constructColumnsVersion,
    constructDataTypeCellClass,
    constructItemReading,
    constructLoadColumnConfigs,
    constructPreviewContentAuditConfig,
    constructReadingConfig,
    constructSampleConfig,
    isDerivedColumn,
    isEmptyUnitColumn,
    type ItemReading,
    resolveColumnConfig,
    restoreItemReading
} from '@/features/studio/dataViews/_dataViewColumns';

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

function buildColumn(overrides: Partial<ObjectColumnConfig>): ObjectColumnConfig {
    return { dataSubtypeId: undefined, dataTypeId: 'string', label: { en: 'Column' }, ...overrides } as ObjectColumnConfig;
}

function buildAuditedColumns(
    columnConfigs: ObjectColumnConfig[],
    columnChoiceConfigs: ColumnChoiceConfigs = {}
): Pick<DataViewConfig, 'columnChoiceConfigs' | 'contentAuditConfig'> {
    return { columnChoiceConfigs, contentAuditConfig: { asAt: 5, columns: columnConfigs } as unknown as ContentAuditConfig };
}

function buildOneAuditedColumn(columnChoiceConfigs: ColumnChoiceConfigs = {}): Pick<DataViewConfig, 'columnChoiceConfigs' | 'contentAuditConfig'> {
    return buildAuditedColumns([buildColumn({})], columnChoiceConfigs);
}

function buildDataView(isComplete: boolean | undefined): Pick<DataViewConfig, 'columnChoiceConfigs' | 'contentAuditConfig'> {
    return { columnChoiceConfigs: undefined, contentAuditConfig: { columns: [buildColumn({ dataTypeId: 'unknown' })], isComplete } as unknown as ContentAuditConfig };
}

// ── Tests ────────────────────────────────────────────────────────────────────────────────────────────────────────────

describe('constructItemReading', () => {
    it('brings how the item is read, its sample and its audit’s columns together', () => {
        const columns = [buildColumn({})];

        const itemReading = constructItemReading({
            contentAuditConfig: { columns } as ContentAuditConfig,
            readingConfig: { dataFormatId: 'dtv' } as never,
            sampleConfig: { parsedRecords: [], size: 4, text: 'a' }
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

    it('keeps only how the item is read in the reading configuration', () => {
        expect(constructReadingConfig(itemReading)).toStrictEqual({ dataFormatId: 'dtv' });
    });

    it('keeps the text with the records it was parsed into, each value with whether it was quoted', () => {
        expect(constructSampleConfig(itemReading)).toStrictEqual({
            issues: [],
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
        expect(constructColumnChoiceConfigs({ 0: { dataSubtypeId: 'decimal', dataTypeId: 'numeric' } }, { 2: ',' }, { 3: true })).toStrictEqual({
            0: { dataSubtypeId: 'decimal', dataTypeId: 'numeric', decimalSeparatorId: undefined, nullWordsAreEmpty: undefined },
            2: { dataSubtypeId: undefined, dataTypeId: undefined, decimalSeparatorId: ',', nullWordsAreEmpty: undefined },
            3: { dataSubtypeId: undefined, dataTypeId: undefined, decimalSeparatorId: undefined, nullWordsAreEmpty: true }
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
            { 0: { dataTypeId: 'numeric' }, 1: { dataTypeId: 'numeric' }, 2: { dataTypeId: 'temporal' }, 3: { dataTypeId: 'boolean' } }
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

    it('give back the decimal separators and readings of null words chosen', () => {
        const columnChoiceConfigs = constructColumnChoiceConfigs({}, { 0: ',' }, { 1: true });

        expect(constructChosenDecimalSeparators(columnChoiceConfigs)).toEqual({ 0: ',' });
        expect(constructChosenNullWords(columnChoiceConfigs)).toEqual({ 1: true });
    });
});

describe('resolveColumnConfig', () => {
    it('uses the chosen type and subtype in place of the detected ones', () => {
        expect(resolveColumnConfig(buildColumn({ dataSubtypeId: 'integer', dataTypeId: 'numeric' }), { dataSubtypeId: 'email', dataTypeId: 'string' })).toMatchObject({
            dataSubtypeId: 'email',
            dataTypeId: 'string'
        });
    });

    it('uses the figures measured for the chosen decimal separator', () => {
        const numericReadings = {
            ',': { dataSubtypeId: 'integer', maxValue: '3456' },
            '.': { dataSubtypeId: 'decimal', maxValue: '3.456' }
        } as ObjectColumnConfig['numericReadings'];

        expect(resolveColumnConfig(buildColumn({ dataTypeId: 'numeric', decimalSeparatorId: '.', numericReadings }), { decimalSeparatorId: ',' })).toMatchObject({
            dataSubtypeId: 'integer',
            maxValue: '3456'
        });
    });

    it('uses the chosen decimal separator in place of the detected one', () => {
        expect(resolveColumnConfig(buildColumn({ dataTypeId: 'numeric', decimalSeparatorId: '.' }), { decimalSeparatorId: ',' }).decimalSeparatorId).toBe(',');
        expect(resolveColumnConfig(buildColumn({ dataTypeId: 'numeric', decimalSeparatorId: '.' }), undefined).decimalSeparatorId).toBe('.');
    });

    it('uses the chosen reading of null words', () => {
        expect(resolveColumnConfig(buildColumn({}), { nullWordsAreEmpty: true }).nullWordsAreEmpty).toBe(true);
    });

    it('keeps the detected type and subtype otherwise', () => {
        expect(resolveColumnConfig(buildColumn({ dataSubtypeId: 'integer', dataTypeId: 'numeric' }), undefined)).toMatchObject({ dataSubtypeId: 'integer', dataTypeId: 'numeric' });
        expect(resolveColumnConfig(buildColumn({ dataSubtypeId: 'integer', dataTypeId: 'numeric' }), { dataTypeId: 'numeric' })).toMatchObject({ dataSubtypeId: 'integer' });
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
        expect(isDerivedColumn(buildColumn({ derivationId: 'currency', derivedFromColumnIndex: 0 }))).toBe(true);
        expect(isDerivedColumn(buildColumn({}))).toBe(false);
    });
});

describe('isEmptyUnitColumn', () => {
    it('is a unit column that found no unit', () => {
        expect(isEmptyUnitColumn(buildColumn({ derivationId: 'unit', derivedFromColumnIndex: 0, validValueCount: 0 }))).toBe(true);
        expect(isEmptyUnitColumn(buildColumn({ derivationId: 'unit', derivedFromColumnIndex: 0, validValueCount: 2 }))).toBe(false);
        expect(isEmptyUnitColumn(buildColumn({ validValueCount: 0 }))).toBe(false);
    });
});

describe('constructColumnsVersion', () => {
    it('is the time alone with no chosen type, as loads recorded earlier hold', () => {
        expect(constructColumnsVersion(buildOneAuditedColumn())).toBe(5);
    });

    it('changes with a chosen type', () => {
        expect(constructColumnsVersion(buildOneAuditedColumn({ 0: { dataTypeId: 'numeric' } }))).toBe('5|{"0":"numeric"}');
        expect(constructColumnsVersion(buildOneAuditedColumn({ 0: { dataSubtypeId: 'decimal', dataTypeId: 'numeric' } }))).toBe('5|{"0":"numeric.decimal"}');
    });

    it('changes with a chosen reading of null words', () => {
        expect(constructColumnsVersion(buildOneAuditedColumn({ 0: { nullWordsAreEmpty: true } }))).toBe('5|{"0.nullWordsAreEmpty":"true"}');
    });

    it('changes with a chosen decimal separator', () => {
        expect(constructColumnsVersion(buildOneAuditedColumn({ 0: { decimalSeparatorId: ',' } }))).toBe('5|{"0.decimalSeparator":","}');
    });

    it('is undefined without an audit', () => {
        expect(constructColumnsVersion(undefined)).toBeUndefined();
        expect(constructColumnsVersion({ columnChoiceConfigs: {}, contentAuditConfig: undefined })).toBeUndefined();
    });
});

describe('restoreItemReading', () => {
    it('puts the audit’s columns back as the user wants them read', () => {
        const itemReading = restoreItemReading({
            ...buildOneAuditedColumn({ 0: { dataTypeId: 'numeric' } }),
            readingConfig: { dataFormatId: 'dtv' } as never,
            sampleConfig: { parsedRecords: [[{ value: 'a', valueWasQuoted: false }]], size: 1, text: 'a' }
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
