<script setup lang="ts">
// External Dependencies
import { useVirtualizer } from '@tanstack/vue-virtual';
import { computed, onMounted, onUnmounted, ref, shallowRef, watch } from 'vue';

// Types ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export type GridColumnDefinition = { field: string; headerName?: string; width?: number; flex?: number };

export type GridDatasource = { rowCount: number; getRows: (startRow: number, endRow: number) => Promise<unknown[]> };

// Properties ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

type Properties = {
    columnDefs: GridColumnDefinition[];
    datasource: GridDatasource;
    /** Rows fetched per request. Default: 100 */
    cacheBlockSize?: number;
    /** Maximum blocks held in memory before LRU eviction. Default: 10 */
    maxBlocksInCache?: number;
};
const { columnDefs, datasource, cacheBlockSize = 100, maxBlocksInCache = 10 } = defineProps<Properties>();

// Column widths ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const containerElement = ref<HTMLDivElement | null>(null);
const containerWidth = shallowRef(0);
let lastContainerWidth = 0;
let resizeRafId: number | undefined;

/**
 * Computes pixel widths for every column given the available container width.
 * Fixed columns use their explicit `width`. Flex columns share the remaining space
 * proportionally. Returns an array parallel to `columnDefs`.
 */
const columnWidths = computed<number[]>(() => {
    const avail = containerWidth.value;
    if (avail === 0) return columnDefs.map((c) => c.width ?? 150);

    const totalFixed = columnDefs.filter((c) => c.width !== undefined).reduce((sum, c) => sum + (c.width ?? 0), 0);
    const totalFlex = columnDefs.filter((c) => c.flex !== undefined).reduce((sum, c) => sum + (c.flex ?? 1), 0);
    const flexSpace = Math.max(0, avail - totalFixed);

    return columnDefs.map((c) => (c.width === undefined ? ((c.flex ?? 1) / Math.max(totalFlex, 1)) * flexSpace : c.width));
});

const totalColumnsWidth = computed(() => columnWidths.value.reduce((sum, w) => sum + w, 0));

/** RAF-throttled — coalesces all resize events within one animation frame into a single update. */
const containerObserver = new ResizeObserver(([entry]) => {
    if (resizeRafId !== undefined) return;
    resizeRafId = requestAnimationFrame(() => {
        resizeRafId = undefined;
        const w = Math.round(entry.contentRect.width);
        if (w === lastContainerWidth) return;
        lastContainerWidth = w;
        containerWidth.value = w;
    });
});

// Block cache (LRU, data virtualisation) ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//
// Plain (non-reactive) Map so Vue never traverses its internals during render.
// Re-renders are triggered only by `blockCacheVersion`, incremented once per fetch result.

const blockCacheMap = new Map<number, unknown[]>();
const blockCacheVersion = shallowRef(0);
const inFlight = new Set<number>();
const lruOrder: number[] = [];

function recordAccess(bi: number): void {
    const pos = lruOrder.indexOf(bi);
    if (pos !== -1) lruOrder.splice(pos, 1);
    lruOrder.push(bi);
}

function blockIndex(rowIndex: number): number {
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
            blockCacheVersion.value++;
        })
        .finally(() => inFlight.delete(bi));
}

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

/**
 * Pre-computes row data for all visible virtual items in one pass.
 * Only recomputes when `virtualItems` or `blockCacheVersion` changes — never on resize.
 */
const visibleRowData = computed(() => {
    void blockCacheVersion.value; // reactive dependency
    return virtualItems.value.map((vRow) => {
        const bi = blockIndex(vRow.index);
        const block = blockCacheMap.get(bi);
        return block ? (block[vRow.index % cacheBlockSize] as Record<string, unknown>) : undefined;
    });
});

watch(virtualItems, (items) => {
    const needed = new Set(items.map((item) => blockIndex(item.index)));
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
        containerWidth.value = w;
    }
    containerObserver.observe(containerElement.value);
});

onUnmounted(() => {
    containerObserver.disconnect();
    if (resizeRafId !== undefined) cancelAnimationFrame(resizeRafId);
});
</script>

<template>
    <div ref="containerElement" class="flex h-full flex-col overflow-hidden">
        <div ref="scrollElement" class="grid-scroll-body flex-1 overflow-auto" style="overscroll-behavior: none; -webkit-overflow-scrolling: touch">
            <div :style="{ minWidth: totalColumnsWidth + 'px' }">
                <!-- Sticky header -->
                <div class="sticky top-0 z-10 flex border-b border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900" style="height: 40px">
                    <div
                        v-for="(col, ci) in columnDefs"
                        :key="col.field"
                        class="flex shrink-0 items-center px-3 text-xs font-medium tracking-wide text-zinc-500 uppercase select-none dark:text-zinc-400"
                        :style="{ width: columnWidths[ci] + 'px' }"
                    >
                        <span class="truncate">{{ col.headerName ?? col.field }}</span>
                    </div>
                </div>

                <!-- Virtual rows -->
                <div :style="{ height: totalSize + 'px', position: 'relative' }">
                    <div
                        v-for="(vRow, i) in virtualItems"
                        :key="vRow.index"
                        class="absolute flex border-b border-zinc-100 bg-white hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:bg-zinc-900"
                        :style="{ top: vRow.start + 'px', height: vRow.size + 'px', width: totalColumnsWidth + 'px' }"
                    >
                        <template v-if="visibleRowData[i] !== undefined">
                            <div
                                v-for="(col, ci) in columnDefs"
                                :key="col.field"
                                class="flex shrink-0 items-center overflow-hidden px-3 text-sm text-zinc-800 dark:text-zinc-300"
                                :style="{ width: columnWidths[ci] + 'px' }"
                            >
                                <span class="truncate">{{ visibleRowData[i]?.[col.field] ?? '' }}</span>
                            </div>
                        </template>

                        <template v-else>
                            <div v-for="(col, ci) in columnDefs" :key="col.field" class="flex shrink-0 items-center px-3" :style="{ width: columnWidths[ci] + 'px' }">
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
/* .grid-scroll-body::-webkit-scrollbar {
    -webkit-appearance: none;
    width: 7px;
    height: 7px;
}

.grid-scroll-body::-webkit-scrollbar-thumb {
    border-radius: 4px;
    background-color: rgba(0, 0, 0, 0.3);
} */
</style>
