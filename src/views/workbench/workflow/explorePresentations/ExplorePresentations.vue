<script setup lang="ts">
// App Core
import type { ColumnDef } from '@tanstack/vue-table';
import type { DataSource } from '@/composables/useDataWindow';
import { t } from '@/locales';
import T from '@/locales/views/workbench/workflow/explorePresentations/ExplorePresentations.json';

// App Components & Views - Statically imported so always available, even after app goes offline.
import Header from '@/components/header/Header.vue';
import Table from '@/components/table/Table.vue';
import ViewShell from '@/components/view/ViewShell.vue';

// EXPERIMENTAL ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const TOTAL_ROWS = 100_000;
const CATEGORIES = ['Alpha', 'Beta', 'Gamma', 'Delta'] as const;

const dataSource: DataSource = {
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
    { accessorKey: 'id', header: 'ID', size: 80 },
    { accessorKey: 'name', header: 'Name', size: 120 },
    { accessorKey: 'category', header: 'Category', size: 120 },
    { accessorKey: 'value', header: 'Value', size: 120 }
];
</script>

<template>
    <ViewShell>
        <Header :breadcrumbs="[{ id: 'benchtop', label: t(T, 'wb.label') }]" :title="t(T, 'Explore_Presentations')" :workbench-pane-is-hidden="false" />

        <Table class="flex-1 px-4" :column-definitions="columnDefinitions" :data-source="dataSource" />
    </ViewShell>
</template>
