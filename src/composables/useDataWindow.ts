// ── External Dependencies & Registrations
import { computed, type ComputedRef, ref, type ShallowRef, watch } from 'vue';
import { useVirtualizer, type VirtualItem } from '@tanstack/vue-virtual';

// ── Types ────────────────────────────────────────────────────────────────────────────────────────────────────────────

export type DataSource<T = unknown> = { id?: string; rowCount: number; getRows: (startRow: number, endRow: number) => Promise<T[]> };

type Options<T> = {
    scrollElement: Readonly<ShallowRef<HTMLElement | null>>;
    dataSource: () => DataSource<T>;
    count?: () => number; // Virtual row count. Defaults to dataSource().rowCount (1 virtual row per data row).
    getDataIndexes?: (virtualRowIndex: number) => number[]; // Maps a virtual row index to data row indexes for block fetching. Defaults to identity (1:1).
    cacheBlockSize?: () => number;
    maxBlocksInCache?: () => number;
    estimateSize?: () => number;
};

type DataWindow<T> = {
    virtualRows: ComputedRef<VirtualItem[]>;
    totalSize: ComputedRef<number>;
    visibleRowData: ComputedRef<(T | undefined)[]>;
    getRow: (dataIndex: number) => T | undefined;
};

// ── Composables ──────────────────────────────────────────────────────────────────────────────────────────────────────

export function useDataWindow<T>({
    scrollElement,
    dataSource,
    count,
    getDataIndexes,
    cacheBlockSize = (): number => 100,
    maxBlocksInCache = (): number => 10,
    estimateSize = (): number => 48
}: Options<T>): DataWindow<T> {
    // Data Block Cache: Local State ───────────────────────────────────────────────────────────────────────────────────

    const blockCacheMap = new Map<number, unknown[]>(); // Plain (non-reactive) Map so Vue never traverses its internals during render.
    const blockCacheVersion = ref(0); // Re-renders are triggered only by `blockCacheVersion`, incremented once per fetch result.
    const blockLruOrder: number[] = []; // Index 0 contains the block index of the least recently used (oldest) block.
    const blockPendingSet = new Set<number>();
    let fetchGeneration = 0; // Incremented on dataSource change; in-flight responses from prior generations are discarded.

    // Data Block Cache: Side Effects ──────────────────────────────────────────────────────────────────────────────────

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
            fetchVisibleBlocks(virtualizer.value.getVirtualItems());
        },
        { flush: 'sync' }
    );

    // Row Virtualizer: Local State ────────────────────────────────────────────────────────────────────────────────────

    const virtualizer = useVirtualizer({
        get count() {
            return count ? count() : dataSource().rowCount;
        },
        getScrollElement: () => scrollElement.value,
        estimateSize: () => estimateSize(),
        overscan: 5
    });

    // Row Virtualizer: Derived State ──────────────────────────────────────────────────────────────────────────────────

    const virtualRows = computed(() => virtualizer.value.getVirtualItems());
    const totalSize = computed(() => virtualizer.value.getTotalSize());
    const visibleRowData = computed((): T[] => {
        void blockCacheVersion.value; // Only recomputes when `virtualRows` or `blockCacheVersion` changes — never on resize.
        return virtualRows.value.map((virtualRow) => getRow(virtualRow.index)) as T[];
    });

    // Row Virtualizer: Side Effects ───────────────────────────────────────────────────────────────────────────────────

    // Fetch blocks for all data items in the current viewport. fetchBlock also updates LRU for cached blocks.
    // getDataIndexes maps a virtual row index to one or more data indexes (default 1:1; Grid passes N:1).
    watch(virtualRows, fetchVisibleBlocks);

    // Row Virtualizer: Helpers ────────────────────────────────────────────────────────────────────────────────────────

    function fetchVisibleBlocks(items: VirtualItem[]): void {
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

    function getBlockIndex(rowIndex: number): number {
        return Math.floor(rowIndex / cacheBlockSize());
    }

    // Look up a data row by its flat data index. Returns undefined while the block is loading.
    // Touches blockCacheVersion so any reactive context (computed or template) re-evaluates on fetch completion.
    function getRow(dataIndex: number): T | undefined {
        if (dataIndex >= dataSource().rowCount) return undefined;
        void blockCacheVersion.value;
        const blockIndex = getBlockIndex(dataIndex);
        const block = blockCacheMap.get(blockIndex);
        return block ? (block[dataIndex % cacheBlockSize()] as T) : undefined;
    }

    function recordBlockAccessed(blockIndex: number): void {
        const position = blockLruOrder.indexOf(blockIndex);
        if (position !== -1) blockLruOrder.splice(position, 1);
        blockLruOrder.push(blockIndex);
    }

    return { virtualRows, totalSize, visibleRowData, getRow };
}
