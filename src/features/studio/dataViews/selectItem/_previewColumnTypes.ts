// ── DPUse Framework
import type { DataTypeId, ObjectColumnConfig } from '@dpuse/dpuse-shared';

// ── Local Framework
import type { ItemReading } from '@/features/studio/dataViews/_dataViewColumns';

// ── Types ────────────────────────────────────────────────────────────────────────────────────────────────────────────

export type DetectedColumnType = Pick<ObjectColumnConfig, 'dataSubtypeId' | 'dataTypeId'>;

// ── Actions ──────────────────────────────────────────────────────────────────────────────────────────────────────────

// The preview with every type the user chose put back, for after its columns are counted again.
export function applyPreviewColumnTypes(itemReading: ItemReading, dataTypeIds: Partial<Record<string, DataTypeId>>, detectedColumnTypes: DetectedColumnType[]): ItemReading {
    let typedItemReading = itemReading;
    for (const [columnIndex, detectedColumnType] of detectedColumnTypes.entries())
        typedItemReading = applyPreviewColumnType(typedItemReading, columnIndex, dataTypeIds[String(columnIndex)], detectedColumnType);
    return typedItemReading;
}

// The preview with one column read as the type the user chose, or as detected when they chose none. Detection's subtype
// only describes detection's type, so a different type has none.
export function applyPreviewColumnType(itemReading: ItemReading, columnIndex: number, dataTypeId: DataTypeId | undefined, detectedColumnType: DetectedColumnType): ItemReading {
    const columnType = dataTypeId == null || dataTypeId === detectedColumnType.dataTypeId ? detectedColumnType : { dataSubtypeId: undefined, dataTypeId };
    return {
        ...itemReading,
        columnConfigs: itemReading.columnConfigs.map((columnConfig, index) => (index === columnIndex ? { ...columnConfig, ...columnType } : columnConfig))
    };
}
