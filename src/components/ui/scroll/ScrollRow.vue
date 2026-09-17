<script setup lang="ts">
// ── External Dependencies & Registrations
import { ChevronLeftIcon, ChevronRightIcon } from '@lucide/vue';
import { onBeforeUnmount, onMounted, onUpdated, ref, shallowRef, useTemplateRef } from 'vue';

// ── Local Framework
import { t } from '@/state/locale';
import { TEXT } from './ScrollRow_.json';

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

// The width of an arrow button in pixels: 20px of padding plus a 20px icon. Update it if the button's classes change.
// The arrows use it to stop an item clear of the arrow. The row also uses it as scroll padding, so an item reached with
// the keyboard stops clear of the arrow too.
const ARROW_BUTTON_WIDTH = 40;

// The part of an arrow button that hides what is under it, in pixels: the 20px icon and 4px of padding at the edge.
// The rest of the button is a fade that you can still see through, so an item under only the fade counts as visible.
const ARROW_COVER_WIDTH = 24;

// ── Options, Props, Slots & Emits ────────────────────────────────────────────────────────────────────────────────────

const { keepActiveItemInView, rowClass } = defineProps<{
    keepActiveItemInView?: boolean; // Scrolls the active item into view when the row first shows and whenever it changes.
    rowClass?: string; // Extra classes for the row, such as the gap between items.
}>();

defineSlots<{
    // The items. Each one must be its own element, because the arrows scroll one item at a time. Mark the active item
    // with 'aria-selected="true"' so 'keepActiveItemInView' can find it.
    default(): unknown;
}>();

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

const revealedActiveItem = shallowRef<HTMLElement>(); // The active item last scrolled into view, so it only scrolls again when it changes.
const rowCanScrollLeft = ref(false);
const rowCanScrollRight = ref(false);
const rowElement = useTemplateRef<HTMLDivElement>('row');
const rowResizeObserver = shallowRef<ResizeObserver>();

// ── Side Effects ─────────────────────────────────────────────────────────────────────────────────────────────────────

onMounted(() => {
    updateScrollState();
    revealActiveItem('instant');
    // Web fonts can finish loading after the row first shows, which changes the width of the items, so check again then.
    void document.fonts.ready.then(() => {
        updateScrollState();
        revealedActiveItem.value = undefined;
        revealActiveItem('instant');
    });
    rowResizeObserver.value = new ResizeObserver(updateScrollState);
    if (!rowElement.value) return;
    rowResizeObserver.value.observe(rowElement.value);
    // The row listens for clicks and focus on the items inside it, which are the real buttons and links. The listeners
    // are added here because a click listener on the row itself in the template is flagged as a control with no
    // keyboard support. Focus covers the keyboard: tabbing to an item scrolls it into view too.
    rowElement.value.addEventListener('click', handleRevealItem);
    rowElement.value.addEventListener('focusin', handleRevealItem);
});

// The items can change without the row changing size, for example when an item is added, the language changes or a
// different item becomes active. This runs after the change is on screen.
onUpdated(() => {
    updateScrollState();
    revealActiveItem('smooth');
});

onBeforeUnmount(() => {
    rowResizeObserver.value?.disconnect();
    rowElement.value?.removeEventListener('click', handleRevealItem);
    rowElement.value?.removeEventListener('focusin', handleRevealItem);
});

// ── Event Handlers ───────────────────────────────────────────────────────────────────────────────────────────────────

// An item that is clicked or reached with the keyboard scrolls into view if it is not fully in view.
function handleRevealItem(event: Event): void {
    const row = rowElement.value;
    if (!row || !(event.target instanceof Node)) return;
    const target = event.target;
    const item = ([...row.children] as HTMLElement[]).find((child) => child.contains(target));
    if (item) revealItem(row, item);
}

function handleScroll(): void {
    updateScrollState();
}

