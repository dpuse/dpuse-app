// ── External Dependencies & Registrations
import { computed, type ComputedRef, type Ref } from 'vue';

// ── Local Framework
import { useSplitPanes } from '@/composables/useSplitPanes';
import { viewportIsWide } from '@/state/device';

// ── Types ────────────────────────────────────────────────────────────────────────────────────────────────────────────

export type AppPaneId = 'assistant' | 'studio';

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

const appPanes = useSplitPanes<AppPaneId>(['studio', 'assistant'], { containerIsWide: viewportIsWide, initialPaneId: 'studio' });

// The pane in front follows where the user is working. 'App.vue' moves it whenever a pointer, a scroll or focus lands
// in a pane, even on a wide display, so a display that narrows keeps that pane.
export const currentAppPaneId: Ref<AppPaneId> = appPanes.currentPaneId;

// ── Derived State ────────────────────────────────────────────────────────────────────────────────────────────────────

export const assistantPaneIsOpen: ComputedRef<boolean> = computed(() => appPanes.isPaneOpen('assistant'));
export const assistantPaneWasOpened: ComputedRef<boolean> = computed(() => appPanes.wasPaneOpened('assistant')); // Never clears, so 'App.vue' keeps the pane mounted once opened.
export const studioPaneIsOpen: ComputedRef<boolean> = computed(() => appPanes.isPaneOpen('studio'));
export const studioPaneWasOpened: ComputedRef<boolean> = computed(() => appPanes.wasPaneOpened('studio')); // Never clears, so 'App.vue' keeps the pane mounted once opened.

// A wide display shows both open panes. A narrow one shows only the pane in front, 'currentAppPaneId'.
export const studioPaneIsVisible: ComputedRef<boolean> = computed(() => appPanes.isPaneVisible('studio'));
export const appPaneSplitterIsVisible: ComputedRef<boolean> = appPanes.splitterIsVisible;
export const assistantPaneIsVisible: ComputedRef<boolean> = computed(() => appPanes.isPaneVisible('assistant'));

// ── Actions ──────────────────────────────────────────────────────────────────────────────────────────────────────────

// The only way a pane is opened or closed. Opening a pane puts it in front, and closing one leaves the other in front.
export const setPaneOpenState: (paneId: AppPaneId, isOpen: boolean) => void = appPanes.setPaneOpenState;
