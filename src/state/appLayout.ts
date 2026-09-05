// ── External Dependencies & Registrations
import { computed, type ComputedRef, ref } from 'vue';

// ── Types ────────────────────────────────────────────────────────────────────────────────────────────────────────────

export type AppPaneId = 'assistant' | 'studio';

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

const APPEARANCE_OBSERVER = new MutationObserver(handleAppearanceChange);
const FULLSCREEN_DISPLAY_MEDIA_QUERY = matchMedia('(display-mode: fullscreen)');
const LANDSCAPE_ORIENTATION_MEDIA_QUERY = matchMedia('(orientation: landscape)');
const STANDALONE_DISPLAY_MEDIA_QUERY = matchMedia('(display-mode: standalone)');
const WIDE_VIEWPORT_MEDIA_QUERY = matchMedia('(min-width: 768px)'); // 768px is Tailwind's 'md'; a template using 'md:' and a script reading 'viewportIsWide' have to agree.

// ── State - Environment ──────────────────────────────────────────────────────────────────────────────────────────────

export const appearanceIsDark = ref(document.documentElement.classList.contains('dark'));
export const isPWA = STANDALONE_DISPLAY_MEDIA_QUERY.matches || FULLSCREEN_DISPLAY_MEDIA_QUERY.matches;
export const orientationIsLandscape = ref(LANDSCAPE_ORIENTATION_MEDIA_QUERY.matches);
export const viewportIsWide = ref(WIDE_VIEWPORT_MEDIA_QUERY.matches);

// ── State - Application Panes ────────────────────────────────────────────────────────────────────────────────────────

export const activeAppPaneId = ref<AppPaneId | undefined>(); // Undefined until the initial URL has been read.
export const assistantPaneIsActive = ref(false);
export const assistantPaneWasActivated = ref(false); // Latches on first activation and never clears; see 'setPaneActiveState'.
export const studioPaneIsActive = ref(false);
export const studioPaneWasActivated = ref(false); // Latches on first activation and never clears; see 'setPaneActiveState'.

// ── State - Session Menu ─────────────────────────────────────────────────────────────────────────────────────────────

export const sessionMenuIsOpen = ref(false);

// ── Derived State ────────────────────────────────────────────────────────────────────────────────────────────────────

// A wide display can show both active panes side by side. A narrow one has room for only one, so being active is not
// enough — the pane also has to be the one in front. 'activeAppPaneId' is what decides that, which is why a pointer, a
// scroll or focus anywhere in a pane claims it: on a narrow display the claim is already true, and on a wide one it
// records which pane the user was last working in, so the narrow layout knows what to show if the display shrinks.
export const assistantPaneIsVisible: ComputedRef<boolean> = computed(() => isPaneVisible('assistant'));
export const studioPaneIsVisible: ComputedRef<boolean> = computed(() => isPaneVisible('studio'));

// ── Initialisation ───────────────────────────────────────────────────────────────────────────────────────────────────

// This module is an app-lifetime singleton: listeners are registered once at import and shared by every consumer,
// not tied to any one component's lifecycle, so they intentionally live at the top level rather than in a hook.
// eslint-disable-next-line unicorn/no-top-level-side-effects -- see comment above
WIDE_VIEWPORT_MEDIA_QUERY.addEventListener('change', handleWideViewportMediaQueryChange);
// eslint-disable-next-line unicorn/no-top-level-side-effects -- see comment above
LANDSCAPE_ORIENTATION_MEDIA_QUERY.addEventListener('change', handleLandscapeOrientationMediaQueryChange);
// eslint-disable-next-line unicorn/no-top-level-side-effects -- see comment above
APPEARANCE_OBSERVER.observe(document.documentElement, { attributeFilter: ['class'] });
if (import.meta.hot) {
    import.meta.hot.dispose(() => {
        WIDE_VIEWPORT_MEDIA_QUERY.removeEventListener('change', handleWideViewportMediaQueryChange); // Dispose runs when module is about to be replaced.
        LANDSCAPE_ORIENTATION_MEDIA_QUERY.removeEventListener('change', handleLandscapeOrientationMediaQueryChange);
        APPEARANCE_OBSERVER.disconnect();
    });
}

// ── Actions ──────────────────────────────────────────────────────────────────────────────────────────────────────────

// The only way a pane's active state is changed. Activating also latches 'wasActivated', which is what 'App.vue' keeps
// the pane mounted on: a hidden pane stays in the DOM behind a 'v-show' so it does not lose what the user had done in
// it. The latch never clears, because a pane that has been open once can be reopened at any time.
export function setPaneActiveState(paneId: AppPaneId, isActive: boolean): void {
    if (paneId === 'assistant') {
        assistantPaneIsActive.value = isActive;
        if (isActive) assistantPaneWasActivated.value = true;
    } else {
        studioPaneIsActive.value = isActive;
        if (isActive) studioPaneWasActivated.value = true;
    }
}

// ── Event Handlers ───────────────────────────────────────────────────────────────────────────────────────────────────

function handleAppearanceChange(): void {
    appearanceIsDark.value = document.documentElement.classList.contains('dark');
}

function handleLandscapeOrientationMediaQueryChange(event: MediaQueryListEvent): void {
    orientationIsLandscape.value = event.matches;
}

function handleWideViewportMediaQueryChange(event: MediaQueryListEvent): void {
    viewportIsWide.value = event.matches;
}

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

function isPaneVisible(paneId: AppPaneId): boolean {
    const isActive = paneId === 'assistant' ? assistantPaneIsActive.value : studioPaneIsActive.value;
    return isActive && (viewportIsWide.value || activeAppPaneId.value === paneId);
}
