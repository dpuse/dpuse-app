<script setup lang="ts" generic="T">
// External Dependencies
import { computed, nextTick, onUnmounted, ref, shallowRef, watch } from 'vue';

// Local (App) Framework
import { type DataSource, useDataWindow } from '@/composables/useDataWindow';

// Local Components - Static
import ScrollArea from '@/components/layout/scrollArea/ScrollArea.vue';
import type { ComponentExposed } from 'vue-component-type-helpers';
import type { VirtualItem } from '@tanstack/vue-virtual';

// Options, Properties, Slots & Emits ──────────────────────────────────────────────────────────────────────────────────

type Properties = {
    dataSource: DataSource<T>;
    rowHeight?: number; // Row height in px. Default: 48.
    targetColumnWidth?: number; // When set, multiple items are shown per row based on available width.
    cacheBlockSize?: number; // Rows fetched per request. Default: 100.
    maxBlocksInCache?: number; // Maximum blocks held in memory before LRU eviction. Default: 10.
};
const { dataSource, rowHeight = 48, targetColumnWidth, cacheBlockSize, maxBlocksInCache } = defineProps<Properties>();

const slots = defineSlots<{
    compact?(properties: { index: number; item: T }): unknown;
    default?(properties: { index: number; item: T }): unknown;
}>();

// State ───────────────────────────────────────────────────────────────────────────────────────────────────────────────

const scrollAreaReference = ref<ComponentExposed<typeof ScrollArea> | null>(null);
const columnCount = ref(1);
const columnWidth = ref(0);
const scrollElement = shallowRef<HTMLElement | null>(null);
const resizeObserver = new ResizeObserver((entries) => {
    const width = entries[0]!.contentRect.width;
    if (!slots.default || targetColumnWidth == null) {
        columnCount.value = 1;
        columnWidth.value = width;
    } else {
        columnCount.value = Math.max(Math.floor(width / targetColumnWidth), 1);
        columnWidth.value = Math.floor(width / columnCount.value);
    }
});
const { virtualRows, totalSize, getRow } = useDataWindow({
    scrollElement,
    dataSource: () => dataSource,
    count: () => Math.ceil(dataSource.rowCount / columnCount.value),
    getDataIndexes: (virtualRowIndex) => Array.from({ length: columnCount.value }, (_, col) => virtualRowIndex * columnCount.value + col),
    estimateSize: () => (!slots.default || (slots.compact && columnCount.value === 1) ? 48 : rowHeight),
    cacheBlockSize: cacheBlockSize == null ? undefined : (): number => cacheBlockSize,
    maxBlocksInCache: maxBlocksInCache == null ? undefined : (): number => maxBlocksInCache
});

// Derived State ───────────────────────────────────────────────────────────────────────────────────────────────────────

const rowWidth = computed(() => columnCount.value * columnWidth.value);
const columnOffsets = computed(() => Array.from({ length: columnCount.value }, (_, index) => index));
const isCompact = computed(() => !slots.default || (!!slots.compact && columnCount.value === 1));

// Side Effects ────────────────────────────────────────────────────────────────────────────────────────────────────────

onUnmounted(() => resizeObserver.disconnect());

watch(
    () => dataSource,
    async () => {
        console.log('### GRID: DATA SOURCE CHANGED', dataSource, scrollAreaReference);
        // scrollAreaReference.value?.refresh();
        // await nextTick();
        // requestAnimationFrame(() => {
        //     requestAnimationFrame(() => {
        //         scrollAreaReference.value?.refresh();
        //         // void scrollAreaReference.value?.$el.offsetHeight;
        //     });
        // });
    }
);

// UI Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

function handleInitialised(viewport: HTMLElement): void {
    console.log('### GRID: SCROLL AREA INITIALISED');
    scrollElement.value = viewport;
    resizeObserver.observe(viewport);
}
</script>

<template>
    <ScrollArea ref="scrollAreaReference" class="h-full" role="list" :row-count="dataSource.rowCount" scroll-area-inset="screen" @initialised="handleInitialised">
        <div :style="{ height: totalSize + 'px', position: 'relative' }">
            <div
                v-for="virtualRow in virtualRows"
                :key="virtualRow.index"
                class="absolute top-0 left-0 flex"
                :style="{ transform: `translateY(${virtualRow.start}px)`, height: `${virtualRow.size}px`, width: `${rowWidth}px` }"
            >
                <template v-for="columnOffset in columnOffsets" :key="columnOffset">
                    <!-- Skip cells beyond the last data item (last row may be partially filled) -->
                    <div v-if="virtualRow.index * columnCount + columnOffset < dataSource.rowCount" class="shrink-0" role="listitem" :style="{ width: `${columnWidth}px` }">
                        <div class="h-full pl-4" :class="[isCompact ? 'pt-2' : 'pt-4']">
                            <slot
                                v-if="isCompact && getRow(virtualRow.index * columnCount + columnOffset) !== undefined"
                                name="compact"
                                :item="getRow(virtualRow.index * columnCount + columnOffset) as T"
                                :index="virtualRow.index * columnCount + columnOffset"
                            />
                            <slot
                                v-else-if="getRow(virtualRow.index * columnCount + columnOffset) !== undefined"
                                :item="getRow(virtualRow.index * columnCount + columnOffset) as T"
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
    </ScrollArea>
</template>
