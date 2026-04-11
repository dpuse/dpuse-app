// External Dependencies
import { ref } from 'vue';

// Constants ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const MEDIA_QUERY = globalThis.matchMedia('(min-width: 768px)');

// State ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const contentScrollTop = ref(0);
export const displayIsWide = ref(MEDIA_QUERY.matches);
export const knowledgePaneIsVisible = ref(false); // The pane is actually rendered in the layout right now.
export const workbenchPaneIsVisible = ref(false); // The pane is actually rendered in the layout right now.

// Initialisation ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

MEDIA_QUERY.addEventListener('change', handleMediaQueryChange);
if (import.meta.hot) {
    import.meta.hot.dispose(() => MEDIA_QUERY.removeEventListener('change', handleMediaQueryChange)); // Dispose runs when module is about to be replaced.
}

// UI Helpers ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function handleMediaQueryChange(event: MediaQueryListEvent): void {
    displayIsWide.value = event.matches;
}
