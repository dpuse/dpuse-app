// External Dependencies
import { ref } from 'vue';

// Constants ───────────────────────────────────────────────────────────────────────────────────────────────────────────

const APPEARANCE_OBSERVER = new MutationObserver(handleAppearanceChange);
const MEDIA_QUERY = globalThis.matchMedia('(min-width: 768px)');
const LANDSCAPE_QUERY = globalThis.matchMedia('(orientation: landscape)');

// State ───────────────────────────────────────────────────────────────────────────────────────────────────────────────

export const contentScrollPosition = ref(0);
export const displayIsWide = ref(MEDIA_QUERY.matches);
export const isDarkMode = ref(document.documentElement.classList.contains('dark'));
export const isLandscape = ref(LANDSCAPE_QUERY.matches);
export const isPWA = globalThis.matchMedia('(display-mode: standalone)').matches || globalThis.matchMedia('(display-mode: fullscreen)').matches;
export const knowledgePaneIsVisible = ref(false); // The knowledge pane is actually rendered (visible) in the layout right now.
export const workbenchPaneIsVisible = ref(false); // The workbench pane is actually rendered (visible) in the layout right now.

// Initialisation ──────────────────────────────────────────────────────────────────────────────────────────────────────

MEDIA_QUERY.addEventListener('change', handleMediaQueryChange);
LANDSCAPE_QUERY.addEventListener('change', handleLandscapeQueryChange);
APPEARANCE_OBSERVER.observe(document.documentElement, { attributeFilter: ['class'] });
if (import.meta.hot) {
    import.meta.hot.dispose(() => {
        MEDIA_QUERY.removeEventListener('change', handleMediaQueryChange); // Dispose runs when module is about to be replaced.
        LANDSCAPE_QUERY.removeEventListener('change', handleLandscapeQueryChange);
        APPEARANCE_OBSERVER.disconnect();
    });
}

// Handlers ────────────────────────────────────────────────────────────────────────────────────────────────────────────

function handleAppearanceChange(): void {
    isDarkMode.value = document.documentElement.classList.contains('dark');
}

function handleLandscapeQueryChange(event: MediaQueryListEvent): void {
    isLandscape.value = event.matches;
}

function handleMediaQueryChange(event: MediaQueryListEvent): void {
    displayIsWide.value = event.matches;
}
