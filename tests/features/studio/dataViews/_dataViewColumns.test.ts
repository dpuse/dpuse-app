// ── External Dependencies & Registrations
import { describe, expect, it } from 'vitest';

// ── DPUse Framework
import type { ColumnSetConfig, ContentAuditConfig, DataViewColumnConfig, PreviewConfig } from '@dpuse/dpuse-shared';

// ── Local Framework
import {
    applyChosenColumnDataTypes,
    constructAuditColumnSetConfig,
    constructAuditSummaryConfig,
    constructChosenColumnDataTypeIds,
    constructColumnSetVersion,
    constructLoadColumnConfigs,
    constructPreviewColumnSetConfig,
    constructStoredPreviewConfig,
    resolveColumnConfig,
    restorePreviewConfig
} from '@/features/studio/dataViews/_dataViewColumns';

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

function buildColumn(overrides: Partial<DataViewColumnConfig>): DataViewColumnConfig {
    return { dataSubtypeId: undefined, dataTypeId: 'string', label: { en: 'Column' }, ...overrides } as DataViewColumnConfig;
}

function buildColumnSet(columnConfigs: DataViewColumnConfig[], sourceId: ColumnSetConfig['sourceId'] = 'preview'): ColumnSetConfig {
    return { asAt: 5, columnConfigs, sourceId };
}

// ── Tests ────────────────────────────────────────────────────────────────────────────────────────────────────────────

describe('constructStoredPreviewConfig and constructAuditSummaryConfig', () => {
    it('leave the columns out, because they are saved in the column set', () => {
        expect(constructStoredPreviewConfig({ asAt: 1, columnConfigs: [] } as unknown as PreviewConfig)).toStrictEqual({ asAt: 1 });
        expect(constructAuditSummaryConfig({ asAt: 1, columns: [] } as unknown as ContentAuditConfig)).toStrictEqual({ asAt: 1 });
    });
});

describe('constructPreviewColumnSetConfig', () => {
    it('keeps the detected type apart from the chosen one', () => {
        const previewConfig = { asAt: 3, columnConfigs: [buildColumn({ dataTypeId: 'numeric' })] } as unknown as PreviewConfig;

        const columnSetConfig = constructPreviewColumnSetConfig(previewConfig, [{ dataSubtypeId: 'email', dataTypeId: 'string' }], { 0: 'numeric' });

        expect(columnSetConfig).toMatchObject({ asAt: 3, sourceId: 'preview' });
        expect(columnSetConfig.columnConfigs[0]).toMatchObject({ chosenDataTypeId: 'numeric', dataSubtypeId: 'email', dataTypeId: 'string' });
    });
});

describe('constructAuditColumnSetConfig', () => {
    it('replaces what was detected and keeps each chosen type', () => {
        const audit = { asAt: 9, columns: [buildColumn({ dataTypeId: 'temporal' }), buildColumn({ dataTypeId: 'numeric' })] } as unknown as ContentAuditConfig;

        const columnSetConfig = constructAuditColumnSetConfig(audit, buildColumnSet([buildColumn({ chosenDataTypeId: 'string' })]));

        expect(columnSetConfig).toMatchObject({ asAt: 9, sourceId: 'audit' });
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
    it('loads a preview’s unknown column as text, because it may only be blank in the sample', () => {
        const columnSetConfig = buildColumnSet([buildColumn({ dataTypeId: 'unknown' })], 'preview');

        expect(constructLoadColumnConfigs(columnSetConfig)[0]?.dataTypeId).toBe('string');
    });

    it('leaves an audit’s unknown column, because the whole item was read', () => {
        const columnSetConfig = buildColumnSet([buildColumn({ dataTypeId: 'unknown' })], 'audit');

        expect(constructLoadColumnConfigs(columnSetConfig)[0]?.dataTypeId).toBe('unknown');
    });

    it('has no columns without a column set', () => {
        expect(constructLoadColumnConfigs(undefined)).toStrictEqual([]);
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

describe('restorePreviewConfig', () => {
    it('puts the columns back as the user wants them read', () => {
        const previewConfig = restorePreviewConfig({
            columnSetConfig: buildColumnSet([buildColumn({ chosenDataTypeId: 'numeric' })]),
            previewConfig: { asAt: 1 } as never
        });

        expect(previewConfig?.columnConfigs[0]?.dataTypeId).toBe('numeric');
    });

    it('is undefined without a preview', () => {
        expect(restorePreviewConfig({ columnSetConfig: undefined, previewConfig: undefined })).toBeUndefined();
    });
});
