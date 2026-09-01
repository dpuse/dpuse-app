// ── External Dependencies & Registrations
import { ref } from 'vue';

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

const APPEARANCE_OBSERVER = new MutationObserver(handleAppearanceChange);
const MEDIA_QUERY = matchMedia('(min-width: 768px)');
const LANDSCAPE_QUERY = matchMedia('(orientation: landscape)');
const VISUAL_VIEWPORT = window.visualViewport;

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

export const assistantPaneIsVisible = ref(false); // The assistant pane is actually rendered (visible) in the layout right now.
export const contentScrollPosition = ref(0);
export const keyboardInset = ref(establishKeyboardInset()); // Screen the on-screen keyboard takes from the bottom of the layout viewport.
export const viewportIsWide = ref(MEDIA_QUERY.matches);
export const appearanceIsDark = ref(document.documentElement.classList.contains('dark'));
export const orientationIsLandscape = ref(LANDSCAPE_QUERY.matches);
export const isPWA = matchMedia('(display-mode: standalone)').matches || matchMedia('(display-mode: fullscreen)').matches;
export const sessionMenuIsOpen = ref(false); // The session menu overlay is open.
export const studioPaneIsVisible = ref(false); // The studio pane is actually rendered (visible) in the layout right now.

// ── Initialisation ───────────────────────────────────────────────────────────────────────────────────────────────────

// This module is an app-lifetime singleton: listeners are registered once at import and shared by every consumer,
// not tied to any one component's lifecycle, so they intentionally live at the top level rather than in a hook.
// eslint-disable-next-line unicorn/no-top-level-side-effects -- see comment above
MEDIA_QUERY.addEventListener('change', handleMediaQueryChange);
// eslint-disable-next-line unicorn/no-top-level-side-effects -- see comment above
LANDSCAPE_QUERY.addEventListener('change', handleLandscapeQueryChange);
// eslint-disable-next-line unicorn/no-top-level-side-effects -- see comment above
APPEARANCE_OBSERVER.observe(document.documentElement, { attributeFilter: ['class'] });
// Both events matter: 'resize' is the keyboard opening or closing, 'scroll' is Safari panning the visual viewport
// to keep the focused field in sight, which moves the inset without changing any height.
// eslint-disable-next-line unicorn/no-top-level-side-effects -- see comment above
VISUAL_VIEWPORT?.addEventListener('resize', handleVisualViewportChange);
// eslint-disable-next-line unicorn/no-top-level-side-effects -- see comment above
VISUAL_VIEWPORT?.addEventListener('scroll', handleVisualViewportChange);
if (import.meta.hot) {
    import.meta.hot.dispose(() => {
        MEDIA_QUERY.removeEventListener('change', handleMediaQueryChange); // Dispose runs when module is about to be replaced.
        LANDSCAPE_QUERY.removeEventListener('change', handleLandscapeQueryChange);
        APPEARANCE_OBSERVER.disconnect();
        VISUAL_VIEWPORT?.removeEventListener('resize', handleVisualViewportChange);
        VISUAL_VIEWPORT?.removeEventListener('scroll', handleVisualViewportChange);
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

function handleVisualViewportChange(): void {
    keyboardInset.value = establishKeyboardInset();
}

// ── Helpers ───────────────────────────────────────────────────────────────────────────────────────────────────────────

// iOS does not shrink the layout viewport for the keyboard, so a bottom-anchored element sits behind it and Safari
// compensates by panning the visual viewport instead — by an amount nothing reads back. Derived here rather than
// left implicit: the gap between the bottom of the visual viewport and the bottom of the layout viewport is exactly
// how far such an element has to lift to clear the keyboard. Rounded because subpixel values jitter the layout.
function establishKeyboardInset(): number {
    if (!VISUAL_VIEWPORT) return 0;
    return Math.max(0, Math.round(window.innerHeight - VISUAL_VIEWPORT.height - VISUAL_VIEWPORT.offsetTop));
}
