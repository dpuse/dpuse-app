// ── External Dependencies & Registrations
import { describe, expect, it } from 'vitest';

// ── DPUse Framework
import type { DataViewConfig } from '@dpuse/dpuse-shared';

// ── Local Framework
import { applyDataViewWorkingCopy, constructDataViewWorkingCopy, isSameDataViewDefinition } from '@/features/studio/dataViews/_dataViewWorkingCopy';

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

const DATA_VIEW = {
    columnSetConfig: { asAt: 1, columnConfigs: [{ label: { en: 'Name' } }], sourceId: 'preview' },
    connectionId: 'one',
    connectionNodeConfig: { extension: 'csv', folderPath: '/data', name: 'sales' },
    id: 'a',
    label: { en: 'Sales' },
    previewConfig: { dataFormatId: 'dtv', encodingId: 'utf-8' }
} as unknown as DataViewConfig;

// ── Tests ────────────────────────────────────────────────────────────────────────────────────────────────────────────

describe('constructDataViewWorkingCopy', () => {
    it('leaves out the label, which saves at once', () => {
        expect(constructDataViewWorkingCopy(DATA_VIEW)).not.toHaveProperty('label');
    });
});

describe('applyDataViewWorkingCopy', () => {
    it('keeps the saved data view when there is no working copy', () => {
        expect(applyDataViewWorkingCopy(DATA_VIEW, undefined)).toBe(DATA_VIEW);
    });

    it('takes the definition from the working copy and the label from the saved data view', () => {
        const workingCopy = constructDataViewWorkingCopy({ ...DATA_VIEW, connectionId: 'two', label: { en: 'Old' } });

        expect(applyDataViewWorkingCopy(DATA_VIEW, workingCopy)).toMatchObject({ connectionId: 'two', label: { en: 'Sales' } });
    });

    it('clears a field the stored working copy has lost, rather than bringing back the saved value', () => {
        const { previewConfig: _previewConfig, ...storedWorkingCopy } = constructDataViewWorkingCopy(DATA_VIEW);

        expect(applyDataViewWorkingCopy(DATA_VIEW, storedWorkingCopy as never).previewConfig).toBeUndefined();
    });
});

describe('isSameDataViewDefinition', () => {
    it('ignores when the preview was read', () => {
        const readAgain = { ...DATA_VIEW, columnSetConfig: { ...DATA_VIEW.columnSetConfig, asAt: 2 } } as DataViewConfig;

        expect(isSameDataViewDefinition(DATA_VIEW, readAgain)).toBe(true);
    });

    it('sees a different connection', () => {
        expect(isSameDataViewDefinition(DATA_VIEW, { ...DATA_VIEW, connectionId: 'two' })).toBe(false);
    });

    it('sees a chosen column type', () => {
        const typed = { ...DATA_VIEW, columnSetConfig: { asAt: 1, columnConfigs: [{ chosenDataTypeId: 'numeric' }], sourceId: 'preview' } } as DataViewConfig;

        expect(isSameDataViewDefinition(DATA_VIEW, typed)).toBe(false);
    });

    it('sees a different audit', () => {
        const audited = { ...DATA_VIEW, columnSetConfig: { asAt: 1, columnConfigs: [], sourceId: 'audit' } } as DataViewConfig;

        expect(isSameDataViewDefinition(DATA_VIEW, audited)).toBe(false);
    });
});
