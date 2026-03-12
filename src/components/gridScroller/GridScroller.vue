<script setup lang="ts" generic="T extends { id: string; label: string }">
// External Dependencies
import { computed, onMounted, onUnmounted, ref, watchEffect } from 'vue';
import { useVirtualizer, type VirtualItem } from '@tanstack/vue-virtual';

// Properties & Emits
type Properties = { items?: T[]; rowHeight?: number; targetColumnWidth?: number };
const { targetColumnWidth = 200, items = [], rowHeight = 35 } = defineProps<Properties>();

/** Reactive DOM References */
const gridScrollerReference = ref<HTMLDivElement | null>(null);

/** Reactive Variables & Watchers */
const columnCount = ref(1);
const gridWidth = ref(0);
const columnVirtualizer = useVirtualizer({
    count: 0,
    horizontal: true,
    overscan: 5,
    /* Subtract 16px, app gutter of 1rem. */
    estimateSize: () => (gridWidth.value >= 1280 ? targetColumnWidth : Math.floor((gridWidth.value - 16) / columnCount.value)),
    getScrollElement: () => gridScrollerReference.value
});
const rowVirtualizer = useVirtualizer({ count: 0, overscan: 5, estimateSize: () => rowHeight, getScrollElement: () => gridScrollerReference.value });
const totalSizeRows = computed<number>((): number => rowVirtualizer.value.getTotalSize());
const virtualRows = computed<VirtualItem[]>((): VirtualItem[] => rowVirtualizer.value.getVirtualItems());

const resizeObserver = new ResizeObserver((entries) => {
    gridWidth.value = entries[0]!.contentRect.width;
    columnCount.value = Math.max(Math.floor((gridWidth.value - 16) / targetColumnWidth), 1);
    columnVirtualizer.value.measure();
});

watchEffect(() => {
    columnVirtualizer.value.setOptions({ ...columnVirtualizer.value.options, count: columnCount.value });
    rowVirtualizer.value.setOptions({ ...rowVirtualizer.value.options, count: Math.ceil(items.length / columnCount.value) });
    rowVirtualizer.value.measure();
});

/** Component Lifecycle Event Handlers */
onMounted(() => { if (gridScrollerReference.value) resizeObserver.observe(gridScrollerReference.value); });
onUnmounted(() => resizeObserver.disconnect());

// Utilities - Get item configuration.
function getItemConfig(rowIndex: number, columnIndex: number): T | undefined {
    const index = rowIndex * columnCount.value + columnIndex;
    if (index < items.length) return items[index];
    return;
}
</script>

<template>
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
                    <div class="h-full pt-4 pl-4">
                        <!-- Item -->
                        <slot :item="getItemConfig(virtualRow.index, virtualColumn.index)" />
                    </div>
                </div>
            </template>
        </div>
    </div>
</template>
