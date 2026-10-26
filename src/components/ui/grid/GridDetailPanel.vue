<script setup lang="ts" generic="T extends { id: string }">
// ── External Dependencies & Registrations
import { useElementSize } from '@vueuse/core';
import { computed, provide, ref, useTemplateRef, watch } from 'vue';

// ── Local Framework
import type { DataSource } from '@/composables/useDataWindow';
import { GRID_DETAIL_SPLIT_THRESHOLD_PX, gridDetailIsSplitKey } from '@/components/ui/grid/gridDetail';

// ── Static Components
import Grid from '@/components/ui/grid/Grid.vue';

// ── Options, Props, Slots & Emits ────────────────────────────────────────────────────────────────────────────────────

interface Properties {
    selectedItem?: T;
    addLabel?: string;
    dataSource: DataSource<T>;
    isCompact?: boolean;
    isDetailInitiallyClosed?: boolean; // Shows the grid, not the detail, for the first selection on a narrow screen, as when the user comes back up to the list.
    maxDetailWidth?: string;
    maxGridWidth?: string;
    rowHeight?: number; // Row height in px. Default: 'Grid''s own.
    scrollAreaPaddingTop?: number | string;
    targetColumnWidth?: number; // Column width in px the grid aims for, before it stretches the columns to fill the row. Default: 250.
}
const {
    selectedItem,
    addLabel,
    dataSource,
    isCompact,
    isDetailInitiallyClosed,
    maxDetailWidth,
    maxGridWidth,
    rowHeight,
    scrollAreaPaddingTop,
    targetColumnWidth = 250
} = defineProps<Properties>();

defineSlots<{
    busy?(): unknown;
    header(properties: { isSplit: boolean }): unknown;
    item(properties: { item: T; isSplit: boolean; openDetail: () => void }): unknown; // 'openDetail' shows the selected item's detail again after the user closed it.
    'no-items'(): unknown;
    detail(properties: { item: T; close: () => void }): unknown;
    'detail-action'(properties: { item: T }): unknown;
    'no-selection'(): unknown;
}>();

defineEmits<{ add: [] }>();

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

const bodyElement = useTemplateRef<HTMLElement>('bodyElement');
const detailIsOpen = ref(false); // Whether the detail has been opened and not since dismissed, which is intent rather than visibility.
const firstSelectionIsClosed = ref(isDetailInitiallyClosed); // Cleared once the first selection arrives, which may be after the list loads.
const shownNarrowPaneId = ref<'detail' | 'grid'>(); // The pane shown on a narrow screen. Unset while the old pane fades out.
const { width: bodyWidth } = useElementSize(bodyElement);

// ── Derived State ────────────────────────────────────────────────────────────────────────────────────────────────────

const isSplit = computed(() => bodyWidth.value >= GRID_DETAIL_SPLIT_THRESHOLD_PX);
const bodyIsMeasured = computed(() => bodyWidth.value > 0); // The width is 0 until first measured, which would lay the panes out as narrow for a frame.
provide(gridDetailIsSplitKey, isSplit);
const narrowPaneId = computed(() => (detailIsOpen.value ? 'detail' : 'grid'));
const detailPaneIsVisible = computed(() => isSplit.value || shownNarrowPaneId.value === 'detail');
const gridPaneIsVisible = computed(() => isSplit.value || shownNarrowPaneId.value === 'grid');

// ── Scroll Target ─ The selected item's row is scrolled into view, so a selection restored when the list opens can be
// seen. Built from the id, so a new object for the same item, as a language switch gives, does not scroll the list again.
const selectedItemId = computed(() => selectedItem?.id);
const matchSelectedRow = computed(() => {
    const id = selectedItemId.value;
    return id === undefined ? undefined : (item: T): boolean => item.id === id;
});

// ── Side Effects ─────────────────────────────────────────────────────────────────────────────────────────────────────

