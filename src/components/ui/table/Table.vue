<script setup lang="ts" generic="T extends Record<string, number | string | null | undefined>">
// ── External Dependencies & Registrations
import { useVirtualizer } from '@tanstack/vue-virtual';
import { type ColumnDef, type ColumnPinningState, type ColumnSizingState, type ColumnVisibilityState, useTable } from '@tanstack/vue-table';
import { computed, onBeforeUnmount, onMounted, shallowRef, useId, useTemplateRef } from 'vue';

// ── Local Framework
import { type DataSource, useDataWindow } from '@/composables/useDataWindow';

// ── Local Components - Static
import ScrollThumb, { SCROLL_THUMB_CROSS_INSET } from '../ScrollThumb.vue';
import TableCell from './TableRowCell.vue';
import TableColumnPicker from './TableColumnPicker.vue';
import TableHeaderCell from './TableHeaderCell.vue';
import { type TableFeatureSet, tableFeatureSet } from './tableFeatures.ts';

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

const COLUMN_VIRTUALIZATION_THRESHOLD_PX = 2000; // Empirically chosen — below this width, flat rendering is cheaper than virtualizer overhead.

// ── Options, Properties, Slots & Emits ───────────────────────────────────────────────────────────────────────────────

type Properties = {
    columnDefinitions: ColumnDef<TableFeatureSet, T>[];
    dataSource: DataSource<T>;
    cacheBlockSize?: number; // Rows fetched per request. Default: 100.
    maxBlocksInCache?: number; // Maximum blocks held in memory before LRU eviction. Default: 10.
};
const { columnDefinitions, dataSource, cacheBlockSize = 100, maxBlocksInCache = 10 } = defineProps<Properties>();

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────
// Outer scrolls vertically only (drives the row virtualizer), inner scrolls horizontally only (drives the column
// virtualizer) — no single element is ever scrollable on both axes, which is what keeps a diagonal touch gesture
// from blending into simultaneous x/y scroll on iOS. The header lives in its own separate viewport rather than as
// sticky content inside the body: see the template comment above it and syncHeaderScroll below for why.

const scrollElement = useTemplateRef<HTMLDivElement>('scroller');
const scrollElementId = useId();
const innerScrollElement = useTemplateRef<HTMLDivElement>('innerScroller');
const innerScrollElementId = useId();
const headerViewport = useTemplateRef<HTMLDivElement>('headerViewport');
const verticalThumb = useTemplateRef<InstanceType<typeof ScrollThumb>>('verticalThumb');

// ── State - Columns ──────────────────────────────────────────────────────────────────────────────────────────────────

const columnPinningStateMap = shallowRef<ColumnPinningState>({ start: [], end: [] });
const columnSizingStateMap = shallowRef<ColumnSizingState>({});
const columnVisibilityStateMap = shallowRef<ColumnVisibilityState>({});

// Column virtualization is only activated when the total initial column width exceeds the threshold.
// Below the threshold, all columns are rendered in a flat flex row — simpler and cheaper.
const columnVirtualisationIsRequired = computed(() => columnDefinitions.reduce((sum, col) => sum + (col.size ?? 150), 0) > COLUMN_VIRTUALIZATION_THRESHOLD_PX);

// ── State - Rows ─────────────────────────────────────────────────────────────────────────────────────────────────────

const { virtualRows, totalSize, visibleRowData } = useDataWindow({
    scrollElement,
    dataSource: () => dataSource,
    cacheBlockSize: () => cacheBlockSize,
    maxBlocksInCache: () => maxBlocksInCache
});

// ── State - Table ────────────────────────────────────────────────────────────────────────────────────────────────────
// `table` and `centerLeafHeaders` must exist before columnVirtualizer is constructed below: useVirtualizer reads
// `count` synchronously during setup, and that getter reads centerLeafHeaders — declaring it later crashes with a
// TDZ ReferenceError the moment column virtualization actually activates (only once columns are wide enough to
// cross the threshold above; no existing usage has hit this path, which is how it went unnoticed).

