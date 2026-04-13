// External Dependencies
import { ref } from 'vue';

// Constants ───────────────────────────────────────────────────────────────────────────────────────────────────────────

const NAV_DELAY_MS = 150;
const NAV_MIN_VISIBLE_MS = 350;
const BUSY_DELAY_MS = 200;

// State ───────────────────────────────────────────────────────────────────────────────────────────────────────────────

// Navigation progress bar state - debounced so fast navigations show nothing.
export const isNavigating = ref(false);

let showTimer: ReturnType<typeof setTimeout> | null = null;
let hideTimer: ReturnType<typeof setTimeout> | null = null;
let showedAt: number | null = null;

// Busy mask state - counter-based so concurrent operations don't cancel each other.
export const isBusy = ref(false);

let busyCount = 0;
let busyTimer: ReturnType<typeof setTimeout> | null = null;

// Actions ─────────────────────────────────────────────────────────────────────────────────────────────────────────────

export function startNavigation(): void {
    if (hideTimer != null) {
        clearTimeout(hideTimer);
        hideTimer = null;
    }
    showTimer = setTimeout(() => {
        isNavigating.value = true;
        showedAt = Date.now();
    }, NAV_DELAY_MS);
}

export function completeNavigation(): void {
    if (showTimer != null) {
        clearTimeout(showTimer);
        showTimer = null;
    }
    if (!isNavigating.value) return;
    const elapsed = showedAt == null ? NAV_MIN_VISIBLE_MS : Date.now() - showedAt;
    const remaining = Math.max(0, NAV_MIN_VISIBLE_MS - elapsed);
    hideTimer = setTimeout(() => {
        isNavigating.value = false;
        showedAt = null;
    }, remaining);
}

// Actions - Busy ─────────────────────────────────────────────────────────────────────────────────────────────────────

export function startBusy(): void {
    busyCount++;
    if (busyTimer == null) {
        busyTimer = setTimeout(() => {
            busyTimer = null;
            if (busyCount > 0) isBusy.value = true;
        }, BUSY_DELAY_MS);
    }
}

export function completeBusy(): void {
    busyCount = Math.max(0, busyCount - 1);
    if (busyCount === 0) {
        if (busyTimer != null) {
            clearTimeout(busyTimer);
            busyTimer = null;
        }
        isBusy.value = false;
    }
}
