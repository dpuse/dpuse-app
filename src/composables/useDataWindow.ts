// ── External Dependencies & Registrations
import { computed, type ComputedRef, ref, type ShallowRef, watch } from 'vue';
import { useVirtualizer, type VirtualItem } from '@tanstack/vue-virtual';

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

// Rows fetched per block by default, and the render-time guess used while a source's count is still unknown — see
// the virtualizer `count` getter below for why a render guess (not 0) is needed even before any row is confirmed.
export const DEFAULT_CACHE_BLOCK_SIZE = 100;

// ── Types ────────────────────────────────────────────────────────────────────────────────────────────────────────────

export type DataSource<T = unknown> = {
    id?: string;
    rowCount: number | undefined; // Caller's best-known count, or undefined if not yet known — distinct from 0 (genuinely empty). useDataWindow guarantees an initial fetch to discover the real total via getRows' totalCount.
    getRows: (startRow: number, endRow: number) => Promise<{ rows: T[]; totalCount?: number }>;
};

type Options<T> = {
    scrollElement: Readonly<ShallowRef<HTMLElement | null>>;
    dataSource: () => DataSource<T>;
    count?: () => number; // Virtual row count override — e.g. Grid divides by column count for its N-per-row layout.
    // When `count` is provided, the caller owns row-count math and needs the self-corrected total to build its own
    // override from (rather than the caller's static placeholder) — this reports it as it changes.
    onRowCountChange?: (rowCount: number) => void;
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
    rowCount: ComputedRef<number>; // Self-corrected count, matching the virtualizer's own render count (a block-sized guess while unknown, never 0-while-unknown) — prefer this over dataSource().rowCount.
};

// ── Composables ──────────────────────────────────────────────────────────────────────────────────────────────────────

export function useDataWindow<T>({
    scrollElement,
    dataSource,
    count,
    onRowCountChange,
    getDataIndexes,
    cacheBlockSize = (): number => DEFAULT_CACHE_BLOCK_SIZE,
    maxBlocksInCache = (): number => 10,
    estimateSize = (): number => 48
}: Options<T>): DataWindow<T> {
    // Data Block Cache: Local State ───────────────────────────────────────────────────────────────────────────────────

    const blockCacheMap = new Map<number, unknown[]>(); // Plain (non-reactive) Map so Vue never traverses its internals during render.
    const blockCacheVersion = ref(0); // Re-renders are triggered only by `blockCacheVersion`, incremented once per fetch result.
    const blockLruOrder: number[] = []; // Index 0 contains the block index of the least recently used (oldest) block.
    const blockPendingSet = new Set<number>();
    let fetchGeneration = 0; // Incremented on dataSource change; in-flight responses from prior generations are discarded.
    const knownRowCount = ref<number | undefined>(dataSource().rowCount); // Self-corrects from getRows' totalCount once a fetch resolves.

    // Update the self-corrected count and notify a `count`-override caller (e.g. Grid) that owns its own row-count
    // math and can't read `knownRowCount` directly, since it must supply its `count` callback before this composable
    // (and its self-correction) exists. Reported as cacheBlockSize() while still unknown — matching the virtualizer's
    // own render-time fallback above, so a `count`-override caller's rendering stays consistent with this
    // composable's internal one (both need "guess a block, not 0" for the same reason: skeleton rows need to exist).
    function setKnownRowCount(value: number | undefined): void {
        knownRowCount.value = value;
        onRowCountChange?.(value ?? cacheBlockSize());
    }

    // Data Block Cache: Side Effects ──────────────────────────────────────────────────────────────────────────────────

    // Guarantees at least one fetch happens even when a source starts with rowCount undefined (count unknown).
    // Without this, an unknown count coerces to 0 virtual rows, so fetchVisibleBlocks never has anything to trigger
    // from, and the real count would never be learned. Safe/idempotent for sources that already know their count:
    // fetchBlock dedupes via blockPendingSet/blockCacheMap, so this never causes a duplicate network fetch.
    fetchBlock(0);

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
            setKnownRowCount(dataSource().rowCount); // New source means a fresh guess (or undefined), not the previous folder's corrected count.
            fetchBlock(0); // Same bootstrap guarantee as above, for the new source.
            fetchVisibleBlocks(virtualizer.value.getVirtualItems());
        },
        { flush: 'sync' }
    );

    // Row Virtualizer: Local State ────────────────────────────────────────────────────────────────────────────────────

    const virtualizer = useVirtualizer({
        get count() {
            // While unknown, render a guessed block's worth of rows (skeleton placeholders via getRow returning
            // undefined) rather than 0 — 0 would mean no virtual rows exist at all, hiding the loading state
            // entirely instead of showing it. Corrects to the real count once a fetch resolves.
            return count ? count() : (knownRowCount.value ?? cacheBlockSize());
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
                if (knownRowCount.value !== undefined && dataIndex < knownRowCount.value) {
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
    async function fetchBlock(blockIndex: number): Promise<void> {
        if (blockCacheMap.has(blockIndex)) {
            recordBlockAccessed(blockIndex);
            return;
        }
        if (blockPendingSet.has(blockIndex)) return;
        blockPendingSet.add(blockIndex);
        const start = blockIndex * cacheBlockSize();
        // Unclamped while the count is still unknown — clamping to a placeholder would request a truncated range
        // and discover nothing. Once a real count is known, block 0 is the only block ever fetched before it's
        // learned (nothing beyond it can be in the viewport until the virtualizer sees a real, non-zero count).
        const end = knownRowCount.value === undefined ? start + cacheBlockSize() : Math.min(start + cacheBlockSize(), knownRowCount.value);
        const generation = fetchGeneration;
        try {
            const { rows, totalCount } = await dataSource().getRows(start, end);
            if (generation !== fetchGeneration) return; // DataSource changed while this fetch was in-flight; discard.
            if (totalCount !== undefined) setKnownRowCount(totalCount);
            while (blockCacheMap.size >= maxBlocksInCache()) {
                const evict = blockLruOrder.shift();
                if (evict === undefined) break;
                blockCacheMap.delete(evict);
            }
            blockCacheMap.set(blockIndex, rows);
            recordBlockAccessed(blockIndex);
            blockCacheVersion.value++;
        } catch (error) {
            console.error(`[dpuse-app] useDataWindow failed to fetch block ${blockIndex}:`, error);
        } finally {
            blockPendingSet.delete(blockIndex);
        }
    }

    function getBlockIndex(rowIndex: number): number {
        return Math.floor(rowIndex / cacheBlockSize());
    }

    // Look up a data row by its flat data index. Returns undefined while the block is loading.
    // Touches blockCacheVersion so any reactive context (computed or template) re-evaluates on fetch completion.
    function getRow(dataIndex: number): T | undefined {
        if (knownRowCount.value === undefined || dataIndex >= knownRowCount.value) return undefined;
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

    return { virtualRows, totalSize, visibleRowData, getRow, rowCount: computed(() => knownRowCount.value ?? cacheBlockSize()) };
}
