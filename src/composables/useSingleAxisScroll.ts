import type { Ref } from 'vue';
import { onMounted, onUnmounted } from 'vue';

const LOCK_THRESHOLD_PX = 4;

/**
 * Locks a scroll container to a single axis (horizontal or vertical) for the
 * duration of each touch gesture, based on the initial direction of movement.
 * Prevents the diagonal drift common on iOS when the user intends to scroll
 * in one direction only.
 *
 * On lock, the non-dominant axis scroll position is restored to its value at
 * touchstart, undoing any drift that accumulated within the threshold window.
 */
export function useSingleAxisScroll(scrollElement: Ref<HTMLElement | null>): void {
    let startX = 0;
    let startY = 0;
    let scrollLeftAtStart = 0;
    let scrollTopAtStart = 0;
    let locked = false;

    function onTouchStart(event: TouchEvent): void {
        const touch = event.touches[0];
        startX = touch.clientX;
        startY = touch.clientY;
        scrollLeftAtStart = scrollElement.value?.scrollLeft ?? 0;
        scrollTopAtStart = scrollElement.value?.scrollTop ?? 0;
        locked = false;
    }

    function onTouchMove(event: TouchEvent): void {
        if (locked || !scrollElement.value) return;
        const touch = event.touches[0];
        const deltaX = Math.abs(touch.clientX - startX);
        const deltaY = Math.abs(touch.clientY - startY);
        if (deltaX < LOCK_THRESHOLD_PX && deltaY < LOCK_THRESHOLD_PX) return;
        locked = true;
        if (deltaX > deltaY) {
            // Horizontal intent — lock vertical and restore any vertical drift.
            scrollElement.value.style.overflowY = 'hidden';
            scrollElement.value.scrollTop = scrollTopAtStart;
        } else {
            // Vertical intent — lock horizontal and restore any horizontal drift.
            scrollElement.value.style.overflowX = 'hidden';
            scrollElement.value.scrollLeft = scrollLeftAtStart;
        }
    }

    function onTouchEnd(): void {
        if (!scrollElement.value) return;
        scrollElement.value.style.overflowX = '';
        scrollElement.value.style.overflowY = '';
        locked = false;
    }

    onMounted(() => {
        const element = scrollElement.value;
        if (!element) return;
        element.addEventListener('touchstart', onTouchStart, { passive: true });
        element.addEventListener('touchmove', onTouchMove, { passive: true });
        element.addEventListener('touchend', onTouchEnd, { passive: true });
        element.addEventListener('touchcancel', onTouchEnd, { passive: true });
    });

    onUnmounted(() => {
        const element = scrollElement.value;
        if (!element) return;
        element.removeEventListener('touchstart', onTouchStart);
        element.removeEventListener('touchmove', onTouchMove);
        element.removeEventListener('touchend', onTouchEnd);
        element.removeEventListener('touchcancel', onTouchEnd);
    });
}
