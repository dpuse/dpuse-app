// ── External Dependencies & Registrations
import { ref } from 'vue';

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

const VISIBLE_DELAY_MS = 150;
const MIN_VISIBLE_MS = 350;

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

export const navigationIsActive = ref(false);
export const navigationIsDelayed = ref(false);

const state: { showTimer: ReturnType<typeof setTimeout> | null; hideTimer: ReturnType<typeof setTimeout> | null; showedAt: number | null } = {
    showTimer: null,
    hideTimer: null,
    showedAt: null
};

// ── Actions ──────────────────────────────────────────────────────────────────────────────────────────────────────────

export function start(): void {
    clearTimers();
    navigationIsActive.value = true;
    navigationIsDelayed.value = false;
    state.showTimer = setTimeout(() => {
        state.showTimer = null;
        navigationIsDelayed.value = true;
        state.showedAt = Date.now();
    }, VISIBLE_DELAY_MS);
}

export function complete(): void {
    clearTimers();
    if (!navigationIsDelayed.value) {
        navigationIsActive.value = false;
        return;
    }
    const remaining = Math.max(0, MIN_VISIBLE_MS - (Date.now() - state.showedAt!));
    state.hideTimer = setTimeout(() => {
        state.hideTimer = null;
        reset();
    }, remaining);
}

export function fail(): void {
    clearTimers();
    reset();
}

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

function clearTimers(): void {
    if (state.showTimer != null) {
        clearTimeout(state.showTimer);
        state.showTimer = null;
    }
    if (state.hideTimer != null) {
        clearTimeout(state.hideTimer);
        state.hideTimer = null;
    }
}

function reset(): void {
    navigationIsActive.value = false;
    navigationIsDelayed.value = false;
    state.showedAt = null;
}
