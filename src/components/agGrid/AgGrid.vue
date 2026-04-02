<script setup lang="ts">
// External Dependencies
import type { ColDef, GridApi, IDatasource } from 'ag-grid-community';
import { createGrid, InfiniteRowModelModule, ModuleRegistry, themeQuartz } from 'ag-grid-community';
import { onMounted, onUnmounted, ref, watch } from 'vue';

// Properties & Emits
type Properties = {
    columnDefs: ColDef[];
    datasource: IDatasource;
};
const { columnDefs, datasource } = defineProps<Properties>();

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
    rowHeight: 48,
    wrapperBorder: false,
    wrapperBorderRadius: 0
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
    rowHeight: 48,
    wrapperBorder: false,
    wrapperBorderRadius: 0
});

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

    api = createGrid(gridElement.value, {
        theme: isDark.value ? darkTheme : lightTheme,
        rowModelType: 'infinite',
        /** Number of rows fetched per request. */
        cacheBlockSize: 100,
        /** Maximum blocks held in memory — beyond this, oldest blocks are evicted and re-fetched on scroll-back. */
        maxBlocksInCache: 10,
        datasource,
        columnDefs,
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
    <div ref="gridElement" />
</template>
