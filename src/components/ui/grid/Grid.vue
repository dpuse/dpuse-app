<script setup lang="ts" generic="T">
// External Dependencies
import { PlusIcon } from 'lucide-vue-next';
import { computed, onUnmounted, ref, shallowRef } from 'vue';

// Local (App) Framework
import { type DataSource, useDataWindow } from '@/composables/useDataWindow';

// Local Components - Static
import ActionBar from '@/components/layout/actionBar/ActionBar.vue';
import ScrollArea from '@/components/layout/scrollArea/ScrollArea.vue';

// Options, Properties, Slots & Emits ──────────────────────────────────────────────────────────────────────────────────

defineOptions({ inheritAttrs: false });

type Properties = {
    cacheBlockSize?: number; // Rows fetched per request. Default: 100.
    dataSource: DataSource<T>;
    addLabel?: string;
    isCompact?: boolean;
    maxBlocksInCache?: number; // Maximum blocks held in memory before LRU eviction. Default: 10.
    rowHeight?: number; // Row height in px. Default: 48.
    targetColumnWidth?: number; // When set, multiple items are shown per row based on available width.
};
const { cacheBlockSize, dataSource, addLabel, isCompact = false, maxBlocksInCache, rowHeight = 48, targetColumnWidth } = defineProps<Properties>();

defineSlots<{ default?(properties: { index: number; item: T }): unknown }>();

defineEmits<{ add: []; select: [item: T | undefined] }>();

// State ───────────────────────────────────────────────────────────────────────────────────────────────────────────────

const columnCount = ref(1);
const columnWidth = ref(0);
const scrollElement = shallowRef<HTMLElement | null>(null);
const resizeObserver = new ResizeObserver((entries) => {
    const width = entries[0]!.contentRect.width;
    if (isCompact || targetColumnWidth == null) {
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
    estimateSize: () => (isCompact ? 48 : rowHeight),
    cacheBlockSize: cacheBlockSize == null ? undefined : (): number => cacheBlockSize,
    maxBlocksInCache: maxBlocksInCache == null ? undefined : (): number => maxBlocksInCache
});

// Derived State ───────────────────────────────────────────────────────────────────────────────────────────────────────

const rowWidth = computed(() => columnCount.value * columnWidth.value);
const columnOffsets = computed(() => Array.from({ length: columnCount.value }, (_, index) => index));

// Side Effects ────────────────────────────────────────────────────────────────────────────────────────────────────────

onUnmounted(() => resizeObserver.disconnect());

// Handlers ────────────────────────────────────────────────────────────────────────────────────────────────────────────

function handleScrollAreaInitialised(viewport: HTMLElement): void {
    resizeObserver.disconnect();
    scrollElement.value = viewport;
    resizeObserver.observe(viewport);
}
</script>

<template>
    <div class="relative h-full min-h-0">
        <ScrollArea v-bind="$attrs" class="h-full" role="list" :row-count="dataSource.rowCount" scroll-area-inset="screen" @initialised="handleScrollAreaInitialised">
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
                                    v-if="getRow(virtualRow.index * columnCount + columnOffset) !== undefined"
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

        <ActionBar v-if="addLabel" class="absolute right-(--safe-right-offset) bottom-(--safe-bottom-offset)" variant="add" @action="$emit('add')">
            <template #action>
                <PlusIcon />
                <span class="text-xs">{{ addLabel }}</span>
            </template>
        </ActionBar>
    </div>
</template>
