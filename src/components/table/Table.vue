<script setup lang="ts">
// External Dependencies
import { computed, ref } from 'vue';

// App Core
import { type DataSource, useLazyRows } from '@/composables/useLazyRows';

// Properties & Emits ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

type Properties = {
    columnDefinitions: ColumnDefinition[];
    dataSource: DataSource;
    cacheBlockSize?: number; // Rows fetched per request. Default: 100.
    maxBlocksInCache?: number; // Maximum blocks held in memory before LRU eviction. Default: 10.
};
export type ColumnDefinition = { field: string; headerName?: string; width?: number };
const { columnDefinitions, dataSource, cacheBlockSize, maxBlocksInCache } = defineProps<Properties>();

// Local State ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const scrollElement = ref<HTMLElement | null>(null);
const totalColumnsWidth = computed(() => columnDefinitions.reduce((sum, col) => sum + (col.width ?? 150), 0));
const { virtualRows, totalRowSize, visibleRowData } = useLazyRows({
    scrollElement,
    dataSource: () => dataSource,
    cacheBlockSize: cacheBlockSize === undefined ? undefined : (): number => cacheBlockSize,
    maxBlocksInCache: maxBlocksInCache === undefined ? undefined : (): number => maxBlocksInCache
});
</script>

<template>
    <div class="flex h-full flex-col overflow-hidden">
        <div ref="scrollElement" class="flex-1 overflow-auto" style="overscroll-behavior: none; -webkit-overflow-scrolling: touch">
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
                <div :style="{ height: totalRowSize + 'px', position: 'relative' }">
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
