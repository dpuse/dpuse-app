// ── External Dependencies & Registrations
import { describe, expect, it } from 'vitest';

// ── DPUse Framework
import type { PreviewConfig } from '@dpuse/dpuse-shared';

// ── Local Framework
import { applyPreviewColumnType } from '@/features/studio/dataViews/selectItem/_previewColumnTypes';

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

const DETECTED_COLUMN_TYPE = { dataSubtypeId: 'integer', dataTypeId: 'numeric' } as const;
const PREVIEW_CONFIG = {
    columnConfigs: [
        { ...DETECTED_COLUMN_TYPE, label: { en: 'id' } },
        { dataSubtypeId: 'plain', dataTypeId: 'string', label: { en: 'city' } }
    ]
} as unknown as PreviewConfig;

// ── Tests ────────────────────────────────────────────────────────────────────────────────────────────────────────────

describe('applyPreviewColumnType', () => {
    it('reads only the chosen column as the chosen type, with no subtype', () => {
        const { columnConfigs } = applyPreviewColumnType(PREVIEW_CONFIG, 0, 'string', DETECTED_COLUMN_TYPE);

        expect(columnConfigs[0]).toMatchObject({ dataSubtypeId: undefined, dataTypeId: 'string', label: { en: 'id' } });
        expect(columnConfigs[1]).toBe(PREVIEW_CONFIG.columnConfigs[1]);
    });

    it('returns to the detected type and subtype when none is chosen', () => {
        const chosenPreviewConfig = applyPreviewColumnType(PREVIEW_CONFIG, 0, 'string', DETECTED_COLUMN_TYPE);

        expect(applyPreviewColumnType(chosenPreviewConfig, 0, undefined, DETECTED_COLUMN_TYPE).columnConfigs[0]).toMatchObject(DETECTED_COLUMN_TYPE);
    });

    it('keeps the detected subtype when the detected type is chosen', () => {
        expect(applyPreviewColumnType(PREVIEW_CONFIG, 0, 'numeric', DETECTED_COLUMN_TYPE).columnConfigs[0]).toMatchObject(DETECTED_COLUMN_TYPE);
    });
});
