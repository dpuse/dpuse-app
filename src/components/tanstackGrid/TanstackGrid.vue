<script setup lang="ts">
// External Dependencies
import { createColumnHelper, getCoreRowModel, useVueTable, type ColumnSizingState } from '@tanstack/vue-table';
import { useVirtualizer } from '@tanstack/vue-virtual';
import { computed, onMounted, onUnmounted, ref, shallowRef, watch } from 'vue';

// Types ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export type GridColumnDef = {
    field: string;
    headerName?: string;
    width?: number;
    flex?: number;
};

export type GridDatasource = {
    rowCount: number;
    getRows: (startRow: number, endRow: number) => Promise<unknown[]>;
};

// Properties ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

type Properties = {
    columnDefs: GridColumnDef[];
    datasource: GridDatasource;
    /** Rows fetched per request. Analogous to AG Grid cacheBlockSize. Default: 100 */
    cacheBlockSize?: number;
    /** Maximum blocks held in memory. When the limit is reached the least-recently-used block
     *  is evicted and re-fetched if the user scrolls back to it.
     *  Analogous to AG Grid maxBlocksInCache. Default: 10 */
    maxBlocksInCache?: number;
};
const { columnDefs, datasource, cacheBlockSize = 100, maxBlocksInCache = 10 } = defineProps<Properties>();

// Column sizing ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const containerElement = ref<HTMLDivElement | null>(null);
const columnSizing = ref<ColumnSizingState>({});

// Non-reactive last measured width — used only to detect actual changes, not to drive computed.
let lastContainerWidth = 0;
let resizeRafId: number | undefined;

/** Computes a full ColumnSizingState from a known container pixel width. */
function computeFullSizing(availableWidth: number): ColumnSizingState {
    const totalFixed = columnDefs.filter((c) => c.width !== undefined).reduce((sum, c) => sum + (c.width ?? 0), 0);
    const totalFlex = columnDefs.filter((c) => c.flex !== undefined).reduce((sum, c) => sum + (c.flex ?? 1), 0);
    const flexSpace = Math.max(0, availableWidth - totalFixed);
    return Object.fromEntries(columnDefs.map((c) => [c.field, c.width !== undefined ? c.width : ((c.flex ?? 1) / Math.max(totalFlex, 1)) * flexSpace]));
}

/** On subsequent resizes, only redistributes flex-column widths; preserves user-resized columns. */
function applyFlexResize(availableWidth: number): void {
    const flexCols = columnDefs.filter((c) => c.flex !== undefined);
    if (flexCols.length === 0) return;
    const totalFixed = columnDefs.filter((c) => c.width !== undefined).reduce((sum, c) => sum + (c.width ?? 0), 0);
    const totalFlex = flexCols.reduce((sum, c) => sum + (c.flex ?? 1), 0);
    const flexSpace = Math.max(0, availableWidth - totalFixed);
    const updated = {
        ...columnSizing.value,
        ...Object.fromEntries(flexCols.map((c) => [c.field, ((c.flex ?? 1) / totalFlex) * flexSpace]))
    };
    columnSizing.value = updated;
    committedSizing.value = updated;
}

/**
 * RAF-throttled ResizeObserver: coalesces all resize events within a single animation frame into
 * one Vue reactive update. Without this, dragging the window edge fires hundreds of updates per
 * second, saturating the reactive scheduler and hanging the browser.
 */
const containerObserver = new ResizeObserver(([entry]) => {
    if (resizeRafId !== undefined) return; // already scheduled — discard this event
    resizeRafId = requestAnimationFrame(() => {
        resizeRafId = undefined;
        const w = Math.round(entry.contentRect.width);
        if (w === lastContainerWidth) return;
        lastContainerWidth = w;
        applyFlexResize(w);
    });
});

// TanStack Table (header + column resize) ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const columnHelper = createColumnHelper<Record<string, unknown>>();

/**
 * tableColumns depends ONLY on columnDefs — NOT on containerWidth — so it never recomputes on
 * window resize, which would reinitialise the entire TanStack Table instance and hang the app.
 * Live column widths are carried by `columnSizing` state, not the column definition.
 */
const tableColumns = computed(() =>
    columnDefs.map((c) =>
        columnHelper.accessor(c.field, {
            id: c.field,
            header: c.headerName ?? c.field,
            size: c.width ?? 150,
            minSize: 40,
            enableResizing: true
        })
    )
);

/**
 * Two separate sizing refs:
 *
 * - `columnSizing`  (live)      — updated every RAF during drag. Drives the header cell widths
 *                                 only. Changing this does NOT touch row layout.
 * - `committedSizing` (settled) — updated only on pointerup (drag end). Drives the min-width
 *                                 wrapper, every row's explicit width, and each data cell width.
 *
 * The key insight: during a column drag the user only needs to see the header moving. Updating
 * row widths on every pointermove event (60× per second × N visible rows) is what causes the
 * hang. We defer that work until the drag is finished.
 */
