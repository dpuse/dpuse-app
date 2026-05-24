<script setup lang="ts" generic="T extends { icon?: string | null; iconDark?: string | null; iconNeutral?: string | null; label: string }">
// External Dependencies
import { XIcon } from 'lucide-vue-next';
import { nextTick, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

// Local (App) Framework
import type { DataSource } from '@/composables/useDataWindow';

// Local Components - Static
import ActionBar from '@/components/layout/actionBar/ActionBar.vue';
import Button from '@/components/ui/button/Button.vue';
import Grid from '@/components/ui/grid/Grid.vue';
import type { ScrollAreaPadding } from '@/components/layout/scrollArea/ScrollArea.vue';

// Options, Properties, Slots & Emits ──────────────────────────────────────────────────────────────────────────────────

type Properties = {
    activeItem?: T;
    dataSource: DataSource<T>;
    addLabel?: string;
    isCompact?: boolean;
    maxListWidth?: string;
    maxDetailWidth?: string;
    scrollAreaPadding?: ScrollAreaPadding;
};
const { activeItem, dataSource, addLabel, isCompact = false, maxListWidth, maxDetailWidth, scrollAreaPadding } = defineProps<Properties>();

defineSlots<{
    'header'(): unknown;
    'list-item-compact'(properties: { item: T }): unknown;
    'list-item-default'(properties: { item: T }): unknown;
    detail(properties: { item: T }): unknown;
    'no-selection'(): unknown;
}>();

const emit = defineEmits<{ add: []; select: [item: T | undefined] }>();

// State ───────────────────────────────────────────────────────────────────────────────────────────────────────────────

const detailPaneIsVisible = ref(false);

const route = useRoute();
const router = useRouter();

// Derived State ───────────────────────────────────────────────────────────────────────────────────────────────────────

watch(
    () => activeItem,
    (newActiveItem) => {
        if (newActiveItem == null) detailPaneIsVisible.value = false;
    }
);

// Handlers ────────────────────────────────────────────────────────────────────────────────────────────────────────────

async function handleCommitDetail(): Promise<void> {
    // emit('submit');
    await router.push({ name: 'selectItem', query: { ...route.query, wbView: 'selectItem' } });
}

async function handleSelectItem(row: T): Promise<void> {
    emit('select', row);
    await nextTick();
    detailPaneIsVisible.value = activeItem != null;
}
</script>

<template>
    <div class="flex h-full flex-col" data-component="GridDetailPanel">
        <!-- Header -->
        <header class="mx-4 flex-none">
            <slot name="header" />
        </header>

        <!-- Body -->
        <div class="flex flex-1" :class="{ 'dpuse-show-detail': detailPaneIsVisible }" :style="{ '--gdp-max-list-width': maxListWidth, '--gdp-max-detail-width': maxDetailWidth }">
            <!-- Grid (Left) Pane -->
            <div class="gdp-list relative flex-1 flex-col">
                <Grid :add-label="addLabel" class="flex-1" :data-source="dataSource" :is-compact="isCompact" :row-height="83" :target-column-width="250" @add="$emit('add')">
                    <template #default="{ item }">
                        <Button class="h-full w-full" :is-active="activeItem === item" shape="minimal" @click="handleSelectItem(item)">
                            <slot name="list-item-default" :item="item" />
                        </Button>
                    </template>
                </Grid>
            </div>

            <!-- Detail (Right) Pane -->
            <div class="gdp-detail border-separator mr-4 min-w-0 flex-1" style="container-type: inline-size">
                <!-- Detail Panel -->
                <div v-if="activeItem" class="flex h-full flex-col">
                    <!-- Detail Header -->
                    <div class="border-separator ml-4 flex h-10 items-center gap-x-1 border-b text-sm">
                        <!-- Icon -->
                        <div class="flex size-7 items-center justify-center">
                            <div v-if="activeItem.icon" aria-hidden="true" class="block w-6 dark:hidden" v-html="activeItem.icon || activeItem.iconDark" />
                            <div v-if="activeItem.icon" aria-hidden="true" class="hidden w-6 dark:block" v-html="activeItem.iconDark || activeItem.icon" />
                        </div>

                        <!-- Label -->
                        <span class="ml-1 min-w-0 truncate">{{ activeItem.label }}</span>

                        <!-- Close -->
                        <Button
                            class="ml-auto"
                            shape="icon"
                            size="sm"
                            @click="
                                detailPaneIsVisible = false;
                                $emit('select', undefined);
                            "
                        >
                            <XIcon stroke-width="1.25" />
                        </Button>
                    </div>

                    <!-- Detail Body -->
                    <div class="flex-1 overflow-hidden">
                        <slot name="detail" :item="activeItem" />
                        <ActionBar class="absolute right-4 bottom-(--safe-bottom-offset)" commit-action-variant="select" @commit="handleCommitDetail" />
                        <!-- <ActionBar
                            v-model="activeItemId"
                            class="fixed right-(--safe-right-offset) bottom-(--safe-bottom-offset)"
                            clear-action
                            commit-action-variant="select"
                            :item-actions="[
                                { id: 'table', label: t(T, 'tab.table') },
                                { id: 'text', label: t(T, 'tab.text') },
                                { id: 'details', label: t(T, 'tab.details') }
                            ]"
                            @clear="handleClearSelection"
                            @commit="handleSelectItem"
                        /> -->
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
.gdp-list {
    display: flex;
}

.gdp-detail {
    display: none;
}

/* Narrow + item selected: show detail only */
.dpuse-show-detail .gdp-list {
    display: none;
}

.dpuse-show-detail .gdp-detail {
    display: block;
}

/* Wide: always show both panes regardless of selection state */
@container (min-width: 768px) {
    .gdp-list,
    .dpuse-show-detail .gdp-list {
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
