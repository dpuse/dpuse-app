<script setup lang="ts">
// External Dependencies
import { createColumnHelper, getCoreRowModel, useVueTable, type ColumnSizingState } from '@tanstack/vue-table';
import { useVirtualizer } from '@tanstack/vue-virtual';
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';

// Types ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export type GridColumnDef = {
    field: string;
    headerName?: string;
    width?: number;
    flex?: number;
};

export type GridDatasource = {
    rowCount: number;
    getRows: (startRow: number, endRow: number) => Promise<unknown[]>;
};

// Properties ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

type Properties = {
    columnDefs: GridColumnDef[];
    datasource: GridDatasource;
};
const { columnDefs, datasource } = defineProps<Properties>();

// Column sizing ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const containerElement = ref<HTMLDivElement | null>(null);
const containerWidth = ref(0);

/** Calculates initial pixel width for each column, distributing remaining space across flex cols */
const initialColumnSizing = computed<ColumnSizingState>(() => {
    const totalFixed = columnDefs.filter((c) => c.width !== undefined).reduce((sum, c) => sum + (c.width ?? 0), 0);
    const totalFlex = columnDefs.filter((c) => c.flex !== undefined).reduce((sum, c) => sum + (c.flex ?? 1), 0);
    const flexSpace = Math.max(0, (containerWidth.value || 600) - totalFixed);

    return Object.fromEntries(
        columnDefs.map((c) => {
            const px = c.width !== undefined ? c.width : ((c.flex ?? 1) / totalFlex) * flexSpace;
            return [c.field, px];
        })
    );
});

const columnSizing = ref<ColumnSizingState>({});

const containerObserver = new ResizeObserver(([entry]) => {
    const newWidth = entry.contentRect.width;
    if (newWidth === containerWidth.value) return;
    containerWidth.value = newWidth;
    // Only reset flex columns when container resizes; preserve user-dragged fixed columns.
    const totalFixed = columnDefs.filter((c) => c.width !== undefined).reduce((sum, c) => sum + (c.width ?? 0), 0);
    const totalFlex = columnDefs.filter((c) => c.flex !== undefined).reduce((sum, c) => sum + (c.flex ?? 1), 0);
    const flexSpace = Math.max(0, newWidth - totalFixed);

    columnSizing.value = {
        ...columnSizing.value,
        ...Object.fromEntries(columnDefs.filter((c) => c.flex !== undefined).map((c) => [c.field, ((c.flex ?? 1) / totalFlex) * flexSpace]))
    };
});

// TanStack Table (header + column resize only) ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const columnHelper = createColumnHelper<Record<string, unknown>>();

const tableColumns = computed(() =>
    columnDefs.map((c) =>
        columnHelper.accessor(c.field, {
            id: c.field,
            header: c.headerName ?? c.field,
            size: initialColumnSizing.value[c.field] ?? 150,
            minSize: 40,
            enableResizing: true
        })
    )
);

const table = useVueTable({
    get data() {
        return [];
    },
    get columns() {
        return tableColumns.value;
    },
    getCoreRowModel: getCoreRowModel(),
    columnResizeMode: 'onChange',
    get state() {
        return { columnSizing: columnSizing.value };
    },
    onColumnSizingChange: (updater) => {
        columnSizing.value = typeof updater === 'function' ? updater(columnSizing.value) : updater;
    }
});

// Block cache & infinite scroll ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const BLOCK_SIZE = 100;
const blockCache = ref(new Map<number, unknown[]>());
const inFlight = new Set<number>();

function blockIndexForRow(rowIndex: number): number {
    return Math.floor(rowIndex / BLOCK_SIZE);
}

function fetchBlock(blockIndex: number): void {
    if (blockCache.value.has(blockIndex) || inFlight.has(blockIndex)) return;
    inFlight.add(blockIndex);
    const startRow = blockIndex * BLOCK_SIZE;
    const endRow = Math.min(startRow + BLOCK_SIZE, datasource.rowCount);
    datasource
        .getRows(startRow, endRow)
        .then((rows) => {
            const next = new Map(blockCache.value);
            next.set(blockIndex, rows);
            blockCache.value = next;
        })
        .finally(() => {
            inFlight.delete(blockIndex);
        });
}

function getRowData(rowIndex: number): Record<string, unknown> | undefined {
    const block = blockCache.value.get(blockIndexForRow(rowIndex));
    if (!block) return undefined;
    return block[rowIndex % BLOCK_SIZE] as Record<string, unknown>;
}

