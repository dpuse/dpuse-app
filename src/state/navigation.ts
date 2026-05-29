// External Dependencies
import { ref } from 'vue';

// Constants ───────────────────────────────────────────────────────────────────────────────────────────────────────────

const VISIBLE_DELAY_MS = 150;
const MIN_VISIBLE_MS = 350;

// State ───────────────────────────────────────────────────────────────────────────────────────────────────────────────

export const isBlocking = ref(false);
export const isLoading = ref(false);

let showTimer: ReturnType<typeof setTimeout> | null = null;
let hideTimer: ReturnType<typeof setTimeout> | null = null;
let showedAt: number | null = null;

// Actions ─────────────────────────────────────────────────────────────────────────────────────────────────────────────

export function start(): void {
    clearTimers();
    isBlocking.value = true;
    isLoading.value = false;
    showTimer = setTimeout(() => {
        showTimer = null;
        isLoading.value = true;
        showedAt = Date.now();
    }, VISIBLE_DELAY_MS);
}

export function complete(): void {
    clearTimers();
    if (!isLoading.value) { isBlocking.value = false; return; }
    const remaining = Math.max(0, MIN_VISIBLE_MS - (Date.now() - showedAt!));
    hideTimer = setTimeout(() => { hideTimer = null; reset(); }, remaining);
}

export function fail(): void {
    clearTimers();
    reset();
}

// Helpers ─────────────────────────────────────────────────────────────────────────────────────────────────────────────

function clearTimers(): void {
    if (showTimer != null) { clearTimeout(showTimer); showTimer = null; }
    if (hideTimer != null) { clearTimeout(hideTimer); hideTimer = null; }
}

function reset(): void {
    isBlocking.value = false;
    isLoading.value = false;
    showedAt = null;
}
