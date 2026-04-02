<script setup lang="ts">
// External Dependencies
import type { ColDef, IDatasource, IGetRowsParams } from 'ag-grid-community';

// App Core
import { t } from '@/locales';
import T from '@/locales/views/workbench/workflow/explorePresentations/ExplorePresentations.json';

// App Components & Views - Statically imported so always available, even after app goes offline.
import AgGrid from '@/components/agGrid/AgGrid.vue';
import Header from '@/components/header/Header.vue';
import ViewShell from '@/components/view/ViewShell.vue';

// Simulated server datasource — 100,000 rows, 300ms latency. ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const TOTAL_ROWS = 100_000;
const CATEGORIES = ['Alpha', 'Beta', 'Gamma', 'Delta'] as const;

function fetchRows(startRow: number, endRow: number): Promise<object[]> {
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

const datasource: IDatasource = {
    rowCount: TOTAL_ROWS,
    getRows(parameters: IGetRowsParams) {
        fetchRows(parameters.startRow, parameters.endRow)
            .then((rows) => parameters.successCallback(rows, TOTAL_ROWS))
            .catch(() => parameters.failCallback());
    }
};

const columnDefs: ColDef[] = [
    { field: 'id', headerName: 'ID', width: 80 },
    { field: 'name', headerName: 'Name', flex: 1 },
    { field: 'category', headerName: 'Category', width: 120 },
    { field: 'value', headerName: 'Value', width: 120 }
];
</script>

<template>
    <ViewShell>
        <Header :breadcrumbs="[{ id: 'benchtop', label: t(T, 'wb.label') }]" :title="t(T, 'Explore_Presentations')" :workbench-pane-is-hidden="false" />

        <AgGrid class="flex-1 px-4" :column-defs="columnDefs" :datasource="datasource" />
    </ViewShell>
</template>
