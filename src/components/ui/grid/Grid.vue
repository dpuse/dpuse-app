<script setup lang="ts" generic="T">
// External Dependencies
import { computed, onMounted, onUnmounted, ref, useSlots, useTemplateRef } from 'vue';

// App Core
import { type DataSource, useDataWindow } from '@/composables/useDataWindow';

// App Components - Statically imported.
import ScrollThumb from '../scrollThumb/ScrollThumb.vue';

// Properties & Emits ──────────────────────────────────────────────────────────────────────────────────────────────────

type Properties = {
    dataSource: DataSource<T>;
    rowHeight?: number; // Row height in px. Default: 48.
    targetColumnWidth?: number; // When set, multiple items are shown per row based on available width.
    cacheBlockSize?: number; // Rows fetched per request. Default: 100.
    maxBlocksInCache?: number; // Maximum blocks held in memory before LRU eviction. Default: 10.
};
const { dataSource, rowHeight = 48, targetColumnWidth, cacheBlockSize, maxBlocksInCache } = defineProps<Properties>();

// State ───────────────────────────────────────────────────────────────────────────────────────────────────────────────

const columnCount = ref(1);
const columnWidth = ref(0);
const scrollElement = useTemplateRef<HTMLDivElement>('scroller');
const resizeObserver = new ResizeObserver((entries) => {
    const width = entries[0]!.contentRect.width;
    if (targetColumnWidth == null) {
        columnCount.value = 1;
        columnWidth.value = width;
    } else {
        columnCount.value = Math.max(Math.floor((width - 16) / targetColumnWidth), 1);
        columnWidth.value = Math.floor((width - 16) / columnCount.value);
    }
});
const slots = useSlots();
const { virtualRows, totalRowCount, getRow } = useDataWindow({
    scrollElement,
    dataSource: () => dataSource,
    count: () => Math.ceil(dataSource.rowCount / columnCount.value),
    getDataIndexes: (virtualRowIndex) => Array.from({ length: columnCount.value }, (_, col) => virtualRowIndex * columnCount.value + col),
    estimateSize: () => (slots.compact && columnCount.value === 1 ? 48 : rowHeight),
    cacheBlockSize: cacheBlockSize == null ? undefined : (): number => cacheBlockSize,
    maxBlocksInCache: maxBlocksInCache == null ? undefined : (): number => maxBlocksInCache
});

// Derived State ───────────────────────────────────────────────────────────────────────────────────────────────────────

const rowWidth = computed(() => columnCount.value * columnWidth.value);
const columnOffsets = computed(() => Array.from({ length: columnCount.value }, (_, index) => index));
const isCompact = computed(() => !!slots.compact && columnCount.value === 1);

// Side Effects ────────────────────────────────────────────────────────────────────────────────────────────────────────

onMounted(() => resizeObserver.observe(scrollElement.value!));
onUnmounted(() => resizeObserver.disconnect());
</script>

<template>
    <div class="relative flex h-full flex-col overflow-hidden">
        <div ref="scroller" class="flex-1 overflow-y-auto pb-(--dp-app-bottom-gutter)" role="list" style="overscroll-behavior: none; -webkit-overflow-scrolling: touch">
            <div :style="{ height: totalRowCount + 'px', position: 'relative' }">
                <div
                    v-for="virtualRow in virtualRows"
                    :key="virtualRow.index"
                    class="absolute top-0 left-0 flex"
                    :style="{ transform: `translateY(${virtualRow.start}px)`, height: `${virtualRow.size}px`, width: `${rowWidth}px` }"
                >
                    <template v-for="columnOffset in columnOffsets" :key="columnOffset">
                        <!-- Skip cells beyond the last data item (last row may be partially filled) -->
                        <div v-if="virtualRow.index * columnCount + columnOffset < dataSource.rowCount" class="shrink-0" role="listitem" :style="{ width: `${columnWidth}px` }">
                            <div class="h-full pl-4" :class="isCompact ? 'pt-2' : 'pt-4'">
                                <slot
                                    v-if="isCompact && getRow(virtualRow.index * columnCount + columnOffset) !== undefined"
                                    name="compact"
                                    :row="getRow(virtualRow.index * columnCount + columnOffset)"
                                    :index="virtualRow.index * columnCount + columnOffset"
                                />
                                <slot
                                    v-else-if="getRow(virtualRow.index * columnCount + columnOffset) !== undefined"
                                    :row="getRow(virtualRow.index * columnCount + columnOffset)"
                                    :index="virtualRow.index * columnCount + columnOffset"
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
