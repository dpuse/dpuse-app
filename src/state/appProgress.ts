// External Dependencies
import { createLoadingState } from '@/state/loading';

// State ───────────────────────────────────────────────────────────────────────────────────────────────────────────────

export const navLoadingState = createLoadingState({
    visibleDelayMs: 150,
    minVisibleMs: 350
});
