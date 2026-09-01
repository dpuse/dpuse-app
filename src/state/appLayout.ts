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
// 'resize' only, deliberately. 'scroll' fires for every pan and rubber-band of the visual viewport, and resizing the
// shell on those would move the focused box continuously under a caret that does not follow it.
// eslint-disable-next-line unicorn/no-top-level-side-effects -- see comment above
VISUAL_VIEWPORT?.addEventListener('resize', handleVisualViewportChange);
// eslint-disable-next-line unicorn/no-top-level-side-effects -- the shell has to be sized before first paint.
publishViewportHeight();
if (import.meta.hot) {
    import.meta.hot.dispose(() => {
        MEDIA_QUERY.removeEventListener('change', handleMediaQueryChange); // Dispose runs when module is about to be replaced.
        LANDSCAPE_QUERY.removeEventListener('change', handleLandscapeQueryChange);
        APPEARANCE_OBSERVER.disconnect();
        VISUAL_VIEWPORT?.removeEventListener('resize', handleVisualViewportChange);
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
    publishViewportHeight();
}

// ── Helpers ───────────────────────────────────────────────────────────────────────────────────────────────────────────

// iOS shrinks the visual viewport for the on-screen keyboard but leaves the layout viewport alone, so every CSS
// length — 'dvh' included — still measures a screen the keyboard is covering part of. Publishing the visible height
// as a variable is what lets the shell be laid out at the size it can actually occupy.
//
// The shell is sized rather than the composer inside it being offset, and the difference is the whole point. WebKit
// composites the text caret as an overlay positioned when focus or selection changes, and it does not follow an
// element that moves for any other reason. Offsetting the composer moved a focused box, and stranded the caret every
// time. Resizing the shell moves nothing inside it: the composer stays at the bottom of its container, and the
// container is simply the right height. One reflow when the keyboard appears, rather than motion under the caret.
//
// 'offsetTop' is deliberately not part of this. It tracks Safari panning the viewport, which happens on every scroll
// rather than only when the keyboard moves, and answering it would put the motion back.
function publishViewportHeight(): void {
    if (!VISUAL_VIEWPORT) return; // The stylesheet's own '100dvh' stands, which is the best available without this API.
    // Rounded because subpixel values jitter the layout on every reflow.
    document.documentElement.style.setProperty('--viewport-height', `${String(Math.round(VISUAL_VIEWPORT.height))}px`);
}