function handleScrollRow(direction: 'left' | 'right'): void {
    const row = rowElement.value;
    if (!row) return;
    const item = findHiddenItem(row, direction);
    if (item) revealItem(row, item);
}

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

// Finds the nearest item on the given side that is partly or completely hidden. An item counts as hidden when any of
// its text or icons is under the solid part of the arrow button or past the edge of the row.
function findHiddenItem(row: HTMLElement, direction: 'left' | 'right'): HTMLElement | undefined {
    const rowBox = row.getBoundingClientRect();
    const items = [...row.children] as HTMLElement[];

    // Each check allows 1px, because item positions can be fractions of a pixel.
    if (direction === 'right') {
        const visibleRight = rowBox.right - ARROW_COVER_WIDTH;
        return items.find((item) => measureItemContent(item).right > visibleRight + 1);
    }
    const visibleLeft = rowBox.left + ARROW_COVER_WIDTH;
    return items.findLast((item) => measureItemContent(item).left < visibleLeft - 1);
}

// Measures the left and right edges of an item's text and icons. Empty padding is left out, so an item whose empty
// edge is under an arrow button still counts as visible.
function measureItemContent(item: HTMLElement): { left: number; right: number } {
    const boxes: DOMRect[] = [];
    const range = document.createRange();
    const walker = document.createTreeWalker(item, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT);
    let node = walker.nextNode();
    while (node) {
        if (node instanceof Text && node.data.trim() !== '') {
            range.selectNodeContents(node);
            boxes.push(range.getBoundingClientRect());
        } else if (node instanceof SVGSVGElement) {
            boxes.push(node.getBoundingClientRect());
        }
        node = walker.nextNode();
    }
    if (boxes.length === 0) return item.getBoundingClientRect(); // An item with no text or icons is measured as a whole.
    return { left: Math.min(...boxes.map((box) => box.left)), right: Math.max(...boxes.map((box) => box.right)) };
}

// Scrolls just far enough for the item to be fully in view. Where an arrow button is showing, the item stops clear of
// the whole button, including its fade.
// Scrolls the active item into view if it has changed since it was last scrolled into view.
function revealActiveItem(behavior: ScrollBehavior): void {
    const row = rowElement.value;
    if (!keepActiveItemInView || !row) return;
    const activeItem = row.querySelector<HTMLElement>(':scope > [aria-selected="true"]') ?? undefined;
    if (!activeItem || activeItem === revealedActiveItem.value) return;
    revealedActiveItem.value = activeItem;
    revealItem(row, activeItem, behavior);
}

function revealItem(row: HTMLElement, item: HTMLElement, behavior: ScrollBehavior = 'smooth'): void {
    const itemBox = item.getBoundingClientRect();
    const rowBox = row.getBoundingClientRect();
    const visibleLeft = rowBox.left + (rowCanScrollLeft.value ? ARROW_BUTTON_WIDTH : 0);
    const visibleRight = rowBox.right - (rowCanScrollRight.value ? ARROW_BUTTON_WIDTH : 0);

    // Each check allows 1px, because item positions can be fractions of a pixel.
    if (itemBox.left < visibleLeft - 1) row.scrollBy({ behavior, left: itemBox.left - visibleLeft });
    else if (itemBox.right > visibleRight + 1) row.scrollBy({ behavior, left: itemBox.right - visibleRight });
}

function updateScrollState(): void {
    const row = rowElement.value;
    if (!row) return;
    // An arrow shows only when the row can scroll that way and an item is hidden on that side. Otherwise a click could
    // move the row by only a few pixels, which looks like nothing happened.
    // The right check allows 1px, because the row's scroll position can be a fraction of a pixel short of the end.
    rowCanScrollLeft.value = row.scrollLeft > 0 && findHiddenItem(row, 'left') !== undefined;
    rowCanScrollRight.value = row.scrollLeft + row.clientWidth < row.scrollWidth - 1 && findHiddenItem(row, 'right') !== undefined;
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
