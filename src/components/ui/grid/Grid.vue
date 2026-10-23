<script setup lang="ts" generic="T extends object">
// ── External Dependencies & Registrations
import { PlusIcon } from '@lucide/vue';
import { useResizeObserver } from '@vueuse/core';
import { computed, ref, shallowRef, useTemplateRef, watch } from 'vue';

// ── Local Framework
import { type DataSource, DEFAULT_CACHE_BLOCK_SIZE, useDataWindow } from '@/composables/useDataWindow';

// ── Static Components
import BusyBar from '@/components/ui/BusyBar.vue';
import PillButton from '@/components/ui/action/PillButton.vue';
import ScrollArea from '@/components/ui/scroll/ScrollArea.vue';

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

// Compact rows are plain one-line rows rather than boxed cards, so they sit closer together.
const COMPACT_ROW_HEIGHT = 36;
const ROW_HEIGHT = 48;

// ── Options, Props, Slots & Emits ────────────────────────────────────────────────────────────────────────────────────

interface Properties {
    cacheBlockSize?: number; // Rows fetched per request. Default: 100.
    dataSource: DataSource<T>;
    addLabel?: string;
    headerRowHeight?: number; // Row height for items with isHeader set, in px. Default: 24.
    isCompact?: boolean;
    isScrollTarget?: (item: T) => boolean; // Scrolls the first matching row into view once, e.g. a selection restored when the list opens.
    maxBlocksInCache?: number; // Maximum blocks held in memory before LRU eviction. Default: 10.
    rowHeight?: number; // Row height in px. Default: 48, or 36 when compact.
    scrollAreaPaddingBottom?: number | string;
    scrollAreaPaddingTop?: number | string;
    targetColumnWidth?: number; // When set, multiple items are shown per row based on available width.
}
const {
    cacheBlockSize,
    dataSource,
    addLabel,
    headerRowHeight = 32,
    isCompact,
    isScrollTarget,
    maxBlocksInCache,
    rowHeight,
    scrollAreaPaddingBottom = 'var(--vertical-scroll-bottom-screen-inset)',
    scrollAreaPaddingTop,
    targetColumnWidth
} = defineProps<Properties>();

defineSlots<{ busy?(): unknown; default?(properties: { index: number; item: T }): unknown; 'no-items'?(): unknown }>();

defineEmits<{ add: []; select: [item: T | undefined] }>();

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