// Watches the id rather than the item, because a caller can hand over a new object for the same item (a language switch
// re-localises every row), and that must not reopen a detail the user has dismissed. Immediate, because returning to a
// page with an item already selected (e.g. by the back button) must open its detail without the selection changing.
watch(
    () => selectedItem?.id,
    (newActiveItemId) => {
        detailIsOpen.value = newActiveItemId !== undefined && !firstSelectionIsClosed.value;
        if (newActiveItemId !== undefined) firstSelectionIsClosed.value = false;
    },
    { immediate: true }
);

// Going back to the list on a narrow screen hides the detail but keeps the item selected. Side by side, the detail
// shows anyway, so when the panel narrows again it shows the selected item's detail, which the user was just looking
// at, rather than a list they went back to earlier.
watch(isSplit, (newIsSplit, oldIsSplit) => {
    if (oldIsSplit && !newIsSplit) detailIsOpen.value = selectedItem != null;
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

// ── Event Handlers ───────────────────────────────────────────────────────────────────────────────────────────────────

function handleShowNarrowPane(): void {
    shownNarrowPaneId.value = narrowPaneId.value;
}
</script>

<template>
    <div class="flex h-full flex-col" data-region="GridDetailPanel">
        <!-- Header -->
        <header class="flex-none">
            <slot name="header" :is-split="isSplit" />
        </header>

        <!-- Body -->
        <div ref="bodyElement" class="flex min-h-0 flex-1" :class="{ invisible: !bodyIsMeasured }">
            <!-- Grid (Left) Pane. Hidden with 'v-show' rather than a 'hidden' class because Grid's own root carries
                 'flex': the two are both display utilities, and which won would rest on stylesheet order alone. On a
                 narrow screen it fades, and the detail pane appears once its fade-out ends. -->
            <Transition name="dpuse-action-fade" @after-leave="handleShowNarrowPane">
                <Grid
                    v-show="gridPaneIsVisible"
                    :add-label="addLabel"
                    class="flex-1"
                    :data-source="dataSource"
                    :is-compact="isCompact"
                    :is-scroll-target="matchSelectedRow"
                    :row-height="rowHeight"
                    :scroll-area-padding-top="scrollAreaPaddingTop"
                    :style="{ maxWidth: isSplit ? maxGridWidth : undefined }"
                    :target-column-width="targetColumnWidth"
                    @add="$emit('add')"
                >
                    <template #default="{ item }">
                        <slot name="item" :is-split="isSplit" :item="item" :open-detail="() => (detailIsOpen = true)" />
                    </template>

                    <template #busy>
                        <slot name="busy" />
                    </template>

                    <template #no-items>
                        <slot name="no-items" />
                    </template>
                </Grid>
            </Transition>

            <!-- Detail (Right) Pane ─ On a narrow screen it fades, and the grid pane appears once its fade-out ends. -->
            <Transition name="dpuse-action-fade" @after-leave="handleShowNarrowPane">
                <div
                    v-show="detailPaneIsVisible"
                    class="@container relative min-w-0 flex-1 border-separator"
                    :class="{ 'border-l': isSplit }"
                    :style="{ maxWidth: isSplit ? maxDetailWidth : undefined }"
                >
                    <!-- Active Item, or No Selection - Keyed on the item, so each new selection fades in. The old detail
                         fades out quickly first, as route views do, so it does not vanish in a flash. The comments stay
                         out here because a comment between the branches would sit inside the transition. -->
                    <Transition name="dpuse-action-fade" mode="out-in">
                        <div v-if="selectedItem" :key="selectedItem.id" class="relative flex h-full min-h-0 flex-col">
                            <slot name="detail" :item="selectedItem" :close="() => (detailIsOpen = false)" />
                        </div>
                        <div v-else key="noSelection" class="mx-page mt-6">
                            <slot name="no-selection" />
                        </div>
                    </Transition>

                    <!-- Detail Action ─ Outside the transition, so the button stays put while the item's details fade in. -->
                    <slot v-if="selectedItem" name="detail-action" :item="selectedItem" />
                </div>
            </Transition>
        </div>
    </div>
</template>
