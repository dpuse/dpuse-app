// External Dependencies
import { computed, type ComputedRef, type Ref, ref, watch } from 'vue';
import { useVirtualizer, type VirtualItem } from '@tanstack/vue-virtual';

// Types
export type DataSource = { rowCount: number; getRows: (startRow: number, endRow: number) => Promise<unknown[]> };

type Options = {
    scrollElement: Ref<HTMLElement | null>;
    dataSource: () => DataSource;
    count?: () => number; // Virtual row count. Defaults to dataSource().rowCount (1 virtual row per data row).
    getDataIndexes?: (virtualRowIndex: number) => number[]; // Maps a virtual row index to data row indexes for block fetching. Defaults to identity (1:1).
    cacheBlockSize?: () => number;
    maxBlocksInCache?: () => number;
    estimateSize?: () => number;
};

type DataWindow = {
    virtualRows: ComputedRef<VirtualItem[]>;
    totalRowCount: ComputedRef<number>;
    visibleRowData: ComputedRef<(Record<string, unknown> | undefined)[]>;
    getRow: (dataIndex: number) => Record<string, unknown> | undefined;
};

// Composable ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export function useDataWindow({
    scrollElement,
    dataSource,
    count,
    getDataIndexes,
    cacheBlockSize = (): number => 100,
    maxBlocksInCache = (): number => 10,
    estimateSize = (): number => 48
}: Options): DataWindow {
    // Data Block Cache ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    const blockCacheMap = new Map<number, unknown[]>(); // Plain (non-reactive) Map so Vue never traverses its internals during render.
    const blockCacheVersion = ref(0); // Re-renders are triggered only by `blockCacheVersion`, incremented once per fetch result.
    const blockLruOrder: number[] = []; // Index 0 contains the block index of the least recently used (oldest) block.
    const blockPendingSet = new Set<number>();
    let fetchGeneration = 0; // Incremented on dataSource change; in-flight responses from prior generations are discarded.

    // When the data source is swapped, stale blocks must be purged immediately. In-flight fetches from the
    // prior source are identified by their generation snapshot and silently dropped when they resolve.
    watch(
        dataSource,
        () => {
            fetchGeneration++;
            blockCacheMap.clear();
            blockLruOrder.length = 0;
            blockPendingSet.clear();
            blockCacheVersion.value++;
        },
        { flush: 'sync' }
    );

    function getBlockIndex(rowIndex: number): number {
        return Math.floor(rowIndex / cacheBlockSize());
    }

    function recordBlockAccessed(blockIndex: number): void {
        const position = blockLruOrder.indexOf(blockIndex);
        if (position !== -1) blockLruOrder.splice(position, 1);
        blockLruOrder.push(blockIndex);
    }

    // Fetch the block if not cached. If already cached, update LRU order so the block is not evicted
    // while it is still in the viewport.
    function fetchBlock(blockIndex: number): void {
        if (blockCacheMap.has(blockIndex)) {
            recordBlockAccessed(blockIndex);
            return;
        }
        if (blockPendingSet.has(blockIndex)) return;
        blockPendingSet.add(blockIndex);
        const start = blockIndex * cacheBlockSize();
        const end = Math.min(start + cacheBlockSize(), dataSource().rowCount);
        const generation = fetchGeneration;
        dataSource()
            .getRows(start, end)
            .then((rows) => {
                if (generation !== fetchGeneration) return; // DataSource changed while this fetch was in-flight; discard.
                while (blockCacheMap.size >= maxBlocksInCache()) {
                    const evict = blockLruOrder.shift();
                    if (evict === undefined) break;
                    blockCacheMap.delete(evict);
                }
                blockCacheMap.set(blockIndex, rows);
                recordBlockAccessed(blockIndex);
                blockCacheVersion.value++;
            })
            .catch((error) => console.error(`[dpuse-app] useDataWindow failed to fetch block ${blockIndex}:`, error))
            .finally(() => blockPendingSet.delete(blockIndex));
    }

    // Look up a data row by its flat data index. Returns undefined while the block is loading.
    // Touches blockCacheVersion so any reactive context (computed or template) re-evaluates on fetch completion.
    function getRow(dataIndex: number): Record<string, unknown> | undefined {
        if (dataIndex >= dataSource().rowCount) return undefined;
        void blockCacheVersion.value;
        const blockIndex = getBlockIndex(dataIndex);
        const block = blockCacheMap.get(blockIndex);
        return block ? (block[dataIndex % cacheBlockSize()] as Record<string, unknown>) : undefined;
    }

    // Virtualizer ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    const virtualizer = useVirtualizer({
        get count() {
            return count ? count() : dataSource().rowCount;
        },
        getScrollElement: () => scrollElement.value,
        estimateSize: () => estimateSize(),
        overscan: 5
    });

    // Derived State ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    const virtualRows = computed(() => virtualizer.value.getVirtualItems());
    const totalRowCount = computed(() => virtualizer.value.getTotalSize());
    const visibleRowData = computed(() => {
        void blockCacheVersion.value; // Only recomputes when `virtualRows` or `blockCacheVersion` changes — never on resize.
        return virtualRows.value.map((virtualRow) => getRow(virtualRow.index));
    });

    // Side Effects ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    // Fetch blocks for all data items in the current viewport. fetchBlock also updates LRU for cached blocks.
    // getDataIndexes maps a virtual row index to one or more data indexes (default 1:1; Grid passes N:1).
    watch(virtualRows, (items) => {
        const requiredBlockIndexes = new Set<number>();
        for (const item of items) {
            const dataIndexes = getDataIndexes ? getDataIndexes(item.index) : [item.index];
            for (const dataIndex of dataIndexes) {
                if (dataIndex < dataSource().rowCount) {
                    requiredBlockIndexes.add(getBlockIndex(dataIndex));
                }
            }
        }
        for (const blockIndex of requiredBlockIndexes) {
            fetchBlock(blockIndex);
        }
    });

    return { virtualRows, totalRowCount, visibleRowData, getRow };
}
