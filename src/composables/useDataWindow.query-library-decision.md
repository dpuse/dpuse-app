# `useDataWindow.ts`: query/cache library decision — context

**Status:** deferred, not decided.
**Trigger to revisit:** when a second real connector-backed consumer of `useDataWindow` exists (the leading candidate is `dpuse-connector-dexie-js` getting real `listNodes` pagination — it's WIP and currently returns everything in one call, same as the emulator connectors). One real consumer (`SelectItemPanel.vue`'s folder browser) isn't enough to confirm the query-key shape generalizes.

This file exists so that revisiting this decision later doesn't require re-deriving the investigation from scratch. See also the `TODO: Follow-Up Work` block at the top of `useDataWindow.ts` itself, item 9 — this document is the detailed backing for that one bullet.

## The question

`useDataWindow.ts` hand-rolls its own block-level cache: `blockCacheMap`, `blockLruOrder`, `blockPendingSet`, `fetchGeneration`, plus manual retry/backoff (`fetchRowsWithRetry`) and debounce. Libraries like **TanStack Query** and **Pinia Colada** exist specifically to own this category of problem (caching, deduplication, retry, request lifecycle for async server state). Should one of them replace this file's internals?

## Why this came up

A five-issue review of `useDataWindow.ts` surfaced:

1. No debounce on scroll-triggered fetching.
2. No cancellation of in-flight fetches that scroll out of view.
3. No error/retry UX.
4. No cap on concurrent in-flight requests.
5. A theoretical LRU-eviction edge case.

Debounce (1) and retry (part of 3) were implemented by hand directly in `useDataWindow.ts` — see the file itself. The question of whether a query library would have been a *better* way to get there (and whether it's worth migrating to one now) is what this document is about.

## What a query library would and wouldn't help with

| Issue | Helped by a query library? | Why |
|---|---|---|
| Debounce | **No** | Scroll-timing is orthogonal to caching. Neither TanStack Query nor Pinia Colada know why a query key changed — a block index changing from scrolling looks identical to a search box changing from typing. The ecosystem convention is "debounce the input that drives the key yourself," not something the library does for you. This had to be (and was) hand-written regardless. |
| Cancellation | **No, not really** | The library gives you the *pattern* (query functions receive an `AbortSignal`), but it terminates at `EngineWorker.processRequest` (`dpuse-engine`), which accepts no `AbortSignal` at all today. No caching library changes that — the fix is a `dpuse-engine` change, independent of this decision. |
| Concurrency cap | **No** | Neither library throttles distinct concurrent requests out of the box. Dedup only helps for *identical* keys, not general concurrency. |
| Error/retry UX | **Yes, real but modest** | Both give configurable retry/backoff and structured `isLoading`/`isError`/`error`/`data` state for free. `useDataWindow.ts` already hand-rolled a basic version of the retry half (`fetchRowsWithRetry`); a library version would likely be more correct (e.g. it would naturally support distinguishing retryable/non-retryable failures, which the hand-rolled version currently does not — see TODO item 3) and would add the still-missing user-visible failure state (TODO item 4) with much less custom code. |
| LRU/cache bookkeeping | **Yes, this is the big one** | This is the real prize. `blockCacheMap`, `blockLruOrder`, `blockPendingSet`, `fetchGeneration`, and their associated eviction/pending/generation-discard logic are collectively close to half of this file's current complexity. Keying queries by `[folderPath, blockIndex]` would let a library own all of this — including the "discard stale in-flight results after a folder change" concern, which falls out for free (an old folder's in-flight request just lands in an unused cache entry under a different key, instead of needing a manual generation counter to detect and discard it). |

**Net: 2 of 5 issues meaningfully helped, 3 would remain exactly as unsolved as they are today.** The win is concentrated entirely in "delete a bunch of hand-rolled cache/staleness code," not in the other four issues.

## TanStack Query vs Pinia Colada

Verified directly against each library's actual docs/API (not assumed by analogy) — earlier in this investigation there was a wrong assumption that Pinia Colada lacked an imperative API equivalent to TanStack Query's; that was checked and corrected.

