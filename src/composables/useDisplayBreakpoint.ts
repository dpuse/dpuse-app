import { readonly, ref } from 'vue';

const mediaQuery = globalThis.matchMedia('(min-width: 768px)');
const displayIsWide = ref(mediaQuery.matches);
mediaQuery.addEventListener('change', (event: MediaQueryListEvent) => (displayIsWide.value = event.matches));

export function useDisplayBreakpoint() {
    return { displayIsWide: readonly(displayIsWide) };
}
