/**
 * Preview column rows tests.
 */

// Vendor dependencies.
import { describe, expect, it } from 'vitest';

// Framework dependencies.
import type { ColumnAuditConfig } from '@dpuse/dpuse-shared';
import type { ItemReading } from '@/features/studio/dataViews/_dataViewColumns';
import {
    constructColumnValueCounts,
    constructPreviewColumnHeaders,
    constructPreviewColumnIcons,
    constructPreviewColumnRows,
    countChosenTypeMisfits,
    isColumnComplete,
    PREVIEW_COLUMN_KEYS
} from '@/features/studio/dataViews/_previewColumnRows';
import { DATA_SUBTYPE_ICONS, DATA_TYPE_ICONS, getColumnTypeIcon } from '@/features/studio/dataViews/_columnTypeIcons';

function buildItemReading(hasHeaders: boolean, columnConfig: Partial<ColumnAuditConfig>): ItemReading {
    const defaultColumnConfig = { dataTypeId: 'string', inferenceCounts: {}, label: { en: 'id' }, leadingInferenceCounts: {} };
    return { columnConfigs: [{ ...defaultColumnConfig, ...columnConfig }], hasHeaders } as unknown as ItemReading;
}

describe('constructPreviewColumnHeaders', () => {
    it('names every column of a row', () => {
        const headerKeys = Object.keys(constructPreviewColumnHeaders());

        expect(new Set(headerKeys)).toEqual(new Set(PREVIEW_COLUMN_KEYS));
    });
});

describe('constructPreviewColumnIcons', () => {
    it('gives a column its type and subtype icons', () => {
        const itemReading = buildItemReading(false, { dataSubtypeId: 'integer', dataTypeId: 'numeric' });

        expect(constructPreviewColumnIcons(itemReading)[0]).toEqual({ dataSubtypeIcon: DATA_SUBTYPE_ICONS.integer, dataTypeIcon: DATA_TYPE_ICONS.numeric });
    });

    it('shows no subtype icon for plain text, which has no subtype label', () => {
        const itemReading = buildItemReading(false, { dataSubtypeId: 'plain' });

        expect(constructPreviewColumnIcons(itemReading)[0]).toEqual({ dataSubtypeIcon: undefined, dataTypeIcon: DATA_TYPE_ICONS.string });
    });
});

describe('getColumnTypeIcon', () => {
    it('uses the subtype icon, or the type icon when there is no subtype', () => {
        expect(getColumnTypeIcon({ dataSubtypeId: 'email', dataTypeId: 'string' })).toBe(DATA_SUBTYPE_ICONS.email);
        expect(getColumnTypeIcon({ dataSubtypeId: undefined, dataTypeId: 'boolean' })).toBe(DATA_TYPE_ICONS.boolean);
    });
});

