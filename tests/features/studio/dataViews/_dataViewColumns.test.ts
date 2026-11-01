// ── External Dependencies & Registrations
import { describe, expect, it } from 'vitest';

// ── DPUse Framework
import type { ColumnSetConfig, ContentAuditConfig, DataViewColumnConfig, DataViewConfig } from '@dpuse/dpuse-shared';

// ── Local Framework
import {
    applyChosenColumnDataTypes,
    constructAuditColumnSetConfig,
    constructChosenColumnDataTypeIds,
    constructColumnSetVersion,
    constructItemColumnSetConfig,
    constructItemReading,
    constructLoadColumnConfigs,
    constructPreviewContentAuditConfig,
    constructReadConfig,
    constructStoredContentAuditConfig,
    constructStoredPreviewConfig,
    type ItemReading,
    resolveColumnConfig,
    restoreItemReading
} from '@/features/studio/dataViews/_dataViewColumns';

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

function buildColumn(overrides: Partial<DataViewColumnConfig>): DataViewColumnConfig {
    return { dataSubtypeId: undefined, dataTypeId: 'string', label: { en: 'Column' }, ...overrides } as DataViewColumnConfig;
}

function buildColumnSet(columnConfigs: DataViewColumnConfig[]): ColumnSetConfig {
    return { asAt: 5, columnConfigs };
}

function buildDataView(isComplete: boolean | undefined): Pick<DataViewConfig, 'columnSetConfig' | 'contentAuditConfig'> {
    return { columnSetConfig: buildColumnSet([buildColumn({ dataTypeId: 'unknown' })]), contentAuditConfig: isComplete == null ? undefined : ({ isComplete } as never) };
}

// ── Tests ────────────────────────────────────────────────────────────────────────────────────────────────────────────

describe('constructItemReading', () => {
    it('brings how the item is read, its preview and its audit’s columns together', () => {
        const columns = [buildColumn({})];

        const itemReading = constructItemReading({
            contentAuditConfig: { columns } as ContentAuditConfig,
            previewConfig: { parsedRecords: [], size: 4, text: 'a' },
            readConfig: { dataFormatId: 'dtv' } as never
        });

        expect(itemReading).toMatchObject({ columnConfigs: columns, dataFormatId: 'dtv', size: 4, text: 'a' });
    });
});

describe('the parts of an item saved with a data view', () => {
    const itemReading = { columnConfigs: [], dataFormatId: 'dtv', issues: [], parsedRecords: [], size: 4, text: 'a' } as unknown as ItemReading;

    it('keeps only how the item is read in the read configuration', () => {
        expect(constructReadConfig(itemReading)).toStrictEqual({ dataFormatId: 'dtv' });
    });

    it('leaves the raw text out of the preview, because the records hold the same block', () => {
        expect(constructStoredPreviewConfig(itemReading)).toStrictEqual({ issues: [], parsedRecords: [], size: 4, text: undefined });
    });

    it('leaves the columns out of the audit, because they are saved in the column set', () => {
        expect(constructStoredContentAuditConfig({ asAt: 1, columns: [] } as unknown as ContentAuditConfig)).toStrictEqual({ asAt: 1 });
    });
});

describe('constructPreviewContentAuditConfig', () => {
    it('counts the preview’s records, leaving out a header record', () => {
        const auditConfig = constructPreviewContentAuditConfig({ hasHeaders: true, parsedRecords: [[], [], []], size: 40 }, 7, false);

        expect(auditConfig).toMatchObject({ asAt: 7, byteCount: 40, isComplete: false, recordCount: 2 });
    });

    it('has no bytes for an item not read as bytes', () => {
        expect(constructPreviewContentAuditConfig({ hasHeaders: false, parsedRecords: [[]], size: undefined }, 7, true)).toMatchObject({ byteCount: 0, recordCount: 1 });
    });
});

