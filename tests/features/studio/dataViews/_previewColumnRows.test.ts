/**
 * Preview column rows tests.
 */

// Vendor dependencies.
import { describe, expect, it } from 'vitest';

// Framework dependencies.
import { constructPreviewColumnHeaders, constructPreviewColumnRows, PREVIEW_COLUMN_KEYS } from '@/features/studio/dataViews/_previewColumnRows';
import type { ObjectColumnConfig, PreviewConfig } from '@dpuse/dpuse-shared';

function constructPreviewConfig(hasHeaders: boolean, columnConfig: Partial<ObjectColumnConfig>): PreviewConfig {
    const defaultColumnConfig = { dataTypeId: 'string', inferenceCounts: {}, label: { en: 'id' }, leadingInferenceCounts: {} };
    return { columnConfigs: [{ ...defaultColumnConfig, ...columnConfig }], hasHeaders } as unknown as PreviewConfig;
}

describe('constructPreviewColumnHeaders', () => {
    it('names every column of a row', () => {
        const headerKeys = Object.keys(constructPreviewColumnHeaders());

        expect(new Set(headerKeys)).toEqual(new Set(PREVIEW_COLUMN_KEYS));
    });
});

describe('constructPreviewColumnRows', () => {
    it('leaves the header out of the match, and adds the counts below a full match', () => {
        const previewConfig = constructPreviewConfig(true, {
            dataSubtypeId: 'integer',
            dataTypeId: 'numeric',
            inferenceCounts: { 'numeric.integer': 3, 'string.plain': 2 },
            leadingInferenceCounts: { 'string.plain': 1 }
        });

        expect(constructPreviewColumnRows(previewConfig)[0]).toMatchObject({ dataSubtypeLabel: 'Integer', dataTypeLabel: 'Number', label: 'id', matchText: '75% (3 of 4)' });
    });

    it('shows no subtype for plain text, which fits every value', () => {
        const previewConfig = constructPreviewConfig(false, { dataSubtypeId: 'plain', inferenceCounts: { 'numeric.integer': 1, 'string.plain': 1 } });

        expect(constructPreviewColumnRows(previewConfig)[0]).toMatchObject({ dataSubtypeLabel: '', dataTypeLabel: 'Text', label: 'id', matchText: '100%' });
    });

    it('shows every measured item', () => {
        const previewConfig = constructPreviewConfig(false, {
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

        expect(constructPreviewColumnRows(previewConfig)[0]).toMatchObject({
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
        const previewConfig = constructPreviewConfig(false, {
            blankValueCount: 1,
            dataTypeId: 'string',
            inferenceCounts: { 'numeric.integer': 3, 'string.plain': 1 },
            invalidValueCount: 1,
            missingValueCount: 2,
            validValueCount: 3
        });

        expect(constructPreviewColumnRows(previewConfig)[0]).toMatchObject({ blankValueText: '1', invalidValueText: '0', matchText: '100%', missingValueText: '2', validValueText: '4' });
    });

    it('says when a column held too many values to count, and leaves a preview read before counting blank', () => {
        const measuredConfig = constructPreviewConfig(false, { quotedValueCount: 0 });

        expect(constructPreviewColumnRows(measuredConfig)[0]?.distinctValueText).toBe('Not counted');
        expect(constructPreviewColumnRows(constructPreviewConfig(false, {}))[0]?.distinctValueText).toBe('');
    });

    it('shows no match for a column with no sampled values', () => {
        expect(constructPreviewColumnRows(constructPreviewConfig(false, {}))[0]?.matchText).toBe('');
    });
});