const columnCount = ref(1);
const columnWidth = ref(0);
const scrollElement = shallowRef<HTMLElement | null>(null);
const rowsElement = useTemplateRef<HTMLDivElement>('rows'); // Measured for the row width, because the scroll area's side padding sits inside the scroller.
// Grid needs its own `count` override to divide the item count by columnCount for its N-per-row layout, which
// means useDataWindow's built-in self-correcting row count is bypassed for the virtualizer unless we mirror it
// locally — correctedRowCount starts at the caller's best guess (possibly undefined/unknown) and is kept in sync
// via onRowCountChange (always a real number, matching useDataWindow's own "guess a block while unknown"
// fallback). The `?? DEFAULT_CACHE_BLOCK_SIZE` below only covers the brief window before the first
// onRowCountChange call — same fallback useDataWindow uses internally when cacheBlockSize isn't overridden.
const correctedRowCount = ref(dataSource.rowCount);
const { virtualRows, totalSize, getRow, findRowIndex, scrollToIndex, rowCount, knownRowCount } = useDataWindow({
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
const scrolledToTarget = shallowRef<(item: T) => boolean>(); // The target last scrolled to, so a user who scrolls away is not pulled back.

// ── Derived State ────────────────────────────────────────────────────────────────────────────────────────────────────

const rowWidth = computed(() => columnCount.value * columnWidth.value);

// Compact rows sit almost touching, so a compact list starts a little below the top edge; a full-size cell carries its own
// top gap. A caller's padding takes precedence.
const contentPaddingTop = computed(() => scrollAreaPaddingTop ?? (isCompact ? '8px' : undefined));
const columnOffsets = computed(() => Array.from({ length: columnCount.value }, (_, index) => index));
// Uses useDataWindow's knownRowCount (not the coerced `rowCount`, and not dataSource.rowCount directly) — a
// caller's dataSource.rowCount may stay undefined forever by design (e.g. SelectItemPanel's folder browser, which
// only learns its count from a resolved fetch's totalCount, never writes it back to its own DataSource object).
const state = computed<'busy' | 'empty' | 'rows'>(() => {
    if (knownRowCount.value === undefined) return 'busy';
    return knownRowCount.value === 0 ? 'empty' : 'rows';
});

// ── Side Effects ─────────────────────────────────────────────────────────────────────────────────────────────────────

useResizeObserver(rowsElement, ([entry]) => {
    const width = entry.contentRect.width;
    if (isCompact || targetColumnWidth == null) {
        columnCount.value = 1;
        columnWidth.value = width;
    } else {
        columnCount.value = Math.max(Math.floor(width / targetColumnWidth), 1);
        columnWidth.value = Math.floor(width / columnCount.value);
    }
});

// The list's scroll area is replaced whenever a new list loads, such as another folder's. The old one is let go, so the
// virtualizer starts the new list from the top instead of from the old list's scroll position.
watch(state, (newState) => {
    if (newState !== 'rows') scrollElement.value = null;
});

// The target row may load after the list appears, and the list's scroll area only exists once rows are shown. So this
// waits for both, then scrolls once. After the DOM updates, so the scroll area has its size.
watch(
    () => (isScrollTarget == null || isScrollTarget === scrolledToTarget.value || scrollElement.value == null ? undefined : findRowIndex(isScrollTarget)),
    (rowIndex) => {
        if (rowIndex === undefined) return;
        scrollToIndex(Math.floor(rowIndex / columnCount.value));
        scrolledToTarget.value = isScrollTarget;
    },
    { flush: 'post' }
);

// ── Event Handlers ───────────────────────────────────────────────────────────────────────────────────────────────────

function handleScrollAreaInitialised(viewport: HTMLElement): void {
    scrollElement.value = viewport;
}

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

function getRowHeight(item: T | undefined): number {
    if ((item as { isHeader?: boolean } | undefined)?.isHeader === true) return headerRowHeight;
    return rowHeight ?? (isCompact ? COMPACT_ROW_HEIGHT : ROW_HEIGHT);
}
</script>

<template>
    <div class="relative flex min-h-0 flex-col" data-region="Grid">
        <!-- Body ─ The old state fades out quickly before the new one fades in, so the loading bar does not vanish in a
             flash. -->
        <Transition mode="out-in" name="dpuse-action-fade">
            <!-- Busy ─ The caller's 'busy' content, such as a slow-load message, sits below the bar so the bar never
                 moves. -->
            <div v-if="state === 'busy'">
                <BusyBar class="mx-page" />
                <slot name="busy" />
            </div>

            <ScrollArea v-else-if="state === 'empty'" class="flex-1" :scroll-area-padding-bottom="scrollAreaPaddingBottom" :scroll-area-padding-top="contentPaddingTop">
                <slot name="no-items" />
            </ScrollArea>

            <ScrollArea
                v-else
                class="flex-1"
                role="list"
                :row-count="rowCount"
                :scroll-area-padding-bottom="scrollAreaPaddingBottom"
                :scroll-area-padding-right="isCompact ? '8px' : undefined"
                :scroll-area-padding-top="contentPaddingTop"
                @initialised="handleScrollAreaInitialised"
            >
                <!-- <div :class="{ 'mt-2': isCompact }" :style="{ height: totalSize + 'px', position: 'relative' }"> -->
                <div ref="rows" :style="{ height: totalSize + 'px', position: 'relative' }">
                    <div
                        v-for="virtualRow in virtualRows"
                        :key="virtualRow.index"
                        class="absolute top-0 left-0 flex"
                        :style="{ transform: `translateY(${virtualRow.start}px)`, height: `${virtualRow.size}px`, width: `${rowWidth}px` }"
                    >
                        <template v-for="columnOffset in columnOffsets" :key="columnOffset">
                            <!-- Skip cells beyond the last data item (last row may be partially filled) -->
                            <div v-if="virtualRow.index * columnCount + columnOffset < rowCount" class="shrink-0" role="listitem" :style="{ width: `${columnWidth}px` }">
                                <!-- A compact row is inset 8px on the left, where its own 8px inset then lines its icon up with
                                     the 16px page edge and its hover and selected fill reach 8px into that margin. The scroll
                                     area keeps the same 8px on the right, so the fill has an equal gap on both sides. -->
                                <div class="h-full" :class="isCompact ? 'pt-0.5 pl-2' : 'pt-4 pl-page'">
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

        <!-- Floating Add Button (Optional) ─ Hidden while the list loads, because adding goes to the same source the list
             is waiting on, so it could not finish any sooner. Its fade-in waits for the loading bar's fade-out, so it
             arrives with the list. -->
        <Transition name="dpuse-action-fade-delayed">
            <PillButton v-if="addLabel && state !== 'busy'" :icon="PlusIcon" icon-is-leading :label="addLabel" @click="$emit('add')" />
        </Transition>
    </div>
</template>
