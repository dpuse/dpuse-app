// External Dependencies
import { type DeepReadonly, readonly, type Ref, ref } from 'vue';

// Composable
type DisplayBreakpointInterface = { displayIsWide: DeepReadonly<Ref<boolean>> };
export function useDisplayBreakpoint(): DisplayBreakpointInterface {
    return { displayIsWide: readonly(displayIsWide) };
}

// State ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const mediaQuery = globalThis.matchMedia('(min-width: 768px)');
const displayIsWide = ref(mediaQuery.matches);

// UI Helpers ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function onMediaQueryChange(event: MediaQueryListEvent): void {
    displayIsWide.value = event.matches;
}
mediaQuery.addEventListener('change', onMediaQueryChange);
if (import.meta.hot) import.meta.hot.dispose(() => mediaQuery.removeEventListener('change', onMediaQueryChange));
