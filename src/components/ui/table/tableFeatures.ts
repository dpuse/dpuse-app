// ── External Dependencies & Registrations
import { columnPinningFeature, columnResizingFeature, columnSizingFeature, columnVisibilityFeature, tableFeatures } from '@tanstack/vue-table';

// Explicit feature registration (rather than `stockFeatures`) keeps unused features — sorting, filtering, grouping,
// pagination, row selection, etc. — out of the bundle. Shared here so every file typing table/column/header generics
// references the same `TableFeatureSet`.
export const tableFeatureSet = tableFeatures({
    columnPinningFeature,
    columnResizingFeature,
    columnSizingFeature,
    columnVisibilityFeature
});

export type TableFeatureSet = typeof tableFeatureSet;
