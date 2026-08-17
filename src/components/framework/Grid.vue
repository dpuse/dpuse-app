<script setup lang="ts" generic="T">
// ── External Dependencies & Registrations
import { PlusIcon } from '@lucide/vue';
import { computed, onUnmounted, ref, shallowRef } from 'vue';

// ── Local Framework
import { type DataSource, DEFAULT_CACHE_BLOCK_SIZE, useDataWindow } from '@/composables/useDataWindow';

// ── Local Components - Static
import AddActionButton from '@/components/ui/button/AddActionButton.vue';
import BusyBar from '@/components/framework/BusyBar.vue';
import Button from '@/components/ui/button/Button.vue';
import ScrollArea, { type ScrollAreaPadding } from '@/components/ui/ScrollArea.vue';

// ── Options, Properties, Model Value, Slots & Emits ──────────────────────────────────────────────────────────────────

type Properties = {
    cacheBlockSize?: number; // Rows fetched per request. Default: 100.
    dataSource: DataSource<T>;
    addLabel?: string;
    headerRowHeight?: number; // Row height for items with isHeader set, in px. Default: 24.
    isCompact?: boolean;
    maxBlocksInCache?: number; // Maximum blocks held in memory before LRU eviction. Default: 10.
    rowHeight?: number; // Row height in px. Default: 48.
    scrollAreaPadding?: ScrollAreaPadding;
    targetColumnWidth?: number; // When set, multiple items are shown per row based on available width.
};
const {
    cacheBlockSize,
    dataSource,
    addLabel,
    headerRowHeight = 24,
    isCompact = false,
    maxBlocksInCache,
    rowHeight = 48,
    scrollAreaPadding = 'screen',
    targetColumnWidth
} = defineProps<Properties>();

defineSlots<{ default?(properties: { index: number; item: T }): unknown; empty?(): unknown }>();

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
const { virtualRows, totalSize, getRow, rowCount, knownRowCount } = useDataWindow({
    scrollElement,
    dataSource: () => dataSource,
    count: () => Math.ceil((correctedRowCount.value ?? cacheBlockSize ?? DEFAULT_CACHE_BLOCK_SIZE) / columnCount.value),
    onRowCountChange: (newRowCount) => {
        correctedRowCount.value = newRowCount;
    },
    getDataIndexes: (virtualRowIndex) => Array.from({ length: columnCount.value }, (_, col) => virtualRowIndex * columnCount.value + col),
    estimateSize: getRowHeight,
    cacheBlockSize: cacheBlockSize == null ? undefined : (): number => cacheBlockSize,
    maxBlocksInCache: maxBlocksInCache == null ? undefined : (): number => maxBlocksInCache
});

// ── Derived State ────────────────────────────────────────────────────────────────────────────────────────────────────

const rowWidth = computed(() => columnCount.value * columnWidth.value);
const columnOffsets = computed(() => Array.from({ length: columnCount.value }, (_, index) => index));
// Uses useDataWindow's knownRowCount (not the coerced `rowCount`, and not dataSource.rowCount directly) — a
// caller's dataSource.rowCount may stay undefined forever by design (e.g. SelectItemPanel's folder browser, which
// only learns its count from a resolved fetch's totalCount, never writes it back to its own DataSource object).
const state = computed<'busy' | 'empty' | 'rows'>(() => {
    if (knownRowCount.value === undefined) return 'busy';
    if (knownRowCount.value === 0) return 'empty';
    return 'rows';
});

// ── Side Effects ─────────────────────────────────────────────────────────────────────────────────────────────────────

onUnmounted(() => resizeObserver.disconnect());

// ── Event Handlers ───────────────────────────────────────────────────────────────────────────────────────────────────

function handleScrollAreaInitialised(viewport: HTMLElement): void {
    resizeObserver.disconnect();
    scrollElement.value = viewport;
    resizeObserver.observe(viewport);
}

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

function getRowHeight(item: T | undefined): number {
    if ((item as { isHeader?: boolean } | undefined)?.isHeader === true) return headerRowHeight;
    return isCompact ? 48 : rowHeight;
}
</script>

<template>
    <div class="relative flex min-h-0 flex-col" data-region="Grid">
        <!-- Body -->
        <Transition mode="out-in" name="action-fade">
            <BusyBar v-if="state === 'busy'" class="mx-4" />

            <ScrollArea v-else-if="state === 'empty'" class="flex-1" :scroll-area-padding="scrollAreaPadding">
                <slot name="empty" />
            </ScrollArea>

            <ScrollArea v-else class="flex-1" role="list" :row-count="rowCount" :scroll-area-padding="scrollAreaPadding" @initialised="handleScrollAreaInitialised">
                <div :class="{ 'mt-2': isCompact }" :style="{ height: totalSize + 'px', position: 'relative' }">
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
        </Transition>

        <!-- Floating Add Button (Optional) -->
        <AddActionButton v-if="addLabel" :label="addLabel" @click="$emit('add')" />
        <!-- <Button v-if="addLabel" class="absolute right-(--safe-right-offset) bottom-(--safe-bottom-offset)" shape="minimal" @click="$emit('add')">
            <div
                class="flex h-10 items-center gap-x-1 rounded-full border border-blue-200 bg-blue-50 pr-3.5 pl-2 text-blue-600 shadow-md hover:bg-blue-100 focus-visible:ring-blue-300 dark:border-blue-600 dark:bg-blue-800 dark:text-blue-300 dark:hover:bg-blue-700 dark:focus-visible:ring-blue-500"
            >
                <PlusIcon class="size-5" :stroke-width="1.25" />
                <span class="text-sm">{{ addLabel }}</span>
            </div>
        </Button> -->
    </div>
</template>
