<script setup lang="ts" generic="T extends { icon?: string | null; iconDark?: string | null; label: string; typeId: string; isHeader?: boolean }">
// ── External Dependencies & Registrations
import { nextTick, ref, watch } from 'vue';

// ── Local Framework
import type { DataSource } from '@/composables/useDataWindow';

// ── Static Components
import Button from '@/components/ui/button/Button.vue';
import Grid from '@/components/ui/grid/Grid.vue';

// ── Options, Props, Slots & Emits ────────────────────────────────────────────────────────────────────────────────────

interface Properties {
    activeItem?: T;
    addLabel?: string;
    dataSource: DataSource<T>;
    isCompact?: boolean;
    maxListWidth?: string;
    maxDetailWidth?: string;
    rowHeight?: number;
    scrollAreaPaddingBottom?: number | string;
}
const { activeItem, addLabel, dataSource, isCompact, maxListWidth, maxDetailWidth, rowHeight = 80, scrollAreaPaddingBottom } = defineProps<Properties>();

defineSlots<{
    header(): unknown;
    'grid-item'(properties: { item: T }): unknown;
    empty(): unknown;
    detail(properties: { item: T; clear: () => void; close: () => void }): unknown;
    'no-selection'(): unknown;
}>();

const emit = defineEmits<{ add: []; select: [item?: T] }>();

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

const detailPaneIsVisible = ref(false);

// ── Side Effects ─────────────────────────────────────────────────────────────────────────────────────────────────────

watch(
    () => activeItem,
    (newActiveItem) => {
        if (newActiveItem == null) detailPaneIsVisible.value = false;
    }
);

// ── Event Handlers ───────────────────────────────────────────────────────────────────────────────────────────────────

function handleClearSelection(): void {
    detailPaneIsVisible.value = false;
    emit('select');
}

function handleClose(): void {
    detailPaneIsVisible.value = false;
}

async function handleSelectItem(row: T): Promise<void> {
    emit('select', row);
    await nextTick();
    detailPaneIsVisible.value = activeItem != null;
}
</script>

<template>
    <div class="flex h-full flex-col" data-region="GridDetailPanel">
        <!-- Header -->
        <header class="mx-4 flex-none">
            <slot name="header" />
        </header>

        <!-- Body -->
        <div
            class="flex min-h-0 flex-1"
            :class="{ 'dpuse-show-detail': detailPaneIsVisible }"
            :style="{ '--gdp-max-list-width': maxListWidth, '--gdp-max-detail-width': maxDetailWidth }"
        >
            <!-- Grid (Left) Pane -->
            <div class="gdp-grid relative flex-1 flex-col">
                <Grid
                    :add-label="addLabel"
                    class="flex-1"
                    :data-source="dataSource"
                    :is-compact="isCompact"
                    :row-height="rowHeight"
                    :scroll-area-padding-bottom="scrollAreaPaddingBottom"
                    :target-column-width="250"
                    @add="$emit('add')"
                >
                    <template #default="{ item }">
                        <Button class="size-full" :is-active="activeItem === item" shape="minimal" @click="handleSelectItem(item)">
                            <slot name="grid-item" :item="item" />
                        </Button>
                    </template>

                    <template #empty>
                        <slot name="empty" />
                    </template>
                </Grid>
            </div>

            <!-- Detail (Right) Pane -->
            <div class="gdp-detail min-w-0 flex-1 border-separator" style="container-type: inline-size">
                <!-- Active Item -->
                <div v-if="activeItem" class="flex h-full min-h-0 flex-col">
                    <slot name="detail" :item="activeItem" :clear="handleClearSelection" :close="handleClose" />
                </div>

                <!-- No Selection -->
                <div v-else class="mx-4 mt-6">
                    <slot name="no-selection" />
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
/* Narrow: show list, hide detail */
.gdp-grid {
    display: flex;
}

.gdp-detail {
    display: none;
}

/* Narrow + item selected: show detail only */
.dpuse-show-detail .gdp-grid {
    display: none;
}

.dpuse-show-detail .gdp-detail {
    display: block;
}

/* Wide: always show both panes regardless of selection state */
@container (min-width: 768px) {
    .gdp-grid,
    .dpuse-show-detail .gdp-grid {
        display: flex;
        max-width: var(--gdp-max-list-width, none);
    }

    .gdp-detail,
    .dpuse-show-detail .gdp-detail {
        display: block;
        border-left-width: 1px;
        max-width: var(--gdp-max-detail-width, none);
    }
}
</style>
