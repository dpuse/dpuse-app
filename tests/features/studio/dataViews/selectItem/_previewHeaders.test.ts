// ── External Dependencies & Registrations
import { describe, expect, it } from 'vitest';

// ── DPUse Framework
import type { ItemReading } from '@/features/studio/dataViews/_dataViewColumns';

// ── Local Framework
import { applyPreviewHeaders } from '@/features/studio/dataViews/selectItem/_previewHeaders';

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

const ITEM_READING = {
    columnConfigs: [
        { dataTypeId: 'numeric', label: { en: 'Column 1' } },
        { dataTypeId: 'numeric', label: { en: 'Column 2' } }
    ],
    hasHeaders: false,
    parsedRecords: [
        [
            { value: '2023', valueWasQuoted: false },
            { value: null, valueWasQuoted: false }
        ],
        [
            { value: '7', valueWasQuoted: false },
            { value: '8', valueWasQuoted: false }
        ]
    ]
} as unknown as ItemReading;

// ── Tests ────────────────────────────────────────────────────────────────────────────────────────────────────────────

describe('applyPreviewHeaders', () => {
    it('names the columns from the first record, even when it holds numbers', () => {
        const itemReading = applyPreviewHeaders(ITEM_READING, true);

        expect(itemReading.hasHeaders).toBe(true);
        expect(itemReading.columnConfigs.map((columnConfig) => columnConfig.label.en)).toEqual(['2023', 'Column 2']);
    });

    it('gives the columns their numbered names when the first record is data', () => {
        const headedItemReading = applyPreviewHeaders(ITEM_READING, true);

        const itemReading = applyPreviewHeaders(headedItemReading, false);

        expect(itemReading.hasHeaders).toBe(false);
        expect(itemReading.columnConfigs.map((columnConfig) => columnConfig.label.en)).toEqual(['Column 1', 'Column 2']);
    });

    it('keeps the name of a derived column, which is not in the header record', () => {
        const currencyColumn = { dataTypeId: 'string', derivationId: 'currency', derivedFromColumnIndex: 0, label: { en: 'Column 1 currency' } };
        const itemReading = applyPreviewHeaders({ ...ITEM_READING, columnConfigs: [...ITEM_READING.columnConfigs, currencyColumn] } as ItemReading, true);

        expect(itemReading.columnConfigs.map((columnConfig) => columnConfig.label.en)).toEqual(['2023', 'Column 2', 'Column 1 currency']);
    });

    it('leaves the preview it was given unchanged', () => {
        applyPreviewHeaders(ITEM_READING, true);

        expect(ITEM_READING.hasHeaders).toBe(false);
        expect(ITEM_READING.columnConfigs[0]?.label.en).toBe('Column 1');
    });
});
