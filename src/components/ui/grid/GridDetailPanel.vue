<script setup lang="ts" generic="T extends { id: string }">
// ── External Dependencies & Registrations
import { computed, provide, ref, useTemplateRef, watch } from 'vue';

// ── Local Framework
import type { DataSource } from '@/composables/useDataWindow';
import { useElementIsWide } from '@/composables/useElementIsWide';
import { GRID_DETAIL_SPLIT_THRESHOLD_PX, gridDetailIsSplitKey } from '@/components/ui/grid/gridDetail';

// ── Static Components
import Grid from '@/components/ui/grid/Grid.vue';

// ── Options, Props, Slots & Emits ────────────────────────────────────────────────────────────────────────────────────

interface Properties {
    activeItem?: T;
    addLabel?: string;
    dataSource: DataSource<T>;
    isCompact?: boolean;
    maxDetailWidth?: string;
    maxGridWidth?: string;
    rowHeight?: number; // Row height in px. Default: 48, matching 'Grid'.
    scrollAreaPaddingTop?: number | string;
}
const { activeItem, addLabel, dataSource, isCompact, maxDetailWidth, maxGridWidth, rowHeight = 48, scrollAreaPaddingTop } = defineProps<Properties>();

defineSlots<{
    header(properties: { isSplit: boolean }): unknown;
    item(properties: { item: T }): unknown;
    'no-items'(): unknown;
    detail(properties: { item: T; close: () => void }): unknown;
    'no-selection'(): unknown;
}>();

defineEmits<{ add: [] }>();

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

const bodyElement = useTemplateRef<HTMLElement>('bodyElement');
const detailIsOpen = ref(false); // Whether the detail has been opened and not since dismissed, which is intent rather than visibility.
const { isWide: isSplit } = useElementIsWide(bodyElement, GRID_DETAIL_SPLIT_THRESHOLD_PX);
provide(gridDetailIsSplitKey, isSplit);

// ── Derived State ────────────────────────────────────────────────────────────────────────────────────────────────────

const detailPaneIsVisible = computed(() => isSplit.value || detailIsOpen.value);
const gridPaneIsVisible = computed(() => isSplit.value || !detailIsOpen.value);

// ── Side Effects ─────────────────────────────────────────────────────────────────────────────────────────────────────

// Watches the id rather than the item, because a caller can hand over a new object for the same item (a language switch
// re-localises every row), and that must not reopen a detail the user has dismissed. Immediate, because returning to a
// page with an item already selected (e.g. by the back button) must open its detail without the selection changing.
watch(
    () => activeItem?.id,
    (newActiveItemId) => {
        detailIsOpen.value = newActiveItemId !== undefined;
    },
    { immediate: true }
);
</script>

<template>
    <div class="flex h-full flex-col" data-region="GridDetailPanel">
        <!-- Header -->
        <header class="mx-4 flex-none">
            <slot name="header" :is-split="isSplit" />
        </header>

        <!-- Body -->
        <div ref="bodyElement" class="flex min-h-0 flex-1">
            <!-- Grid (Left) Pane. Hidden with 'v-show' rather than a 'hidden' class because Grid's own root carries
                 'flex': the two are both display utilities, and which won would rest on stylesheet order alone. -->
            <Grid
                v-show="gridPaneIsVisible"
                :add-label="addLabel"
                class="flex-1"
                :data-source="dataSource"
                :is-compact="isCompact"
                :row-height="rowHeight"
                :scroll-area-padding-top="scrollAreaPaddingTop"
                :style="{ maxWidth: isSplit ? maxGridWidth : undefined }"
                :target-column-width="250"
                @add="$emit('add')"
            >
                <template #default="{ item }">
                    <slot name="item" :item="item" />
                </template>

                <template #no-items>
                    <slot name="no-items" />
                </template>
            </Grid>

            <!-- Detail (Right) Pane -->
            <div
                class="@container min-w-0 flex-1 border-separator"
                :class="[detailPaneIsVisible ? 'block' : 'hidden', { 'border-l': isSplit }]"
                :style="{ maxWidth: isSplit ? maxDetailWidth : undefined }"
            >
                <!-- Active Item -->
                <div v-if="activeItem" class="relative flex h-full min-h-0 flex-col">
                    <slot name="detail" :item="activeItem" :close="() => (detailIsOpen = false)" />
                </div>

                <!-- No Selection -->
                <div v-else class="mx-4 mt-6">
                    <slot name="no-selection" />
                </div>
            </div>
        </div>
    </div>
</template>
