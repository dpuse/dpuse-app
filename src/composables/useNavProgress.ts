// External Dependencies
import { type DeepReadonly, readonly, type Ref, ref } from 'vue';

// Composable
type NavProgressInterface = { isNavigating: DeepReadonly<Ref<boolean>> };
export function useNavProgress(): NavProgressInterface {
    return { isNavigating: readonly(isNavigating) };
}

// Constants ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const DELAY_MS = 150;
const MIN_VISIBLE_MS = 350;

// Non-Reactive State ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

let showTimer: ReturnType<typeof setTimeout> | null = null;
let hideTimer: ReturnType<typeof setTimeout> | null = null;
let showedAt: number | null = null;

// Reactive State ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const isNavigating = ref(false);

// Actions ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export function startNavigation(): void {
    if (hideTimer != null) {
        clearTimeout(hideTimer);
        hideTimer = null;
    }
    showTimer = setTimeout(() => {
        isNavigating.value = true;
        showedAt = Date.now();
    }, DELAY_MS);
}

export function completeNavigation(): void {
    if (showTimer != null) {
        clearTimeout(showTimer);
        showTimer = null;
    }
    if (!isNavigating.value) return;
    const elapsed = showedAt == null ? MIN_VISIBLE_MS : Date.now() - showedAt;
    const remaining = Math.max(0, MIN_VISIBLE_MS - elapsed);
    hideTimer = setTimeout(() => {
        isNavigating.value = false;
        showedAt = null;
    }, remaining);
}
