<script setup lang="ts">
// ── External Dependencies & Registrations
import type { ColumnDef } from '@tanstack/vue-table';
import { promiseTimeout } from '@vueuse/core';

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
    async getRows(startRow: number, endRow: number) {
        await promiseTimeout(300);
        return {
            rows: Array.from({ length: endRow - startRow }, (_, index) => ({
                id: startRow + index + 1,
                name: `Record ${String(startRow + index + 1)}`,
                category: CATEGORIES[(startRow + index) % CATEGORIES.length],
                value: ((startRow + index + 1) * 1.618).toFixed(2)
            }))
        };
    }
};
</script>

<template>
    <div class="flex min-h-0 flex-1 flex-col" data-region="InvestigateDataPanel">
        <!-- The usual room after the last row, less the status bar's height: the table already ends above it. -->
        <Table
            class="flex-1"
            :column-definitions="COLUMN_DEFINITIONS"
            :data-source="DATA_SOURCE"
            scroll-area-padding-bottom="calc(var(--vertical-scroll-bottom-screen-inset) - var(--status-bar-height))"
        />

        <!-- Status Bar - Blank for now. Keeps the table, and its horizontal scroll bar, above the bottom safe area on
             iOS, as the item preview's status bar does. -->
        <div class="h-(--status-bar-height) w-full flex-none border-t border-separator bg-card" />
    </div>
</template>
