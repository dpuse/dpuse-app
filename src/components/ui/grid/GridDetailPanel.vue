<script setup lang="ts" generic="T extends { id: string }">
// ── External Dependencies & Registrations
import { computed, useTemplateRef } from 'vue';

// ── Local Framework
import type { DataSource } from '@/composables/useDataWindow';

// ── Static Components
import Grid from '@/components/ui/grid/Grid.vue';
import MasterDetailPanel from '@/components/ui/MasterDetailPanel.vue';

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
    header?(properties: { isSplit: boolean; revealSelectedItem: () => void }): unknown; // 'revealSelectedItem' scrolls the list back to the selected item.

    item(properties: { item: T; isSplit: boolean; openDetail: () => void }): unknown; // 'openDetail' shows the selected item's detail again after the user closed it.
    'no-items'(): unknown;
    detail(properties: { item: T; close: () => void }): unknown;
    'detail-action'(properties: { item: T }): unknown;
    'no-selection'(): unknown;
}>();

defineEmits<{ add: [] }>();

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

const gridComponent = useTemplateRef<{ scrollToTarget: () => void }>('grid');
const masterDetailPanelComponent = useTemplateRef<{ detailPaneIsVisible: boolean; isNarrow: boolean; masterPaneIsVisible: boolean }>('masterDetailPanel');

// ── Derived State ────────────────────────────────────────────────────────────────────────────────────────────────────

// For a caller whose header or actions sit outside the panel, where the slots cannot reach. Passed on from the panes,
// which decide them. Both panes count as visible until the panes are there to say otherwise.
defineExpose({
    detailPaneIsVisible: computed(() => masterDetailPanelComponent.value?.detailPaneIsVisible ?? true),
    gridPaneIsVisible: computed(() => masterDetailPanelComponent.value?.masterPaneIsVisible ?? true),
    isNarrow: computed(() => masterDetailPanelComponent.value?.isNarrow ?? false),
    revealSelectedItem
});

// ── Scroll Target ─ The selected item's row is scrolled into view, so a selection restored when the list opens can be
// seen. Built from the id, so a new object for the same item, as a language switch gives, does not scroll the list again.
const selectedItemId = computed(() => selectedItem?.id);
const matchSelectedRow = computed(() => {
    const id = selectedItemId.value;
    return id === undefined ? undefined : (item: T): boolean => item.id === id;
});

// ── Actions ──────────────────────────────────────────────────────────────────────────────────────────────────────────

function revealSelectedItem(): void {
    gridComponent.value?.scrollToTarget();
}
</script>

<template>
    <!-- The panes, their sizes and the detail are 'MasterDetailPanel''s. This panel puts a grid in the left pane. -->
    <MasterDetailPanel
        ref="masterDetailPanel"
        data-region="GridDetailPanel"
        :is-detail-initially-closed="isDetailInitiallyClosed"
        :max-detail-width="maxDetailWidth"
        :max-master-width="maxGridWidth"
        :selected-item="selectedItem"
    >
        <template #header="{ isSplit }">
            <slot name="header" :is-split="isSplit" :reveal-selected-item="revealSelectedItem" />
        </template>

        <template #master="{ isSplit, openDetail }">
            <Grid
                ref="grid"
                :add-label="addLabel"
                class="flex-1"
                :data-source="dataSource"
                :is-compact="isCompact"
                :is-scroll-target="matchSelectedRow"
                :row-height="rowHeight"
                :scroll-area-padding-top="scrollAreaPaddingTop"
                :target-column-width="targetColumnWidth"
                @add="$emit('add')"
            >
                <template #default="{ item }">
                    <slot name="item" :is-split="isSplit" :item="item" :open-detail="openDetail" />
                </template>

                <template #busy>
                    <slot name="busy" />
                </template>

                <template #no-items>
                    <slot name="no-items" />
                </template>
            </Grid>
        </template>

        <template #detail="{ item, close }">
            <slot name="detail" :item="item" :close="close" />
        </template>

        <template #detail-action="{ item }">
            <slot name="detail-action" :item="item" />
        </template>

        <template #no-selection>
            <slot name="no-selection" />
        </template>
    </MasterDetailPanel>
</template>
