<script setup lang="ts" generic="T extends { id: string }">
// Two panes: on the left the caller's own way of choosing an item, such as a grid of cards or a diagram, and on the
// right the chosen item's detail. With room, the two sit side by side. Without, one shows at a time, unless the caller
// fills the 'detail-summary' slot. The left pane then stays, and the detail becomes a sheet that slides up over its
// foot: first to a summary, then to half and to the whole height. That suits a diagram the user is still finding their
// way round.

// ── External Dependencies & Registrations
import { type ComponentPublicInstance, computed, provide, ref, useTemplateRef, watch } from 'vue';
import { onKeyStroke, useElementSize } from '@vueuse/core';

// ── Local Framework
import { t } from '@/state/locale';
import { TEXT } from './MasterDetailPanel_.json';
import { GRID_DETAIL_SPLIT_THRESHOLD_PX, gridDetailIsSplitKey } from '@/components/ui/grid/gridDetail';

// ── Static Components
import SheetHeader from '@/components/ui/SheetHeader.vue';

// ── Types ────────────────────────────────────────────────────────────────────────────────────────────────────────────

// How much of the selected item's detail a narrow screen shows. A panel without a summary shows none or all of it, in
// place of the master pane. A panel with one has a sheet, which also rests at its summary and at half height. One
// value, so a click, a drag and a key all move the sheet by setting it.
type DetailPosition = 'closed' | 'full' | 'half' | 'summary';

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

const SHEET_POSITIONS: DetailPosition[] = ['closed', 'summary', 'half', 'full']; // From the lowest to the highest.
const SHEET_CLOSE_HEIGHT_PX = 60; // A sheet let go below this, which is well under its summary's height, closes.
const SHEET_STEP_DRAG_PX = 40; // A drag shorter than this leaves the sheet where it was.

// ── Options, Props, Slots & Emits ────────────────────────────────────────────────────────────────────────────────────

const { selectedItem, isDetailInitiallyClosed, maxDetailWidth, maxMasterWidth } = defineProps<{
    selectedItem?: T;
    isDetailInitiallyClosed?: boolean; // Shows the master pane, not the detail, for the first selection on a narrow screen, as when the user comes back up to the list. A panel with a summary shows the summary.
    maxDetailWidth?: string;
    maxMasterWidth?: string;
}>();

const slots = defineSlots<{
    header?(properties: { isSplit: boolean }): unknown;
    master(properties: { detailIsShown: boolean; dismissDetail: () => void; isSplit: boolean; openDetail: () => void }): unknown; // 'openDetail' shows the selected item's detail or summary again after the user closed it. 'dismissDetail' hides both and keeps the item selected, as Escape does.
    detail(properties: { item: T; close: () => void }): unknown;
    'detail-summary'?(properties: { item: T }): unknown; // Filling it makes the detail a sheet on a narrow screen, which shows this while at its lowest. It must be filled from the start, not conditionally.
    'detail-action'?(properties: { item: T }): unknown;
    'no-selection'?(): unknown;
}>();

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

const bodyElement = useTemplateRef<HTMLElement>('bodyElement');
const detailPaneElement = useTemplateRef<HTMLDivElement>('detailPane');
const sheetHeaderComponent = useTemplateRef<ComponentPublicInstance>('sheetHeader');
const detailPosition = ref<DetailPosition>('closed'); // What the user last asked for, which is intent rather than visibility: side by side, the detail shows whatever this says.
const firstSelectionIsClosed = ref(isDetailInitiallyClosed); // Cleared once the first selection arrives, which may be after the list loads.
const shownNarrowPaneId = ref<'detail' | 'master'>(); // The pane shown on a narrow screen. Unset while the old pane fades out.
const { height: bodyHeight, width: bodyWidth } = useElementSize(bodyElement);
const { height: sheetHeaderHeight } = useElementSize(sheetHeaderComponent);

// ── Sheet Drag ─ Only meaningful while the sheet's handle is being dragged.
const sheetDragStartHeight = ref(0);
const sheetDragHeight = ref<number>(); // The height the drag has pulled the sheet to. Unset when no drag is under way.

