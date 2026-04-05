<script setup lang="ts">
// External Dependencies
import { useVirtualizer } from '@tanstack/vue-virtual';
import { type ColumnDef, type ColumnPinningState, type ColumnSizingState, getCoreRowModel, useVueTable, type VisibilityState } from '@tanstack/vue-table';
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';

// App Core
import ScrollThumb from '@/components/scrollThumb/ScrollThumb.vue';
import { type DataSource, useDataWindow } from '@/composables/useDataWindow';

// Local Components — statically imported so always available, even after app goes offline.
import TableCell from './TableRowCell.vue';
import TableColumnPicker from './TableColumnPicker.vue';
import TableHeaderCell from './TableHeaderCell.vue';

// Properties & Emits
type RowData = Record<string, unknown>;
type Properties = {
    columnDefinitions: ColumnDef<RowData>[];
    dataSource: DataSource;
    cacheBlockSize?: number; // Rows fetched per request. Default: 100.
    maxBlocksInCache?: number; // Maximum blocks held in memory before LRU eviction. Default: 10.
};
const { columnDefinitions, dataSource, cacheBlockSize, maxBlocksInCache } = defineProps<Properties>();

// Constants ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const COLUMN_VIRTUALIZATION_THRESHOLD_PX = 2000;

// Local State - Toolbar ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// Measured so ScrollThumb can be offset to align with the scroll area, not the toolbar.
const toolbarElement = ref<HTMLElement | null>(null);
const toolbarHeight = ref(0);
let toolbarObserver: ResizeObserver | null = null;

// Local State - Columns ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const columnPinningStateMap = ref<ColumnPinningState>({});
const columnSizingStateMap = ref<ColumnSizingState>({});
const columnVisibilityStateMap = ref<VisibilityState>({});

// TanStack Table (column state only — data is always empty, rows are never processed) ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// measureColumns is set after columnVirtualizer is defined. onColumnSizingChange only fires on user
// interaction (after setup completes), so the forward reference is safe.
let measureColumns: () => void = () => {};

// Local State - Column Virtualiser ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// Column Virtualization Threshold ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Column virtualization is only activated when the total initial column width exceeds this threshold.
// Below the threshold, all columns are rendered in a flat flex row — simpler and cheaper.
// Composable rules prevent conditional useVirtualizer calls, so it is always called;
// when not needed, count is set to 0 so it remains idle.
const useColumnVirtualization = columnDefinitions.reduce((sum, col) => sum + (col.size ?? 150), 0) > COLUMN_VIRTUALIZATION_THRESHOLD_PX;

// Local State - Column Virtualizer ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// Column Virtualizer (horizontal — always called per composable rules, idle when not needed) ━━━━━━━━━━━━━━━━━━━━━━━━
const columnVirtualizer = useVirtualizer({
    get count() {
        return useColumnVirtualization ? centerHeaders.value.length : 0;
    },
    getScrollElement: () => scrollElement.value,
    estimateSize: (index) => centerHeaders.value[index]?.column.getSize() ?? 150,
    horizontal: true,
    overscan: 3
});

// Local State - Row Virtualizer ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const scrollElement = ref<HTMLElement | null>(null);
const { virtualRows, totalRowCount, visibleRowData } = useDataWindow({
    scrollElement,
    dataSource: () => dataSource,
    cacheBlockSize: cacheBlockSize === undefined ? undefined : (): number => cacheBlockSize,
    maxBlocksInCache: maxBlocksInCache === undefined ? undefined : (): number => maxBlocksInCache
});

