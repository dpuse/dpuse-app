<script setup lang="ts">
// App Core
import type { ColumnDef } from '@tanstack/vue-table';
import type { DataSource } from '@/composables/useDataWindow';
import { t } from '@/translations';
import T from '@/translations/domains/workbench/workflow/buildDataApps/BuildDataAppsLayout.json';

// App Components - Statically imported.
import Header from '@/components/layout/header/Header.vue';
import LayoutShell from '@/components/layout/layoutShell/LayoutShell.vue';
import Table from '@/components/ui/table/Table.vue';

// EXPERIMENTAL ────────────────────────────────────────────────────────────────────────────────────────────────────────

const TOTAL_ROWS = 100_000;
const CATEGORIES = ['Alpha', 'Beta', 'Gamma', 'Delta'] as const;

const dataSource: DataSource<{ id: number; name: string; category: string; value: string }> = {
    rowCount: TOTAL_ROWS,
    getRows(startRow: number, endRow: number) {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve(
                    Array.from({ length: endRow - startRow }, (_, index) => ({
                        id: startRow + index + 1,
                        name: `Record ${startRow + index + 1}`,
                        category: CATEGORIES[(startRow + index) % CATEGORIES.length],
                        value: ((startRow + index + 1) * 1.618).toFixed(2)
                    }))
                );
            }, 300);
        });
    }
};

const columnDefinitions: ColumnDef<Record<string, unknown>>[] = [
    { accessorKey: 'id', header: 'ID', size: 120 },
    { accessorKey: 'name', header: 'Name', size: 120 },
    { accessorKey: 'category', header: 'Category', size: 120 },
    { accessorKey: 'value', header: 'Value', size: 120 }
];
</script>

<template>
    <LayoutShell>
        <Header :breadcrumbs="[{ id: 'benchtop', label: t(T, 'wb.label') }]" :title="t(T, 'Build_Data_Apps')" />

        <Table class="flex-1 px-4" :column-definitions="columnDefinitions" :data-source="dataSource" />
    </LayoutShell>
</template>
