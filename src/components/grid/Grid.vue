<script setup lang="ts">
// External Dependencies
import { useVirtualizer } from '@tanstack/vue-virtual';
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';

// App Core
import type { DataSource } from '@/composables/useDataWindow';

// App Components & Views - Statically imported so always available, even after app goes offline.
import ScrollThumb from '@/components/scrollThumb/ScrollThumb.vue';

// Properties & Emits ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

type Properties = {
    dataSource?: DataSource; // Large async datasets — uses block cache.
    items?: Record<string, unknown>[]; // Small static arrays — no block cache.
    rowHeight?: number; // Row height in px. Default: 35.
    targetColumnWidth?: number; // Target column width in px. Default: 200.
    cacheBlockSize?: number; // Rows fetched per request (dataSource only). Default: 100.
    maxBlocksInCache?: number; // Maximum blocks held in memory before LRU eviction (dataSource only). Default: 10.
};
const { dataSource, items, rowHeight = 35, targetColumnWidth = 200, cacheBlockSize = 100, maxBlocksInCache = 10 } = defineProps<Properties>();

// Row count — derived from whichever source is active.
const rowCount = computed(() => dataSource?.rowCount ?? items?.length ?? 0);

// Block Cache (dataSource mode only) ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Inlined (not useDataWindow) because the grid maps N data rows → 1 virtual row; useDataWindow assumes 1:1.

const blockCacheMap = new Map<number, unknown[]>(); // Non-reactive; Vue never traverses its internals.
const blockCacheVersion = ref(0); // Incremented on fetch completion to trigger re-renders.
const blockLruOrder: number[] = [];
const blockPendingSet = new Set<number>();
let fetchGeneration = 0;

watch(
    () => dataSource,
    () => {
        fetchGeneration++;
        blockCacheMap.clear();
        blockLruOrder.length = 0;
        blockPendingSet.clear();
        blockCacheVersion.value++;
    },
    { flush: 'sync' }
);

function fetchBlock(blockIndex: number): void {
    if (!dataSource) return;
    if (blockCacheMap.has(blockIndex) || blockPendingSet.has(blockIndex)) return;
    blockPendingSet.add(blockIndex);
    const start = blockIndex * cacheBlockSize;
    const end = Math.min(start + cacheBlockSize, dataSource.rowCount);
    const generation = fetchGeneration;
    dataSource
        .getRows(start, end)
        .then((rows) => {
            if (generation !== fetchGeneration) return;
            while (blockCacheMap.size >= maxBlocksInCache) {
                const evict = blockLruOrder.shift();
                if (evict === undefined) break;
                blockCacheMap.delete(evict);
            }
            blockCacheMap.set(blockIndex, rows);
            const pos = blockLruOrder.indexOf(blockIndex);
            if (pos !== -1) blockLruOrder.splice(pos, 1);
            blockLruOrder.push(blockIndex);
            blockCacheVersion.value++;
        })
        .catch((error) => console.error('[dpuse-app] Grid failed to fetch block:', error))
        .finally(() => blockPendingSet.delete(blockIndex));
}

// Row accessor — returns undefined while a block is loading (signals skeleton to caller).
function getRow(dataIndex: number): Record<string, unknown> | undefined {
    if (dataIndex >= rowCount.value) return undefined;
    if (items) return items[dataIndex];
    void blockCacheVersion.value; // Register as reactive dependency so re-renders fire on fetch completion.
    const blockIndex = Math.floor(dataIndex / cacheBlockSize);
    const block = blockCacheMap.get(blockIndex);
    return block ? (block[dataIndex % cacheBlockSize] as Record<string, unknown>) : undefined;
}

// Layout ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const scrollElement = ref<HTMLDivElement | null>(null);
const columnCount = ref(1);
const gridWidth = ref(0);

const gridRowCount = computed(() => Math.ceil(rowCount.value / columnCount.value));

const resizeObserver = new ResizeObserver((entries) => {
    gridWidth.value = entries[0]!.contentRect.width;
    columnCount.value = Math.max(Math.floor((gridWidth.value - 16) / targetColumnWidth), 1);
    columnVirtualizer.value.measure();
});

onMounted(() => {
    if (scrollElement.value) resizeObserver.observe(scrollElement.value);
});
onUnmounted(() => resizeObserver.disconnect());

// Virtualizers ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const columnVirtualizer = useVirtualizer({
    get count() {
        return columnCount.value;
    },
    horizontal: true,
    overscan: 2,
    estimateSize: () => (gridWidth.value >= 1280 ? targetColumnWidth : Math.floor((gridWidth.value - 16) / columnCount.value)),
    getScrollElement: () => scrollElement.value
});

const rowVirtualizer = useVirtualizer({
    get count() {
        return gridRowCount.value;
    },
    overscan: 3,
    estimateSize: () => rowHeight,
    getScrollElement: () => scrollElement.value
});

const virtualRows = computed(() => rowVirtualizer.value.getVirtualItems());
const totalSize = computed(() => rowVirtualizer.value.getTotalSize());

// Fetch blocks for all data items in the current viewport (dataSource mode only).
watch([virtualRows, (): number => columnCount.value], ([rows, cols]) => {
    if (!dataSource) return;
    for (const vRow of rows) {
        for (let c = 0; c < cols; c++) {
            const dataIndex = vRow.index * cols + c;
            if (dataIndex < dataSource.rowCount) {
                fetchBlock(Math.floor(dataIndex / cacheBlockSize));
            }
        }
    }
});
</script>

<template>
    <div class="relative flex h-full flex-col overflow-hidden">
        <div ref="scrollElement" class="flex-1 overflow-y-auto pb-(--dp-app-bottom-gutter)" style="overscroll-behavior: none; -webkit-overflow-scrolling: touch">
            <div :style="{ height: totalSize + 'px', position: 'relative' }">
                <template v-for="vRow in virtualRows" :key="vRow.index">
                    <div
                        v-for="vCol in columnVirtualizer.getVirtualItems()"
                        :key="vCol.index"
                        class="absolute top-0 left-0"
                        :style="{
                            height: `${vRow.size}px`,
                            transform: `translateX(${vCol.start}px) translateY(${vRow.start}px)`,
                            width: `${vCol.size}px`
                        }"
                    >
                        <div class="h-full pt-4 pl-4">
                            <slot :row="getRow(vRow.index * columnCount + vCol.index)" :index="vRow.index * columnCount + vCol.index" />
                        </div>
                    </div>
                </template>
            </div>
        </div>
        <ScrollThumb :scroll-element="scrollElement" :row-count="rowCount" />
    </div>
</template>