// Local State - Table ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// useVueTable returns reactive(), NOT a ref — access methods directly (not via .value)
const table = useVueTable<RowData>({
    get data(): RowData[] {
        return []; // CRITICAL: always empty — rows are rendered via useDataWindow, never via TanStack Table
    },
    get columns() {
        return columnDefinitions;
    },
    getCoreRowModel: getCoreRowModel(),
    enableColumnResizing: true,
    defaultColumn: { enableResizing: true, enableHiding: true, enablePinning: true, size: 150 },
    columnResizeMode: 'onEnd', // Snaps on mouse-up — avoids 60fps reactivity cascade during drag
    state: {
        get columnVisibility() {
            return columnVisibilityStateMap.value;
        },
        get columnPinning() {
            return columnPinningStateMap.value;
        },
        get columnSizing() {
            return columnSizingStateMap.value;
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
        measureColumns(); // Called once on resize-end, not per mouse-move pixel
    }
});

// Derived State - Column Headers ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// Header Groups — leaf headers give access to header.getResizeHandler() ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const leftHeaders = computed(() => table.getLeftLeafHeaders());
const centerHeaders = computed(() => table.getCenterLeafHeaders());
const rightHeaders = computed(() => table.getRightLeafHeaders());
const leftPinnedWidth = computed(() => leftHeaders.value.reduce((sum, h) => sum + h.column.getSize(), 0));
const rightPinnedWidth = computed(() => rightHeaders.value.reduce((sum, h) => sum + h.column.getSize(), 0));

measureColumns = useColumnVirtualization ? (): void => columnVirtualizer.value.measure() : (): void => {};

// totalCenterWidth: from the virtualizer when active; otherwise sum visible center column sizes directly.
const totalCenterWidth = computed(() => (useColumnVirtualization ? columnVirtualizer.value.getTotalSize() : centerHeaders.value.reduce((sum, h) => sum + h.column.getSize(), 0)));
const totalWidth = computed(() => leftPinnedWidth.value + totalCenterWidth.value + rightPinnedWidth.value);

// Derived State - Columns ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const virtualColumns = computed(() => columnVirtualizer.value.getVirtualItems());

// Side Effects ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

onMounted(() => {
    if (!toolbarElement.value) return;
    toolbarObserver = new ResizeObserver(() => {
        toolbarHeight.value = toolbarElement.value?.offsetHeight ?? 0;
    });
    toolbarObserver.observe(toolbarElement.value);
    toolbarHeight.value = toolbarElement.value.offsetHeight;
});
onBeforeUnmount(() => toolbarObserver?.disconnect());
</script>

<template>
    <div class="relative flex h-full flex-col overflow-hidden">
        <!-- Toolbar -->
        <div ref="toolbarElement">
            <TableColumnPicker :table="table" />
        </div>

        <!-- Scroll container — single element for both row and column virtualizers -->
        <div ref="scrollElement" class="flex-1 overflow-auto" style="overscroll-behavior: none; -webkit-overflow-scrolling: touch">
            <div :style="{ minWidth: totalWidth + 'px' }">
                <!-- Sticky header ─────────────────────────────────────────────────────────────── -->
                <div class="sticky top-0 z-10 flex border-b border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900" style="height: 40px">
                    <!-- Left pinned headers -->
                    <div
                        v-for="h in leftHeaders"
                        :key="h.id"
                        class="sticky shrink-0 border-r border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900"
                        :style="{ left: h.column.getStart('left') + 'px', width: h.column.getSize() + 'px', zIndex: 2 }"
                    >
                        <TableHeaderCell :header="h" />
                    </div>

                    <!-- Center headers: flat when below threshold, virtualised when above -->
                    <template v-if="!useColumnVirtualization">
                        <div v-for="h in centerHeaders" :key="h.id" class="h-full shrink-0" :style="{ width: h.column.getSize() + 'px' }">
                            <TableHeaderCell :header="h" />
                        </div>
                    </template>
                    <div v-else :style="{ position: 'relative', width: totalCenterWidth + 'px', flexShrink: 0 }">
                        <template v-for="vc in virtualColumns" :key="vc.key">
                            <div v-if="centerHeaders[vc.index]" class="absolute top-0 h-full" :style="{ left: vc.start + 'px', width: vc.size + 'px' }">
                                <TableHeaderCell :header="centerHeaders[vc.index]!" />
                            </div>
                        </template>
                    </div>

                    <!-- Right pinned headers -->
                    <div
                        v-for="h in rightHeaders"
                        :key="h.id"
                        class="sticky shrink-0 border-l border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900"
                        :style="{ right: h.column.getAfter('right') + 'px', width: h.column.getSize() + 'px', zIndex: 2 }"
                    >
                        <TableHeaderCell :header="h" />
                    </div>
                </div>

                <!-- Virtual rows spacer ────────────────────────────────────────────────────────── -->
                <div :style="{ height: totalRowCount + 'px', position: 'relative' }">
                    <div
                        v-for="(vRow, i) in virtualRows"
                        :key="vRow.index"
                        class="group absolute flex border-b border-zinc-100 bg-white dark:border-zinc-800 dark:bg-zinc-950"
                        :style="{ top: 0, transform: `translateY(${vRow.start}px)`, height: vRow.size + 'px', width: totalWidth + 'px' }"
                    >
                        <!-- Left pinned cells -->
                        <TableCell
                            v-for="h in leftHeaders"
                            :key="h.id"
                            :value="visibleRowData[i]?.[h.column.id]"
                            :loading="visibleRowData[i] === undefined"
                            class="sticky shrink-0 border-r border-zinc-100 bg-white group-hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:group-hover:bg-zinc-900"
                            :style="{ left: h.column.getStart('left') + 'px', width: h.column.getSize() + 'px', zIndex: 1 }"
                        />

                        <!-- Center cells: flat when below threshold, virtualised when above -->
                        <template v-if="!useColumnVirtualization">
                            <TableCell
                                v-for="h in centerHeaders"
                                :key="h.id"
                                :value="visibleRowData[i]?.[h.column.id]"
                                :loading="visibleRowData[i] === undefined"
                                class="shrink-0"
                                :style="{ width: h.column.getSize() + 'px' }"
                            />
                        </template>
                        <div v-else class="group-hover:bg-zinc-50 dark:group-hover:bg-zinc-900" :style="{ position: 'relative', width: totalCenterWidth + 'px', flexShrink: 0 }">
                            <template v-for="vc in virtualColumns" :key="vc.key">
                                <TableCell
                                    v-if="centerHeaders[vc.index]"
                                    :value="visibleRowData[i]?.[centerHeaders[vc.index]!.column.id]"
                                    :loading="visibleRowData[i] === undefined"
                                    class="absolute top-0 h-full"
                                    :style="{ left: vc.start + 'px', width: vc.size + 'px' }"
                                />
                            </template>
                        </div>

                        <!-- Right pinned cells -->
                        <TableCell
                            v-for="h in rightHeaders"
                            :key="h.id"
                            :value="visibleRowData[i]?.[h.column.id]"
                            :loading="visibleRowData[i] === undefined"
                            class="sticky shrink-0 border-l border-zinc-100 bg-white group-hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:group-hover:bg-zinc-900"
                            :style="{ right: h.column.getAfter('right') + 'px', width: h.column.getSize() + 'px', zIndex: 1 }"
                        />
                    </div>
                </div>
            </div>
        </div>

        <ScrollThumb :scroll-element="scrollElement" :row-count="dataSource.rowCount" :style="{ top: toolbarHeight + 'px' }" />
    </div>
</template>
