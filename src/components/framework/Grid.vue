<script setup lang="ts" generic="T">
// ── External Dependencies & Registrations
import { PlusIcon } from '@lucide/vue';
import { computed, onUnmounted, ref, shallowRef } from 'vue';

// ── Local Framework
import { type DataSource, DEFAULT_CACHE_BLOCK_SIZE, useDataWindow } from '@/composables/useDataWindow';

// ── Local Components - Static
import Button from '@/components/ui/button/Button.vue';
import ScrollArea, { type ScrollAreaPadding } from '@/components/ui/ScrollArea.vue';

// ── Options, Properties, Slots & Emits ───────────────────────────────────────────────────────────────────────────────

type Properties = {
    cacheBlockSize?: number; // Rows fetched per request. Default: 100.
    dataSource: DataSource<T>;
    addLabel?: string;
    isCompact?: boolean;
    maxBlocksInCache?: number; // Maximum blocks held in memory before LRU eviction. Default: 10.
    rowHeight?: number; // Row height in px. Default: 48.
    scrollAreaPadding?: ScrollAreaPadding;
    targetColumnWidth?: number; // When set, multiple items are shown per row based on available width.
};
const { cacheBlockSize, dataSource, addLabel, isCompact = false, maxBlocksInCache, rowHeight = 48, scrollAreaPadding = 'screen', targetColumnWidth } = defineProps<Properties>();

defineSlots<{ default?(properties: { index: number; item: T }): unknown }>();

defineEmits<{ add: []; select: [item: T | undefined] }>();

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

const columnCount = ref(1);
const columnWidth = ref(0);
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
const scrollElement = shallowRef<HTMLElement | null>(null);
// Grid needs its own `count` override to divide the item count by columnCount for its N-per-row layout, which
// means useDataWindow's built-in self-correcting row count is bypassed for the virtualizer unless we mirror it
// locally — correctedRowCount starts at the caller's best guess (possibly undefined/unknown) and is kept in sync
// via onRowCountChange (always a real number, matching useDataWindow's own "guess a block while unknown"
// fallback). The `?? DEFAULT_CACHE_BLOCK_SIZE` below only covers the brief window before the first
// onRowCountChange call — same fallback useDataWindow uses internally when cacheBlockSize isn't overridden.
const correctedRowCount = ref(dataSource.rowCount);
const { virtualRows, totalSize, getRow, rowCount } = useDataWindow({
    scrollElement,
    dataSource: () => dataSource,
    count: () => Math.ceil((correctedRowCount.value ?? cacheBlockSize ?? DEFAULT_CACHE_BLOCK_SIZE) / columnCount.value),
    onRowCountChange: (newRowCount) => {
        correctedRowCount.value = newRowCount;
    },
    getDataIndexes: (virtualRowIndex) => Array.from({ length: columnCount.value }, (_, col) => virtualRowIndex * columnCount.value + col),
    estimateSize: () => (isCompact ? 48 : rowHeight),
    cacheBlockSize: cacheBlockSize == null ? undefined : (): number => cacheBlockSize,
    maxBlocksInCache: maxBlocksInCache == null ? undefined : (): number => maxBlocksInCache
});

// ── Derived State ────────────────────────────────────────────────────────────────────────────────────────────────────

const rowWidth = computed(() => columnCount.value * columnWidth.value);
const columnOffsets = computed(() => Array.from({ length: columnCount.value }, (_, index) => index));

// ── Side Effects ─────────────────────────────────────────────────────────────────────────────────────────────────────

onUnmounted(() => resizeObserver.disconnect());

// ── Event Handlers ───────────────────────────────────────────────────────────────────────────────────────────────────

function handleScrollAreaInitialised(viewport: HTMLElement): void {
    resizeObserver.disconnect();
    scrollElement.value = viewport;
    resizeObserver.observe(viewport);
}
</script>

<template>
    <div class="relative flex min-h-0 flex-col" data-region="Grid">
        <!-- Body -->
        <ScrollArea class="flex-1" role="list" :row-count="rowCount" :scroll-area-padding="scrollAreaPadding" @initialised="handleScrollAreaInitialised">
            <div :style="{ height: totalSize + 'px', position: 'relative' }">
                <div
                    v-for="virtualRow in virtualRows"
                    :key="virtualRow.index"
                    class="absolute top-0 left-0 flex"
                    :style="{ transform: `translateY(${virtualRow.start}px)`, height: `${virtualRow.size}px`, width: `${rowWidth}px` }"
                >
                    <template v-for="columnOffset in columnOffsets" :key="columnOffset">
                        <!-- Skip cells beyond the last data item (last row may be partially filled) -->
                        <div v-if="virtualRow.index * columnCount + columnOffset < rowCount" class="shrink-0" role="listitem" :style="{ width: `${columnWidth}px` }">
                            <div class="h-full pl-4" :class="[isCompact ? 'pt-2' : 'pt-4']">
                                <slot
                                    v-if="getRow(virtualRow.index * columnCount + columnOffset) !== undefined"
                                    :item="getRow(virtualRow.index * columnCount + columnOffset) as T"
                                    :index="virtualRow.index * columnCount + columnOffset"
                                />

                                <div v-else class="flex h-full items-center py-3">
                                    <div class="h-10 w-full animate-pulse rounded bg-zinc-100 dark:bg-zinc-800" />
                                </div>
                            </div>
                        </div>
                    </template>
                </div>
            </div>
        </ScrollArea>

        <!-- Floating Add Button (Optional) -->
        <Button v-if="addLabel" class="absolute right-(--safe-right-offset) bottom-(--safe-bottom-offset)" shape="minimal" @click="$emit('add')">
            <div
                class="flex h-10 items-center gap-x-1 rounded-full border border-zinc-300 bg-zinc-100 pr-3.5 pl-2 text-zinc-600 shadow-md hover:bg-zinc-200 focus-visible:ring-zinc-300 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700 dark:focus-visible:ring-zinc-500"
            >
                <PlusIcon class="size-5" :stroke-width="1.25" />
                <span class="text-sm">{{ addLabel }}</span>
            </div>
        </Button>
    </div>
</template>
