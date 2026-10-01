// ── TODO: Follow-Up Work ─────────────────────────────────────────────────────────────────────────────────────────────
//
// This composable went through heavy iteration to reach its current state (real on-demand block fetching, self-
// correcting row count, debounce, retry) — three separate real bugs were found and fixed along the way (Grid's own
// `count` override bypassing self-correction entirely, the 0-vs-undefined "unknown" sentinel ambiguity, and the
// skeleton display being hidden along with the data while the count was unknown). That history is *why* this list
// exists: reasoning about this file in isolation has already proven insufficient twice.
//
// Highest priority — biggest gap between "believed correct" and actually production-ready:
// 1. Never verified in a live browser. Every fix here, including the two bugs above, was found through code-level
//    reasoning and manual testing reported back in conversation — never an actual driven browser session. No
//    project run-skill exists yet for dpuse-app, and full E2E is blocked on Hanko passkey auth not being
//    scriptable in this environment.
// 2. Zero automated test coverage for this file. No unit tests for debounce timing, retry/backoff, the
//    generation-discard-on-dataSource-change logic, bootstrap-from-unknown-count, or LRU eviction.
//
// Known, deliberately deferred gaps:
// 3. `fetchRowsWithRetry` doesn't distinguish retryable from non-retryable failures — a permanent error (e.g. an
//    invalid folder path) still burns all `FETCH_MAX_RETRIES` attempts and ~900ms of backoff before giving up,
//    instead of failing fast.
// 4. No user-visible failure state. A block that exhausts its retries just `console.error`s and stays in permanent
//    skeleton/loading state forever — no "failed to load" affordance ever reaches the user.
// 5. No cancellation of in-flight fetches for blocks that scroll back out of view. Can't be fixed from inside this
//    file: `EngineWorker.processRequest` (dpuse-engine) takes no `AbortSignal` at all, so there's no plumbing from
//    here down to a connector's own `abortController`, even though most connectors already support one.
// 6. No cap on concurrent in-flight requests — a big scrollbar jump can fire several fetches at once. Deprioritized:
//    no evidence this is an actual problem yet.
// 7. Theoretical: LRU eviction (`maxBlocksInCache`, default 10 × `cacheBlockSize`) could evict a block still in the
//    viewport if the viewport+overscan ever spans more rows than that — needs an unrealistic row-height/viewport
//    combination to actually happen.
//
// Architectural — deliberately deferred, not forgotten:
// 8. Only one real consumer exists (SelectItemPanel.vue's folder browser). dexie-js was flagged as needing real
//    pagination added (it currently returns everything in one call, same as the emulator connectors) but that work
//    was never started. The block-fetching pattern here is unproven beyond a single example.
// 9. Whether to adopt a query/cache library (TanStack Query or Pinia Colada) instead of this file's hand-rolled
//    `blockCacheMap`/`blockLruOrder`/`blockPendingSet`/`fetchGeneration` bookkeeping — deliberately not decided yet.
//    - Both are functionally equivalent for this use case: caching, dedup, and configurable retry, via an
//      *imperative* fetch-on-demand API (TanStack Query's `QueryClient.fetchQuery()`/`ensureQueryData()`, or Pinia
//      Colada's `useQueryCache().fetch()`/`.ensure()`) rather than the reactive `useQuery` hook — block-indexed,
//      random-access fetching doesn't fit "call a hook a stable number of times per render" well.
//    - `useInfiniteQuery` (either library) is explicitly *not* the right primitive: it merges sequential pages into
//      one growing cache entry for "load more"-style scrolling, not random access (jumping straight to block 40 via
//      a scrollbar drag without having "loaded" the blocks before it).
//    - Neither would solve items 1, 5, or 6 above — debounce is orthogonal (scroll-timing, not caching), and
//      cancellation is blocked at the engine-worker layer regardless of caching library.
//    - TanStack Query: far more mature/battle-tested; doesn't require adding a new dependency paradigm (this app
//      doesn't use Pinia today).
//    - Pinia Colada: built by the Vue Router/Pinia author, designed around Vue's reactivity from the start; its
//      "Paginated Queries" pattern (a reactive key with the page/offset baked in) maps naturally onto block-indexed
//      fetching, with confirmed random-access support — but it requires adding Pinia as a new dependency, and is
//      newer/less battle-tested.
//    - Trigger to revisit: when a second real connector-backed consumer exists (dexie-js pagination is the likely
//      candidate) — enough data points to confirm the query-key shape generalizes before committing to either.
//
// Related, outside this file (dpuse-app / dpuse-engine), surfaced while building this:
// 10. SelectItemPanel.vue: `setConnectionNodeConfig(newActiveItem)` is commented out, leaving the "Details" tab
//     permanently empty — this is where `getInfo` output (see dpuse-connector-dbnomics) was meant to land, and the
//     select-vs-drill-down / per-row info-icon UI design was discussed and agreed but never implemented.
// 11. SelectItemPanel.vue: minor pre-existing issues from the original review, still not addressed — the duplicate
//     light/dark icon divs (`ConnectionNodeConfig` has no `iconDark` field, so one is dead markup), the
//     `activeConnectionConfig.value!` non-null assertion, and the preview status bar's byte-size messaging not
//     generalizing to non-file connectors (e.g. DBnomics, where size is always undefined).
// 12. dpuse-engine: `EngineWorker.processRequest` has no `AbortSignal` parameter — the prerequisite for item 5
//     above, and for any future cancellation support across the app, not just this composable.
// 13. Do we need cache in the connector and in this component, maybe just this component?
// 14. Directional prefetch: once debounce settles, speculatively fetch one block past the trailing edge in the
//     direction of scroll travel (inferred from the delta between consecutive scroll offsets), so a "scroll, pause,
//     scroll the same direction again" pattern feels instant instead of showing a fetch lag. Skip if that block is
//     already cached or pending. Deliberately not implemented yet: it burns speculative connector calls that may
//     never be used, which cuts against being respectful of rate-limited connectors (e.g. DBnomics) — a fast
//     back-and-forth scroller would waste requests on both sides. If done, keep it capped (exactly one block ahead,
//     never more) rather than aggressive.

