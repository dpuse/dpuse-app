<script setup lang="ts" generic="T extends Record<string, number | string | null | undefined>">
// ── External Dependencies & Registrations
import { useVirtualizer } from '@tanstack/vue-virtual';
import { type ColumnDef, type ColumnPinningState, type ColumnSizingState, type ColumnVisibilityState, useTable } from '@tanstack/vue-table';
import { computed, ref, shallowRef, useId, useTemplateRef, watch } from 'vue';
import { useElementSize, useEventListener, useResizeObserver } from '@vueuse/core';

// ── Local Framework
import { constructFittedColumnWidth, HEADER_MENU_WIDTH_PX, HEADER_TAB_INSET_PX } from './tableColumnWidth';
import { type DataSource, useDataWindow } from '@/composables/useDataWindow';

// ── Static Components
import TableCell from './TableRowCell.vue';
import TableColumnPicker from './TableColumnPicker.vue';
import TableHeaderCell from './TableHeaderCell.vue';
import TableResizeLine from './TableResizeLine.vue';
import ScrollThumb, { SCROLL_THUMB_CROSS_INSET } from '../scroll/ScrollThumb.vue';
import { type TableFeatureSet, tableFeatureSet } from './tableFeatures.ts';

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

const COLUMN_VIRTUALIZATION_THRESHOLD_PX = 2000; // Empirically chosen — below this width, flat rendering is cheaper than virtualizer overhead.
// Before the first column and after the last. With the cells' own 12px it starts and ends the text 16px in, on the page
// edge, while the table and its lines run to the edges of whatever holds it. It scrolls with the columns, so no space is
// kept empty once the table is scrolled sideways.
const EDGE_INSET_PX = 4;
const END_INSET_PX = 16; // The page margin, '--spacing-page' in 'theme.css', so the last column's resize handle sits clear of the screen edge and the scroll thumb.
const ROW_HEIGHT_PX = 36; // One line of text with a little room, so a screen shows as many rows as it comfortably can.

// ── Options, Props, Slots & Emits ────────────────────────────────────────────────────────────────────────────────────

interface Properties {
    columnDefinitions: ColumnDef<TableFeatureSet, T>[];
    constructCellClass?: (columnId: string, rowIndex: number) => string | undefined; // Marks a cell by what it holds. Every cell is positioned, so a mark can be a layer inside it.
    constructCellTitle?: (columnId: string, rowIndex: number) => string | undefined; // Says in words what a mark on a cell means, on hover.
    dataSource: DataSource<T>;
    cacheBlockSize?: number; // Rows fetched per request. Default: 100.
    maxBlocksInCache?: number; // Maximum blocks held in memory before LRU eviction. Default: 10.
    isColumnFitToVisibleRows?: boolean; // A double click on a column's edge fits it to the rows on screen, for a table that holds only some of its rows. Otherwise it returns to the column's starting width.
    isColumnMenuHidden?: boolean; // Leaves out each column's pin and hide menu, for a table that must show every column as it is.
    isColumnPickerHidden?: boolean; // Leaves out the toolbar that shows and hides columns, for a table that only previews data.
    isCollapsedToPinned?: boolean; // Shows only the pinned columns, for a table sharing its space with a detail panel. The rest stay defined, so they return as they were.
    isHeaderTabbed?: boolean; // Draws each column's header as a tab, for a table whose headers also choose the column a detail panel shows.
    label?: string; // Names the table for screen readers.
    hiddenColumnIds?: string[]; // Columns hidden from the start. The column picker can show them.
    pinnedColumnIds?: string[]; // Columns pinned to the left from the start.
    selectedColumnId?: string; // Marks the column whose detail is showing.
    selectedRowIndex?: number; // Marks the row whose detail is showing.
    scrollAreaPaddingBottom?: string; // Room after the last row, as a grid's scroll area has. Less where the table already ends above a status bar.
}
const {
    columnDefinitions,
    constructCellClass,
    constructCellTitle,
    dataSource,
    cacheBlockSize = 100,
    maxBlocksInCache = 10,
    isCollapsedToPinned,
    isColumnFitToVisibleRows,
    isColumnMenuHidden,
    isColumnPickerHidden,
    isHeaderTabbed,
    label,
    hiddenColumnIds = [],
    pinnedColumnIds = [],
    scrollAreaPaddingBottom = 'var(--vertical-scroll-bottom-screen-inset)',
    selectedColumnId,
    selectedRowIndex
} = defineProps<Properties>();

