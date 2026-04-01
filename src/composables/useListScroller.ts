// External Dependencies
import {
    computed,
    type ComputedRef,
    type DeepReadonly,
    type MaybeRefOrGetter,
    nextTick,
    onMounted,
    onUnmounted,
    readonly,
    ref,
    type Ref,
    toValue,
} from 'vue';
import { useVirtualizer, type VirtualItem } from '@tanstack/vue-virtual';

// Types ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export type UseListScrollerOptions = {
    /** Total number of rows currently loaded. */
    count: MaybeRefOrGetter<number>;
    /** Returns estimated row height in px. Used for virtual layout; inaccuracies are auto-corrected by measureElement. */
    estimateSize: (index: number) => number;
    /** Called when the user scrolls toward the top. Await your prepend operation — scroll anchoring is applied automatically on resolve. */
    onScrollBack?: () => Promise<void> | void;
    /** Called when the user scrolls toward the bottom. */
    onScrollForward?: () => Promise<void> | void;
    /** Guards onScrollBack. When false the top sentinel is ignored. */
    hasMoreBack?: MaybeRefOrGetter<boolean>;
    /** Guards onScrollForward. When false the bottom sentinel is ignored. */
    hasMoreForward?: MaybeRefOrGetter<boolean>;
    /** IntersectionObserver rootMargin — triggers fetches this far before the sentinel reaches the viewport edge. Default: '200px'. */
    prefetchMargin?: string;
    overscan?: number;
};

export type UseListScrollerInterface = {
    containerRef: Ref<HTMLElement | null>;
    topSentinelRef: Ref<HTMLElement | null>;
    bottomSentinelRef: Ref<HTMLElement | null>;
    virtualRows: ComputedRef<VirtualItem[]>;
    totalSize: ComputedRef<number>;
    /** Bind to each virtual row element's ref to enable dynamic height measurement. */
    measureElement: (element: Element | null) => void;
    isLoadingBack: DeepReadonly<Ref<boolean>>;
    isLoadingForward: DeepReadonly<Ref<boolean>>;
};

// List Scroller Composable ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export function useListScroller(options: UseListScrollerOptions): UseListScrollerInterface {
    const { count, estimateSize, onScrollBack, onScrollForward, hasMoreBack, hasMoreForward, prefetchMargin = '200px', overscan = 5 } = options;

    const containerRef = ref<HTMLElement | null>(null);
    const topSentinelRef = ref<HTMLElement | null>(null);
    const bottomSentinelRef = ref<HTMLElement | null>(null);
    const isLoadingBack = ref(false);
    const isLoadingForward = ref(false);

    const virtualizer = useVirtualizer(
        computed(() => ({
            count: toValue(count),
            getScrollElement: () => containerRef.value,
            estimateSize,
            overscan,
        }))
    );

    const virtualRows = computed<VirtualItem[]>(() => virtualizer.value.getVirtualItems());
    const totalSize = computed<number>(() => virtualizer.value.getTotalSize());

    function measureElement(element: Element | null): void {
        if (element) virtualizer.value.measureElement(element);
    }

    // Fetch backward ─ anchors scroll position after prepend so the viewport doesn't jump.
    async function handleScrollBack(): Promise<void> {
        if (!onScrollBack || isLoadingBack.value) return;
        if (hasMoreBack !== undefined && !toValue(hasMoreBack)) return;
        if (toValue(count) === 0) return;

        isLoadingBack.value = true;
        const prevScrollHeight = containerRef.value?.scrollHeight ?? 0;
        const prevCount = toValue(count);

        try {
            await onScrollBack();
            await nextTick();
            // Compensate for the height added by prepended rows.
            if (containerRef.value && toValue(count) > prevCount) {
                containerRef.value.scrollTop += containerRef.value.scrollHeight - prevScrollHeight;
            }
        } finally {
            isLoadingBack.value = false;
        }
    }

    // Fetch forward ─ no anchor correction needed since rows are appended.
    async function handleScrollForward(): Promise<void> {
        if (!onScrollForward || isLoadingForward.value) return;
        if (hasMoreForward !== undefined && !toValue(hasMoreForward)) return;

        isLoadingForward.value = true;
        try {
            await onScrollForward();
        } finally {
            isLoadingForward.value = false;
        }
    }

    let observer: IntersectionObserver | undefined;

    onMounted(() => {
        // root: containerRef makes rootMargin relative to the scroll container, not the viewport.
        observer = new IntersectionObserver(
            (entries) => {
                for (const entry of entries) {
                    if (!entry.isIntersecting) continue;
                    if (entry.target === topSentinelRef.value) void handleScrollBack();
                    if (entry.target === bottomSentinelRef.value) void handleScrollForward();
                }
            },
            { root: containerRef.value, rootMargin: prefetchMargin, threshold: 0 }
        );

        if (topSentinelRef.value) observer.observe(topSentinelRef.value);
        if (bottomSentinelRef.value) observer.observe(bottomSentinelRef.value);
    });

    onUnmounted(() => observer?.disconnect());

    return {
        containerRef,
        topSentinelRef,
        bottomSentinelRef,
        virtualRows,
        totalSize,
        measureElement,
        isLoadingBack: readonly(isLoadingBack),
        isLoadingForward: readonly(isLoadingForward),
    };
}