// ── External Dependencies & Registrations
import { computed, type ComputedRef, ref, type ShallowRef, watch } from 'vue';
import { promiseTimeout, watchDebounced } from '@vueuse/core';
import { useVirtualizer, type VirtualItem } from '@tanstack/vue-virtual';

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

// Rows fetched per block by default, and the render-time guess used while a source's count is still unknown — see
// the virtualizer `count` getter below for why a render guess (not 0) is needed even before any row is confirmed.
export const DEFAULT_CACHE_BLOCK_SIZE = 100;

// Default trailing-edge debounce before fetching newly-visible blocks after a scroll.
export const DEFAULT_FETCH_DEBOUNCE_MS = 150;

// Fetch retry attempts (beyond the first) and the base delay for their exponential backoff.
const FETCH_MAX_RETRIES = 2;
const FETCH_RETRY_BASE_DELAY_MS = 300;

// ── Types ────────────────────────────────────────────────────────────────────────────────────────────────────────────

export type DataSource<T = unknown> = {
    id?: string;
    rowCount: number | undefined; // Caller's best-known count, or undefined if not yet known — distinct from 0 (genuinely empty). useDataWindow guarantees an initial fetch to discover the real total via getRows' totalCount.
} & (
    | { getRows: (startRow: number, endRow: number) => Promise<{ rows: T[]; totalCount?: number }> }
    // Fully in-memory data: bypasses the async block-fetch/cache entirely, so getRow (and therefore estimateSize)
    // gets a real item on its very first, one-shot call instead of undefined — see useDataWindow's getRow.
    | { rows: T[] }
);

interface Options<T> {
    scrollElement: Readonly<ShallowRef<HTMLElement | null>>;
    dataSource: () => DataSource<T>;
    count?: () => number; // Virtual row count override — e.g. Grid divides by column count for its N-per-row layout.
    // When `count` is provided, the caller owns row-count math and needs the self-corrected total to build its own
    // override from (rather than the caller's static placeholder) — this reports it as it changes.
    onRowCountChange?: (rowCount: number) => void;
    getDataIndexes?: (virtualRowIndex: number) => number[]; // Maps a virtual row index to data row indexes for block fetching. Defaults to identity (1:1).
    cacheBlockSize?: () => number;
    maxBlocksInCache?: () => number;
    estimateSize?: (item: T | undefined) => number;
    // Trailing-edge debounce (ms) before fetching newly-visible blocks after a scroll. Blocks only visible
    // transiently mid-scroll are never fetched at all, not just delayed — the fetch only fires once the viewport
    // has been stable for this long, using whatever is visible at that point. Does not delay the initial/navigation
    // bootstrap fetch, which stays immediate.
    fetchDebounceMs?: () => number;
}

interface DataWindow<T> {
    virtualRows: ComputedRef<VirtualItem[]>;
    totalSize: ComputedRef<number>;
    visibleRowData: ComputedRef<(T | undefined)[]>;
    getRow: (dataIndex: number) => T | undefined;
    rowCount: ComputedRef<number>; // Self-corrected count, matching the virtualizer's own render count (a block-sized guess while unknown, never 0-while-unknown) — prefer this over dataSource().rowCount.
    // Uncoerced version of the above: undefined until the real count is confirmed (via dataSource().rowCount or a
    // resolved fetch's totalCount), distinct from 0 (confirmed empty). A caller's dataSource().rowCount may stay
    // undefined forever by design (e.g. a source that only learns its count from getRows' totalCount) — this is
    // the only reliable "is it still unknown" signal for busy/empty UI state; prefer it over dataSource().rowCount.
    knownRowCount: ComputedRef<number | undefined>;
}