defineSlots<{
    'cell-icon'?(properties: { columnId: string; row: T | undefined; rowIndex: number }): unknown; // Rendered before a cell's value. Its row is given too, for a cell that shows more of the row than its own value.
    'cell-value'?(properties: { columnId: string; rowIndex: number; value: unknown }): unknown; // Rendered in place of a cell's plain value. A cell where it renders nothing shows the plain value.
    'header-detail'?(properties: { columnId: string }): unknown; // Rendered below each column's label, in a taller header.
    'header-label'?(properties: { columnId: string }): unknown; // Rendered in place of each column's plain label, e.g. a button.
    'header-label-end'?(properties: { columnId: string }): unknown; // Rendered at the end of each column's label.
    'header-label-start'?(properties: { columnId: string }): unknown; // Rendered at the start of each column's label.
    'pinned-cell'?(properties: { columnId: string; rowIndex: number; value: unknown }): unknown; // Rendered in place of a left pinned cell's value, e.g. a button.
    'toolbar-end'?(): unknown; // Rendered at the right end of the toolbar, for actions on the whole table.
}>();

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

// One element scrolls both ways and drives both the row and the column virtualizers. It holds the header as sticky
// content, so the header never lags behind the columns as a separately scrolled header would.
const scrollElement = useTemplateRef<HTMLDivElement>('scroller');
const scrollElementId = useId();
const headerElement = useTemplateRef<HTMLDivElement>('header');
const { height: headerHeight } = useElementSize(headerElement, undefined, { box: 'border-box' });
const savedScrollLeft = ref(0); // Where the table was left, because a browser can reset a hidden element's scroll position.
const savedScrollTop = ref(0);
const verticalThumb = useTemplateRef<InstanceType<typeof ScrollThumb>>('verticalThumb');
const horizontalThumb = useTemplateRef<InstanceType<typeof ScrollThumb>>('horizontalThumb');

// ── State - Columns ──────────────────────────────────────────────────────────────────────────────────────────────────

const columnPinningStateMap = shallowRef<ColumnPinningState>({ start: pinnedColumnIds, end: [] });
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
    estimateSize: () => ROW_HEIGHT_PX,
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

const centerLeafHeaders = computed(() => (isCollapsedToPinned ? [] : table.getCenterLeafHeaders()));

// ── State - Columns (continued) ─────────────────────────────────────────────────────────────────────────────────────
// Constructed only now that centerLeafHeaders exists — see the note above table's declaration.

