// ── External Dependencies & Registrations
import { describe, expect, it } from 'vitest';

// ── DPUse Framework
import type { PreviewConfig } from '@dpuse/dpuse-shared';

// ── Local Framework
import { applyPreviewHeaders } from '@/features/studio/dataViews/selectItem/_previewHeaders';

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

const PREVIEW_CONFIG = {
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
} as unknown as PreviewConfig;

// ── Tests ────────────────────────────────────────────────────────────────────────────────────────────────────────────

describe('applyPreviewHeaders', () => {
    it('names the columns from the first record, even when it holds numbers', () => {
        const previewConfig = applyPreviewHeaders(PREVIEW_CONFIG, true);

        expect(previewConfig.hasHeaders).toBe(true);
        expect(previewConfig.columnConfigs.map((columnConfig) => columnConfig.label.en)).toEqual(['2023', 'Column 2']);
    });

    it('gives the columns their numbered names when the first record is data', () => {
        const headedPreviewConfig = applyPreviewHeaders(PREVIEW_CONFIG, true);

        const previewConfig = applyPreviewHeaders(headedPreviewConfig, false);

        expect(previewConfig.hasHeaders).toBe(false);
        expect(previewConfig.columnConfigs.map((columnConfig) => columnConfig.label.en)).toEqual(['Column 1', 'Column 2']);
    });

    it('leaves the preview it was given unchanged', () => {
        applyPreviewHeaders(PREVIEW_CONFIG, true);

        expect(PREVIEW_CONFIG.hasHeaders).toBe(false);
        expect(PREVIEW_CONFIG.columnConfigs[0]?.label.en).toBe('Column 1');
    });
});
