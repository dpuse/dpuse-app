<script setup lang="ts" generic="T extends { icon?: string | null; iconDark?: string | null; iconNeutral?: string | null; label: string }">
// External Dependencies & Registrations
import { nextTick, ref, watch } from 'vue';

// Local (App) Framework
import type { DataSource } from '@/composables/useDataWindow';

// Local Components - Static
import Button from '@/components/ui/button/Button.vue';
import Grid from '@/components/framework/Grid.vue';
import type { ScrollAreaPadding } from '@/components/ui/ScrollArea.vue';
import DetailActionBar, { type CommitVariant, type ItemAction } from './DetailActionBar.vue';

// Options, Properties, Slots & Emits ──────────────────────────────────────────────────────────────────────────────────

type Properties = {
    activeItem?: T;
    addLabel?: string;
    commitVariant?: CommitVariant;
    dataSource: DataSource<T>;
    isCompact?: boolean;
    itemActions?: ItemAction[];
    maxListWidth?: string;
    maxDetailWidth?: string;
    scrollAreaPadding?: ScrollAreaPadding;
};
const { activeItem, addLabel, commitVariant, dataSource, isCompact = false, itemActions = [], maxListWidth, maxDetailWidth, scrollAreaPadding } = defineProps<Properties>();

defineSlots<{
    'header'(): unknown;
    'grid-item'(properties: { item: T }): unknown;
    detail(properties: { item: T }): unknown;
    'no-selection'(): unknown;
}>();

const emit = defineEmits<{ add: []; commitDetail: []; select: [item?: T] }>();

// State ───────────────────────────────────────────────────────────────────────────────────────────────────────────────

const activeItemAction = defineModel<ItemAction>('activeItemAction');

const detailPaneIsVisible = ref(false);

// Derived State ───────────────────────────────────────────────────────────────────────────────────────────────────────

watch(
    () => activeItem,
    (newActiveItem) => {
        if (newActiveItem == null) detailPaneIsVisible.value = false;
    }
);

// ── UI Event Handlers ────────────────────────────────────────────────────────────────────────────────────────────────

async function handleCommitDetail(): Promise<void> {
    emit('commitDetail');
}

async function handleClearSelection(): Promise<void> {
    detailPaneIsVisible.value = false;
    emit('select');
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
                    :row-height="83"
                    :scroll-area-padding="scrollAreaPadding"
                    :target-column-width="250"
                    @add="$emit('add')"
                >
                    <template #default="{ item }">
                        <Button class="h-full w-full" :is-active="activeItem === item" shape="minimal" @click="handleSelectItem(item)">
                            <slot name="grid-item" :item="item" />
                        </Button>
                    </template>
                </Grid>
            </div>

            <!-- Detail (Right) Pane -->
            <div class="gdp-detail mr-4 min-w-0 flex-1 border-separator" style="container-type: inline-size">
                <!-- Detail Panel -->
                <div v-if="activeItem" class="flex h-full flex-col">
                    <!-- Detail Header -->
                    <div class="ml-4 flex h-10 items-center gap-x-1 border-b border-separator text-sm">
                        <!-- Icon -->
                        <div class="flex size-7 items-center justify-center">
                            <div v-if="activeItem.icon" aria-hidden="true" class="block w-6 dark:hidden" v-html="activeItem.icon || activeItem.iconDark" />
                            <div v-if="activeItem.icon" aria-hidden="true" class="hidden w-6 dark:block" v-html="activeItem.iconDark || activeItem.icon" />
                        </div>

                        <!-- Label -->
                        <span class="ml-1 min-w-0 truncate">{{ activeItem.label }}</span>
                    </div>

                    <!-- Detail Body -->
                    <div class="relative min-h-0 flex-1">
                        <slot name="detail" :item="activeItem" />
                        <DetailActionBar
                            class="absolute right-4 bottom-(--safe-bottom-offset)"
                            :commit-variant="commitVariant"
                            :item-actions="itemActions"
                            :model-value="activeItemAction?.id"
                            @update:model-value="activeItemAction = itemActions.find((a) => a.id === $event)"
                            @clear="handleClearSelection"
                            @commit="handleCommitDetail"
                        />
                    </div>
                </div>

                <!-- No Selection -->
                <div v-else class="mt-4 ml-4">
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