const columnVirtualizer = useVirtualizer({
    get count() {
        return columnVirtualisationIsRequired.value ? centerLeafHeaders.value.length : 0;
    },
    estimateSize: (index) => centerLeafHeaders.value[index]?.column.getSize() ?? 150,
    getScrollElement: () => scrollElement.value,
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
const totalWidth = computed(() => leftPinnedWidth.value + totalCenterWidth.value + rightPinnedWidth.value + EDGE_INSET_PX + END_INSET_PX);
// A table collapsed to its pinned columns beside a detail panel is a list, so its columns fill its width and it never
// scrolls sideways.
const contentMinWidth = computed(() => (isCollapsedToPinned ? '100%' : `${String(totalWidth.value)}px`));
const virtualColumns = computed(() => (columnVirtualisationIsRequired.value ? columnVirtualizer.value.getVirtualItems() : []));
// A column's detail covers the rows while a tab is selected, so a resize there would change nothing the user can see.
const columnResizeIsHidden = computed(() => isCollapsedToPinned || (isHeaderTabbed && selectedColumnId != null));

// ── Side Effects ─────────────────────────────────────────────────────────────────────────────────────────────────────

useEventListener(scrollElement, 'scroll', saveScroll, { passive: true });
useResizeObserver(scrollElement, restoreScroll);

// Only a change to which columns start hidden resets them, so a column the user showed stays shown as the rows load.
watch(
    () => hiddenColumnIds.join('\n'),
    () => {
        columnVisibilityStateMap.value = Object.fromEntries(hiddenColumnIds.map((columnId) => [columnId, false]));
    },
    { immediate: true }
);

// The column virtualizer keeps the widths it measured, so new starting widths need it to measure again.
watch(
    () => columnDefinitions,
    () => {
        if (columnVirtualisationIsRequired.value) columnVirtualizer.value.measure();
    }
);

// ── Event Handlers ───────────────────────────────────────────────────────────────────────────────────────────────────

function handleFitColumn(columnId: string): void {
    const column = table.getColumn(columnId);
    if (!isColumnFitToVisibleRows) {
        column?.resetSize();
        return;
    }
    const values = visibleRowData.value.map((row) => String(row?.[columnId] ?? ''));
    const fittedWidth = constructFittedColumnWidth(String(column?.columnDef.header), values, {
        headerExtraPx: (isColumnMenuHidden ? 0 : HEADER_MENU_WIDTH_PX) + (isHeaderTabbed ? HEADER_TAB_INSET_PX : 0)
    });
    table.setColumnSizing((columnSizing) => ({ ...columnSizing, [columnId]: fittedWidth }));
}

// ── Actions ──────────────────────────────────────────────────────────────────────────────────────────────────────────

// Scrolls sideways just far enough to show a chosen column, such as by a detail panel's Previous and Next or a click on
// a tabbed header. A column wider than the view shows from its start. A pinned column is always in view.
function scrollColumnIntoView(columnId: string): void {
    const scroller = scrollElement.value;
    const column = table.getColumn(columnId);
    if (!scroller || column?.getIsPinned() !== false) return;
    const columnStart = column.getStart('center');
    const columnEnd = columnStart + column.getSize();
    const visibleWidth = scroller.clientWidth - leftPinnedWidth.value - rightPinnedWidth.value - EDGE_INSET_PX - END_INSET_PX;
    if (columnStart < scroller.scrollLeft) scroller.scrollTo({ behavior: 'smooth', left: columnStart });
    else if (columnEnd > scroller.scrollLeft + visibleWidth) scroller.scrollTo({ behavior: 'smooth', left: Math.min(columnStart, columnEnd - visibleWidth) });
}

defineExpose({ scrollColumnIntoView });

// ── Scroll Handlers ──────────────────────────────────────────────────────────────────────────────────────────────────

// A hidden table has no size, and the position a browser gives it then is not the user's.
function saveScroll(): void {
    if (!scrollElement.value || scrollElement.value.clientWidth === 0) return;
    savedScrollLeft.value = scrollElement.value.scrollLeft;
    savedScrollTop.value = scrollElement.value.scrollTop;
}

// A table hidden with 'v-show' can come back with its scroll position reset, and no scroll event says so. The virtualizers
// would then keep drawing the rows and columns of the old position, off screen, and leave the table looking empty. Putting
// the position back fixes that, and keeps the user's place.
function restoreScroll(): void {
    if (!scrollElement.value || scrollElement.value.clientWidth === 0) return;
    scrollElement.value.scrollTop = savedScrollTop.value;
    scrollElement.value.scrollLeft = savedScrollLeft.value;
}

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

// A tabbed header's cell is the tab, padded in from its column so the gap either side, where the resize handle sits,
// shows the header row behind it.
function constructHeaderClass(columnId: string): string | undefined {
    if (isHeaderTabbed) return 'px-1 pt-1.5';
    return columnId === selectedColumnId ? 'state-selected' : undefined;
}
</script>

<template>
    <div class="relative flex h-full flex-col overflow-y-hidden" data-region="Table">
        <!-- Toolbar ─ 40px high, as the other toolbars on the data view screens are. Positioned, so a control in it can
             open over the whole row. -->
        <div v-if="!isColumnPickerHidden" class="relative flex h-10 flex-none items-center gap-x-3 border-b border-separator px-page text-xs">
            <!-- '-ml-2' cancels the button's padding, so its icon lines up with the page edge. -->
            <TableColumnPicker class="mr-auto -ml-2" :table="table" />
            <slot name="toolbar-end" />
        </div>

        <div :aria-label="label" class="relative flex min-h-0 flex-1 flex-col" role="table">
            <!-- Room at the end, as a grid's scroll area has, so the last rows can scroll up clear of a floating button. -->
            <div :id="scrollElementId" ref="scroller" class="min-h-0 flex-1 scrollbar-none overflow-auto overscroll-none" :style="{ paddingBottom: scrollAreaPaddingBottom }">
                <div :style="{ minWidth: contentMinWidth }">
                    <!-- Header ─ Sticky inside the one scroller, so the browser moves it sideways with the columns in the same frame
                     and keeps it at the top as the rows scroll. Above the rows, whose pinned cells are sticky too. -->
                    <div ref="header" class="sticky top-0 z-3" role="rowgroup">
                        <div
                            class="flex border-b bg-backdrop"
                            :class="[$slots['header-detail'] ? 'h-17' : 'h-10', isHeaderTabbed ? 'border-separator' : 'border-boundary']"
                            :style="{ minWidth: contentMinWidth }"
                            role="row"
                        >
                            <div class="shrink-0" :style="{ width: EDGE_INSET_PX + 'px' }" />

                            <!-- Left pinned headers -->
                            <div
                                v-for="leftLeafHeader in leftLeafHeaders"
                                :key="leftLeafHeader.id"
                                class="sticky bg-backdrop"
                                :class="[isCollapsedToPinned ? 'min-w-0 flex-1' : 'shrink-0 border-r border-boundary', constructHeaderClass(leftLeafHeader.column.id)]"
                                role="columnheader"
                                :style="{ left: leftLeafHeader.column.getStart('start') + 'px', width: isCollapsedToPinned ? undefined : leftLeafHeader.column.getSize() + 'px', zIndex: 2 }"
                            >
                                <TableHeaderCell
                                    :header="leftLeafHeader"
                                    :is-menu-hidden="isColumnMenuHidden"
                                    :is-resize-hidden="columnResizeIsHidden"
                                    :is-selected="leftLeafHeader.column.id === selectedColumnId"
                                    :is-tabbed="isHeaderTabbed"
                                    @fit-width="handleFitColumn(leftLeafHeader.column.id)"
                                >
                                    <template v-if="$slots['header-detail']" #detail><slot name="header-detail" :column-id="leftLeafHeader.column.id" /></template>
                                    <template v-if="$slots['header-label-end']" #label-end><slot name="header-label-end" :column-id="leftLeafHeader.column.id" /></template>
                                    <template v-if="$slots['header-label-start']" #label-start><slot name="header-label-start" :column-id="leftLeafHeader.column.id" /></template>
                                    <template v-if="$slots['header-label']" #label><slot name="header-label" :column-id="leftLeafHeader.column.id" /></template>
                                </TableHeaderCell>
                            </div>

                            <!-- Center headers: flat when below threshold, virtualised when above -->
                            <template v-if="!columnVirtualisationIsRequired">
                                <div
                                    v-for="centerLeafHeader in centerLeafHeaders"
                                    :key="centerLeafHeader.id"
                                    class="relative h-full shrink-0"
                                    :class="constructHeaderClass(centerLeafHeader.column.id)"
                                    role="columnheader"
                                    :style="{ width: centerLeafHeader.column.getSize() + 'px' }"
                                >
                                    <TableHeaderCell :header="centerLeafHeader" :is-menu-hidden="isColumnMenuHidden" :is-resize-hidden="columnResizeIsHidden" :is-selected="centerLeafHeader.column.id === selectedColumnId" :is-tabbed="isHeaderTabbed" @fit-width="handleFitColumn(centerLeafHeader.column.id)">
                                        <template v-if="$slots['header-detail']" #detail><slot name="header-detail" :column-id="centerLeafHeader.column.id" /></template>
                                        <template v-if="$slots['header-label-end']" #label-end><slot name="header-label-end" :column-id="centerLeafHeader.column.id" /></template>
                                        <template v-if="$slots['header-label-start']" #label-start><slot name="header-label-start" :column-id="centerLeafHeader.column.id" /></template>
                                        <template v-if="$slots['header-label']" #label><slot name="header-label" :column-id="centerLeafHeader.column.id" /></template>
                                    </TableHeaderCell>
                                </div>
                            </template>

                            <div v-else class="relative shrink-0" :style="{ width: totalCenterWidth + 'px' }">
                                <div
                                    v-for="virtualColumn in virtualColumns"
                                    :key="virtualColumn.index"
                                    class="absolute top-0 h-full"
                                    :class="constructHeaderClass(centerLeafHeaders[virtualColumn.index]!.column.id)"
                                    role="columnheader"
                                    :style="{ left: virtualColumn.start + 'px', width: virtualColumn.size + 'px' }"
                                >
                                    <TableHeaderCell
                                        :header="centerLeafHeaders[virtualColumn.index]!"
                                        :is-menu-hidden="isColumnMenuHidden"
                                        :is-resize-hidden="columnResizeIsHidden"
                                        :is-selected="centerLeafHeaders[virtualColumn.index]!.column.id === selectedColumnId"
                                        :is-tabbed="isHeaderTabbed"
                                        @fit-width="handleFitColumn(centerLeafHeaders[virtualColumn.index]!.column.id)"
                                    >
                                        <template v-if="$slots['header-detail']" #detail
                                            ><slot name="header-detail" :column-id="centerLeafHeaders[virtualColumn.index]!.column.id"
                                        /></template>
                                        <template v-if="$slots['header-label-end']" #label-end
                                            ><slot name="header-label-end" :column-id="centerLeafHeaders[virtualColumn.index]!.column.id"
                                        /></template>
                                        <template v-if="$slots['header-label-start']" #label-start><slot name="header-label-start" :column-id="centerLeafHeaders[virtualColumn.index]!.column.id" /></template>
                                        <template v-if="$slots['header-label']" #label><slot name="header-label" :column-id="centerLeafHeaders[virtualColumn.index]!.column.id" /></template>
                                    </TableHeaderCell>
                                </div>
                            </div>

                            <!-- Right pinned headers -->
                            <div
                                v-for="rightLeafHeader in rightLeafHeaders"
                                :key="rightLeafHeader.id"
                                class="sticky shrink-0 border-l border-boundary bg-backdrop"
                                :class="constructHeaderClass(rightLeafHeader.column.id)"
                                role="columnheader"
                                :style="{ right: rightLeafHeader.column.getAfter('end') + 'px', width: rightLeafHeader.column.getSize() + 'px', zIndex: 2 }"
                            >
                                <TableHeaderCell :header="rightLeafHeader" :is-menu-hidden="isColumnMenuHidden" :is-resize-hidden="columnResizeIsHidden" :is-selected="rightLeafHeader.column.id === selectedColumnId" :is-tabbed="isHeaderTabbed" @fit-width="handleFitColumn(rightLeafHeader.column.id)">
                                    <template v-if="$slots['header-detail']" #detail><slot name="header-detail" :column-id="rightLeafHeader.column.id" /></template>
                                    <template v-if="$slots['header-label-end']" #label-end><slot name="header-label-end" :column-id="rightLeafHeader.column.id" /></template>
                                    <template v-if="$slots['header-label-start']" #label-start><slot name="header-label-start" :column-id="rightLeafHeader.column.id" /></template>
                                    <template v-if="$slots['header-label']" #label><slot name="header-label" :column-id="rightLeafHeader.column.id" /></template>
                                </TableHeaderCell>
                            </div>

                            <div v-if="!isCollapsedToPinned" class="shrink-0" :style="{ width: END_INSET_PX + 'px' }" />
                        </div>
                    </div>

                    <!-- Virtual rows spacer -->
                    <div class="relative" role="rowgroup" :style="{ height: totalSize + 'px' }">
                        <div
                            v-for="(vRow, i) in virtualRows"
                            :key="vRow.index"
                            class="group absolute top-0 flex border-b border-boundary bg-surface"
                            role="row"
                            :style="{ transform: `translateY(${vRow.start}px)`, height: vRow.size + 'px', minWidth: contentMinWidth, width: '100%' }"
                        >
                            <div class="shrink-0" :style="{ width: EDGE_INSET_PX + 'px' }" />

                            <!-- Left pinned cells -->
                            <TableCell
                                v-for="leftLeafHeader in leftLeafHeaders"
                                :key="leftLeafHeader.id"
                                :value="visibleRowData[i]?.[leftLeafHeader.column.id]"
                                :loading="visibleRowData[i] === undefined"
                                class="sticky bg-surface group-hover:bg-card"
                                :class="[
                                    isCollapsedToPinned ? 'min-w-0 flex-1' : 'shrink-0 border-r border-boundary',
                                    { 'state-selected': vRow.index === selectedRowIndex },
                                    constructCellClass?.(leftLeafHeader.column.id, vRow.index)
                                ]"
                                :title="constructCellTitle?.(leftLeafHeader.column.id, vRow.index)"
                                :style="{ left: leftLeafHeader.column.getStart('start') + 'px', width: isCollapsedToPinned ? undefined : leftLeafHeader.column.getSize() + 'px', zIndex: 1 }"
                            >
                                <template v-if="$slots['pinned-cell']" #value
                                    ><slot
                                        name="pinned-cell"
                                        :column-id="leftLeafHeader.column.id"
                                        :row-index="vRow.index"
                                        :value="visibleRowData[i]?.[leftLeafHeader.column.id]"
                                /></template>
                                <template v-else-if="$slots['cell-value']" #value
                                    ><slot name="cell-value" :column-id="leftLeafHeader.column.id" :row-index="vRow.index" :value="visibleRowData[i]?.[leftLeafHeader.column.id]"
                                /></template>
                                <template v-if="$slots['cell-icon']" #icon
                                    ><slot name="cell-icon" :column-id="leftLeafHeader.column.id" :row="visibleRowData[i]" :row-index="vRow.index"
                                /></template>
                            </TableCell>

                            <!-- Center cells: flat when below threshold, virtualised when above -->
                            <template v-if="!columnVirtualisationIsRequired">
                                <TableCell
                                    v-for="centerLeafHeader in centerLeafHeaders"
                                    :key="centerLeafHeader.id"
                                    :value="visibleRowData[i]?.[centerLeafHeader.column.id]"
                                    :loading="visibleRowData[i] === undefined"
                                    class="relative shrink-0"
                                    :class="constructCellClass?.(centerLeafHeader.column.id, vRow.index)"
                                    :title="constructCellTitle?.(centerLeafHeader.column.id, vRow.index)"
                                    :style="{ width: centerLeafHeader.column.getSize() + 'px' }"
                                >
                                    <template v-if="$slots['cell-value']" #value
                                        ><slot name="cell-value" :column-id="centerLeafHeader.column.id" :row-index="vRow.index" :value="visibleRowData[i]?.[centerLeafHeader.column.id]"
                                    /></template>
                                    <template v-if="$slots['cell-icon']" #icon
                                        ><slot name="cell-icon" :column-id="centerLeafHeader.column.id" :row="visibleRowData[i]" :row-index="vRow.index"
                                    /></template>
                                </TableCell>
                            </template>

                            <div v-else class="relative shrink-0 group-hover:bg-card" :style="{ width: totalCenterWidth + 'px' }">
                                <TableCell
                                    v-for="virtualColumn in virtualColumns"
                                    :key="virtualColumn.index"
                                    :value="visibleRowData[i]?.[centerLeafHeaders[virtualColumn.index]!.column.id]"
                                    :loading="visibleRowData[i] === undefined"
                                    class="absolute top-0 h-full"
                                    :class="constructCellClass?.(centerLeafHeaders[virtualColumn.index]!.column.id, vRow.index)"
                                    :title="constructCellTitle?.(centerLeafHeaders[virtualColumn.index]!.column.id, vRow.index)"
                                    :style="{ left: virtualColumn.start + 'px', width: virtualColumn.size + 'px' }"
                                >
                                    <template v-if="$slots['cell-value']" #value
                                        ><slot
                                            name="cell-value"
                                            :column-id="centerLeafHeaders[virtualColumn.index]!.column.id"
                                            :row-index="vRow.index"
                                            :value="visibleRowData[i]?.[centerLeafHeaders[virtualColumn.index]!.column.id]"
                                    /></template>
                                    <template v-if="$slots['cell-icon']" #icon
                                        ><slot name="cell-icon" :column-id="centerLeafHeaders[virtualColumn.index]!.column.id" :row="visibleRowData[i]" :row-index="vRow.index"
                                    /></template>
                                </TableCell>
                            </div>

                            <!-- Right pinned cells -->
                            <TableCell
                                v-for="rightLeafHeader in rightLeafHeaders"
                                :key="rightLeafHeader.id"
                                :value="visibleRowData[i]?.[rightLeafHeader.column.id]"
                                :loading="visibleRowData[i] === undefined"
                                class="sticky shrink-0 border-l border-boundary bg-surface group-hover:bg-card"
                                :style="{ right: rightLeafHeader.column.getAfter('end') + 'px', width: rightLeafHeader.column.getSize() + 'px', zIndex: 1 }"
                            >
                                <template v-if="$slots['cell-value']" #value
                                    ><slot name="cell-value" :column-id="rightLeafHeader.column.id" :row-index="vRow.index" :value="visibleRowData[i]?.[rightLeafHeader.column.id]"
                                /></template>
                                <template v-if="$slots['cell-icon']" #icon
                                    ><slot name="cell-icon" :column-id="rightLeafHeader.column.id" :row="visibleRowData[i]" :row-index="vRow.index"
                                /></template>
                            </TableCell>

                            <div v-if="!isCollapsedToPinned" class="shrink-0" :style="{ width: END_INSET_PX + 'px' }" />
                        </div>
                    </div>
                </div>
            </div>

            <!-- Vertical Scroll Thumb ─ Starts below the header, because the header never scrolls out of view. -->
            <ScrollThumb
                ref="verticalThumb"
                orientation="vertical"
                :scroll-element="scrollElement"
                :cross-inset-end="horizontalThumb?.visible ? SCROLL_THUMB_CROSS_INSET : 0"
                :inset-start="headerHeight"
            />
            <ScrollThumb
                ref="horizontalThumb"
                orientation="horizontal"
                :scroll-element="scrollElement"
                :cross-inset-end="verticalThumb?.visible ? SCROLL_THUMB_CROSS_INSET : 0"
            />

            <TableResizeLine :scroll-element="scrollElement" :table="table" />
        </div>
    </div>
</template>