const table = useTable<TableFeatureSet, T>({
    features: tableFeatureSet,
    get data(): T[] {
        return []; // Always empty — rows are rendered via useDataWindow, never via TanStack Table.
    },
    get columns() {
        return columnDefinitions;
    },
    enableColumnResizing: true,
    defaultColumn: { enableResizing: true, enableHiding: true, enablePinning: true, size: 150 },
    columnResizeMode: 'onEnd', // Snaps on mouse-up — avoids 60fps reactivity cascade during drag.
    state: {
        get columnPinning() {
            return columnPinningStateMap.value;
        },
        get columnSizing() {
            return columnSizingStateMap.value;
        },
        get columnVisibility() {
            return columnVisibilityStateMap.value;
        }
    },
    onColumnVisibilityChange: (updater) => {
        columnVisibilityStateMap.value = typeof updater === 'function' ? updater(columnVisibilityStateMap.value) : updater;
    },
    onColumnPinningChange: (updater) => {
        columnPinningStateMap.value = typeof updater === 'function' ? updater(columnPinningStateMap.value) : updater;
    },
    onColumnSizingChange: (updater) => {
        columnSizingStateMap.value = typeof updater === 'function' ? updater(columnSizingStateMap.value) : updater;
        if (columnVirtualisationIsRequired.value) columnVirtualizer.value.measure();
    }
});

const centerLeafHeaders = computed(() => table.getCenterLeafHeaders());

// ── State - Columns (continued) ─────────────────────────────────────────────────────────────────────────────────────
// Constructed only now that centerLeafHeaders exists — see the note above table's declaration.

const columnVirtualizer = useVirtualizer({
    get count() {
        return columnVirtualisationIsRequired.value ? centerLeafHeaders.value.length : 0;
    },
    estimateSize: (index) => centerLeafHeaders.value[index]?.column.getSize() ?? 150,
    getScrollElement: () => innerScrollElement.value,
    horizontal: true,
    overscan: 3
});

// ── Derived State - Columns ──────────────────────────────────────────────────────────────────────────────────────────

const leftLeafHeaders = computed(() => table.getStartLeafHeaders());
const leftPinnedWidth = computed(() => leftLeafHeaders.value.reduce((sum, header) => sum + header.column.getSize(), 0));
const rightLeafHeaders = computed(() => table.getEndLeafHeaders());
const rightPinnedWidth = computed(() => rightLeafHeaders.value.reduce((sum, header) => sum + header.column.getSize(), 0));
const totalCenterWidth = computed(() =>
    columnVirtualisationIsRequired.value ? columnVirtualizer.value.getTotalSize() : centerLeafHeaders.value.reduce((sum, header) => sum + header.column.getSize(), 0)
);
const totalWidth = computed(() => leftPinnedWidth.value + totalCenterWidth.value + rightPinnedWidth.value);
const virtualColumns = computed(() => (columnVirtualisationIsRequired.value ? columnVirtualizer.value.getVirtualItems() : []));

// ── Side Effects ─────────────────────────────────────────────────────────────────────────────────────────────────────

onMounted(() => {
    scrollElement.value?.addEventListener('wheel', handleBodyWheel, { passive: true });
    innerScrollElement.value?.addEventListener('scroll', syncHeaderScroll, { passive: true });
});

onBeforeUnmount(() => {
    scrollElement.value?.removeEventListener('wheel', handleBodyWheel);
    innerScrollElement.value?.removeEventListener('scroll', syncHeaderScroll);
});

// ── Scroll Handlers ──────────────────────────────────────────────────────────────────────────────────────────────────

// Keeps the header viewport's horizontal position matched to the body's — the header is a separate element (see
// template) rather than sticky content inside the scrolling body, so nothing else keeps them in sync.
function syncHeaderScroll(): void {
    if (!headerViewport.value || !innerScrollElement.value) return;
    headerViewport.value.scrollLeft = innerScrollElement.value.scrollLeft;
}