let pendingSizing: ColumnSizingState | undefined;
let sizingRafId: number | undefined;
const committedSizing = shallowRef<ColumnSizingState>({});

const table = useVueTable({
    get data() {
        return [];
    },
    get columns() {
        return tableColumns.value;
    },
    getCoreRowModel: getCoreRowModel(),
    columnResizeMode: 'onChange',
    get state() {
        return { columnSizing: columnSizing.value };
    },
    onColumnSizingChange: (updater) => {
        const base = pendingSizing ?? columnSizing.value;
        pendingSizing = typeof updater === 'function' ? updater(base) : updater;
        if (sizingRafId !== undefined) return;
        sizingRafId = requestAnimationFrame(() => {
            sizingRafId = undefined;
            if (pendingSizing !== undefined) {
                // Update header widths live during drag (cheap — only header cells re-render).
                columnSizing.value = pendingSizing;
                pendingSizing = undefined;
            }
        });
    }
});

/** Settled column widths — only updated when the drag ends. */
function onResizePointerUp(): void {
    if (Object.keys(columnSizing.value).length > 0) {
        committedSizing.value = { ...columnSizing.value };
    }
}

/** Cached flat header list — avoids calling getFlatHeaders() inside every row's v-for. */
const flatHeaders = computed(() => table.getFlatHeaders());

/**
 * Column widths for row layout — derived from committedSizing so they only change when the
 * drag ends, not on every pointermove. Each entry is [columnId, pixelWidth].
 */
const committedColumnWidths = computed<Record<string, number>>(() => {
    const sizing = committedSizing.value;
    return Object.fromEntries(flatHeaders.value.map((h) => [h.id, sizing[h.id] ?? h.getSize()]));
});

/** Total pixel width across all columns for row layout — only recomputes when drag ends. */
const totalColumnsWidth = computed(() => Object.values(committedColumnWidths.value).reduce((sum, w) => sum + w, 0));

// Block cache & infinite scroll ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//
// Two distinct concerns:
//   1. DOM virtualisation  — only the visible rows are rendered (handled by useVirtualizer).
//   2. Data virtualisation — only a bounded window of FETCHED data is kept in memory.
//
// This implements an LRU (Least Recently Used) block cache so the component can handle datasets
// of arbitrary size without unbounded memory growth. When the cache is full, the block that has
// not been seen for the longest time is evicted. If the user scrolls back into an evicted block
// the row shows a skeleton and the block is re-fetched transparently.

/**
 * Plain (non-reactive) Map — Vue never traverses its internals, so reads during render do not
 * register as reactive dependencies. Re-renders are triggered only by `blockCacheVersion`, which
 * is incremented exactly once per fetch result. This prevents column resize events from touching
 * the data reactivity graph at all.
 */
const blockCacheMap = new Map<number, unknown[]>();
const blockCacheVersion = shallowRef(0);
const inFlight = new Set<number>();

const lruOrder: number[] = [];

function recordAccess(bi: number): void {
    const pos = lruOrder.indexOf(bi);
    if (pos !== -1) lruOrder.splice(pos, 1);
    lruOrder.push(bi);
}

function blockIdx(rowIndex: number): number {
    return Math.floor(rowIndex / cacheBlockSize);
}

function fetchBlock(bi: number): void {
    if (blockCacheMap.has(bi) || inFlight.has(bi)) return;
    inFlight.add(bi);
    const start = bi * cacheBlockSize;
    const end = Math.min(start + cacheBlockSize, datasource.rowCount);
    datasource
        .getRows(start, end)
        .then((rows) => {
            while (blockCacheMap.size >= maxBlocksInCache) {
                const evict = lruOrder.shift();
                if (evict === undefined) break;
                blockCacheMap.delete(evict);
            }
            blockCacheMap.set(bi, rows);
            recordAccess(bi);
            // Single reactive write — triggers one re-render of the row list, nothing else.
            blockCacheVersion.value++;
        })
        .finally(() => inFlight.delete(bi));
}

/**
 * Pre-computes row data for every currently visible virtual item in one pass.
 * The result is an array parallel to `virtualItems`. Each entry is either a row data object
 * (data loaded) or `undefined` (block not yet fetched — show skeleton).
 *
 * Using a computed means:
 *  - The Map is read exactly once per row per re-render, not twice (v-if + cell values).
 *  - It only recomputes when `virtualItems` OR `blockCacheVersion` changes — NOT when
 *    `columnSizing` changes. Column drag therefore does not touch this computed at all.
 */
const visibleRowData = computed(() => {
    void blockCacheVersion.value; // establish reactive dependency
    return virtualItems.value.map((vRow) => {
        const bi = blockIdx(vRow.index);
        const block = blockCacheMap.get(bi);
        return block ? (block[vRow.index % cacheBlockSize] as Record<string, unknown>) : undefined;
    });
});