- **Capability, for this specific use case: equivalent.** Both have the primitive that actually fits block-indexed, random-access virtualized fetching: an **imperative** fetch-and-cache call (TanStack Query's `QueryClient.fetchQuery()` / `ensureQueryData()`; Pinia Colada's `useQueryCache().fetch()` / `.ensure()`), not the reactive `useQuery()` hook. Vue composables are meant to be called a stable number of times per render — calling one per dynamically-changing, potentially-multiple required block index doesn't fit that model. The imperative API does, and both libraries have one.
- **`useInfiniteQuery` (either library) is explicitly the wrong primitive**, despite the name suggesting otherwise. It merges sequential pages into *one* growing cache entry via `getNextPageParam`/`loadNextPage()` — built for "load more" append-style infinite scroll. It does not support random access (jumping straight to block 40 via a scrollbar drag without having "loaded" the blocks before it).
- **Pinia Colada's "Paginated Queries" pattern is the right conceptual fit**, confirmed against its actual docs: `useQuery` with a *reactive key* that includes the page/offset (e.g. `key: () => ['listNodes', folderPath, blockIndex.value]`). Each distinct key is confirmed to be an independent cache entry, with confirmed random-access support (no sequential dependency between pages). This maps naturally onto per-block fetching. TanStack Query's imperative API achieves the same thing without needing an equivalent named pattern.
- **The actual differentiator is non-functional:**
  - **TanStack Query** — far more mature, much larger ecosystem, years of production hardening. Requires no new dependency paradigm: `dpuse-app` doesn't use Pinia today, and TanStack Query's Vue package doesn't need it.
  - **Pinia Colada** — built by the Vue Router/Pinia author (posva), designed around Vue's reactivity from the start, smaller. **Requires adding Pinia as a dependency** — the app has no Pinia stores today, so adopting Colada means introducing a new state-management paradigm alongside the existing plain-reactive-module pattern (`@/state/*`), just to get a caching layer. Also newer/less battle-tested — worth checking whether it's reached a stable 1.0 by the time this is revisited.

**No recommendation between the two is made here** — it's a genuine toss-up dependent on how much the Pinia dependency cost matters versus TanStack Query's maturity, and that trade-off is worth re-evaluating at decision time rather than pre-deciding now.

## If/when this is revisited

1. Confirm the trigger condition actually holds (a second real consumer exists, or is imminent) — don't do this speculatively with only one data point.
2. Re-check both libraries' current maturity/stability (Pinia Colada especially — it was newer at the time of this analysis).
3. Decide TanStack Query vs Pinia Colada based on the Pinia-dependency trade-off above, not capability (capability is equivalent).
4. Scope: this is a `useDataWindow.ts`-internal migration. The public `DataSource<T>` contract (`{ rowCount, getRows }`) that all consumers implement against doesn't need to change — consumers shouldn't need to be touched.
5. Expect to delete: `blockCacheMap`, `blockLruOrder`, `blockPendingSet`, `fetchGeneration`, `recordBlockAccessed`, the eviction loop, the generation-discard checks. Expect to keep: the debounce logic (orthogonal, still needed), the virtualizer/viewport wiring, and probably tighten up retry/error-state as a side effect of the migration (TODO items 3 and 4).
6. Cancellation (TODO item 5) will *not* be solved by this migration alone — it still needs the separate `dpuse-engine` `AbortSignal` work first for the library's cancellation support to have any effect.

## Sources consulted

- [Pinia Colada — `useInfiniteQuery` API](https://pinia-colada.esm.dev/api/@pinia/colada/functions/useInfiniteQuery.html)
- [Pinia Colada — Paginated Queries guide](https://pinia-colada.esm.dev/guide/paginated-queries.html)
- [Pinia Colada — Infinite Queries guide](https://pinia-colada.esm.dev/guide/infinite-queries.html)
- [Pinia Colada — Query Cache (advanced)](https://pinia-colada.esm.dev/advanced/query-cache.html)
