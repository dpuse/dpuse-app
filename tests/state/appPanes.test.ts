// ── External Dependencies & Registrations
import { describe, expect, it } from 'vitest';

// ── Local Framework
import {
    appPaneSplitterIsVisible,
    assistantPaneIsOpen,
    assistantPaneIsVisible,
    assistantPaneWasOpened,
    currentAppPaneId,
    setPaneOpenState,
    studioPaneIsOpen,
    studioPaneIsVisible
} from '@/state/appPanes';

// ── Tests ────────────────────────────────────────────────────────────────────────────────────────────────────────────

// The pane rules themselves are covered by 'tests/composables/useSplitPanes.test.ts'. These check the app's two panes
// are wired to them and to the viewport. Tests render the narrow layout, because 'matchMedia' never matches in jsdom,
// so one pane shows at a time.
describe('app panes', () => {
    it('shows only the pane in front on a narrow display, and no splitter', () => {
        setPaneOpenState('studio', true);
        setPaneOpenState('assistant', true);

        expect(studioPaneIsOpen.value).toBe(true);
        expect(assistantPaneIsOpen.value).toBe(true);
        expect(currentAppPaneId.value).toBe('assistant'); // Opened last, so it is in front.
        expect(assistantPaneIsVisible.value).toBe(true);
        expect(studioPaneIsVisible.value).toBe(false);
        expect(appPaneSplitterIsVisible.value).toBe(false);
    });

    it('brings the other pane forward when the one in front closes, and keeps the closed one mounted', () => {
        setPaneOpenState('studio', true);
        setPaneOpenState('assistant', true);

        setPaneOpenState('assistant', false);

        expect(currentAppPaneId.value).toBe('studio');
        expect(studioPaneIsVisible.value).toBe(true);
        expect(assistantPaneWasOpened.value).toBe(true); // 'App.vue' keeps it mounted, so it keeps its state.
    });
});
