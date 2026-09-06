// ── External Dependencies & Registrations
import { computed, type ComputedRef, type Ref, ref } from 'vue';

// ── Types ────────────────────────────────────────────────────────────────────────────────────────────────────────────

interface SplitPanes<TPaneId extends string> {
    // Which pane is in front. Decides what a narrow container shows, and records where the user last worked so a
    // container that narrows knows which pane to keep.
    activePaneId: Ref<TPaneId>;
    // Latches on first activation and never clears, so a pane that has been open once stays mounted behind its
    // 'v-show' and does not lose what the user had done in it.
    wasPaneActivated: (paneId: TPaneId) => boolean;
    isPaneActive: (paneId: TPaneId) => boolean;
    isPaneVisible: (paneId: TPaneId) => boolean;
    splitterIsVisible: ComputedRef<boolean>;
    setPaneActiveState: (paneId: TPaneId, isActive: boolean) => void;
}

// ── Composables ──────────────────────────────────────────────────────────────────────────────────────────────────────

// A two-pane split: each pane is active or not, and where there is room for only one, the active pane in front is the
// one shown. The same model 'App.vue' runs at the top level, scoped to a container rather than the viewport, so it can
// be nested inside a pane that is itself one half of a split.
//
// Deliberately not shared with the app-level model in '@/state/appLayout': that one is a module singleton tied to the
// URL and to the app's own two panes, and generalising it would put a parameterised store behind a component that only
// ever needs one instance of this.
export function useSplitPanes<TPaneId extends string>(
    paneIds: readonly [TPaneId, TPaneId],
    options: { containerIsWide: Ref<boolean>; initialPaneId: TPaneId }
): SplitPanes<TPaneId> {
    const { containerIsWide, initialPaneId } = options;

    const activePaneId = ref(initialPaneId) as Ref<TPaneId>;
    const activeStates = ref(new Map<TPaneId, boolean>()) as Ref<Map<TPaneId, boolean>>;
    const activatedStates = ref(new Map<TPaneId, boolean>()) as Ref<Map<TPaneId, boolean>>;

    // Both panes have to be active for a splitter to divide anything, and a narrow container shows one at a time, so
    // there is nothing between them to drag.
    const splitterIsVisible = computed(() => containerIsWide.value && paneIds.every((paneId) => activeStates.value.get(paneId) === true));

    function isPaneActive(paneId: TPaneId): boolean {
        return activeStates.value.get(paneId) === true;
    }

    function isPaneVisible(paneId: TPaneId): boolean {
        return isPaneActive(paneId) && (containerIsWide.value || activePaneId.value === paneId);
    }

    function wasPaneActivated(paneId: TPaneId): boolean {
        return activatedStates.value.get(paneId) === true;
    }

    // The only way a pane's active state is changed. Which pane is in front follows from the same change, so it is
    // settled here rather than at each call site: switching a pane on puts it in front, and switching one off leaves
    // the other.
    function setPaneActiveState(paneId: TPaneId, isActive: boolean): void {
        activeStates.value = new Map(activeStates.value).set(paneId, isActive);
        if (isActive) activatedStates.value = new Map(activatedStates.value).set(paneId, true);

        activePaneId.value = isActive ? paneId : (paneIds.find((candidateId) => candidateId !== paneId) ?? paneId);
    }

    return { activePaneId, isPaneActive, isPaneVisible, wasPaneActivated, splitterIsVisible, setPaneActiveState };
}