// ── Derived State ────────────────────────────────────────────────────────────────────────────────────────────────────

const isSplit = computed(() => bodyWidth.value >= GRID_DETAIL_SPLIT_THRESHOLD_PX);
const bodyIsMeasured = computed(() => bodyWidth.value > 0); // The width is 0 until first measured, which would lay the panes out as narrow for a frame.
const hasDetailSummary = slots['detail-summary'] != null;
const sheetIsUsed = computed(() => hasDetailSummary && !isSplit.value);
// A detail header offers no way back while the master pane is still on screen, which it is beside the detail and under
// the sheet alike. The sheet has its own handle and close button.
provide(
    gridDetailIsSplitKey,
    computed(() => isSplit.value || hasDetailSummary)
);
const narrowPaneId = computed(() => (!hasDetailSummary && detailPosition.value === 'full' ? 'detail' : 'master')); // A sheet lies over the master pane, so the master pane is never swapped out for it.
const detailIsShown = computed(() => isSplit.value || detailPosition.value !== 'closed'); // In whole or in part.
const detailPaneIsVisible = computed(() => isSplit.value || shownNarrowPaneId.value === 'detail');
const masterPaneIsVisible = computed(() => isSplit.value || shownNarrowPaneId.value === 'master');
// For a caller whose header or actions sit outside the panel, where the slots cannot reach. Narrow only once measured,
// because the width reads 0 until then.
defineExpose({ detailPaneIsVisible, masterPaneIsVisible, isNarrow: computed(() => bodyIsMeasured.value && !isSplit.value), isSplit });

// ── Sheet ─ At its lowest the sheet is as tall as its header, which holds the summary, plus the bottom row of controls,
// where the detail's action sits. The detail itself is then out of sight, so it is hidden from the keyboard and screen
// readers too, until a drag starts to pull it into view.
const sheetHeight = computed(() => {
    if (sheetDragHeight.value !== undefined) return `${String(sheetDragHeight.value)}px`;
    switch (detailPosition.value) {
        case 'closed':
            return '0px';
        case 'summary':
            return `calc(${String(sheetHeaderHeight.value)}px + 3rem + var(--safe-bottom-offset))`;
        case 'half':
            return '50%';
        case 'full':
            return '100%';
    }
});
const sheetDetailIsHidden = computed(() => sheetIsUsed.value && detailPosition.value === 'summary' && sheetDragHeight.value === undefined);
const detailPaneStyle = computed(() => (sheetIsUsed.value ? { height: sheetHeight.value } : { maxWidth: isSplit.value ? maxDetailWidth : undefined }));

// ── Side Effects ─────────────────────────────────────────────────────────────────────────────────────────────────────

// Watches the id rather than the item, because a caller can hand over a new object for the same item (a language switch
// re-localises every row), and that must not reopen a detail the user has dismissed. Immediate, because returning to a
// page with an item already selected (e.g. by the back button) must open its detail without the selection changing. A
// sheet that is already up stays at its height, so the user can move through a diagram with the detail in view.
watch(
    () => selectedItem?.id,
    (newActiveItemId) => {
        if (newActiveItemId === undefined) detailPosition.value = 'closed';
        else if (!hasDetailSummary) detailPosition.value = firstSelectionIsClosed.value ? 'closed' : 'full';
        else if (detailPosition.value === 'closed') detailPosition.value = 'summary';
        if (newActiveItemId !== undefined) firstSelectionIsClosed.value = false;
    },
    { immediate: true }
);

// Going back to the master pane on a narrow screen hides the detail but keeps the item selected. Side by side, the
// detail shows anyway, so when the panel narrows again it shows the selected item's detail or summary, which the user
// was just looking at, rather than a list they went back to earlier.
watch(isSplit, (newIsSplit, oldIsSplit) => {
    if (oldIsSplit && !newIsSplit) detailPosition.value = selectedItem == null ? 'closed' : resolveOpenDetailPosition();
});

