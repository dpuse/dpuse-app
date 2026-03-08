<script setup lang="ts" generic="T extends { id: string }">
// External Dependencies
import { onBeforeUnmount, onMounted, ref, watch } from 'vue';

// Properties & Emits
type Properties = {
    items?: T[];
    maxWidth?: 'max-w-4xl' | 'max-w-5xl' | 'max-w-6xl' | 'max-w-7xl' | 'max-w-full'; // 56rem (896px), 64rem (1,024px), 72rem (1,152px). 80rem (1,280px), 100%.
};
// eslint-disable-next-line unicorn/no-useless-undefined
const { items = undefined, maxWidth = 'max-w-full' } = defineProps<Properties>();

/** Constants */
const SKELETON_ITEM_HEIGHT = 120; // Pixels.

/** Non-Reactive Variables */
let resizeObserver: ResizeObserver | undefined;

/** Reactive DOM References */
const contentReference = ref<HTMLElement | null>(null);

/** Reactive Variables & Watchers */
const hasItems = ref(false);
const minHeight = ref(SKELETON_ITEM_HEIGHT);

// Reactive Variables & Watchers - Content reference.
watch(contentReference, (newContentReference, oldContentReference) => {
    if (oldContentReference) resizeObserver?.unobserve(oldContentReference);
    if (newContentReference) {
        resizeObserver?.observe(newContentReference);
        calcMinimumHeight(newContentReference);
    }
});

// Reactive Variables & Watchers - Items.
watch(
    () => items,
    (newItems) => (hasItems.value = newItems !== undefined),
    { immediate: true }
);

/** Component Lifecycle Event Handlers */
onMounted(() => {
    resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) calcMinimumHeight(entry.target as HTMLElement);
    });
});
onBeforeUnmount(() => {
    resizeObserver?.disconnect();
    resizeObserver = undefined;
});

// Utilities - Calculate minimum height.
function calcMinimumHeight(element: Element): void {
    const bounds = (element as HTMLElement).getBoundingClientRect();
    minHeight.value = bounds.height;
}
</script>

<template>
    <div class="relative" :style="{ minHeight: `${minHeight}px` }">
        <Transition name="fade">
            <!-- Skeleton - Display while items are undefined. -->
            <div v-if="!hasItems" ref="contentRef" class="absolute inset-x-0 mx-auto grid grid-cols-1 gap-(--dp-app-gutter) sm:grid-cols-2 xl:grid-cols-3" :class="maxWidth">
                <USkeleton v-for="n in 1" :key="`skeleton-${n}`" class="block rounded-sm sm:hidden" :style="{ height: `${SKELETON_ITEM_HEIGHT}px` }" />
                <USkeleton v-for="n in 2" :key="`skeleton-${n}`" class="hidden rounded-sm sm:block xl:hidden" :style="{ height: `${SKELETON_ITEM_HEIGHT}px` }" />
                <USkeleton v-for="n in 3" :key="`skeleton-${n}`" class="hidden rounded-sm xl:block" :style="{ height: `${SKELETON_ITEM_HEIGHT}px` }" />
            </div>

            <!-- Alert - Display if no items. -->
            <div v-else-if="items && items.length === 0" ref="contentRef" class="absolute inset-x-0 mx-auto max-w-prose">
                <UAlert color="info" icon="i-heroicons-information-circle" title="No items." variant="soft" />
            </div>

            <!-- Items - Pass back each item and format using default slot. -->
            <div v-else ref="contentRef" class="absolute inset-x-0 mx-auto" :class="maxWidth">
                <div class="grid grid-cols-1 gap-(--dp-app-gutter) sm:grid-cols-2 xl:grid-cols-3">
                    <div v-for="item in items || []" :key="item.id">
                        <slot :item="item" />
                    </div>
                </div>
            </div>
        </Transition>
    </div>
</template>
