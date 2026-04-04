<script setup lang="ts">
// External Dependencies
import { ref } from 'vue';

// App Core
import { type DataSource, useDataWindow } from '@/composables/useDataWindow';

// App Components & Views - Statically imported so always available, even after app goes offline.
import ScrollThumb from '@/components/scrollThumb/ScrollThumb.vue';

// Properties & Emits ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

type Properties = {
    dataSource: DataSource;
    field?: string; // Field key to render when no default slot is provided.
    rowHeight?: number; // Row height in px. Default: 48.
    cacheBlockSize?: number; // Rows fetched per request. Default: 100.
    maxBlocksInCache?: number; // Maximum blocks held in memory before LRU eviction. Default: 10.
};
const { dataSource, field, rowHeight = 48, cacheBlockSize, maxBlocksInCache } = defineProps<Properties>();

// Local State ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const scrollElement = ref<HTMLElement | null>(null);
const { virtualRows, totalRowCount, visibleRowData } = useDataWindow({
    scrollElement,
    dataSource: () => dataSource,
    estimateSize: () => rowHeight,
    cacheBlockSize: cacheBlockSize === undefined ? undefined : (): number => cacheBlockSize,
    maxBlocksInCache: maxBlocksInCache === undefined ? undefined : (): number => maxBlocksInCache
});
</script>

<template>
    <div class="relative flex h-full flex-col overflow-hidden">
        <div ref="scrollElement" class="flex-1 overflow-auto" style="overscroll-behavior: none; -webkit-overflow-scrolling: touch">
            <!-- Virtual rows -->
            <div :style="{ height: totalRowCount + 'px', position: 'relative' }">
                <div
                    v-for="(virtualRow, i) in virtualRows"
                    :key="virtualRow.index"
                    class="absolute w-full border-b border-zinc-100 bg-white hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:bg-zinc-900"
                    :style="{ top: 0, transform: `translateY(${virtualRow.start}px)`, height: virtualRow.size + 'px' }"
                >
                    <slot v-if="visibleRowData[i] !== undefined" :row="visibleRowData[i]" :index="virtualRow.index">
                        <div class="flex h-full items-center overflow-hidden px-3 text-sm text-zinc-800 dark:text-zinc-300">
                            <span class="truncate">{{ field ? (visibleRowData[i]?.[field] ?? '') : '' }}</span>
                        </div>
                    </slot>

                    <div v-else class="flex h-full items-center px-3">
                        <div class="h-4 w-3/4 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" />
                    </div>
                </div>
            </div>
        </div>
        <ScrollThumb :scroll-element="scrollElement" :row-count="dataSource.rowCount" />
    </div>
</template>
