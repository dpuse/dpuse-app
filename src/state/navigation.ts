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
    showTimer = setTimeout(() => {
        showTimer = null;
        isLoading.value = true;
        showedAt = Date.now();
    }, VISIBLE_DELAY_MS);
}

export function complete(): void {
    if (showTimer != null) { clearTimeout(showTimer); showTimer = null; }
    if (hideTimer != null) { clearTimeout(hideTimer); hideTimer = null; }
    if (!isLoading.value) { isBlocking.value = false; return; }
    const elapsed = showedAt == null ? MIN_VISIBLE_MS : Date.now() - showedAt;
    const remaining = Math.max(0, MIN_VISIBLE_MS - elapsed);
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
