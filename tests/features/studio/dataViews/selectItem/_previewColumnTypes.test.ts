// ── External Dependencies & Registrations
import { describe, expect, it } from 'vitest';

// ── DPUse Framework
import type { ItemReading } from '@/features/studio/dataViews/_dataViewColumns';

// ── Local Framework
import { applyPreviewColumnType, applyPreviewColumnTypes } from '@/features/studio/dataViews/selectItem/_previewColumnTypes';

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

const DETECTED_COLUMN_TYPE = { dataSubtypeId: 'integer', dataTypeId: 'numeric' } as const;
const ITEM_READING = {
    columnConfigs: [
        { ...DETECTED_COLUMN_TYPE, label: { en: 'id' } },
        { dataSubtypeId: 'plain', dataTypeId: 'string', label: { en: 'city' } }
    ]
} as unknown as ItemReading;

// ── Tests ────────────────────────────────────────────────────────────────────────────────────────────────────────────

describe('applyPreviewColumnType', () => {
    it('reads only the chosen column as the chosen type, with no subtype', () => {
        const { columnConfigs } = applyPreviewColumnType(ITEM_READING, 0, 'string', DETECTED_COLUMN_TYPE);

        expect(columnConfigs[0]).toMatchObject({ dataSubtypeId: undefined, dataTypeId: 'string', label: { en: 'id' } });
        expect(columnConfigs[1]).toBe(ITEM_READING.columnConfigs[1]);
    });

    it('returns to the detected type and subtype when none is chosen', () => {
        const chosenItemReading = applyPreviewColumnType(ITEM_READING, 0, 'string', DETECTED_COLUMN_TYPE);

        expect(applyPreviewColumnType(chosenItemReading, 0, undefined, DETECTED_COLUMN_TYPE).columnConfigs[0]).toMatchObject(DETECTED_COLUMN_TYPE);
    });

    it('keeps the detected subtype when the detected type is chosen', () => {
        expect(applyPreviewColumnType(ITEM_READING, 0, 'numeric', DETECTED_COLUMN_TYPE).columnConfigs[0]).toMatchObject(DETECTED_COLUMN_TYPE);
    });
});

describe('applyPreviewColumnTypes', () => {
    it('puts back the chosen types, and leaves the other columns as detected', () => {
        const detectedColumnTypes = [DETECTED_COLUMN_TYPE, { dataSubtypeId: 'plain', dataTypeId: 'string' } as const];

        const itemReading = applyPreviewColumnTypes(ITEM_READING, { 0: 'string' }, detectedColumnTypes);

        expect(itemReading.columnConfigs[0]).toMatchObject({ dataSubtypeId: undefined, dataTypeId: 'string' });
        expect(itemReading.columnConfigs[1]).toMatchObject({ dataSubtypeId: 'plain', dataTypeId: 'string' });
    });
});
