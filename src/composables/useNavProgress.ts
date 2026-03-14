// External Dependencies
import { type DeepReadonly, readonly, type Ref, ref } from 'vue';

// Composable
type NavProgressInterface = { isNavigating: DeepReadonly<Ref<boolean>> };
export function useNavProgress(): NavProgressInterface {
    return { isNavigating: readonly(isNavigating) };
}

// State ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const isNavigating = ref(false);

// Actions ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export function startNavigation(): void {
    isNavigating.value = true;
}

export function completeNavigation(): void {
    isNavigating.value = false;
}
