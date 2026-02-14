<script setup lang="ts" generic="T extends { id: string; label: string }">
// External dependencies
import { computed, onMounted, ref, watchEffect } from 'vue';
import { useBreakpoints, useResizeObserver } from '@vueuse/core';
import { useVirtualizer, type VirtualItem } from '@tanstack/vue-virtual';

// Properties
type Properties = { items?: T[]; rowHeight?: number; targetColumnWidth?: number };
const { targetColumnWidth = 200, items = [], rowHeight = 35 } = defineProps<Properties>();

/** Reactive DOM References */
const gridScrollerReference = ref<HTMLDivElement | null>(null);

type ScreenSpanId = 's' | 'm' | 'l';
type ScreenWidthId = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
const breakpoints = useBreakpoints({ sm: 640, md: 768, lg: 1024, xl: 1280, '2xl': 1536 });
const screenSpan = computed(() => getScreenSpan());

/** Reactive Variables & Watchers */
const columnCount = ref(1);
const columnVirtualizer = useVirtualizer({
    count: 0,
    horizontal: true,
    overscan: 5,
    /* Subtract 20px below, app gutter of 1.25rem. */
    estimateSize: () => (screenWidthId.value === 'xl' || screenWidthId.value === '2xl' ? targetColumnWidth : Math.floor((gridWidth.value - 20) / columnCount.value)),
    getScrollElement: () => gridScrollerReference.value
});
const gridWidth = ref(0);
const rowVirtualizer = useVirtualizer({ count: 0, overscan: 5, estimateSize: () => rowHeight, getScrollElement: () => gridScrollerReference.value });
const screenWidthId = computed(() => screenSpan.value[1]);
const totalSizeRows = computed<number>((): number => rowVirtualizer.value.getTotalSize());
const virtualRows = computed<VirtualItem[]>((): VirtualItem[] => rowVirtualizer.value.getVirtualItems());

useResizeObserver(gridScrollerReference, (entries) => {
    gridWidth.value = entries[0]!.contentRect.width;
    columnCount.value = Math.max(Math.floor((gridWidth.value - 16) / targetColumnWidth), 1);
    columnVirtualizer.value.measure();
});
/** Reactive Variables & Watchers */
watchEffect(() => {
    columnVirtualizer.value.setOptions({ ...columnVirtualizer.value.options, count: columnCount.value });
    rowVirtualizer.value.setOptions({ ...rowVirtualizer.value.options, count: Math.ceil(items.length / columnCount.value) });
    rowVirtualizer.value.measure();
});

/** Component Lifecycle Event Handlers */
onMounted(() => {});

// Utilities - Get item configuration.
function getItemConfig(rowIndex: number, columnIndex: number): T | undefined {
    const index = rowIndex * columnCount.value + columnIndex;
    if (index < items.length) return items[index];
    return;
}

function getScreenSpan(): [ScreenSpanId, ScreenWidthId] {
    if (breakpoints.smaller('sm').value) return ['s', 'xs']; // <640px.
    if (breakpoints.between('sm', 'md').value) return ['s', 'sm']; // 640px - <768px.
    if (breakpoints.between('md', 'lg').value) return ['m', 'md']; // 768px - <1024px.
    if (breakpoints.between('lg', 'xl').value) return ['l', 'lg']; // 1024px - <1280px.
    if (breakpoints.between('xl', '2xl').value) return ['l', 'xl']; // 1280px - <1536px.
    return ['l', '2xl']; // >=1536px.
}
</script>

<template>
    <ClientOnly>
        <!-- Scrolling Wrapper - Height set to available screen height. -->
        <div ref="gridScrollerReference" class="w-full flex-1 overflow-y-auto overscroll-y-none pb-(--dp-app-bottom-gutter)">
            <!-- Content Wrapper - Height set to sum of all row heights. -->
            <div class="relative w-full" :style="{ height: `${totalSizeRows}px` }">
                <!-- Row Loop -->
                <template v-for="virtualRow in virtualRows" :key="virtualRow.index">
                    <!-- Column Loop -->
                    <div
                        v-for="virtualColumn in columnVirtualizer.getVirtualItems()"
                        :key="virtualColumn.index"
                        class="absolute top-0 left-0"
                        :style="{
                            height: `${virtualRow.size}px`,
                            transform: `translateX(${virtualColumn.start}px) translateY(${virtualRow.start}px)`,
                            width: `${virtualColumn.size}px`
                        }"
                    >
                        <!-- Item Wrapper -->
                        <div class="h-full pt-5 pl-5">
                            <!-- Item -->
                            <slot :item="getItemConfig(virtualRow.index, virtualColumn.index)" />
                        </div>
                    </div>
                </template>
            </div>
        </div>
    </ClientOnly>
</template>
