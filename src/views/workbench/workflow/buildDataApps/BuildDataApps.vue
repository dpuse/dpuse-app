<script setup lang="ts">
// App Core
import { t } from '@/locales';
import T from '@/locales/views/workbench/workflow/buildDataApps/BuildDataApps.json';
import TanstackGrid, { type GridColumnDefinition, type GridDatasource } from '@/components/tanstackGrid/TanstackGrid.vue';

// App Components & Views - Statically imported so always available, even after app goes offline.
import Header from '@/components/header/Header.vue';
import ViewShell from '@/components/view/ViewShell.vue';

// Simulated server datasource — 100,000 rows, 300ms latency. ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const TOTAL_ROWS = 100_000;
const CATEGORIES = ['Alpha', 'Beta', 'Gamma', 'Delta'] as const;

const datasource: GridDatasource = {
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

const columnDefs: GridColumnDefinition[] = [
    { field: 'id', headerName: 'ID', width: 80 },
    { field: 'name', headerName: 'Name', flex: 1 },
    { field: 'category', headerName: 'Category', width: 120 },
    { field: 'value', headerName: 'Value', width: 120 }
];
</script>

<template>
    <ViewShell>
        <Header :breadcrumbs="[{ id: 'benchtop', label: t(T, 'wb.label') }]" :title="t(T, 'Build_Data_Apps')" :workbench-pane-is-hidden="false" />

        <TanstackGrid class="flex-1 px-4" :column-defs="columnDefs" :datasource="datasource" />
    </ViewShell>
</template>