// Virtualizer ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const scrollElement = ref<HTMLDivElement | null>(null);

const virtualizer = useVirtualizer({
    get count() {
        return datasource.rowCount;
    },
    getScrollElement: () => scrollElement.value,
    estimateSize: () => 48,
    overscan: 5
});

const virtualItems = computed(() => virtualizer.value.getVirtualItems());
const totalSize = computed(() => virtualizer.value.getTotalSize());

watch(virtualItems, (items) => {
    const needed = new Set(items.map((item) => blockIdx(item.index)));
    for (const bi of needed) {
        if (blockCacheMap.has(bi)) recordAccess(bi);
        fetchBlock(bi);
    }
});

// Lifecycle ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

onMounted(() => {
    if (!containerElement.value) return;
    const w = Math.round(containerElement.value.getBoundingClientRect().width);
    if (w > 0) {
        lastContainerWidth = w;
        const initial = computeFullSizing(w);
        columnSizing.value = initial;
        committedSizing.value = initial;
    }
    containerObserver.observe(containerElement.value);
});

onUnmounted(() => {
    containerObserver.disconnect();
    if (resizeRafId !== undefined) cancelAnimationFrame(resizeRafId);
    if (sizingRafId !== undefined) cancelAnimationFrame(sizingRafId);
});
</script>

<template>
    <div ref="containerElement" class="flex h-full flex-col overflow-hidden">
        <div ref="scrollElement" class="grid-scroll-body flex-1 overflow-auto" style="overscroll-behavior: none; -webkit-overflow-scrolling: touch">
            <!-- min-width only updates when drag ends, not on every pointermove -->
            <div :style="{ minWidth: totalColumnsWidth + 'px' }">
                <!-- Sticky header: uses live columnSizing so it tracks the drag in real time -->
                <div class="sticky top-0 z-10 flex border-b border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900" style="height: 40px">
                    <div v-for="header in flatHeaders" :key="header.id" class="relative flex shrink-0 items-center" :style="{ width: header.getSize() + 'px' }">
                        <span class="truncate overflow-hidden px-3 text-xs font-medium tracking-wide text-zinc-500 uppercase select-none dark:text-zinc-400">
                            {{ header.column.columnDef.header as string }}
                        </span>

                        <div
                            v-if="header.column.getCanResize()"
                            class="group absolute inset-y-0 right-0 z-10 w-4 translate-x-1/2 cursor-col-resize touch-none select-none"
                            @pointerdown="header.getResizeHandler()($event)"
                            @pointerup="onResizePointerUp"
                        >
                            <div
                                class="mx-auto h-full w-0.5 transition-opacity"
                                :class="
                                    header.column.getIsResizing() ? 'bg-zinc-400 opacity-100 dark:bg-zinc-500' : 'bg-zinc-300 opacity-0 group-hover:opacity-100 dark:bg-zinc-600'
                                "
                            />
                        </div>
                    </div>
                </div>

                <!-- Virtual rows: use committedColumnWidths so they don't update during drag -->
                <div :style="{ height: totalSize + 'px', position: 'relative' }">
                    <div
                        v-for="(vRow, i) in virtualItems"
                        :key="vRow.index"
                        class="absolute flex border-b border-zinc-100 bg-white hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:bg-zinc-900"
                        :style="{
                            top: vRow.start + 'px',
                            height: vRow.size + 'px',
                            width: totalColumnsWidth + 'px'
                        }"
                    >
                        <template v-if="visibleRowData[i] !== undefined">
                            <div
                                v-for="header in flatHeaders"
                                :key="header.id"
                                class="flex shrink-0 items-center overflow-hidden px-3 text-sm text-zinc-800 dark:text-zinc-300"
                                :style="{ width: committedColumnWidths[header.id] + 'px' }"
                            >
                                <span class="truncate">{{ visibleRowData[i]?.[header.column.id] ?? '' }}</span>
                            </div>
                        </template>

                        <template v-else>
                            <div v-for="header in flatHeaders" :key="header.id" class="flex shrink-0 items-center px-3" :style="{ width: committedColumnWidths[header.id] + 'px' }">
                                <div class="h-4 w-3/4 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" />
                            </div>
                        </template>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
/* Force scrollbars visible on iOS Safari (hidden by default). Using a named class rather than
   an attribute selector so Vue's scoped attribute is applied reliably to the element. */
.grid-scroll-body::-webkit-scrollbar {
    -webkit-appearance: none;
    width: 7px;
    height: 7px;
}

.grid-scroll-body::-webkit-scrollbar-thumb {
    border-radius: 4px;
    background-color: rgba(0, 0, 0, 0.3);
}
</style>