// Virtualizer ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const scrollElement = ref<HTMLDivElement | null>(null);

const virtualizer = useVirtualizer({
    get count() {
        return datasource.rowCount;
    },
    getScrollElement: () => scrollElement.value,
    estimateSize: () => 48,
    overscan: 5
});

const virtualItems = computed(() => virtualizer.value.getVirtualItems());
const totalSize = computed(() => virtualizer.value.getTotalSize());

/** Whenever the visible virtual items change, fetch any uncached blocks they cover. */
watch(virtualItems, (items) => {
    const needed = new Set(items.map((item) => blockIndexForRow(item.index)));
    for (const blockIndex of needed) {
        fetchBlock(blockIndex);
    }
});

// Lifecycle ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

onMounted(() => {
    if (containerElement.value) {
        containerObserver.observe(containerElement.value);
    }
    // Seed column sizing once we have a measured width
    watch(
        containerWidth,
        (w) => {
            if (w > 0 && Object.keys(columnSizing.value).length === 0) {
                columnSizing.value = { ...initialColumnSizing.value };
            }
        },
        { immediate: true }
    );
});

onUnmounted(() => {
    containerObserver.disconnect();
});
</script>

<template>
    <div ref="containerElement" class="flex h-full flex-col overflow-hidden">
        <!-- Header ─────────────────────────────────────────────────────────────────────────── -->
        <div class="flex shrink-0 border-b border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900" style="height: 40px">
            <div
                v-for="header in table.getFlatHeaders()"
                :key="header.id"
                class="relative flex items-center overflow-hidden px-3 text-xs font-medium tracking-wide text-zinc-500 uppercase select-none dark:text-zinc-400"
                :style="{ width: header.getSize() + 'px', flexShrink: 0 }"
            >
                <span class="truncate">{{ header.column.columnDef.header as string }}</span>

                <!-- Resize handle -->
                <div
                    v-if="header.column.getCanResize()"
                    class="absolute top-0 right-0 z-10 h-full w-1 cursor-col-resize touch-none opacity-0 transition-opacity select-none hover:opacity-100 active:opacity-100"
                    :class="header.column.getIsResizing() ? 'bg-zinc-400 opacity-100 dark:bg-zinc-500' : 'bg-zinc-300 dark:bg-zinc-600'"
                    @pointerdown="header.getResizeHandler()($event)"
                />
            </div>
        </div>

        <!-- Scroll body ─────────────────────────────────────────────────────────────────────── -->
        <div ref="scrollElement" class="flex-1 overflow-auto" style="overscroll-behavior: none; -webkit-overflow-scrolling: touch">
            <!-- Total height spacer -->
            <div :style="{ height: totalSize + 'px', position: 'relative' }">
                <!-- Virtual rows -->
                <div
                    v-for="vRow in virtualItems"
                    :key="vRow.index"
                    class="absolute flex w-full border-b border-zinc-100 bg-white hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:bg-zinc-900"
                    :style="{ top: vRow.start + 'px', height: vRow.size + 'px' }"
                >
                    <template v-if="getRowData(vRow.index) !== undefined">
                        <!-- Data cells -->
                        <div
                            v-for="header in table.getFlatHeaders()"
                            :key="header.id"
                            class="flex items-center overflow-hidden px-3 text-sm text-zinc-800 dark:text-zinc-300"
                            :style="{ width: header.getSize() + 'px', flexShrink: 0 }"
                        >
                            <span class="truncate">{{ getRowData(vRow.index)?.[header.column.id] ?? '' }}</span>
                        </div>
                    </template>

                    <template v-else>
                        <!-- Skeleton cells -->
                        <div v-for="header in table.getFlatHeaders()" :key="header.id" class="flex items-center px-3" :style="{ width: header.getSize() + 'px', flexShrink: 0 }">
                            <div class="h-4 w-3/4 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" />
                        </div>
                    </template>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
/* Force scrollbars to be visible on iOS (Safari hides them by default) */
div[style*='-webkit-overflow-scrolling']::-webkit-scrollbar {
    -webkit-appearance: none;
    width: 7px;
    height: 7px;
}

div[style*='-webkit-overflow-scrolling']::-webkit-scrollbar-thumb {
    border-radius: 4px;
    background-color: rgba(0, 0, 0, 0.3);
}
</style>
