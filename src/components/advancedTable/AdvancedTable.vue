<script setup lang="ts">
// External Dependencies
import { useVirtualizer } from '@tanstack/vue-virtual';
import { type ColumnDef, type ColumnPinningState, type ColumnSizingState, getCoreRowModel, useVueTable, type VisibilityState } from '@tanstack/vue-table';
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';

// Toolbar Height ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Measured so ScrollThumb can be offset to align with the scroll area, not the toolbar.
const toolbarElement = ref<HTMLElement | null>(null);
const toolbarHeight = ref(0);
let toolbarObserver: ResizeObserver | null = null;
onMounted(() => {
    if (!toolbarElement.value) return;
    toolbarObserver = new ResizeObserver(() => {
        toolbarHeight.value = toolbarElement.value?.offsetHeight ?? 0;
    });
    toolbarObserver.observe(toolbarElement.value);
    toolbarHeight.value = toolbarElement.value.offsetHeight;
});
onBeforeUnmount(() => toolbarObserver?.disconnect());

// App Core
import type { ColumnDefinition } from '@/components/table/Table.vue';
import ScrollThumb from '@/components/scrollThumb/ScrollThumb.vue';
import { type DataSource, useDataWindow } from '@/composables/useDataWindow';

// Local Components — statically imported so always available, even after app goes offline.
import AdvancedTableCell from './AdvancedTableCell.vue';
import AdvancedTableColumnPicker from './AdvancedTableColumnPicker.vue';
import AdvancedTableHeaderCell from './AdvancedTableHeaderCell.vue';

// Types ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

type RowData = Record<string, unknown>;

// Properties & Emits ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

type Properties = {
    columnDefinitions: ColumnDefinition[];
    dataSource: DataSource;
    cacheBlockSize?: number; // Rows fetched per request. Default: 100.
    maxBlocksInCache?: number; // Maximum blocks held in memory before LRU eviction. Default: 10.
};
const { columnDefinitions, dataSource, cacheBlockSize, maxBlocksInCache } = defineProps<Properties>();

// Column State ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const visibilityState = ref<VisibilityState>({});
const pinningState = ref<ColumnPinningState>({});
const sizingState = ref<ColumnSizingState>({});

// Row Virtualizer (vertical) ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const scrollElement = ref<HTMLElement | null>(null);
const { virtualRows, totalRowCount, visibleRowData } = useDataWindow({
    scrollElement,
    dataSource: () => dataSource,
    cacheBlockSize: cacheBlockSize === undefined ? undefined : (): number => cacheBlockSize,
    maxBlocksInCache: maxBlocksInCache === undefined ? undefined : (): number => maxBlocksInCache
});

// TanStack Table (column state only — data is always empty, rows are never processed) ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// measureColumns is populated after columnVirtualizer is defined below.
// onColumnSizingChange only fires on user interaction (after setup completes), so the forward reference is safe.
let measureColumns: () => void = () => {};

const columnDefs = computed<ColumnDef<RowData>[]>(() =>
    columnDefinitions.map((col) => ({
        id: col.field,
        accessorKey: col.field,
        header: col.headerName ?? col.field,
        size: col.width ?? 150,
        enableResizing: true,
        enableHiding: true,
        enablePinning: true
    }))
);

// useVueTable returns reactive(), NOT a ref — access methods directly (not via .value)
const table = useVueTable<RowData>({
    get data(): RowData[] {
        return []; // CRITICAL: always empty — rows are rendered via useDataWindow, never via TanStack Table
    },
    get columns() {
        return columnDefs.value;
    },
    getCoreRowModel: getCoreRowModel(),
    enableColumnResizing: true,
    columnResizeMode: 'onEnd', // Snaps on mouse-up — avoids 60fps reactivity cascade during drag
    state: {
        get columnVisibility() {
            return visibilityState.value;
        },
        get columnPinning() {
            return pinningState.value;
        },
        get columnSizing() {
            return sizingState.value;
        }
    },
    onColumnVisibilityChange: (updater) => {
        visibilityState.value = typeof updater === 'function' ? updater(visibilityState.value) : updater;
    },
    onColumnPinningChange: (updater) => {
        pinningState.value = typeof updater === 'function' ? updater(pinningState.value) : updater;
    },
    onColumnSizingChange: (updater) => {
        sizingState.value = typeof updater === 'function' ? updater(sizingState.value) : updater;
        measureColumns(); // Called once on resize-end, not per mouse-move pixel
    }
});

