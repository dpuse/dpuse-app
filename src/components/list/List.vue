<script setup lang="ts">
// External Dependencies
import { onMounted, onUnmounted, ref } from 'vue';

// App Core
import { type DataSource, useDataWindow } from '@/composables/useDataWindow';

// App Components & Views - Statically imported so always available, even after app goes offline.
import ScrollThumb from '@/components/scrollThumb/ScrollThumb.vue';

// Properties & Emits
type Properties = {
    dataSource: DataSource;
    rowHeight?: number; // Row height in px. Default: 48.
    targetColumnWidth?: number; // When set, multiple items are shown per row based on available width.
    cacheBlockSize?: number; // Rows fetched per request. Default: 100.
    maxBlocksInCache?: number; // Maximum blocks held in memory before LRU eviction. Default: 10.
};
const { dataSource, rowHeight = 48, targetColumnWidth, cacheBlockSize, maxBlocksInCache } = defineProps<Properties>();

// Local State ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const columnCount = ref(1);
const columnWidth = ref(0);
const scrollElement = ref<HTMLElement | null>(null);
const resizeObserver = new ResizeObserver((entries) => {
    const width = entries[0]!.contentRect.width;
    if (targetColumnWidth === undefined) {
        columnCount.value = 1;
        columnWidth.value = width;
    } else {
        columnCount.value = Math.max(Math.floor((width - 16) / targetColumnWidth), 1);
        columnWidth.value = Math.floor((width - 16) / columnCount.value);
    }
});
const { virtualRows, totalRowCount, getRow } = useDataWindow({
    scrollElement,
    dataSource: () => dataSource,
    count: () => Math.ceil(dataSource.rowCount / columnCount.value),
    getDataIndexes: (virtualRowIndex) => {
        const indexes: number[] = [];
        for (let count = 0; count < columnCount.value; count++) indexes.push(virtualRowIndex * columnCount.value + count);
        return indexes;
    },
    estimateSize: () => rowHeight,
    cacheBlockSize: cacheBlockSize === undefined ? undefined : (): number => cacheBlockSize,
    maxBlocksInCache: maxBlocksInCache === undefined ? undefined : (): number => maxBlocksInCache
});

// Side Effects ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

onMounted(() => resizeObserver.observe(scrollElement.value!));
onUnmounted(() => resizeObserver.disconnect());
</script>

<template>
    <div class="relative flex h-full flex-col overflow-hidden">
        <div ref="scrollElement" class="flex-1 overflow-y-auto pb-(--dp-app-bottom-gutter)" style="overscroll-behavior: none; -webkit-overflow-scrolling: touch">
            <div :style="{ height: totalRowCount + 'px', position: 'relative' }">
                <div
                    v-for="vRow in virtualRows"
                    :key="vRow.index"
                    class="absolute top-0 left-0 flex"
                    :style="{ transform: `translateY(${vRow.start}px)`, height: `${vRow.size}px`, width: `${columnCount * columnWidth}px` }"
                >
                    <template v-for="colIndex in columnCount" :key="colIndex">
                        <!-- Skip cells beyond the last data item (last row may be partially filled) -->
                        <div v-if="vRow.index * columnCount + colIndex - 1 < dataSource.rowCount" class="shrink-0" :style="{ width: `${columnWidth}px` }">
                            <div class="h-full" :class="targetColumnWidth !== undefined ? 'pt-4 pl-4' : ''">
                                <slot
                                    v-if="getRow(vRow.index * columnCount + colIndex - 1) !== undefined"
                                    :row="getRow(vRow.index * columnCount + colIndex - 1)"
                                    :index="vRow.index * columnCount + colIndex - 1"
                                />
                                <div v-else class="flex h-full items-center px-3">
                                    <div class="h-4 w-3/4 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" />
                                </div>
                            </div>
                        </div>
                    </template>
                </div>
            </div>
        </div>
        <ScrollThumb :scroll-element="scrollElement" :row-count="dataSource.rowCount" />
    </div>
</template>
