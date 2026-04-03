// External Dependencies
import { useVirtualizer } from '@tanstack/vue-virtual';
import { computed, type Ref, ref, watch } from 'vue';

// Types
export type DataSource = { rowCount: number; getRows: (startRow: number, endRow: number) => Promise<unknown[]> };

type Options = {
    scrollElement: Ref<HTMLElement | null>;
    dataSource: () => DataSource;
    cacheBlockSize?: () => number;
    maxBlocksInCache?: () => number;
    estimateSize?: () => number;
};

export function useLazyRows({ scrollElement, dataSource, cacheBlockSize = (): number => 100, maxBlocksInCache = (): number => 10, estimateSize = (): number => 48 }: Options) {
    // Data Block Cache ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    const blockCacheMap = new Map<number, unknown[]>(); // Plain (non-reactive) Map so Vue never traverses its internals during render.
    const blockCacheVersion = ref(0); // Re-renders are triggered only by `blockCacheVersion`, incremented once per fetch result.
    const blockLeastRecentlyUsedOrder: number[] = []; // Index 0 contains the block index of the least recently used (oldest) block.
    const blockPendingFetchIndexSet = new Set<number>();
    let fetchGeneration = 0; // Incremented on dataSource change; in-flight responses from prior generations are discarded.

    // Virtualizer ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    const virtualizer = useVirtualizer({
        get count() {
            return dataSource().rowCount;
        },
        getScrollElement: () => scrollElement.value,
        estimateSize: () => estimateSize(),
        overscan: 5
    });

    // Derived State ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    const virtualRows = computed(() => virtualizer.value.getVirtualItems());
    const totalRowSize = computed(() => virtualizer.value.getTotalSize());
    const visibleRowData = computed(() => {
        void blockCacheVersion.value; // Only recomputes when `virtualRows` or `blockCacheVersion` changes — never on resize.
        return virtualRows.value.map((virtualRow) => {
            const blockIndex = getBlockIndex(virtualRow.index);
            const block = blockCacheMap.get(blockIndex);
            return block ? (block[virtualRow.index % cacheBlockSize()] as Record<string, unknown>) : undefined;
        });
    });

    // Side Effects ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    // When the data source is swapped, stale blocks must be purged immediately. In-flight fetches from the
    // prior source are identified by their generation snapshot and silently dropped when they resolve.
    watch(
        dataSource,
        () => {
            fetchGeneration++;
            blockCacheMap.clear();
            blockLeastRecentlyUsedOrder.length = 0;
            blockPendingFetchIndexSet.clear();
            blockCacheVersion.value++;
        },
        { flush: 'sync' }
    );

    watch(virtualRows, (items) => {
        const requiredBlockIndexes = new Set(items.map((item) => getBlockIndex(item.index)));
        for (const blockIndex of requiredBlockIndexes) {
            if (blockCacheMap.has(blockIndex)) recordBlockAccessed(blockIndex);
            fetchBlock(blockIndex);
        }
    });

    // Helpers ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    function fetchBlock(blockIndex: number): void {
        if (blockCacheMap.has(blockIndex) || blockPendingFetchIndexSet.has(blockIndex)) return;
        blockPendingFetchIndexSet.add(blockIndex);
        const start = blockIndex * cacheBlockSize();
        const end = Math.min(start + cacheBlockSize(), dataSource().rowCount);
        const generation = fetchGeneration;
        dataSource()
            .getRows(start, end)
            .then((rows) => {
                if (generation !== fetchGeneration) return; // DataSource changed while this fetch was in-flight; discard.
                while (blockCacheMap.size >= maxBlocksInCache()) {
                    const evictBlockIndex = blockLeastRecentlyUsedOrder.shift();
                    if (evictBlockIndex === undefined) break;
                    blockCacheMap.delete(evictBlockIndex);
                }
                blockCacheMap.set(blockIndex, rows);
                recordBlockAccessed(blockIndex);
                blockCacheVersion.value++;
            })
            .catch((error) => console.error(`[dpuse-app] useLazyRows failed to fetch block ${blockIndex}:`, error))
            .finally(() => blockPendingFetchIndexSet.delete(blockIndex));
    }

    function getBlockIndex(rowIndex: number): number {
        return Math.floor(rowIndex / cacheBlockSize());
    }

    function recordBlockAccessed(blockIndex: number): void {
        const position = blockLeastRecentlyUsedOrder.indexOf(blockIndex);
        if (position !== -1) blockLeastRecentlyUsedOrder.splice(position, 1);
        blockLeastRecentlyUsedOrder.push(blockIndex);
    }

    return { virtualRows, totalRowSize, visibleRowData };
}
