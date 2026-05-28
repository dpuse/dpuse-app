// External Dependencies
import { createLoadingState } from '@/state/loading';

// State ───────────────────────────────────────────────────────────────────────────────────────────────────────────────

export const busyLoadingState = createLoadingState({
    visibleDelayMs: 200,
    minVisibleMs: 350
});

// Counter-based so concurrent async loads don't cancel each other.
let busyCount = 0;

// Actions ─────────────────────────────────────────────────────────────────────────────────────────────────────────────

export function startBusy(): void {
    busyCount++;
    busyLoadingState.start();
}

export function completeBusy(): void {
    busyCount = Math.max(0, busyCount - 1);
    if (busyCount === 0) busyLoadingState.complete();
}

export function failBusy(): void {
    busyCount = 0;
    busyLoadingState.fail();
}
