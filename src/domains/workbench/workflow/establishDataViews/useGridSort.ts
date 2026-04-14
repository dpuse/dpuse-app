import { computed, type ComputedRef, onUnmounted, type Ref, ref } from 'vue';

// ─── Public Types ─────────────────────────────────────────────────────────────

export interface SortDisplayItem {
    name: string;
    isDragging: boolean;
}

// ─── Internal Types ───────────────────────────────────────────────────────────

interface PendingDrag {
    sourceName: string;
    sourceIndex: number;
    pointerId: number;
    startX: number;
    startY: number;
}

interface ActiveDrag extends PendingDrag {
    overIndex: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const DISTANCE_THRESHOLD = 5; // px before drag activates
const EDGE_ZONE = 60; // px from scroll container edge to start auto-scroll
const MAX_SCROLL_SPEED = 15; // px per animation frame at full edge proximity

// ─── Composable ───────────────────────────────────────────────────────────────

export function useGridSort(options: {
    items: () => string[];
    onReorder: (newOrder: string[]) => void;
    containerElement: Ref<HTMLElement | null>;
    scrollElement?: Ref<HTMLElement | null>;
}): {
    displayItems: ComputedRef<SortDisplayItem[]>;
    onHandlePointerDown: (event: PointerEvent, name: string) => void;
} {
    const pendingDrag = ref<PendingDrag | null>(null);
    const activeDrag = ref<ActiveDrag | null>(null);

    // ── Display items ──────────────────────────────────────────────────────────
    // During drag the source tile moves to overIndex (dimmed), other tiles FLIP.
    // No separate placeholder element is needed — the dimmed source IS the slot.

    const displayItems = computed<SortDisplayItem[]>(() => {
        const items = options.items();
        if (!activeDrag.value) return items.map((name) => ({ name, isDragging: false }));

        const { sourceName, overIndex } = activeDrag.value;
        const withoutSource = items.filter((name) => name !== sourceName);
        withoutSource.splice(overIndex, 0, sourceName);
        return withoutSource.map((name) => ({ name, isDragging: name === sourceName }));
    });

    // ── Drag start ─────────────────────────────────────────────────────────────

    function onHandlePointerDown(event: PointerEvent, name: string): void {
        // Only handle primary pointer; ignore secondary touches and non-left mouse buttons
        if (!event.isPrimary) return;
        if (event.pointerType === 'mouse' && event.button !== 0) return;

        const items = options.items();
        const sourceIndex = items.indexOf(name);
        if (sourceIndex === -1) return;

        pendingDrag.value = {
            sourceName: name,
            sourceIndex,
            pointerId: event.pointerId,
            startX: event.clientX,
            startY: event.clientY
        };

        // Capture the pointer so we receive move/up events even outside the element.
        // Works on both mouse and touch via the Pointer Events API.
        (event.target as Element).setPointerCapture(event.pointerId);

        document.addEventListener('pointermove', onPointerMove, { passive: false });
        document.addEventListener('pointerup', onPointerUp);
        document.addEventListener('pointercancel', onPointerCancel);
        document.addEventListener('keydown', onKeyDown);
        document.addEventListener('contextmenu', onContextMenu);
    }

    // ── Pointer move ───────────────────────────────────────────────────────────

    function onPointerMove(event: PointerEvent): void {
        const pending = pendingDrag.value ?? activeDrag.value;
        if (!pending || event.pointerId !== pending.pointerId) return;

        // Prevent scroll on touch devices while drag is in progress.
        // Requires the listener to be registered with { passive: false }.
        event.preventDefault();

        const dx = event.clientX - pending.startX;
        const dy = event.clientY - pending.startY;

        if (!activeDrag.value) {
            // Distance threshold: absorb small movements so taps still register as clicks
            if (Math.hypot(dx, dy) < DISTANCE_THRESHOLD) return;

            // Threshold exceeded — transition to active drag
            activeDrag.value = { ...pending, overIndex: pending.sourceIndex };
            pendingDrag.value = null;

            // Prevent text selection for the duration of the drag
            document.body.style.userSelect = 'none';
        }

        updateOverIndex(event.clientX, event.clientY);
        updateEdgeScroll(event.clientY);
    }

    // ── Hit detection ──────────────────────────────────────────────────────────

    function updateOverIndex(clientX: number, clientY: number): void {
        const drag = activeDrag.value;
        if (!drag || !options.containerElement.value) return;

        const { sourceName } = drag;
        const itemsWithoutSource = options.items().filter((name) => name !== sourceName);

        // Query rendered tiles excluding the dimmed source tile
        const tileElements = [...options.containerElement.value.querySelectorAll<HTMLElement>('[data-sort-name]')].filter((element) => element.dataset.sortName !== sourceName);

        if (tileElements.length === 0) return;

        let bestIndex = drag.overIndex;
        let bestDistance = Infinity;

        for (const tileElement of tileElements) {
            const tileName = tileElement.dataset.sortName;
            if (tileName == null) continue;
            const indexInList = itemsWithoutSource.indexOf(tileName);
            if (indexInList === -1) continue;

            const rect = tileElement.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            const distance = Math.hypot(clientX - centerX, clientY - centerY);

            // Before or after this tile? Use X position within the tile to decide,
            // so dragging past the last tile's center reaches the final slot.
            const insertIndex = clientX > centerX ? indexInList + 1 : indexInList;

            if (distance < bestDistance) {
                bestDistance = distance;
                bestIndex = insertIndex;
            }
        }

        drag.overIndex = Math.max(0, Math.min(bestIndex, itemsWithoutSource.length));
    }

    // ── Edge scroll ────────────────────────────────────────────────────────────

    let scrollFrameId: ReturnType<typeof requestAnimationFrame> | null = null;

    function updateEdgeScroll(clientY: number): void {
        cancelEdgeScroll();

        const scrollElement = options.scrollElement?.value;
        if (!scrollElement) return;

        const rect = scrollElement.getBoundingClientRect();
        const distanceFromTop = clientY - rect.top;
        const distanceFromBottom = rect.bottom - clientY;

        let speed = 0;
        if (distanceFromTop > 0 && distanceFromTop < EDGE_ZONE) {
            speed = -MAX_SCROLL_SPEED * (1 - distanceFromTop / EDGE_ZONE);
        } else if (distanceFromBottom > 0 && distanceFromBottom < EDGE_ZONE) {
            speed = MAX_SCROLL_SPEED * (1 - distanceFromBottom / EDGE_ZONE);
        }

        if (speed === 0) return;

        const scroll = (): void => {
            scrollElement.scrollTop += speed;
            scrollFrameId = requestAnimationFrame(scroll);
        };
        scrollFrameId = requestAnimationFrame(scroll);
    }

    function cancelEdgeScroll(): void {
        if (scrollFrameId !== null) {
            cancelAnimationFrame(scrollFrameId);
            scrollFrameId = null;
        }
    }

    // ── Drag end ───────────────────────────────────────────────────────────────

    function onPointerUp(event: PointerEvent): void {
        const drag = activeDrag.value ?? pendingDrag.value;
        if (!drag || event.pointerId !== drag.pointerId) return;

        if (activeDrag.value) {
            // Commit the new order
            const { sourceName, overIndex } = activeDrag.value;
            const next = options.items().filter((name) => name !== sourceName);
            next.splice(overIndex, 0, sourceName);
            options.onReorder(next);
        }

        endDrag();
    }

    function onPointerCancel(event: PointerEvent): void {
        // iOS fires pointercancel on scroll detection, phone call interruption, etc.
        // Revert silently — activeDrag cleared so displayItems returns to original order.
        const drag = activeDrag.value ?? pendingDrag.value;
        if (!drag || event.pointerId !== drag.pointerId) return;
        endDrag();
    }

    function onKeyDown(event: KeyboardEvent): void {
        if (event.key === 'Escape') endDrag();
    }

    function endDrag(): void {
        pendingDrag.value = null;
        activeDrag.value = null;
        cleanup();
    }

    // ── Cleanup ────────────────────────────────────────────────────────────────

    function cleanup(): void {
        cancelEdgeScroll();
        document.body.style.userSelect = '';
        document.removeEventListener('pointermove', onPointerMove);
        document.removeEventListener('pointerup', onPointerUp);
        document.removeEventListener('pointercancel', onPointerCancel);
        document.removeEventListener('keydown', onKeyDown);
        document.removeEventListener('contextmenu', onContextMenu);
    }

    onUnmounted(cleanup);

    return { displayItems, onHandlePointerDown };
}

function onContextMenu(event: Event): void {
    // Suppress context menu on long-press (iOS and Android)
    event.preventDefault();
}
