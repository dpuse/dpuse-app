<script setup lang="ts" generic="T extends Record<string, number | string | null | undefined>">
// ── External Dependencies & Registrations
import { useVirtualizer } from '@tanstack/vue-virtual';
import { type ColumnDef, type ColumnPinningState, type ColumnSizingState, type ColumnVisibilityState, useTable } from '@tanstack/vue-table';
import { computed, onBeforeUnmount, onMounted, ref, shallowRef, useTemplateRef } from 'vue';

// ── Local Framework
import { type DataSource, useDataWindow } from '@/composables/useDataWindow';

// ── Local Components - Static
import TableCell from './TableRowCell.vue';
import TableColumnPicker from './TableColumnPicker.vue';
import TableHeaderCell from './TableHeaderCell.vue';
import { type TableFeatureSet, tableFeatureSet } from './tableFeatures.ts';

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

const COLUMN_VIRTUALIZATION_THRESHOLD_PX = 2000; // Empirically chosen — below this width, flat rendering is cheaper than virtualizer overhead.

// ── Options, Properties, Model Value, Slots & Emits ──────────────────────────────────────────────────────────────────

type Properties = {
    columnDefinitions: ColumnDef<TableFeatureSet, T>[];
    dataSource: DataSource<T>;
    cacheBlockSize?: number; // Rows fetched per request. Default: 100.
    maxBlocksInCache?: number; // Maximum blocks held in memory before LRU eviction. Default: 10.
};
const { columnDefinitions, dataSource, cacheBlockSize = 100, maxBlocksInCache = 10 } = defineProps<Properties>();

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

const scrollElement = useTemplateRef<HTMLDivElement>('scroller');

// ── State - Toolbar ──────────────────────────────────────────────────────────────────────────────────────────────────

const toolbarElement = useTemplateRef<HTMLDivElement>('toolbar');
const toolbarHeight = ref(0); // Measured so ScrollThumb can be offset to align with the scroll area, not the toolbar.
const state: { toolbarObserver: ResizeObserver | null } = { toolbarObserver: null };

// ── State - Columns ──────────────────────────────────────────────────────────────────────────────────────────────────

const columnPinningStateMap = shallowRef<ColumnPinningState>({ start: [], end: [] });
const columnSizingStateMap = shallowRef<ColumnSizingState>({});
const columnVisibilityStateMap = shallowRef<ColumnVisibilityState>({});

// Column virtualization is only activated when the total initial column width exceeds the threshold.
// Below the threshold, all columns are rendered in a flat flex row — simpler and cheaper.
const columnVirtualisationIsRequired = computed(() => columnDefinitions.reduce((sum, col) => sum + (col.size ?? 150), 0) > COLUMN_VIRTUALIZATION_THRESHOLD_PX);
const columnVirtualizer = useVirtualizer({
    get count() {
        return columnVirtualisationIsRequired.value ? centerLeafHeaders.value.length : 0;
    },
    estimateSize: (index) => centerLeafHeaders.value[index]?.column.getSize() ?? 150,
    getScrollElement: () => scrollElement.value,
    horizontal: true,
    overscan: 3
});

// ── State - Rows ─────────────────────────────────────────────────────────────────────────────────────────────────────

const { virtualRows, totalSize, visibleRowData } = useDataWindow({
    scrollElement,
    dataSource: () => dataSource,
    cacheBlockSize: () => cacheBlockSize,
    maxBlocksInCache: () => maxBlocksInCache
});

// ── State - Table ────────────────────────────────────────────────────────────────────────────────────────────────────

