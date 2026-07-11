// ── External Dependencies & Registrations
import { ref } from 'vue';

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

const APPEARANCE_OBSERVER = new MutationObserver(handleAppearanceChange);
const MEDIA_QUERY = matchMedia('(min-width: 768px)');
const LANDSCAPE_QUERY = matchMedia('(orientation: landscape)');

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

export const contentScrollPosition = ref(0);
export const viewportIsWide = ref(MEDIA_QUERY.matches);
export const appearanceIsDark = ref(document.documentElement.classList.contains('dark'));
export const orientationIsLandscape = ref(LANDSCAPE_QUERY.matches);
export const isPWA = matchMedia('(display-mode: standalone)').matches || matchMedia('(display-mode: fullscreen)').matches;
export const knowledgePaneIsVisible = ref(false); // The knowledge pane is actually rendered (visible) in the layout right now.
export const sessionMenuIsOpen = ref(false); // The session menu overlay is open.
export const workbenchPaneIsVisible = ref(false); // The workbench pane is actually rendered (visible) in the layout right now.

// ── Initialisation ───────────────────────────────────────────────────────────────────────────────────────────────────

// This module is an app-lifetime singleton: listeners are registered once at import and shared by every consumer,
// not tied to any one component's lifecycle, so they intentionally live at the top level rather than in a hook.
// eslint-disable-next-line unicorn/no-top-level-side-effects -- see comment above
MEDIA_QUERY.addEventListener('change', handleMediaQueryChange);
// eslint-disable-next-line unicorn/no-top-level-side-effects -- see comment above
LANDSCAPE_QUERY.addEventListener('change', handleLandscapeQueryChange);
// eslint-disable-next-line unicorn/no-top-level-side-effects -- see comment above
APPEARANCE_OBSERVER.observe(document.documentElement, { attributeFilter: ['class'] });
if (import.meta.hot) {
    import.meta.hot.dispose(() => {
        MEDIA_QUERY.removeEventListener('change', handleMediaQueryChange); // Dispose runs when module is about to be replaced.
        LANDSCAPE_QUERY.removeEventListener('change', handleLandscapeQueryChange);
        APPEARANCE_OBSERVER.disconnect();
    });
}

// ── Event Handlers ───────────────────────────────────────────────────────────────────────────────────────────────────

function handleAppearanceChange(): void {
    appearanceIsDark.value = document.documentElement.classList.contains('dark');
}

function handleLandscapeQueryChange(event: MediaQueryListEvent): void {
    orientationIsLandscape.value = event.matches;
}

function handleMediaQueryChange(event: MediaQueryListEvent): void {
    viewportIsWide.value = event.matches;
}
