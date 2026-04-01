<script setup lang="ts">
// External Dependencies
import { useListScroller } from '@/composables/useListScroller';

// Properties & Emits
type Properties = {
    /** Total number of rows currently loaded into the data source. */
    count: number;
    /** Returns estimated row height in px. Default: 48. Inaccuracies are auto-corrected for dynamic heights. */
    estimateSize?: (index: number) => number;
    /** Called when the user scrolls toward the top. Await prepend operations — scroll anchoring is applied automatically. */
    onScrollBack?: () => Promise<void> | void;
    /** Called when the user scrolls toward the bottom. */
    onScrollForward?: () => Promise<void> | void;
    /** When false, the top sentinel stops triggering onScrollBack. */
    hasMoreBack?: boolean;
    /** When false, the bottom sentinel stops triggering onScrollForward. */
    hasMoreForward?: boolean;
    /** How far before the sentinel reaches the viewport edge to start fetching. Default: '200px'. */
    prefetchMargin?: string;
    overscan?: number;
};

const props = withDefaults(defineProps<Properties>(), { estimateSize: () => (_index: number) => 48, prefetchMargin: '200px', overscan: 5 });

/** Virtual List */
const { containerRef, topSentinelRef, bottomSentinelRef, virtualRows, totalSize, measureElement, isLoadingBack, isLoadingForward } = useListScroller({
    count: () => props.count,
    estimateSize: (index) => props.estimateSize(index),
    onScrollBack: props.onScrollBack ? () => props.onScrollBack!() : undefined,
    onScrollForward: props.onScrollForward ? () => props.onScrollForward!() : undefined,
    hasMoreBack: () => props.hasMoreBack ?? true,
    hasMoreForward: () => props.hasMoreForward ?? true,
    prefetchMargin: props.prefetchMargin,
    overscan: props.overscan
});
</script>

<template>
    <!-- Scrolling Wrapper -->
    <div ref="containerRef" class="w-full flex-1 overflow-y-auto overscroll-y-none pb-(--dp-app-bottom-gutter)">
        <!-- Top Sentinel - IntersectionObserver fires onScrollBack when this enters the prefetch zone. -->
        <div ref="topSentinelRef" />

        <!-- Back Loading Indicator -->
        <div v-if="isLoadingBack" class="flex justify-center py-3">
            <div class="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent opacity-40" />
        </div>

        <!-- Content Wrapper - Height set to the sum of all virtual row heights. -->
        <div class="relative w-full" :style="{ height: `${totalSize}px` }">
            <div
                v-for="virtualRow in virtualRows"
                :key="virtualRow.index"
                :ref="(el) => measureElement(el as Element | null)"
                :data-index="virtualRow.index"
                class="absolute top-0 left-0 w-full"
                :style="{ transform: `translateY(${virtualRow.start}px)` }"
            >
                <!-- Row slot: bind index to look up items in the parent. -->
                <slot :index="virtualRow.index" />
            </div>
        </div>

        <!-- Forward Loading Indicator -->
        <div v-if="isLoadingForward" class="flex justify-center py-3">
            <div class="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent opacity-40" />
        </div>

        <!-- Bottom Sentinel - IntersectionObserver fires onScrollForward when this enters the prefetch zone. -->
        <div ref="bottomSentinelRef" />
    </div>
</template>
