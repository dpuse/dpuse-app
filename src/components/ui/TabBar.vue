<script setup lang="ts" generic="T extends { id: string; label: string; to?: string; rightAligned?: boolean }">
// ── External Dependencies & Registrations
import { ChevronLeftIcon, ChevronRightIcon } from '@lucide/vue';
import { nextTick, onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue';

// ── Static Components
import ActionWrapper from '@/components/ui/action/ActionWrapper.vue';

// ── Options, Props, Slots & Emits ────────────────────────────────────────────────────────────────────────────────────

interface Properties {
    activeId?: string;
    items?: T[];
}
const { activeId, items = [] } = defineProps<Properties>();

defineSlots<{ default(properties: { item: T }): unknown }>();

defineEmits<{ select: [item: T] }>();

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

const resizeObserver = shallowRef<ResizeObserver>();
const rowCanScrollLeft = ref(false);
const rowCanScrollRight = ref(false);
const rowElement = ref<HTMLElement | null>(null);

// ── Side Effects ─────────────────────────────────────────────────────────────────────────────────────────────────────

onMounted(() => {
    updateScrollState();
    resizeObserver.value = new ResizeObserver(updateScrollState);
    if (rowElement.value) resizeObserver.value.observe(rowElement.value);
});

watch(
    () => items,
    () => nextTick(updateScrollState)
);

onBeforeUnmount(() => {
    resizeObserver.value?.disconnect();
});

// ── Event Handlers ───────────────────────────────────────────────────────────────────────────────────────────────────

function updateScrollState(): void {
    const row = rowElement.value;
    if (!row) return;
    rowCanScrollLeft.value = row.scrollLeft > 0;
    rowCanScrollRight.value = row.scrollLeft + row.clientWidth < row.scrollWidth - 1;
}

function handleScrollButtonClicked(direction: 'left' | 'right'): void {
    const row = rowElement.value;
    if (!row) return;
    const children = [...row.children] as HTMLElement[];

    if (direction === 'right') {
        const visibleRight = row.scrollLeft + row.clientWidth;
        const nextItem = children.find((child) => child.offsetLeft + child.offsetWidth > visibleRight + 1);
        row.scrollTo({ left: nextItem ? nextItem.offsetLeft + nextItem.offsetWidth - row.clientWidth : row.scrollWidth, behavior: 'smooth' });
    } else {
        const nextItem = children.findLast((child) => child.offsetLeft < row.scrollLeft - 1);
        row.scrollTo({ left: nextItem ? nextItem.offsetLeft : 0, behavior: 'smooth' });
    }
}
</script>

<template>
    <div class="relative flex-none" data-region="TabBar">
        <div ref="rowElement" class="flex min-w-0 flex-1 items-center gap-x-3 overflow-x-auto overscroll-x-none border-b border-separator px-4" @scroll="updateScrollState">
            <ActionWrapper
                v-for="item in items"
                :key="item.id"
                class="border-b-2 border-t-transparent py-1.25"
                :class="[activeId === item.id ? 'border-b-accent text-accent' : 'border-b-transparent', item.rightAligned ? 'ml-auto' : '']"
                role="tab"
                :aria-selected="activeId === item.id"
                :to="item.to != null ? { name: item.to, query: $route.query } : undefined"
                @click="$emit('select', item)"
            >
                <slot :item="item">
                    <div v-if="item.label" class="text-sm">{{ item.label }}</div>
                </slot>
            </ActionWrapper>
        </div>

        <button
            v-if="rowCanScrollLeft"
            aria-label="Scroll left"
            class="absolute inset-y-0 left-0 flex items-center bg-linear-to-r from-surface to-transparent py-2 pr-4 pl-1"
            type="button"
            @click="handleScrollButtonClicked('left')"
        >
            <ChevronLeftIcon class="size-5 rounded-full text-content hover:bg-zinc-100 dark:hover:bg-zinc-300/25" />
        </button>

        <button
            v-if="rowCanScrollRight"
            aria-label="Scroll right"
            class="absolute inset-y-0 right-0 flex items-center bg-linear-to-l from-surface to-transparent py-2 pr-1 pl-4"
            type="button"
            @click="handleScrollButtonClicked('right')"
        >
            <ChevronRightIcon class="size-5 rounded-full text-content hover:bg-zinc-100 dark:hover:bg-zinc-300/25" />
        </button>
    </div>
</template>
