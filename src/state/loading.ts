// External Dependencies
import { ref, type Ref } from 'vue';

// Types ───────────────────────────────────────────────────────────────────────────────────────────────────────────────

export interface LoadingStateOptions {
    visibleDelayMs?: number; // How long after start() before the overlay becomes visible. Default: 150.
    minVisibleMs?: number; // Minimum time the overlay stays visible once shown. Default: 350.
}

export interface ReadableLoadingState {
    readonly isBlocking: Ref<boolean>; // True immediately on start() — transparent blocker, any active phase.
    readonly isVisible: Ref<boolean>; // True during loading phase — drives the visible overlay.
}

export interface LoadingState extends ReadableLoadingState {
    readonly isLoading: Ref<boolean>; // True after visibleDelayMs — drives the progress bar (loading phase only).
    start(): void;
    complete(): void;
    fail(): void;
}

// Factory ─────────────────────────────────────────────────────────────────────────────────────────────────────────────

export function createLoadingState({ visibleDelayMs = 150, minVisibleMs = 350 }: LoadingStateOptions = {}): LoadingState {
    const isBlocking = ref(false);
    const isLoading = ref(false);
    const isVisible = ref(false);

    let showTimer: ReturnType<typeof setTimeout> | null = null;
    let hideTimer: ReturnType<typeof setTimeout> | null = null;
    let showedAt: number | null = null;

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

    function resetState(): void {
        isBlocking.value = false;
        isLoading.value = false;
        isVisible.value = false;
        showedAt = null;
    }

    function start(): void {
        clearTimers();
        isBlocking.value = true;
        showTimer = setTimeout(() => {
            showTimer = null;
            isLoading.value = true;
            isVisible.value = true;
            showedAt = Date.now();
        }, visibleDelayMs);
    }

    function complete(): void {
        if (showTimer != null) {
            clearTimeout(showTimer);
            showTimer = null;
        }
        if (!isLoading.value) {
            // Fast navigation completed before the overlay was shown — clear blocker immediately.
            isBlocking.value = false;
            return;
        }
        const elapsed = showedAt == null ? minVisibleMs : Date.now() - showedAt;
        const remaining = Math.max(0, minVisibleMs - elapsed);
        hideTimer = setTimeout(() => {
            hideTimer = null;
            resetState();
        }, remaining);
    }

    function fail(): void {
        resetState();
    }

    return { isBlocking, isLoading, isVisible, start, complete, fail };
}
