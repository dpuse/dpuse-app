// External Dependencies
import { createLoadingState } from '~/src/state/loading';

// Constants ───────────────────────────────────────────────────────────────────────────────────────────────────────────

// State - Navigation ──────────────────────────────────────────────────────────────────────────────────────────────────

export const navLoadingState = createLoadingState({
    visibleDelayMs: 150,
    minVisibleMs: 350
});

// Backward-compat alias consumed by ProgressBar.vue.
export const isNavigating = navLoadingState.isLoading;

// Consumed by component.ts to detect whether a chunk error occurred during navigation.
export const isRouteChanging = navLoadingState.isBlocking;

// State - Busy ────────────────────────────────────────────────────────────────────────────────────────────────────────

export const busyLoadingState = createLoadingState({
    visibleDelayMs: 200,
    minVisibleMs: 350
});

// Counter-based so concurrent async loads don't cancel each other.
let busyCount = 0;

// Actions - Navigation ────────────────────────────────────────────────────────────────────────────────────────────────

export function startNavigation(): void {
    navLoadingState.start();
}

export function completeNavigation(): void {
    navLoadingState.complete();
}

export function failNavigation(): void {
    navLoadingState.fail();
}

// Actions - Busy ─────────────────────────────────────────────────────────────────────────────────────────────────────

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
