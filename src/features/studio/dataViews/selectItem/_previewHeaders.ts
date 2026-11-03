// ── Local Framework
import type { ItemReading } from '@/features/studio/dataViews/_dataViewColumns';
// ── DPUse Framework

// ── Actions ──────────────────────────────────────────────────────────────────────────────────────────────────────────

// The preview as the user says its first record reads: as the columns' names or as data. Header detection can get this
// wrong, for example when the names are numbers. Only the labels change here, because 'dpuse-engine' counts the columns
// again. An empty header value keeps the name 'dpuse-engine' gives a column with no header. A derived column, such as a
// currency column, is not in the header record, so it keeps its name until the engine counts the columns again.
export function applyPreviewHeaders(itemReading: ItemReading, hasHeaders: boolean): ItemReading {
    const headerRecord = hasHeaders ? itemReading.parsedRecords[0] : undefined;
    return {
        ...itemReading,
        columnConfigs: itemReading.columnConfigs.map((columnConfig, index) =>
            columnConfig.derivedFromColumnIndex == null ? { ...columnConfig, label: { en: headerRecord?.[index]?.value ?? `Column ${String(index + 1)}` } } : columnConfig
        ),
        hasHeaders
    };
}
