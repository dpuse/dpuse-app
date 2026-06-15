// External Dependencies & Registrations
import { ref } from 'vue';

// Constants ───────────────────────────────────────────────────────────────────────────────────────────────────────────

const VISIBLE_DELAY_MS = 150;
const MIN_VISIBLE_MS = 350;

// State ───────────────────────────────────────────────────────────────────────────────────────────────────────────────

export const isNavigationActive = ref(false);
export const isNavigationDelayed = ref(false);

let showTimer: ReturnType<typeof setTimeout> | null = null;
let hideTimer: ReturnType<typeof setTimeout> | null = null;
let showedAt: number | null = null;

// Actions ─────────────────────────────────────────────────────────────────────────────────────────────────────────────

export function start(): void {
    clearTimers();
    isNavigationActive.value = true;
    isNavigationDelayed.value = false;
    showTimer = setTimeout(() => {
        showTimer = null;
        isNavigationDelayed.value = true;
        showedAt = Date.now();
    }, VISIBLE_DELAY_MS);
}

export function complete(): void {
    clearTimers();
    if (!isNavigationDelayed.value) {
        isNavigationActive.value = false;
        return;
    }
    const remaining = Math.max(0, MIN_VISIBLE_MS - (Date.now() - showedAt!));
    hideTimer = setTimeout(() => {
        hideTimer = null;
        reset();
    }, remaining);
}

export function fail(): void {
    clearTimers();
    reset();
}

// Helpers ─────────────────────────────────────────────────────────────────────────────────────────────────────────────

function clearTimers(): void {
    if (showTimer != null) {
        clearTimeout(showTimer);
        showTimer = null;
    }
    if (hideTimer != null) {
        clearTimeout(hideTimer);
        hideTimer = null;
    }
}

function reset(): void {
    isNavigationActive.value = false;
    isNavigationDelayed.value = false;
    showedAt = null;
}