const table = useTable<TableFeatureSet, T>({
    features: tableFeatureSet,
    get data(): T[] {
        return []; // Always empty — rows are rendered via useDataWindow, never via TanStack Table.
    },
    get columns() {
        return columnDefinitions;
    },
    enableColumnResizing: true,
    defaultColumn: { enableResizing: true, enableHiding: true, enablePinning: true, size: 150 },
    columnResizeMode: 'onEnd', // Snaps on mouse-up — avoids 60fps reactivity cascade during drag.
    state: {
        get columnPinning() {
            return columnPinningStateMap.value;
        },
        get columnSizing() {
            return columnSizingStateMap.value;
        },
        get columnVisibility() {
            return columnVisibilityStateMap.value;
        }
    },
    onColumnVisibilityChange: (updater) => {
        columnVisibilityStateMap.value = typeof updater === 'function' ? updater(columnVisibilityStateMap.value) : updater;
    },
    onColumnPinningChange: (updater) => {
        columnPinningStateMap.value = typeof updater === 'function' ? updater(columnPinningStateMap.value) : updater;
    },
    onColumnSizingChange: (updater) => {
        columnSizingStateMap.value = typeof updater === 'function' ? updater(columnSizingStateMap.value) : updater;
        if (columnVirtualisationIsRequired.value) columnVirtualizer.value.measure();
    }
});

// ── Derived State - Columns ──────────────────────────────────────────────────────────────────────────────────────────

const centerLeafHeaders = computed(() => table.getCenterLeafHeaders());
const leftLeafHeaders = computed(() => table.getStartLeafHeaders());
const leftPinnedWidth = computed(() => leftLeafHeaders.value.reduce((sum, header) => sum + header.column.getSize(), 0));
const rightLeafHeaders = computed(() => table.getEndLeafHeaders());
const rightPinnedWidth = computed(() => rightLeafHeaders.value.reduce((sum, header) => sum + header.column.getSize(), 0));
const totalCenterWidth = computed(() =>
    columnVirtualisationIsRequired.value ? columnVirtualizer.value.getTotalSize() : centerLeafHeaders.value.reduce((sum, header) => sum + header.column.getSize(), 0)
);
const totalWidth = computed(() => leftPinnedWidth.value + totalCenterWidth.value + rightPinnedWidth.value);
const virtualColumns = computed(() => (columnVirtualisationIsRequired.value ? columnVirtualizer.value.getVirtualItems() : []));

// ── Side Effects ─────────────────────────────────────────────────────────────────────────────────────────────────────

onMounted(() => {
    if (!toolbarElement.value) return;
    state.toolbarObserver = new ResizeObserver(() => {
        toolbarHeight.value = toolbarElement.value?.offsetHeight ?? 0;
    });
    state.toolbarObserver.observe(toolbarElement.value);
    toolbarHeight.value = toolbarElement.value.offsetHeight;
});

onBeforeUnmount(() => state.toolbarObserver?.disconnect());
</script>