// A narrow screen shows one pane at a time. The old pane fades out before the new one fades in, so the two never share
// the row and the detail's placeholder is not seen on its way out. With nothing shown yet, as on mount, or when both
// panes are shown side by side, the pane is shown at once.
watch(
    narrowPaneId,
    (newNarrowPaneId) => {
        shownNarrowPaneId.value = isSplit.value || shownNarrowPaneId.value === undefined ? newNarrowPaneId : undefined;
    },
    { immediate: true }
);

// Escape closes the sheet from the master pane or the sheet itself. A key that something inside has already used, such
// as a menu closing, is left alone, and so is one pressed in a dialog the detail has opened, which closes the dialog.
onKeyStroke(
    'Escape',
    (event) => {
        if (!sheetIsUsed.value || detailPosition.value === 'closed' || event.defaultPrevented) return;
        if (event.target instanceof Element && event.target.closest('dialog') != null) return;
        detailPosition.value = 'closed';
    },
    { target: bodyElement }
);

// ── Event Handlers ───────────────────────────────────────────────────────────────────────────────────────────────────

function handleShowNarrowPane(): void {
    shownNarrowPaneId.value = narrowPaneId.value;
}

function handleOpenDetail(): void {
    detailPosition.value = resolveOpenDetailPosition();
}

function handleCloseDetail(): void {
    detailPosition.value = hasDetailSummary ? 'summary' : 'closed';
}

function handleDismissDetail(): void {
    detailPosition.value = 'closed';
}

// A click on the sheet's handle raises the sheet one height. At the top it goes back down to the summary.
function handleStepSheet(): void {
    detailPosition.value = detailPosition.value === 'full' ? 'summary' : resolveSheetPosition(1);
}

// The sheet follows the pointer, starting from the height it had when the drag began.
function handleDragSheet(distance: number): void {
    if (sheetDragHeight.value === undefined) sheetDragStartHeight.value = detailPaneElement.value?.offsetHeight ?? 0;
    sheetDragHeight.value = Math.min(Math.max(sheetDragStartHeight.value + distance, 0), bodyHeight.value);
}

// Letting go settles the sheet on the position nearest to where it was let go. A drag that was long enough to mean it,
// but ended nearest the position it started from, moves the sheet one position in the drag's direction instead.
function handleDragEndSheet(distance: number): void {
    if (Math.abs(distance) >= SHEET_STEP_DRAG_PX) {
        const nearestPosition = resolveNearestSheetPosition(sheetDragHeight.value ?? sheetDragStartHeight.value + distance);
        detailPosition.value = nearestPosition === detailPosition.value ? resolveSheetPosition(Math.sign(distance)) : nearestPosition;
    }
    sheetDragHeight.value = undefined;
}

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

function resolveOpenDetailPosition(): DetailPosition {
    return hasDetailSummary ? 'summary' : 'full';
}

// The summary's height depends on its content, so the bounds either side of it are a fixed height below and, above,
// the point midway between a typical summary, a quarter of the way up, and half height.
function resolveNearestSheetPosition(height: number): DetailPosition {
    if (height > bodyHeight.value * 0.75) return 'full';
    if (height > bodyHeight.value * 0.375) return 'half';
    return height > SHEET_CLOSE_HEIGHT_PX ? 'summary' : 'closed';
}

// The sheet position the given number of heights above the current one, or below it when negative, stopping at the ends.
function resolveSheetPosition(steps: number): DetailPosition {
    const index = Math.min(Math.max(SHEET_POSITIONS.indexOf(detailPosition.value) + steps, 0), SHEET_POSITIONS.length - 1);
    return SHEET_POSITIONS[index] ?? detailPosition.value;
}
</script>