// Header Groups — leaf headers give access to header.getResizeHandler() ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const leftHeaders = computed(() => table.getLeftLeafHeaders());
const centerHeaders = computed(() => table.getCenterLeafHeaders());
const rightHeaders = computed(() => table.getRightLeafHeaders());
const leftPinnedWidth = computed(() => leftHeaders.value.reduce((sum, h) => sum + h.column.getSize(), 0));
const rightPinnedWidth = computed(() => rightHeaders.value.reduce((sum, h) => sum + h.column.getSize(), 0));

// Column Virtualizer (horizontal — center columns only) ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const columnVirtualizer = useVirtualizer({
    get count() {
        return centerHeaders.value.length;
    },
    getScrollElement: () => scrollElement.value,
    estimateSize: (i) => centerHeaders.value[i]?.column.getSize() ?? 150,
    horizontal: true,
    overscan: 3
});

// Wire up the forward reference now that columnVirtualizer is defined
measureColumns = () => columnVirtualizer.value.measure();

const virtualColumns = computed(() => columnVirtualizer.value.getVirtualItems());
const totalCenterWidth = computed(() => columnVirtualizer.value.getTotalSize());
const totalWidth = computed(() => leftPinnedWidth.value + totalCenterWidth.value + rightPinnedWidth.value);
</script>

<template>
    <div class="relative flex h-full flex-col overflow-hidden">
        <!-- Toolbar -->
        <div ref="toolbarElement">
            <AdvancedTableColumnPicker :table="table" />
        </div>

        <!-- Scroll container — single element for both row and column virtualizers -->
        <div ref="scrollElement" class="flex-1 overflow-auto" style="overscroll-behavior: none; -webkit-overflow-scrolling: touch">
            <div :style="{ minWidth: totalWidth + 'px' }">
                <!-- Sticky header ─────────────────────────────────────────────────────────────── -->
                <div class="sticky top-0 z-10 flex border-b border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900" style="height: 40px">
                    <!-- Left pinned headers — wrapper owns sticky positioning; component stays relative internally -->
                    <div
                        v-for="h in leftHeaders"
                        :key="h.id"
                        class="sticky shrink-0 border-r border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900"
                        :style="{ left: h.column.getStart('left') + 'px', width: h.column.getSize() + 'px', zIndex: 2 }"
                    >
                        <AdvancedTableHeaderCell :header="h" />
                    </div>

                    <!-- Center headers (column-virtualized) — wrapper owns absolute positioning -->
                    <div :style="{ position: 'relative', width: totalCenterWidth + 'px', flexShrink: 0 }">
                        <template v-for="vc in virtualColumns" :key="vc.key">
                            <div v-if="centerHeaders[vc.index]" class="absolute top-0 h-full" :style="{ left: vc.start + 'px', width: vc.size + 'px' }">
                                <AdvancedTableHeaderCell :header="centerHeaders[vc.index]!" />
                            </div>
                        </template>
                    </div>

                    <!-- Right pinned headers — wrapper owns sticky positioning -->
                    <div
                        v-for="h in rightHeaders"
                        :key="h.id"
                        class="sticky shrink-0 border-l border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900"
                        :style="{ right: h.column.getAfter('right') + 'px', width: h.column.getSize() + 'px', zIndex: 2 }"
                    >
                        <AdvancedTableHeaderCell :header="h" />
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
                        <!-- Left pinned cells — sticky, background matches row hover state via group -->
                        <AdvancedTableCell
                            v-for="h in leftHeaders"
                            :key="h.id"
                            :value="visibleRowData[i]?.[h.column.id]"
                            :loading="visibleRowData[i] === undefined"
                            class="sticky shrink-0 border-r border-zinc-100 bg-white group-hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:group-hover:bg-zinc-900"
                            :style="{ left: h.column.getStart('left') + 'px', width: h.column.getSize() + 'px', zIndex: 1 }"
                        />

                        <!-- Center cells (column-virtualized) -->
                        <div class="group-hover:bg-zinc-50 dark:group-hover:bg-zinc-900" :style="{ position: 'relative', width: totalCenterWidth + 'px', flexShrink: 0 }">
                            <template v-for="vc in virtualColumns" :key="vc.key">
                                <AdvancedTableCell
                                    v-if="centerHeaders[vc.index]"
                                    :value="visibleRowData[i]?.[centerHeaders[vc.index]!.column.id]"
                                    :loading="visibleRowData[i] === undefined"
                                    class="absolute top-0 h-full"
                                    :style="{ left: vc.start + 'px', width: vc.size + 'px' }"
                                />
                            </template>
                        </div>

                        <!-- Right pinned cells — sticky, background matches row hover state via group -->
                        <AdvancedTableCell
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
