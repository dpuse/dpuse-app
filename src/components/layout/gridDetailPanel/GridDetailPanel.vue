<script setup lang="ts" generic="T extends { icon?: string | null; iconDark?: string | null; iconNeutral?: string | null; label: string }">
// External Dependencies
import { XIcon } from 'lucide-vue-next';
import { nextTick, ref, watch } from 'vue';

// Local (App) Framework
import type { DataSource } from '@/composables/useDataWindow';

// Local Components - Static
import Button from '@/components/ui/button/Button.vue';
import Grid from '@/components/ui/grid/Grid.vue';

// Options, Properties, Slots & Emits ──────────────────────────────────────────────────────────────────────────────────

type Properties = { activeItem?: T; dataSource: DataSource<T>; addLabel?: string; isCompact?: boolean; maxListWidth?: string; maxDetailWidth?: string };
const { activeItem, dataSource, addLabel, isCompact = false, maxListWidth, maxDetailWidth } = defineProps<Properties>();

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

// Derived State ───────────────────────────────────────────────────────────────────────────────────────────────────────

watch(
    () => activeItem,
    (newActiveItem) => {
        if (newActiveItem == null) detailPaneIsVisible.value = false;
    }
);

// Handlers ────────────────────────────────────────────────────────────────────────────────────────────────────────────

async function selectItem(row: T): Promise<void> {
    emit('select', row);
    await nextTick();
    detailPaneIsVisible.value = activeItem != null;
}
</script>

<template>
    <div class="flex h-full flex-col overflow-hidden" data-component="GridDetailPanel">
        <!-- Header -->
        <header class="mx-4 flex-none">
            <slot name="header" />
        </header>

        <!-- Body -->
        <div
            class="flex flex-1 overflow-hidden"
            :class="{ 'show-detail': detailPaneIsVisible }"
            :style="{ '--gdp-max-list-width': maxListWidth, '--gdp-max-detail-width': maxDetailWidth }"
        >
            <!-- Grid (Left) Pane -->
            <div class="gdp-list relative flex-1 flex-col overflow-hidden">
                <Grid :add-label="addLabel" class="flex-1" :data-source="dataSource" :is-compact="isCompact" :row-height="83" :target-column-width="250" @add="$emit('add')">
                    <template #default="{ item }">
                        <Button class="h-full w-full" :is-active="activeItem === item" shape="minimal" @click="selectItem(item)">
                            <slot name="list-item-default" :item="item" />
                        </Button>
                    </template>
                </Grid>
            </div>

            <!-- Detail (Right) Pane -->
            <div class="gdp-detail mr-4 min-w-0 flex-1 border-separator" style="container-type: inline-size">
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
.show-detail .gdp-list {
    display: none;
}

.show-detail .gdp-detail {
    display: block;
}

/* Wide: always show both panes regardless of selection state */
@container (min-width: 768px) {
    .gdp-list,
    .show-detail .gdp-list {
        display: flex;
        max-width: var(--gdp-max-list-width, none);
    }

    .gdp-detail,
    .show-detail .gdp-detail {
        display: block;
        border-left-width: 1px;
        max-width: var(--gdp-max-detail-width, none);
    }
}
</style>
