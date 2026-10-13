// ── External Dependencies & Registrations
import { computed, type ComputedRef, type Ref, ref } from 'vue';

// ── Types ────────────────────────────────────────────────────────────────────────────────────────────────────────────

interface SplitPanes<TPaneId extends string> {
    // Which pane is in front. Decides what a narrow container shows, and records where the user last worked so a
    // container that narrows knows which pane to keep.
    currentPaneId: Ref<TPaneId>;
    // Latches on first opening and never clears, so a pane that has been open once stays mounted behind its 'v-show'
    // and does not lose what the user had done in it.
    wasPaneOpened: (paneId: TPaneId) => boolean;
    isPaneOpen: (paneId: TPaneId) => boolean;
    isPaneVisible: (paneId: TPaneId) => boolean;
    splitterIsVisible: ComputedRef<boolean>;
    setPaneOpenState: (paneId: TPaneId, isOpen: boolean) => void;
}

// ── Composables ──────────────────────────────────────────────────────────────────────────────────────────────────────

// A two-pane split: each pane is open or not, and where there is room for only one, the open pane in front is the one
// shown. Scoped to a container rather than the viewport, so it can be nested inside a pane that is itself one half of a
// split. '@/state/appPanes' runs one instance at module level for the app's studio and assistant panes, and
// 'AssistantLayout' runs one per component for its chat and library panes.
export function useSplitPanes<TPaneId extends string>(
    paneIds: readonly [TPaneId, TPaneId],
    options: { containerIsWide: Ref<boolean>; initialPaneId: TPaneId }
): SplitPanes<TPaneId> {
    const { containerIsWide, initialPaneId } = options;

    const currentPaneId = ref(initialPaneId) as Ref<TPaneId>;
    const openStates = ref(new Map<TPaneId, boolean>()) as Ref<Map<TPaneId, boolean>>;
    const openedStates = ref(new Map<TPaneId, boolean>()) as Ref<Map<TPaneId, boolean>>;

    // Both panes have to be open for a splitter to divide anything, and a narrow container shows one at a time, so
    // there is nothing between them to drag.
    const splitterIsVisible = computed(() => containerIsWide.value && paneIds.every((paneId) => openStates.value.get(paneId) === true));

    function isPaneOpen(paneId: TPaneId): boolean {
        return openStates.value.get(paneId) === true;
    }

    function isPaneVisible(paneId: TPaneId): boolean {
        return isPaneOpen(paneId) && (containerIsWide.value || currentPaneId.value === paneId);
    }

    function wasPaneOpened(paneId: TPaneId): boolean {
        return openedStates.value.get(paneId) === true;
    }

    // The only way a pane's open state is changed. Which pane is in front follows from the same change, so it is
    // settled here rather than at each call site: opening a pane puts it in front, and closing one leaves the other.
    function setPaneOpenState(paneId: TPaneId, isOpen: boolean): void {
        openStates.value = new Map(openStates.value).set(paneId, isOpen);
        if (isOpen) openedStates.value = new Map(openedStates.value).set(paneId, true);

        currentPaneId.value = isOpen ? paneId : (paneIds.find((candidateId) => candidateId !== paneId) ?? paneId);
    }

    return { currentPaneId, isPaneOpen, isPaneVisible, wasPaneOpened, splitterIsVisible, setPaneOpenState };
}