<template>
    <div class="flex h-full flex-col" data-region="MasterDetailPanel">
        <!-- Header -->
        <header class="flex-none">
            <slot name="header" :is-split="isSplit" />
        </header>

        <!-- Body ─ Positioned while the detail is a sheet, which is placed against its foot. -->
        <div ref="bodyElement" class="flex min-h-0 flex-1" :class="{ invisible: !bodyIsMeasured, relative: sheetIsUsed }">
            <!-- Master (Left) Pane ─ On a narrow screen it fades, and the detail pane appears once its fade-out ends. Under
                 a sheet at its whole height it cannot be seen, so it is kept from the keyboard and screen readers. -->
            <Transition name="dpuse-action-fade" @after-leave="handleShowNarrowPane">
                <div
                    v-show="masterPaneIsVisible"
                    class="flex min-h-0 min-w-0 flex-1 flex-col"
                    :inert="sheetIsUsed && detailPosition === 'full'"
                    :style="{ maxWidth: isSplit ? maxMasterWidth : undefined }"
                >
                    <slot name="master" :detail-is-shown="detailIsShown" :dismiss-detail="handleDismissDetail" :is-split="isSplit" :open-detail="handleOpenDetail" />
                </div>
            </Transition>

            <!-- Detail (Right) Pane ─ On a narrow screen it fades, and the master pane appears once its fade-out ends. As a
                 sheet it lies over the foot of the master pane, which keeps its size, so a diagram is not redrawn each
                 time the sheet moves. Its height slides to each new position, except while a drag is setting it. A
                 closed sheet stays on the page at no height, so that it slides when it opens, and is hidden once it
                 has slid shut. -->
            <Transition name="dpuse-action-fade" @after-leave="handleShowNarrowPane">
                <div
                    v-show="detailPaneIsVisible || sheetIsUsed"
                    ref="detailPane"
                    :aria-label="sheetIsUsed ? t(TEXT, 'sheet.aria') : undefined"
                    class="@container min-w-0 border-separator"
                    :class="[
                        sheetIsUsed ? 'absolute inset-x-0 bottom-0 z-10 flex flex-col overflow-hidden border-t bg-surface' : 'relative flex-1',
                        sheetIsUsed && sheetDragHeight === undefined ? 'transition-[height,visibility] duration-300 ease-out motion-reduce:transition-none' : '',
                        { 'border-l': isSplit, invisible: sheetIsUsed && detailPosition === 'closed' && sheetDragHeight === undefined }
                    ]"
                    :data-position="sheetIsUsed ? detailPosition : undefined"
                    :role="sheetIsUsed ? 'region' : undefined"
                    :style="detailPaneStyle"
                >
                    <!-- Sheet Header ─ Holds the summary while the sheet is at its lowest. Higher up, the detail's own
                         title says the same. -->
                    <SheetHeader
                        v-if="sheetIsUsed"
                        ref="sheetHeader"
                        :is-full="detailPosition === 'full'"
                        @close="detailPosition = 'closed'"
                        @drag="handleDragSheet"
                        @drag-end="handleDragEndSheet"
                        @step="handleStepSheet"
                    >
                        <div v-if="selectedItem && detailPosition === 'summary'" class="px-page pb-1">
                            <slot name="detail-summary" :item="selectedItem" />
                        </div>
                    </SheetHeader>

                    <div
                        class="min-h-0 transition-opacity motion-reduce:transition-none"
                        :class="[sheetIsUsed ? 'flex-1' : 'h-full', { 'opacity-0': sheetDetailIsHidden }]"
                        :inert="sheetDetailIsHidden"
                    >
                        <!-- Selected Item, or No Selection ─ Keyed on the item, so each new selection fades in. The old
                             detail fades out quickly first, as route views do, so it does not vanish in a flash. The
                             comments stay out here because a comment between the branches would sit inside the
                             transition. The empty message is set down with padding, not a margin, because a top margin
                             would collapse through the full-height box around it and push that box off the page. -->
                        <Transition name="dpuse-action-fade" mode="out-in">
                            <div v-if="selectedItem" :key="selectedItem.id" class="relative flex h-full min-h-0 flex-col">
                                <slot name="detail" :item="selectedItem" :close="handleCloseDetail" />
                            </div>
                            <div v-else key="noSelection" class="mx-page pt-6">
                                <slot name="no-selection" />
                            </div>
                        </Transition>
                    </div>

                    <!-- Detail Action ─ Outside the transition, so the button stays put while the item's details fade in. -->
                    <slot v-if="selectedItem" name="detail-action" :item="selectedItem" />
                </div>
            </Transition>
        </div>
    </div>
</template>
