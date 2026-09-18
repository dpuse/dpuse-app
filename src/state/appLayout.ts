// ── External Dependencies & Registrations
import { computed, type ComputedRef, ref } from 'vue';
import { useColorMode, useMediaQuery } from '@vueuse/core';

// ── Types ────────────────────────────────────────────────────────────────────────────────────────────────────────────

export type AppPaneId = 'assistant' | 'studio';

// ── State - Environment ──────────────────────────────────────────────────────────────────────────────────────────────

// Shares the 'dpuse-appearance' key and the 'dark' class with the inline script in 'index.html', which applies the
// appearance before the app loads. Transitions are left on because switching them off injects a '<style>' element,
// which the production CSP blocks. Light mode sets no class of its own.
export const appearance = useColorMode({ disableTransition: false, modes: { light: '' }, storageKey: 'dpuse-appearance' });
export const isPWA = matchMedia('(display-mode: standalone)').matches || matchMedia('(display-mode: fullscreen)').matches;
export const viewportIsWide = useMediaQuery('(min-width: 768px)'); // 768px is Tailwind's 'md'; a template using 'md:' and a script reading 'viewportIsWide' have to agree.

// ── State - Application Panes ────────────────────────────────────────────────────────────────────────────────────────

export const activeAppPaneId = ref<AppPaneId | undefined>(); // Undefined until the initial URL has been read.
export const assistantPaneIsActive = ref(false);
export const assistantPaneWasActivated = ref(false); // Latches on first activation and never clears; see 'setPaneActiveState'.
export const studioPaneIsActive = ref(false);
export const studioPaneWasActivated = ref(false); // Latches on first activation and never clears; see 'setPaneActiveState'.

// ── State - Session Menu ─────────────────────────────────────────────────────────────────────────────────────────────

export const sessionMenuIsOpen = ref(false);

// ── Derived State ────────────────────────────────────────────────────────────────────────────────────────────────────

export const appearanceIsDark: ComputedRef<boolean> = computed(() => appearance.state.value === 'dark');

// A wide display can show both active panes side by side. A narrow one has room for only one, so being active is not
// enough — the pane also has to be the one in front. 'activeAppPaneId' is what decides that, which is why a pointer, a
// scroll or focus anywhere in a pane claims it: on a narrow display the claim is already true, and on a wide one it
// records which pane the user was last working in, so the narrow layout knows what to show if the display shrinks.
export const assistantPaneIsVisible: ComputedRef<boolean> = computed(() => isPaneVisible('assistant'));
export const studioPaneIsVisible: ComputedRef<boolean> = computed(() => isPaneVisible('studio'));

// ── Actions ──────────────────────────────────────────────────────────────────────────────────────────────────────────

// The only way a pane's active state is changed. Activating also latches 'wasActivated', which is what 'App.vue' keeps
// the pane mounted on: a hidden pane stays in the DOM behind a 'v-show' so it does not lose what the user had done in
// it. The latch never clears, because a pane that has been open once can be reopened at any time.
//
// Which pane is in front follows from the same change, so it is settled here rather than at each call site: switching a
// pane on puts it in front, and switching one off leaves the other. The bootstrap in 'App.vue' is the one caller that
// assigns 'activeAppPaneId' afterwards, because the URL records which pane was in front and that cannot be derived.
export function setPaneActiveState(paneId: AppPaneId, isActive: boolean): void {
    const otherPaneId: AppPaneId = paneId === 'assistant' ? 'studio' : 'assistant';

    if (paneId === 'assistant') {
        assistantPaneIsActive.value = isActive;
        if (isActive) assistantPaneWasActivated.value = true;
    } else {
        studioPaneIsActive.value = isActive;
        if (isActive) studioPaneWasActivated.value = true;
    }

    activeAppPaneId.value = isActive ? paneId : otherPaneId;
}

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

function isPaneVisible(paneId: AppPaneId): boolean {
    const isActive = paneId === 'assistant' ? assistantPaneIsActive.value : studioPaneIsActive.value;
    return isActive && (viewportIsWide.value || activeAppPaneId.value === paneId);
}