describe('constructItemColumnSetConfig', () => {
    it('keeps the detected type apart from the chosen one', () => {
        const itemReading = { columnConfigs: [buildColumn({ dataTypeId: 'numeric' })] } as unknown as ItemReading;

        const columnSetConfig = constructItemColumnSetConfig(itemReading, 3, [{ dataSubtypeId: 'email', dataTypeId: 'string' }], { 0: 'numeric' });

        expect(columnSetConfig.asAt).toBe(3);
        expect(columnSetConfig.columnConfigs[0]).toMatchObject({ chosenDataTypeId: 'numeric', dataSubtypeId: 'email', dataTypeId: 'string' });
    });
});

describe('constructAuditColumnSetConfig', () => {
    it('replaces what was detected and keeps each chosen type', () => {
        const audit = { asAt: 9, columns: [buildColumn({ dataTypeId: 'temporal' }), buildColumn({ dataTypeId: 'numeric' })] } as unknown as ContentAuditConfig;

        const columnSetConfig = constructAuditColumnSetConfig(audit, buildColumnSet([buildColumn({ chosenDataTypeId: 'string' })]));

        expect(columnSetConfig.asAt).toBe(9);
        expect(columnSetConfig.columnConfigs[0]).toMatchObject({ chosenDataTypeId: 'string', dataTypeId: 'temporal' });
        expect(columnSetConfig.columnConfigs[1]?.chosenDataTypeId).toBeUndefined();
    });
});

describe('chosen column types', () => {
    it('round trip through a column set, by position', () => {
        const columnSetConfig = applyChosenColumnDataTypes(buildColumnSet([buildColumn({}), buildColumn({})]), { 1: 'boolean' });

        expect(constructChosenColumnDataTypeIds(columnSetConfig)).toStrictEqual({ 1: 'boolean' });
    });

    it('are empty without a column set', () => {
        expect(constructChosenColumnDataTypeIds(undefined)).toStrictEqual({});
    });
});

describe('resolveColumnConfig', () => {
    it('uses the chosen type and drops the detected subtype', () => {
        expect(resolveColumnConfig(buildColumn({ chosenDataTypeId: 'string', dataSubtypeId: 'integer', dataTypeId: 'numeric' }))).toMatchObject({
            dataSubtypeId: undefined,
            dataTypeId: 'string'
        });
    });

    it('keeps the detected type and subtype otherwise', () => {
        expect(resolveColumnConfig(buildColumn({ dataSubtypeId: 'integer', dataTypeId: 'numeric' }))).toMatchObject({ dataSubtypeId: 'integer', dataTypeId: 'numeric' });
        expect(resolveColumnConfig(buildColumn({ chosenDataTypeId: 'numeric', dataSubtypeId: 'integer', dataTypeId: 'numeric' }))).toMatchObject({ dataSubtypeId: 'integer' });
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

    it('has no columns without a column set', () => {
        expect(constructLoadColumnConfigs({ columnSetConfig: undefined, contentAuditConfig: undefined })).toStrictEqual([]);
    });
});

describe('constructColumnSetVersion', () => {
    it('is the time alone with no chosen type, as loads recorded earlier hold', () => {
        const columnSetConfig = buildColumnSet([buildColumn({})]);

        expect(constructColumnSetVersion(columnSetConfig)).toBe(5);
    });

    it('changes with a chosen type', () => {
        const columnSetConfig = buildColumnSet([buildColumn({ chosenDataTypeId: 'numeric' })]);

        expect(constructColumnSetVersion(columnSetConfig)).toBe('5|{"0":"numeric"}');
    });

    it('is undefined without a column set', () => {
        expect(constructColumnSetVersion(undefined)).toBeUndefined();
    });
});

describe('restoreItemReading', () => {
    it('puts the columns back as the user wants them read', () => {
        const itemReading = restoreItemReading({
            columnSetConfig: buildColumnSet([buildColumn({ chosenDataTypeId: 'numeric' })]),
            previewConfig: { parsedRecords: [] } as never,
            readConfig: { dataFormatId: 'dtv' } as never
        });

        expect(itemReading).toMatchObject({ dataFormatId: 'dtv', parsedRecords: [] });
        expect(itemReading?.columnConfigs[0]?.dataTypeId).toBe('numeric');
    });

    it('is undefined without a preview', () => {
        expect(restoreItemReading({ columnSetConfig: undefined, previewConfig: undefined, readConfig: undefined })).toBeUndefined();
    });
});
