import type { Ref } from 'vue';
import { onMounted, onUnmounted } from 'vue';

const LOCK_THRESHOLD_PX = 4;
// How long (ms) the axis lock is held after a touchend before it resets.
// Allows rapid multi-swipe in the same direction without re-evaluating axis.
const LOCK_HYSTERESIS_MS = 200;
// Ratio by which a new gesture must contradict the inherited lock to override it immediately.
const OVERRIDE_RATIO = 3;

/**
 * Locks a scroll container to a single axis (horizontal or vertical) for the
 * duration of each touch gesture, based on the initial direction of movement.
 * Prevents the diagonal drift common on iOS when the user intends to scroll
 * in one direction only.
 *
 * Lock hysteresis: after touchend the axis lock is held for LOCK_HYSTERESIS_MS.
 * A new touchstart within that window inherits the prior lock direction, so
 * rapid multi-swipe in one direction isn't interrupted by off-angle re-plants.
 * A new gesture that strongly contradicts the inherited direction overrides it.
 */
export function useSingleAxisScroll(scrollElement: Ref<HTMLElement | null>): void {
    let startX = 0;
    let startY = 0;
    let scrollLeftAtStart = 0;
    let scrollTopAtStart = 0;
    let lockedAxis: 'x' | 'y' | null = null; // null = not yet determined this gesture
    let inheritedAxis: 'x' | 'y' | null = null; // carried over from previous gesture via hysteresis
    let hysteresisTimer: ReturnType<typeof setTimeout> | null = null;

    function applyLock(target: HTMLElement, axis: 'x' | 'y'): void {
        lockedAxis = axis;
        inheritedAxis = axis;
        if (axis === 'x') {
            target.style.overflowY = 'hidden';
            target.style.overflowX = '';
            target.scrollTop = scrollTopAtStart;
        } else {
            target.style.overflowX = 'hidden';
            target.style.overflowY = '';
            target.scrollLeft = scrollLeftAtStart;
        }
    }

    function clearLock(target: HTMLElement): void {
        lockedAxis = null;
        target.style.overflowX = '';
        target.style.overflowY = '';
    }

    function onTouchStart(event: TouchEvent): void {
        const touch = event.touches[0];
        startX = touch.clientX;
        startY = touch.clientY;
        scrollLeftAtStart = scrollElement.value?.scrollLeft ?? 0;
        scrollTopAtStart = scrollElement.value?.scrollTop ?? 0;
        lockedAxis = null;

        // Cancel the hysteresis timer — a new gesture has started.
        if (hysteresisTimer !== null) {
            clearTimeout(hysteresisTimer);
            hysteresisTimer = null;
        }

        // If an inherited axis exists, pre-apply it immediately.
        // The gesture may override it in onTouchMove if strongly contradicted.
        if (inheritedAxis !== null && scrollElement.value) {
            applyLock(scrollElement.value, inheritedAxis);
        }
    }

    function onTouchMove(event: TouchEvent): void {
        const target = scrollElement.value;
        if (!target) return;

        const touch = event.touches[0];
        const deltaX = Math.abs(touch.clientX - startX);
        const deltaY = Math.abs(touch.clientY - startY);

        if (lockedAxis !== null) {
            // Already locked — check whether this gesture strongly contradicts the lock.
            // If so, override immediately rather than fighting the user.
            if (lockedAxis === 'x' && deltaY > deltaX * OVERRIDE_RATIO) applyLock(target, 'y');
            else if (lockedAxis === 'y' && deltaX > deltaY * OVERRIDE_RATIO) applyLock(target, 'x');
            return;
        }

        // Not yet locked — wait for threshold before committing.
        if (deltaX < LOCK_THRESHOLD_PX && deltaY < LOCK_THRESHOLD_PX) return;
        applyLock(target, deltaX > deltaY ? 'x' : 'y');
    }

    function onTouchEnd(): void {
        const target = scrollElement.value;
        if (!target) return;

        // Release the overflow constraint immediately so momentum scrolling works.
        clearLock(target);

        // Hold inheritedAxis for LOCK_HYSTERESIS_MS. If a new touchstart fires
        // within this window it will inherit the direction; otherwise it resets.
        hysteresisTimer = setTimeout(() => {
            inheritedAxis = null;
            hysteresisTimer = null;
        }, LOCK_HYSTERESIS_MS);
    }

    onMounted(() => {
        const target = scrollElement.value;
        if (!target) return;
        target.addEventListener('touchstart', onTouchStart, { passive: true });
        target.addEventListener('touchmove', onTouchMove, { passive: true });
        target.addEventListener('touchend', onTouchEnd, { passive: true });
        target.addEventListener('touchcancel', onTouchEnd, { passive: true });
    });

    onUnmounted(() => {
        const target = scrollElement.value;
        if (!target) return;
        target.removeEventListener('touchstart', onTouchStart);
        target.removeEventListener('touchmove', onTouchMove);
        target.removeEventListener('touchend', onTouchEnd);
        target.removeEventListener('touchcancel', onTouchEnd);
        if (hysteresisTimer !== null) clearTimeout(hysteresisTimer);
    });
}
