<script setup lang="ts">
// External Dependencies
import { createGrid, type GridApi, type IGetRowsParams, InfiniteRowModelModule, ModuleRegistry, themeQuartz } from 'ag-grid-community';
import { onMounted, onUnmounted, ref, watch } from 'vue';

// App Core
import { t } from '@/locales';
import T from '@/locales/views/workbench/workflow/buildDataApps/BuildDataApps.json';

// App Components & Views - Statically imported so always available, even after app goes offline.
import Header from '@/components/header/Header.vue';
import ViewShell from '@/components/view/ViewShell.vue';

// Register only the modules needed — avoids pulling in unused AG Grid code.
ModuleRegistry.registerModules([InfiniteRowModelModule]);

// Themes ─ parameterised to match the app's zinc colour tokens. ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const lightTheme = themeQuartz.withParams({
    backgroundColor: '#ffffff',
    chromeBackgroundColor: '#fafafa',
    headerBackgroundColor: '#fafafa',
    foregroundColor: '#27272a', // zinc-800
    borderColor: '#e4e4e7', // zinc-200
    rowHoverColor: '#f4f4f5', // zinc-100
    selectedRowBackgroundColor: '#f4f4f5',
    accentColor: '#52525b', // zinc-600
    fontFamily: 'inherit',
    dataFontSize: 14,
    rowHeight: 48
});

const darkTheme = themeQuartz.withParams({
    backgroundColor: '#09090b', // zinc-950
    chromeBackgroundColor: '#18181b', // zinc-900
    headerBackgroundColor: '#18181b',
    foregroundColor: '#d4d4d8', // zinc-300
    borderColor: '#3f3f46', // zinc-700
    rowHoverColor: '#18181b',
    selectedRowBackgroundColor: '#27272a', // zinc-800
    accentColor: '#a1a1aa', // zinc-400
    fontFamily: 'inherit',
    dataFontSize: 14,
    rowHeight: 48
});

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

// Grid ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const gridElement = ref<HTMLDivElement | null>(null);
let api: GridApi | undefined;

/** Tracks the .dark class on <html> so the grid theme stays in sync with the app. */
const isDark = ref(document.documentElement.classList.contains('dark'));
const classObserver = new MutationObserver(() => {
    isDark.value = document.documentElement.classList.contains('dark');
});

watch(isDark, (dark) => api?.setGridOption('theme', dark ? darkTheme : lightTheme));

onMounted(() => {
    classObserver.observe(document.documentElement, { attributeFilter: ['class'] });

    if (!gridElement.value) return;

    /** Nonce injected by the Cloudflare Worker into a <meta> tag — required for AG Grid's runtime style injection to pass CSP. */
    const styleNonce = document.querySelector<HTMLMetaElement>('meta[name="csp-nonce"]')?.content ?? '';

    api = createGrid(gridElement.value, {
        styleNonce,
        theme: isDark.value ? darkTheme : lightTheme,
        rowModelType: 'infinite',
        /** Number of rows fetched per request. */
        cacheBlockSize: 100,
        /** Maximum blocks held in memory — beyond this, oldest blocks are evicted and re-fetched on scroll-back. */
        maxBlocksInCache: 10,
        datasource: {
            rowCount: TOTAL_ROWS,
            getRows(parameters: IGetRowsParams) {
                fetchRows(parameters.startRow, parameters.endRow)
                    .then((rows) => parameters.successCallback(rows, TOTAL_ROWS))
                    .catch(() => parameters.failCallback());
            }
        },
        columnDefs: [
            { field: 'id', headerName: 'ID', width: 80 },
            { field: 'name', headerName: 'Name', flex: 1 },
            { field: 'category', headerName: 'Category', width: 120 },
            { field: 'value', headerName: 'Value', width: 120 }
        ],
        defaultColDef: { sortable: false, filter: false, resizable: true },
        headerHeight: 40
    });
});

onUnmounted(() => {
    classObserver.disconnect();
    api?.destroy();
});
</script>

<template>
    <ViewShell>
        <Header :breadcrumbs="[{ id: 'benchtop', label: t(T, 'wb.label') }]" :title="t(T, 'Build_Data_Apps')" :workbench-pane-is-hidden="false" />
        <div ref="gridElement" class="flex-1" />
    </ViewShell>
</template>