// ── Wheel Handlers ───────────────────────────────────────────────────────────────────────────────────────────────────

// Wheeling over the body hits the horizontal-only inner scroller first. Because it's a scroll container even with
// overflow-y: hidden, it claims the wheel event and drops the vertical component instead of letting it bubble to
// the vertical-only outer scroller natively, so the vertical component is routed here explicitly.
function handleBodyWheel(wheelEvent: WheelEvent): void {
    if (wheelEvent.deltaY === 0) return;
    scrollElement.value?.scrollBy({ top: wheelEvent.deltaY });
}

// The header viewport has no scroll interaction of its own (overflow: hidden, position mirrored from the body) —
// forward horizontal wheel input over it to the body's horizontal scroller so hovering the header still scrolls columns.
function handleHeaderWheel(wheelEvent: WheelEvent): void {
    if (wheelEvent.deltaX === 0) return;
    innerScrollElement.value?.scrollBy({ left: wheelEvent.deltaX });
}
</script>

<template>
    <div class="relative flex h-full flex-col overflow-y-hidden" data-region="Table">
        <!-- Toolbar -->
        <div>
            <TableColumnPicker :table="table" />
        </div>

        <!-- Header — a separate viewport from the scrolling body, kept in horizontal sync via scrollLeft mirroring
             (syncHeaderScroll) rather than CSS `sticky`: sticky always resolves against the *nearest* scroll-container
             ancestor, and inside the body below that would be the horizontal-only inner scroller, which never scrolls
             vertically, so a sticky header nested in there would just scroll away with the rows instead of pinning. -->
        <div ref="headerViewport" class="overflow-hidden" @wheel.passive="handleHeaderWheel">
            <div class="flex h-10 border-b border-boundary bg-card" :style="{ width: totalWidth + 'px' }">
                <!-- Left pinned headers -->
                <div
                    v-for="leftLeafHeader in leftLeafHeaders"
                    :key="leftLeafHeader.id"
                    class="sticky shrink-0 border-r border-boundary bg-card"
                    :style="{ left: leftLeafHeader.column.getStart('start') + 'px', width: leftLeafHeader.column.getSize() + 'px', zIndex: 2 }"
                >
                    <TableHeaderCell :header="leftLeafHeader" />
                </div>

                <!-- Center headers: flat when below threshold, virtualised when above -->
                <template v-if="!columnVirtualisationIsRequired">
                    <div
                        v-for="centerLeafHeader in centerLeafHeaders"
                        :key="centerLeafHeader.id"
                        class="h-full shrink-0"
                        :style="{ width: centerLeafHeader.column.getSize() + 'px' }"
                    >
                        <TableHeaderCell :header="centerLeafHeader" />
                    </div>
                </template>

                <div v-else class="relative shrink-0" :style="{ width: totalCenterWidth + 'px' }">
                    <div
                        v-for="virtualColumn in virtualColumns"
                        :key="virtualColumn.index"
                        class="absolute top-0 h-full"
                        :style="{ left: virtualColumn.start + 'px', width: virtualColumn.size + 'px' }"
                    >
                        <TableHeaderCell :header="centerLeafHeaders[virtualColumn.index]!" />
                    </div>
                </div>

                <!-- Right pinned headers -->
                <div
                    v-for="rightLeafHeader in rightLeafHeaders"
                    :key="rightLeafHeader.id"
                    class="sticky shrink-0 border-l border-boundary bg-card"
                    :style="{ right: rightLeafHeader.column.getAfter('end') + 'px', width: rightLeafHeader.column.getSize() + 'px', zIndex: 2 }"
                >
                    <TableHeaderCell :header="rightLeafHeader" />
                </div>
            </div>
        </div>

        <!-- Body — outer (vertical-only) drives the row virtualizer, inner (horizontal-only, nested) drives the
             column virtualizer. Wrapped in its own position:relative container so the ScrollThumb tracks below
             are scoped to this region, not the toolbar/header above it. -->
        <div class="relative flex min-h-0 flex-1 flex-col">
            <div :id="scrollElementId" ref="scroller" class="dpuse-table-scroll-v flex-1 overflow-x-hidden overflow-y-auto overscroll-none">
                <div :id="innerScrollElementId" ref="innerScroller" class="dpuse-table-scroll-h overflow-x-auto overflow-y-hidden overscroll-none" @scroll="syncHeaderScroll">
                    <div :style="{ minWidth: totalWidth + 'px' }">
                        <!-- Virtual rows spacer -->
                        <div class="relative" :style="{ height: totalSize + 'px' }">
                            <div
                                v-for="(vRow, i) in virtualRows"
                                :key="vRow.index"
                                class="group absolute top-0 flex border-b border-boundary bg-surface"
                                :style="{ transform: `translateY(${vRow.start}px)`, height: vRow.size + 'px', width: totalWidth + 'px' }"
                            >
                                <!-- Left pinned cells -->
                                <TableCell
                                    v-for="leftLeafHeader in leftLeafHeaders"
                                    :key="leftLeafHeader.id"
                                    :value="visibleRowData[i]?.[leftLeafHeader.column.id]"
                                    :loading="visibleRowData[i] === undefined"
                                    class="sticky shrink-0 border-r border-boundary bg-surface group-hover:bg-card"
                                    :style="{ left: leftLeafHeader.column.getStart('start') + 'px', width: leftLeafHeader.column.getSize() + 'px', zIndex: 1 }"
                                />

                                <!-- Center cells: flat when below threshold, virtualised when above -->
                                <template v-if="!columnVirtualisationIsRequired">
                                    <TableCell
                                        v-for="centerLeafHeader in centerLeafHeaders"
                                        :key="centerLeafHeader.id"
                                        :value="visibleRowData[i]?.[centerLeafHeader.column.id]"
                                        :loading="visibleRowData[i] === undefined"
                                        class="shrink-0"
                                        :style="{ width: centerLeafHeader.column.getSize() + 'px' }"
                                    />
                                </template>

                                <div v-else class="relative shrink-0 group-hover:bg-card" :style="{ width: totalCenterWidth + 'px' }">
                                    <TableCell
                                        v-for="virtualColumn in virtualColumns"
                                        :key="virtualColumn.index"
                                        :value="visibleRowData[i]?.[centerLeafHeaders[virtualColumn.index]!.column.id]"
                                        :loading="visibleRowData[i] === undefined"
                                        class="absolute top-0 h-full"
                                        :style="{ left: virtualColumn.start + 'px', width: virtualColumn.size + 'px' }"
                                    />
                                </div>

                                <!-- Right pinned cells -->
                                <TableCell
                                    v-for="rightLeafHeader in rightLeafHeaders"
                                    :key="rightLeafHeader.id"
                                    :value="visibleRowData[i]?.[rightLeafHeader.column.id]"
                                    :loading="visibleRowData[i] === undefined"
                                    class="sticky shrink-0 border-l border-boundary bg-surface group-hover:bg-card"
                                    :style="{ right: rightLeafHeader.column.getAfter('end') + 'px', width: rightLeafHeader.column.getSize() + 'px', zIndex: 1 }"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <ScrollThumb ref="verticalThumb" orientation="vertical" :scroll-element="scrollElement" :cross-scroll-element="innerScrollElement" />
            <ScrollThumb
                orientation="horizontal"
                :scroll-element="innerScrollElement"
                :cross-scroll-element="scrollElement"
                :cross-inset-end="verticalThumb?.visible ? SCROLL_THUMB_CROSS_INSET : 0"
            />
        </div>
    </div>
</template>

<style scoped>
.dpuse-table-scroll-v,
.dpuse-table-scroll-h {
    scrollbar-width: none;
}

.dpuse-table-scroll-v::-webkit-scrollbar,
.dpuse-table-scroll-h::-webkit-scrollbar {
    display: none;
}
</style>
