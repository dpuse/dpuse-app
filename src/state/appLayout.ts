// ── External Dependencies & Registrations
import { ref } from 'vue';

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

const APPEARANCE_OBSERVER = new MutationObserver(handleAppearanceChange);
const MEDIA_QUERY = matchMedia('(min-width: 768px)');
const LANDSCAPE_QUERY = matchMedia('(orientation: landscape)');

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

export const assistantPaneIsVisible = ref(false); // The assistant pane is actually rendered (visible) in the layout right now.
export const contentScrollPosition = ref(0);
export const keyboardInset = ref(0); // How far the on-screen keyboard overlaps the layout viewport; bottom-anchored UI lifts itself by this.
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
// eslint-disable-next-line unicorn/no-top-level-side-effects -- see comment above
window.visualViewport?.addEventListener('resize', handleViewportGeometryChange);
// The visual viewport's own scroll event, not window's: when nothing in the document can scroll (the shell is fixed),
// iOS offsets the visual viewport alone, and only this event reports it.
// eslint-disable-next-line unicorn/no-top-level-side-effects -- see comment above
window.visualViewport?.addEventListener('scroll', handleViewportGeometryChange);
// eslint-disable-next-line unicorn/no-top-level-side-effects, unicorn/prefer-observer-apis -- see comments above
window.addEventListener('scroll', handleViewportGeometryChange);
if (import.meta.hot) {
    import.meta.hot.dispose(() => {
        MEDIA_QUERY.removeEventListener('change', handleMediaQueryChange); // Dispose runs when module is about to be replaced.
        LANDSCAPE_QUERY.removeEventListener('change', handleLandscapeQueryChange);
        APPEARANCE_OBSERVER.disconnect();
        window.visualViewport?.removeEventListener('resize', handleViewportGeometryChange);
        window.visualViewport?.removeEventListener('scroll', handleViewportGeometryChange);
        window.removeEventListener('scroll', handleViewportGeometryChange);
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

// iOS overlays the keyboard rather than resizing the layout viewport, and scrolls or offsets the viewport to reveal
// the focused field. With a 'fixed inset-0' shell nothing legitimate ever scrolls, and WebKit paints the caret offset
// by that scroll — outside the field (WebKit bug 176896) — so the scroll is undone here, and the keyboard's overlap is
// published instead for bottom-anchored UI to lift itself clear. 'offsetTop' covers the offset the scroll pin cannot
// reach: iOS can shift the visual viewport without any document scroll. Guarded against pinch zoom (which also shrinks
// the visual viewport) rather than by it: focus auto-zoom is already prevented by 'maximum-scale=1' in index.html, so
// a scale above 1 here is a deliberate user zoom, where no lift is wanted.
function handleViewportGeometryChange(): void {
    if (window.scrollX !== 0 || window.scrollY !== 0) window.scrollTo(0, 0);
    const viewport = window.visualViewport;
    if (!viewport) return;
    keyboardInset.value = viewport.scale > 1 ? 0 : Math.max(0, Math.round(window.innerHeight - viewport.height - viewport.offsetTop));
}