<template>
    <div class="relative flex h-full flex-col overflow-y-hidden" data-region="Table">
        <!-- Toolbar -->
        <div ref="toolbar">
            <TableColumnPicker :table="table" />
        </div>

        <!-- Scroll container — single element for both row and column virtualizers -->
        <div ref="scroller" class="flex-1 overflow-auto overscroll-none">
            <div :style="{ minWidth: totalWidth + 'px' }">
                <!-- Header -->
                <div class="sticky top-0 z-10 flex h-10 border-b border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900">
                    <!-- Left pinned headers -->
                    <div
                        v-for="leftLeafHeader in leftLeafHeaders"
                        :key="leftLeafHeader.id"
                        class="sticky shrink-0 border-r border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900"
                        :style="{ left: leftLeafHeader.column.getStart('start') + 'px', width: leftLeafHeader.column.getSize() + 'px', zIndex: 2 }"
                    >
                        <TableHeaderCell :header="leftLeafHeader" />
                    </div>

                    <!-- Center headers: flat when below threshold, virtualised when above -->
                    <template v-if="!columnVirtualisationIsRequired">
                        <div
                            v-for="centerLeafHeader in centerLeafHeaders"
                            :key="centerLeafHeader.id"
                            class="h-full shrink-0"
                            :style="{ width: centerLeafHeader.column.getSize() + 'px' }"
                        >
                            <TableHeaderCell :header="centerLeafHeader" />
                        </div>
                    </template>

                    <div v-else class="relative shrink-0" :style="{ width: totalCenterWidth + 'px' }">
                        <div
                            v-for="virtualColumn in virtualColumns"
                            :key="virtualColumn.index"
                            class="absolute top-0 h-full"
                            :style="{ left: virtualColumn.start + 'px', width: virtualColumn.size + 'px' }"
                        >
                            <TableHeaderCell :header="centerLeafHeaders[virtualColumn.index]!" />
                        </div>
                    </div>

                    <!-- Right pinned headers -->
                    <div
                        v-for="rightLeafHeader in rightLeafHeaders"
                        :key="rightLeafHeader.id"
                        class="sticky shrink-0 border-l border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900"
                        :style="{ right: rightLeafHeader.column.getAfter('end') + 'px', width: rightLeafHeader.column.getSize() + 'px', zIndex: 2 }"
                    >
                        <TableHeaderCell :header="rightLeafHeader" />
                    </div>
                </div>

                <!-- Virtual rows spacer -->
                <div class="relative" :style="{ height: totalSize + 'px' }">
                    <div
                        v-for="(vRow, i) in virtualRows"
                        :key="vRow.index"
                        class="group absolute top-0 flex border-b border-zinc-100 bg-white dark:border-zinc-800 dark:bg-zinc-950"
                        :style="{ transform: `translateY(${vRow.start}px)`, height: vRow.size + 'px', width: totalWidth + 'px' }"
                    >
                        <!-- Left pinned cells -->
                        <TableCell
                            v-for="leftLeafHeader in leftLeafHeaders"
                            :key="leftLeafHeader.id"
                            :value="visibleRowData[i]?.[leftLeafHeader.column.id]"
                            :loading="visibleRowData[i] === undefined"
                            class="sticky shrink-0 border-r border-zinc-100 bg-white group-hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:group-hover:bg-zinc-900"
                            :style="{ left: leftLeafHeader.column.getStart('start') + 'px', width: leftLeafHeader.column.getSize() + 'px', zIndex: 1 }"
                        />

                        <!-- Center cells: flat when below threshold, virtualised when above -->
                        <template v-if="!columnVirtualisationIsRequired">
                            <TableCell
                                v-for="centerLeafHeader in centerLeafHeaders"
                                :key="centerLeafHeader.id"
                                :value="visibleRowData[i]?.[centerLeafHeader.column.id]"
                                :loading="visibleRowData[i] === undefined"
                                class="shrink-0"
                                :style="{ width: centerLeafHeader.column.getSize() + 'px' }"
                            />
                        </template>

                        <div v-else class="relative shrink-0 group-hover:bg-zinc-50 dark:group-hover:bg-zinc-900" :style="{ width: totalCenterWidth + 'px' }">
                            <TableCell
                                v-for="virtualColumn in virtualColumns"
                                :key="virtualColumn.index"
                                :value="visibleRowData[i]?.[centerLeafHeaders[virtualColumn.index]!.column.id]"
                                :loading="visibleRowData[i] === undefined"
                                class="absolute top-0 h-full"
                                :style="{ left: virtualColumn.start + 'px', width: virtualColumn.size + 'px' }"
                            />
                        </div>

                        <!-- Right pinned cells -->
                        <TableCell
                            v-for="rightLeafHeader in rightLeafHeaders"
                            :key="rightLeafHeader.id"
                            :value="visibleRowData[i]?.[rightLeafHeader.column.id]"
                            :loading="visibleRowData[i] === undefined"
                            class="sticky shrink-0 border-l border-zinc-100 bg-white group-hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:group-hover:bg-zinc-900"
                            :style="{ right: rightLeafHeader.column.getAfter('end') + 'px', width: rightLeafHeader.column.getSize() + 'px', zIndex: 1 }"
                        />
                    </div>
                </div>
            </div>
        </div>

        <!-- <ScrollThumb :scroll-element="scrollElement" :row-count="dataSource.rowCount" :style="{ top: toolbarHeight + 'px' }" /> -->
    </div>
</template>
