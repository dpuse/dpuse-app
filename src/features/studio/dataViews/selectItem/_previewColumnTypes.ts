// ── DPUse Framework
import type { DataTypeId, ObjectColumnConfig, PreviewConfig } from '@dpuse/dpuse-shared';

// ── Types ────────────────────────────────────────────────────────────────────────────────────────────────────────────

export type DetectedColumnType = Pick<ObjectColumnConfig, 'dataSubtypeId' | 'dataTypeId'>;

// ── Actions ──────────────────────────────────────────────────────────────────────────────────────────────────────────

// The preview with every type the user chose put back, for after its columns are counted again.
export function applyPreviewColumnTypes(
    previewConfig: PreviewConfig,
    dataTypeIds: Partial<Record<string, DataTypeId>>,
    detectedColumnTypes: DetectedColumnType[]
): PreviewConfig {
    let typedPreviewConfig = previewConfig;
    for (const [columnIndex, detectedColumnType] of detectedColumnTypes.entries())
        typedPreviewConfig = applyPreviewColumnType(typedPreviewConfig, columnIndex, dataTypeIds[String(columnIndex)], detectedColumnType);
    return typedPreviewConfig;
}

// The preview with one column read as the type the user chose, or as detected when they chose none. Detection's subtype
// only describes detection's type, so a different type has none.
export function applyPreviewColumnType(
    previewConfig: PreviewConfig,
    columnIndex: number,
    dataTypeId: DataTypeId | undefined,
    detectedColumnType: DetectedColumnType
): PreviewConfig {
    const columnType = dataTypeId == null || dataTypeId === detectedColumnType.dataTypeId ? detectedColumnType : { dataSubtypeId: undefined, dataTypeId };
    return {
        ...previewConfig,
        columnConfigs: previewConfig.columnConfigs.map((columnConfig, index) => (index === columnIndex ? { ...columnConfig, ...columnType } : columnConfig))
    };
}