// ── Composables ──────────────────────────────────────────────────────────────────────────────────────────────────────

export function useDataWindow<T>({
    scrollElement,
    dataSource,
    count,
    onRowCountChange,
    getDataIndexes,
    cacheBlockSize = (): number => DEFAULT_CACHE_BLOCK_SIZE,
    maxBlocksInCache = (): number => 10,
    estimateSize = (): number => 48,
    fetchDebounceMs = (): number => DEFAULT_FETCH_DEBOUNCE_MS
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
    void fetchBlock(0);

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
            void fetchBlock(0); // Same bootstrap guarantee as above, for the new source.
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
        estimateSize: (index) => estimateSize(getRow((getDataIndexes ? getDataIndexes(index) : [index])[0])),
        overscan: 5
    });

    // Row Virtualizer: Derived State ──────────────────────────────────────────────────────────────────────────────────

    const virtualRows = computed(() => virtualizer.value.getVirtualItems());
    const totalSize = computed(() => virtualizer.value.getTotalSize());
    const visibleRowData = computed((): T[] => {
        blockCacheVersion.value; // Only recomputes when `virtualRows` or `blockCacheVersion` changes — never on resize.
        return virtualRows.value.map((virtualRow) => getRow(virtualRow.index)) as T[];
    });

    // Row Virtualizer: Side Effects ───────────────────────────────────────────────────────────────────────────────────

    // Fetch blocks for all data items in the current viewport, debounced (trailing-edge) so a fast scroll never
    // fetches for blocks that were only ever transiently visible — not merely delayed, never requested at all,
    // since only the final settled `items` (whatever's visible once scrolling pauses) is ever passed through.
    // fetchBlock also updates LRU for cached blocks. getDataIndexes maps a virtual row index to one or more data
    // indexes (default 1:1; Grid passes N:1).
    watchDebounced(virtualRows, fetchVisibleBlocks, { debounce: fetchDebounceMs });

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
            void fetchBlock(blockIndex);
        }
    }

    // Fetch the block if not cached. If already cached, update LRU order so the block is not evicted
    // while it is still in the viewport. No-op for sync (rows-based) sources — getRow reads dataSource().rows
    // directly and there are no blocks to fetch.
    async function fetchBlock(blockIndex: number): Promise<void> {
        if (!('getRows' in dataSource())) return;
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
            const { rows, totalCount } = await fetchRowsWithRetry(start, end, generation);
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
            console.error(`[dpuse-app] useDataWindow failed to fetch block ${String(blockIndex)}:`, error);
        } finally {
            blockPendingSet.delete(blockIndex);
        }
    }

    // Fetch a row range, retrying transient failures with exponential backoff before giving up. Abandons the retry
    // (rethrows immediately) if the data source changes mid-backoff — no point retrying a fetch nobody wants anymore.
    async function fetchRowsWithRetry(start: number, end: number, generation: number): Promise<{ rows: T[]; totalCount?: number }> {
        for (let attempt = 0; ; attempt++) {
            try {
                const source = dataSource();
                if (!('getRows' in source)) throw new Error('fetchRowsWithRetry called for a sync (rows-based) DataSource — fetchBlock should have skipped it.');
                const result = await source.getRows(start, end);
                return result;
            } catch (error) {
                if (generation !== fetchGeneration || attempt >= FETCH_MAX_RETRIES) throw error;
                const delayMs = FETCH_RETRY_BASE_DELAY_MS * 2 ** attempt;
                await promiseTimeout(delayMs);
            }
        }
    }

    function getBlockIndex(rowIndex: number): number {
        return Math.floor(rowIndex / cacheBlockSize());
    }

    // Look up a data row by its flat data index. Returns undefined while the block is loading.
    // Touches blockCacheVersion so any reactive context (computed or template) re-evaluates on fetch completion.
    function getRow(dataIndex: number): T | undefined {
        const source = dataSource();
        if ('rows' in source) return source.rows[dataIndex]; // Sync source: always available immediately, no fetch/cache involved.
        if (knownRowCount.value === undefined || dataIndex >= knownRowCount.value) return undefined;
        blockCacheVersion.value;
        const blockIndex = getBlockIndex(dataIndex);
        const block = blockCacheMap.get(blockIndex);
        return block ? (block[dataIndex % cacheBlockSize()] as T) : undefined;
    }

    function recordBlockAccessed(blockIndex: number): void {
        const position = blockLruOrder.indexOf(blockIndex);
        if (position !== -1) blockLruOrder.splice(position, 1);
        blockLruOrder.push(blockIndex);
    }

    return {
        virtualRows,
        totalSize,
        visibleRowData,
        getRow,
        rowCount: computed(() => knownRowCount.value ?? cacheBlockSize()),
        knownRowCount: computed(() => knownRowCount.value)
    };
}