describe('constructPreviewColumnRows', () => {
    it('leaves the header out of the invalid count', () => {
        const itemReading = buildItemReading(true, {
            dataSubtypeId: 'integer',
            dataTypeId: 'numeric',
            inferenceCounts: { 'numeric.integer': 3, 'string.plain': 2 },
            leadingInferenceCounts: { 'string.plain': 1 }
        });

        expect(constructPreviewColumnRows(itemReading)[0]).toMatchObject({ dataSubtypeLabel: 'Integer', dataTypeLabel: 'Number', label: 'id', invalidValueText: '1' });
    });

    it('shows no subtype for plain text, which fits every value', () => {
        const itemReading = buildItemReading(false, { dataSubtypeId: 'plain', inferenceCounts: { 'numeric.integer': 1, 'string.plain': 1 } });

        expect(constructPreviewColumnRows(itemReading)[0]).toMatchObject({ dataSubtypeLabel: '', dataTypeLabel: 'Text', label: 'id', invalidValueText: '0' });
    });

    it('shows every measured item', () => {
        const itemReading = buildItemReading(false, {
            dataTypeId: 'numeric',
            decimalSeparatorId: ',',
            validDistinctValueCount: 2,
            validFormats: { '9999': 3, '9999,9': 5 },
            validFrequentValues: { '7': 2 },
            invalidValueCount: 1,
            invalidValues: { none: 'string.plain' },
            formatIssueIds: ['decimalSeparatorUnproven'],
            isComplete: false,
            validIsUnique: false,
            validMaxDecimals: 2,
            validMaxWholeDigits: 2,
            validMinDecimals: 2,
            validMinWholeDigits: 1
        });

        expect(constructPreviewColumnRows(itemReading)[0]).toMatchObject({
            formatText: '9999,9 (5), 9999 (3)',
            readingText: 'Decimal comma (unclear, check this column)',
            uniqueText: 'No'
        });
    });

    it('names a derived column as derived, because the item does not hold it', () => {
        const itemReading = buildItemReading(false, { derivedFromColumnIndex: 0, label: { en: 'Amount currency' } });

        expect(constructPreviewColumnRows(itemReading)[0]?.label).toBe('Amount currency (derived)');
    });

    it('calls a column unclear on its own when there is no reading to name', () => {
        const itemReading = buildItemReading(false, { dataTypeId: 'numeric', formatIssueIds: ['currencyMixed'] });

        expect(constructPreviewColumnRows(itemReading)[0]?.readingText).toBe('Unclear, check this column');
    });

    it('keeps the counts in step with a type the user chose', () => {
        const itemReading = buildItemReading(false, {
            blankValueCount: 1,
            dataTypeId: 'string',
            inferenceCounts: { 'numeric.integer': 3, 'string.plain': 1 },
            invalidValueCount: 1,
            missingValueCount: 2,
            validValueCount: 3
        });

        expect(constructPreviewColumnRows(itemReading)[0]).toMatchObject({
            blankValueText: '1',
            invalidValueText: '0',
            missingValueText: '2'
        });
    });

    it('splits a column’s values by whether they fit its type, leaving out a header record', () => {
        const itemReading = buildItemReading(true, {
            blankValueCount: 1,
            dataTypeId: 'numeric',
            inferenceCounts: { 'numeric.integer': 4, 'string.plain': 3 },
            leadingInferenceCounts: { 'string.plain': 1 },
            missingValueCount: 2
        });

        expect(constructColumnValueCounts(itemReading)[0]).toEqual({ blankCount: 1, invalidCount: 2, missingCount: 2, validCount: 4 });
    });

    it('shows no invalid count for a column with no sampled values', () => {
        expect(constructPreviewColumnRows(buildItemReading(false, {}))[0]?.invalidValueText).toBe('');
    });
});

describe('countChosenTypeMisfits', () => {
    const inferenceCounts = { 'numeric.integer': 6, 'string.plain': 3 };
    const detectedText = { dataSubtypeId: 'plain', dataTypeId: 'string' } as const;

    it('counts the values that do not fit a chosen type, leaving out a header', () => {
        const itemReading = buildItemReading(true, { dataSubtypeId: 'integer', dataTypeId: 'numeric', inferenceCounts, leadingInferenceCounts: { 'string.plain': 1 } });

        expect(countChosenTypeMisfits(itemReading, 0, detectedText)).toBe(2);
    });

    it('counts none for the detected type, a text type or a column that is not there', () => {
        const numericReading = buildItemReading(false, { dataSubtypeId: 'integer', dataTypeId: 'numeric', inferenceCounts });

        expect(countChosenTypeMisfits(numericReading, 0, { dataSubtypeId: 'integer', dataTypeId: 'numeric' })).toBe(0);
        expect(countChosenTypeMisfits(buildItemReading(false, { dataSubtypeId: 'email', dataTypeId: 'string', inferenceCounts }), 0, detectedText)).toBe(0);
        expect(countChosenTypeMisfits(numericReading, 1, detectedText)).toBe(0);
        expect(countChosenTypeMisfits(numericReading, 0, undefined)).toBe(0);
    });
});

describe('isColumnComplete', () => {
    const detectedText = { dataSubtypeId: 'plain', dataTypeId: 'string' } as const;

    it('is complete when the audit found every value, and the type in use fits them all', () => {
        const textReading = buildItemReading(false, { dataSubtypeId: 'plain', dataTypeId: 'string', inferenceCounts: { 'string.plain': 3 }, isComplete: true });

        expect(isColumnComplete(textReading, 0, detectedText)).toBe(true);
        expect(isColumnComplete(buildItemReading(false, { dataTypeId: 'string', isComplete: false }), 0, detectedText)).toBe(false);
    });

    it('is not complete when a chosen type leaves values that load empty', () => {
        const itemReading = buildItemReading(false, { dataSubtypeId: 'integer', dataTypeId: 'numeric', inferenceCounts: { 'numeric.integer': 6, 'string.plain': 1 }, isComplete: true });

        expect(isColumnComplete(itemReading, 0, detectedText)).toBe(false);
    });
});
