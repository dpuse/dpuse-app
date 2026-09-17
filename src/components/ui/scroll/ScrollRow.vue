<script setup lang="ts">
// ── External Dependencies & Registrations
import { ChevronLeftIcon, ChevronRightIcon } from '@lucide/vue';
import { onBeforeUnmount, onMounted, onUpdated, ref, shallowRef, useTemplateRef } from 'vue';

// ── Local Framework
import { t } from '@/state/locale';
import { TEXT } from './ScrollRow_.json';

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

// The width of an arrow button in pixels: 20px of padding plus a 20px icon. Update it if the button's classes change.
// The row uses it as scroll padding, so an item scrolled into view stops clear of the arrow.
const ARROW_BUTTON_WIDTH = 40;

// ── Options, Props, Slots & Emits ────────────────────────────────────────────────────────────────────────────────────

const { rowClass } = defineProps<{
    rowClass?: string; // Extra classes for the row, such as the gap between items.
}>();

defineSlots<{
    default(): unknown; // The items. Each one must be its own element, because the arrows scroll one item at a time.
}>();

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

const rowCanScrollLeft = ref(false);
const rowCanScrollRight = ref(false);
const rowElement = useTemplateRef<HTMLDivElement>('row');
const rowResizeObserver = shallowRef<ResizeObserver>();

// ── Side Effects ─────────────────────────────────────────────────────────────────────────────────────────────────────

onMounted(() => {
    updateScrollState();
    rowResizeObserver.value = new ResizeObserver(updateScrollState);
    if (rowElement.value) rowResizeObserver.value.observe(rowElement.value);
});

// The items can change without the row changing size, for example when an item is added or the language changes.
// This runs after the new items are on screen, so the arrows are checked again.
onUpdated(updateScrollState);

onBeforeUnmount(() => {
    rowResizeObserver.value?.disconnect();
});

// ── Event Handlers ───────────────────────────────────────────────────────────────────────────────────────────────────

function handleScroll(): void {
    updateScrollState();
}

function handleScrollRow(direction: 'left' | 'right'): void {
    const row = rowElement.value;
    if (!row) return;
    const item = findHiddenItem(row, direction);
    // The row's scroll padding makes the browser stop the item just clear of the arrow button.
    if (item) item.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
    // No item runs past the edge, but an item can still be covered by the arrow button, so scroll all the way.
    else row.scrollTo({ behavior: 'smooth', left: direction === 'right' ? row.scrollWidth : 0 });
}

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

// Finds the nearest item that runs past the row's edge on the given side, so it is partly or completely hidden.
function findHiddenItem(row: HTMLElement, direction: 'left' | 'right'): HTMLElement | undefined {
    const rowBox = row.getBoundingClientRect();
    const items = [...row.children] as HTMLElement[];

    // Each check allows 1px, because item positions can be fractions of a pixel.
    if (direction === 'right') return items.find((item) => item.getBoundingClientRect().right > rowBox.right + 1);
    return items.findLast((item) => item.getBoundingClientRect().left < rowBox.left - 1);
}

function updateScrollState(): void {
    const row = rowElement.value;
    if (!row) return;
    rowCanScrollLeft.value = row.scrollLeft > 0;
    // Allows 1px, because the row's scroll position can be a fraction of a pixel short of the end.
    rowCanScrollRight.value = row.scrollLeft + row.clientWidth < row.scrollWidth - 1;
}
</script>

<template>
    <div class="relative flex" data-region="ScrollRow">
        <!-- 'overscroll-x-none' stops a swipe that reaches either end from moving the page, for example going back a page.
             The scrollbar is hidden because the arrow buttons replace it. People can still swipe to scroll. -->
        <div
            ref="row"
            class="flex min-w-0 flex-1 scrollbar-none overflow-x-auto overscroll-x-none border-b border-separator px-4"
            :class="rowClass"
            :style="{ scrollPaddingInline: `${ARROW_BUTTON_WIDTH}px` }"
            @scroll="handleScroll"
        >
            <slot />
        </div>

        <!-- 'bottom-px' leaves out the row's 1px bottom border, so each arrow is centred on the items. -->
        <button
            v-if="rowCanScrollLeft"
            :aria-label="t(TEXT, 'scrollLeft.aria')"
            class="absolute top-0 bottom-px left-0 flex items-center bg-linear-to-r from-surface to-transparent py-2 pr-4 pl-1"
            type="button"
            @click="handleScrollRow('left')"
        >
            <ChevronLeftIcon class="size-5 rounded-full text-content hover:bg-zinc-100 dark:hover:bg-zinc-300/25" />
        </button>

        <button
            v-if="rowCanScrollRight"
            :aria-label="t(TEXT, 'scrollRight.aria')"
            class="absolute top-0 right-0 bottom-px flex items-center bg-linear-to-l from-surface to-transparent py-2 pr-1 pl-4"
            type="button"
            @click="handleScrollRow('right')"
        >
            <ChevronRightIcon class="size-5 rounded-full text-content hover:bg-zinc-100 dark:hover:bg-zinc-300/25" />
        </button>
    </div>
</template>
