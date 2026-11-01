/**
 * Preview column rows tests.
 */

// Vendor dependencies.
import { describe, expect, it } from 'vitest';

// Framework dependencies.
import type { ItemReading } from '@/features/studio/dataViews/_dataViewColumns';
import type { ObjectColumnConfig } from '@dpuse/dpuse-shared';
import {
    constructColumnValueCounts,
    constructPreviewColumnHeaders,
    constructPreviewColumnIcons,
    constructPreviewColumnRows,
    PREVIEW_COLUMN_KEYS
} from '@/features/studio/dataViews/_previewColumnRows';
import { DATA_SUBTYPE_ICONS, DATA_TYPE_ICONS, getColumnTypeIcon } from '@/features/studio/dataViews/_columnTypeIcons';

function buildItemReading(hasHeaders: boolean, columnConfig: Partial<ObjectColumnConfig>): ItemReading {
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
    it('leaves the header out of the match, and adds the counts below a full match', () => {
        const itemReading = buildItemReading(true, {
            dataSubtypeId: 'integer',
            dataTypeId: 'numeric',
            inferenceCounts: { 'numeric.integer': 3, 'string.plain': 2 },
            leadingInferenceCounts: { 'string.plain': 1 }
        });

        expect(constructPreviewColumnRows(itemReading)[0]).toMatchObject({ dataSubtypeLabel: 'Integer', dataTypeLabel: 'Number', label: 'id', matchText: '75% (3 of 4)' });
    });

    it('shows no subtype for plain text, which fits every value', () => {
        const itemReading = buildItemReading(false, { dataSubtypeId: 'plain', inferenceCounts: { 'numeric.integer': 1, 'string.plain': 1 } });

        expect(constructPreviewColumnRows(itemReading)[0]).toMatchObject({ dataSubtypeLabel: '', dataTypeLabel: 'Text', label: 'id', matchText: '100%' });
    });

    it('shows every measured item', () => {
        const itemReading = buildItemReading(false, {
            dataTypeId: 'numeric',
            decimalSeparatorId: ',',
            distinctValueCount: 2,
            formats: { '9999': 3, '9999,9': 5 },
            frequentValues: { '7': 2 },
            invalidValueCount: 1,
            invalidValues: { none: 'string.plain' },
            isFormatAmbiguous: true,
            isRequired: false,
            isUnique: false,
            maxDecimals: 2,
            maxValue: '12.5',
            maxWholeDigits: 2,
            minDecimals: 2,
            minValue: '7',
            minWholeDigits: 1,
            quotedValueCount: 0,
            storageTypeId: 'int32',
            validValues: { '7': 'numeric.integer', '12': 'numeric.integer' }
        });

        expect(constructPreviewColumnRows(itemReading)[0]).toMatchObject({
            decimalText: '2',
            distinctValueText: '2',
            formatText: '9999,9 (5), 9999 (3)',
            frequentValueText: '7 (2)',
            invalidSampleText: 'none',
            readingText: 'Decimal comma (unclear, check this column)',
            requiredText: 'No',
            storageTypeLabel: '32-bit integer',
            uniqueText: 'No',
            validSampleText: '7, 12',
            wholeDigitText: '1 to 2'
        });
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
            matchText: '100%',
            missingValueText: '2',
            validValueText: '4'
        });
    });

    it('says when a column held too many values to count, and leaves a preview read before counting blank', () => {
        const measuredConfig = buildItemReading(false, { quotedValueCount: 0 });

        expect(constructPreviewColumnRows(measuredConfig)[0]?.distinctValueText).toBe('Not counted');
        expect(constructPreviewColumnRows(buildItemReading(false, {}))[0]?.distinctValueText).toBe('');
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

    it('shows no match for a column with no sampled values', () => {
        expect(constructPreviewColumnRows(buildItemReading(false, {}))[0]?.matchText).toBe('');
    });
});
