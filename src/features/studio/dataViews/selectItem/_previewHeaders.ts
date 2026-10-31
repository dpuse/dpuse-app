// ── DPUse Framework
import type { PreviewConfig } from '@dpuse/dpuse-shared';

// ── Actions ──────────────────────────────────────────────────────────────────────────────────────────────────────────

// The preview as the user says its first record reads: as the columns' names or as data. Header detection can get this
// wrong, for example when the names are numbers. Only the labels change here, because 'dpuse-engine' counts the columns
// again. An empty header value keeps the name 'dpuse-engine' gives a column with no header.
export function applyPreviewHeaders(previewConfig: PreviewConfig, hasHeaders: boolean): PreviewConfig {
    const headerRecord = hasHeaders ? previewConfig.parsedRecords[0] : undefined;
    return {
        ...previewConfig,
        columnConfigs: previewConfig.columnConfigs.map((columnConfig, index) => ({
            ...columnConfig,
            label: { en: headerRecord?.[index]?.value ?? `Column ${String(index + 1)}` }
        })),
        hasHeaders
    };
}
