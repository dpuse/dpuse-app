<script setup lang="ts">
// ── External Dependencies & Registrations
import { ChevronLeftIcon, ChevronRightIcon } from '@lucide/vue';
import { nextTick, onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue';

// ── Local Framework
import type { LocaleDescription, LocaleLabel, LocalisedConfig } from '@dpuse/dpuse-shared/locale';

// ── Static Components
import Button from '@/components/ui/button/Button.vue';

// ── Options, Props, Slots & Emits ────────────────────────────────────────────────────────────────────────────────────
interface Properties {
    activeTaskId?: string;
    items?: LocalisedConfig<TaskConfig>[];
}
export interface TaskConfig {
    id: string;
    label: LocaleLabel;
    description: LocaleDescription;
    disabled: boolean;
    enableUpTo: number;
    number: number;
    verb?: LocaleLabel;
}
const { activeTaskId, items = [] } = defineProps<Properties>();

defineSlots<{ default(properties: { item: LocalisedConfig<TaskConfig> }): unknown }>();

defineEmits<{ select: [stepConfig: LocalisedConfig<TaskConfig>] }>();

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

const rowElement = ref<HTMLElement | null>(null);
const resizeObserver = shallowRef<ResizeObserver>();
const rowCanScrollLeft = ref(false);
const rowCanScrollRight = ref(false);

// ── Side Effects ─────────────────────────────────────────────────────────────────────────────────────────────────────

onMounted(() => {
    handleUpdateScrollState();
    resizeObserver.value = new ResizeObserver(handleUpdateScrollState);
    if (rowElement.value) resizeObserver.value.observe(rowElement.value);
});

onBeforeUnmount(() => resizeObserver.value?.disconnect());

watch(
    () => items,
    () => nextTick(handleUpdateScrollState)
);

// ── Event Handlers ───────────────────────────────────────────────────────────────────────────────────────────────────

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

function handleUpdateScrollState(): void {
    const row = rowElement.value;
    if (!row) return;
    rowCanScrollLeft.value = row.scrollLeft > 0;
    rowCanScrollRight.value = row.scrollLeft + row.clientWidth < row.scrollWidth - 1;
}
</script>

<template>
    <div class="relative" data-region="TaskBar">
        <div ref="rowElement" class="flex min-w-0 flex-1 gap-x-1 overflow-x-auto overscroll-x-none border-b border-separator" @scroll="handleUpdateScrollState">
            <component
                :is="item.disabled ? 'div' : Button"
                v-for="item in items"
                :key="item.id"
                :aria-selected="activeTaskId === item.id"
                class="border-y-2 border-b-transparent py-2"
                :class="{
                    'border-t-accent': activeTaskId === item.id || !item.disabled,
                    'border-t-zinc-300 dark:border-t-zinc-500': item.disabled
                }"
                role="tab"
                shape="minimal"
                :to="!item.disabled && item.id != null ? { name: item.id, query: { ...$route.query, sView: item.id } } : undefined"
                @click="$emit('select', item)"
            >
                <div
                    class="flex items-center gap-x-1.5 pr-2 text-sm"
                    :class="{
                        'text-accent': activeTaskId === item.id || !item.disabled,
                        'text-subtle': item.disabled
                    }"
                >
                    <div
                        class="flex size-6 items-center justify-center rounded-full border-[1.5px] text-xs font-bold"
                        :class="{ 'border-accent': activeTaskId === item.id || !item.disabled, 'border-zinc-300 text-subtle dark:border-zinc-500': item.disabled }"
                    >
                        {{ item.number }}
                    </div>

                    <div class="flex flex-col leading-none sm:flex-row sm:gap-x-1">
                        <span>{{ item.verb }}</span>
                        <span>{{ item.label }}</span>
                    </div>
                </div>
            </component>
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
