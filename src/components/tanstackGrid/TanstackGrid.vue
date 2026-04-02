<script setup lang="ts">
// External Dependencies
import { useVirtualizer } from '@tanstack/vue-virtual';
import { computed, ref, watch } from 'vue';

// Properties & Emits ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

type Properties = {
    columnDefinitions: GridColumnDefinition[];
    dataSource: GridDataSource;
    cacheBlockSize?: number; // Rows fetched per request. Default: 100.
    maxBlocksInCache?: number; // Maximum blocks held in memory before LRU eviction. Default: 10.
};
export type GridColumnDefinition = { field: string; headerName?: string; width?: number };
export type GridDataSource = { rowCount: number; getRows: (startRow: number, endRow: number) => Promise<unknown[]> };
const { columnDefinitions, dataSource, cacheBlockSize = 100, maxBlocksInCache = 10 } = defineProps<Properties>();

// Local State - Columns ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const totalColumnsWidth = computed(() => columnDefinitions.reduce((sum, col) => sum + (col.width ?? 150), 0));

// Local State - Data Block Cache ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const blockCacheMap = new Map<number, unknown[]>(); // Plain (non-reactive) Map so Vue never traverses its internals during render.
const blockCacheVersion = ref(0); // Re-renders are triggered only by `blockCacheVersion`, incremented once per fetch result.
const blockLeastRecentlyUsedOrder: number[] = []; // Index 0 contains the block index of the least recently used (oldest) block.
const blockPendingFetchIndexSet = new Set<number>();
let fetchGeneration = 0; // Incremented on dataSource change; in-flight responses from prior generations are discarded.

// Local State - Virtualizer ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const scrollElement = ref<HTMLDivElement | null>(null);

const virtualizer = useVirtualizer({
    get count() {
        return dataSource.rowCount;
    },
    getScrollElement: () => scrollElement.value,
    estimateSize: () => 48,
    overscan: 5
});

// Derived State - Virtualizer ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const virtualRows = computed(() => virtualizer.value.getVirtualItems());
const totalRowCount = computed(() => virtualizer.value.getTotalSize());
const visibleRowData = computed(() => {
    void blockCacheVersion.value; // Only recomputes when `virtualRows` or `blockCacheVersion` changes — never on resize.
    return virtualRows.value.map((virtualRow) => {
        const blockIndex = getBlockIndex(virtualRow.index);
        const block = blockCacheMap.get(blockIndex);
        return block ? (block[virtualRow.index % cacheBlockSize] as Record<string, unknown>) : undefined;
    });
});

// Side Effects - Virtualizer ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// When the data source is swapped, stale blocks must be purged immediately. In-flight fetches from the
// prior source are identified by their generation snapshot and silently dropped when they resolve.
watch(
    () => dataSource,
    () => {
        fetchGeneration++;
        blockCacheMap.clear();
        blockLeastRecentlyUsedOrder.length = 0;
        blockPendingFetchIndexSet.clear();
        blockCacheVersion.value++;
    },
    { flush: 'sync' }
);

watch(virtualRows, (items) => {
    const requiredBlockIndexes = new Set(items.map((item) => getBlockIndex(item.index)));
    for (const blockIndex of requiredBlockIndexes) {
        if (blockCacheMap.has(blockIndex)) recordBlockAccessed(blockIndex);
        fetchBlock(blockIndex);
    }
});

// Helpers - Data Block Cache ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function fetchBlock(blockIndex: number): void {
    if (blockCacheMap.has(blockIndex) || blockPendingFetchIndexSet.has(blockIndex)) return;
    blockPendingFetchIndexSet.add(blockIndex);
    const start = blockIndex * cacheBlockSize;
    const end = Math.min(start + cacheBlockSize, dataSource.rowCount);
    const generation = fetchGeneration;
    dataSource
        .getRows(start, end)
        .then((rows) => {
            if (generation !== fetchGeneration) return; // dataSource changed while this fetch was in-flight; discard.
            while (blockCacheMap.size >= maxBlocksInCache) {
                const evictBlockIndex = blockLeastRecentlyUsedOrder.shift();
                if (evictBlockIndex === undefined) break;
                blockCacheMap.delete(evictBlockIndex);
            }
            blockCacheMap.set(blockIndex, rows);
            recordBlockAccessed(blockIndex);
            blockCacheVersion.value++;
        })
        .catch((error) => console.error(`[TanstackGrid] Failed to fetch block ${blockIndex}:`, error))
        .finally(() => blockPendingFetchIndexSet.delete(blockIndex));
}

function getBlockIndex(rowIndex: number): number {
    return Math.floor(rowIndex / cacheBlockSize);
}

function recordBlockAccessed(blockIndex: number): void {
    const position = blockLeastRecentlyUsedOrder.indexOf(blockIndex);
    if (position !== -1) blockLeastRecentlyUsedOrder.splice(position, 1);
    blockLeastRecentlyUsedOrder.push(blockIndex);
}
</script>

<template>
    <div class="flex h-full flex-col overflow-hidden">
        <div ref="scrollElement" class="grid-scroll-body flex-1 overflow-auto" style="overscroll-behavior: none; -webkit-overflow-scrolling: touch">
            <div :style="{ minWidth: totalColumnsWidth + 'px' }">
                <!-- Sticky header -->
                <div class="sticky top-0 z-10 flex border-b border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900" style="height: 40px">
                    <div
                        v-for="col in columnDefinitions"
                        :key="col.field"
                        class="flex shrink-0 items-center px-3 text-xs font-medium tracking-wide text-zinc-500 uppercase select-none dark:text-zinc-400"
                        :style="{ width: (col.width ?? 150) + 'px' }"
                    >
                        <span class="truncate">{{ col.headerName ?? col.field }}</span>
                    </div>
                </div>

                <!-- Virtual rows -->
                <div :style="{ height: totalRowCount + 'px', position: 'relative' }">
                    <div
                        v-for="(virtualRow, i) in virtualRows"
                        :key="virtualRow.index"
                        class="absolute flex border-b border-zinc-100 bg-white hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:bg-zinc-900"
                        :style="{ top: 0, transform: `translateY(${virtualRow.start}px)`, height: virtualRow.size + 'px', width: totalColumnsWidth + 'px' }"
                    >
                        <template v-if="visibleRowData[i] !== undefined">
                            <div
                                v-for="col in columnDefinitions"
                                :key="col.field"
                                class="flex shrink-0 items-center overflow-hidden px-3 text-sm text-zinc-800 dark:text-zinc-300"
                                :style="{ width: (col.width ?? 150) + 'px' }"
                            >
                                <span class="truncate">{{ visibleRowData[i]?.[col.field] ?? '' }}</span>
                            </div>
                        </template>

                        <template v-else>
                            <div v-for="col in columnDefinitions" :key="col.field" class="flex shrink-0 items-center px-3" :style="{ width: (col.width ?? 150) + 'px' }">
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
