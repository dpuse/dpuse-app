<script setup lang="ts">
// ── External Dependencies & Registrations
import type { ColumnDef } from '@tanstack/vue-table';

// ── Local Framework
import type { DataSource } from '@/composables/useDataWindow';

// ── Static Components
import Table from '@/components/ui/table/Table.vue';
import type { TableFeatureSet } from '@/components/ui/table/tableFeatures';

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

const CATEGORIES = ['Alpha', 'Beta', 'Gamma', 'Delta'] as const;
const TOTAL_ROWS = 100_000;

const COLUMN_DEFINITIONS: ColumnDef<TableFeatureSet, Record<string, number | string | null>>[] = [
    { accessorKey: 'id', header: 'ID', size: 120 },
    { accessorKey: 'name', header: 'Name', size: 120 },
    { accessorKey: 'category', header: 'Category', size: 120 },
    { accessorKey: 'value', header: 'Value', size: 120 }
];

const DATA_SOURCE: DataSource<{ id: number; name: string; category: string; value: string }> = {
    rowCount: TOTAL_ROWS,
    getRows(startRow: number, endRow: number) {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({
                    rows: Array.from({ length: endRow - startRow }, (_, index) => ({
                        id: startRow + index + 1,
                        name: `Record ${startRow + index + 1}`,
                        category: CATEGORIES[(startRow + index) % CATEGORIES.length],
                        value: ((startRow + index + 1) * 1.618).toFixed(2)
                    }))
                });
            }, 300);
        });
    }
};
</script>

<template>
    <Table class="flex-1 px-4" :column-definitions="COLUMN_DEFINITIONS" :data-source="DATA_SOURCE" />
</template>
