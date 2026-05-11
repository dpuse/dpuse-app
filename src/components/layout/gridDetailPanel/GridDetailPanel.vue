<script setup lang="ts" generic="T extends { icon?: string | null; iconDark?: string | null; label: string }">
// External Dependencies
import { nextTick, ref, watch } from 'vue';
import { PlusIcon, XIcon } from 'lucide-vue-next';

// Local (App) Framework
import type { DataSource } from '@/composables/useDataWindow';
import { displayIsWide } from '@/state/appLayout';

// Local Components - Static
import ActionBar from '@/components/layout/actionBar/ActionBar.vue';
import Button from '@/components/ui/button/Button.vue';
import Grid from '@/components/ui/grid/Grid.vue';
import ListItemButton from '@/components/ui/button/ListItemButton.vue';

// Options, Properties, Slots & Emits ──────────────────────────────────────────────────────────────────────────────────

type Properties = { activeItem?: T; dataSource: DataSource<T>; enableAddAction?: boolean; maxListWidth?: string; maxDetailWidth?: string };
const { activeItem, dataSource, enableAddAction = false, maxListWidth, maxDetailWidth } = defineProps<Properties>();

const slots = defineSlots<{
    'header'(): unknown;
    'list-item-compact'(properties: { item: T }): unknown;
    'list-item-default'(properties: { item: T }): unknown;
    detail(properties: { item: T }): unknown;
    'no-selection'(): unknown;
}>();

const emit = defineEmits<{ select: [item: T | undefined] }>();

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

function getPaneStyle(maxWidth?: string): { maxWidth?: string } {
    return { maxWidth: maxWidth != null && displayIsWide.value ? maxWidth : undefined };
}

async function selectItem(row: T): Promise<void> {
    emit('select', row);
    await nextTick();
    detailPaneIsVisible.value = activeItem != null;
}
</script>

<template>
    <div class="flex h-full flex-col overflow-hidden">
        <!-- Header -->
        <header class="mx-4 flex-none">
            <slot name="header" />
        </header>

        <!-- Body -->
        <div class="flex flex-1 overflow-hidden">
            <!-- Grid (Left) Pane -->
            <div v-show="displayIsWide || !detailPaneIsVisible" class="relative flex-1 overflow-hidden" :style="getPaneStyle(maxListWidth)">
                <Grid :data-source="dataSource" :row-height="83" :target-column-width="350">
                    <template v-if="slots['list-item-default']" #default="{ item }">
                        <Button class="h-full w-full" :is-active="activeItem === item" shape="minimal" @click="selectItem(item)">
                            <slot name="list-item-default" :item="item" />
                        </Button>
                    </template>

                    <template v-if="slots['list-item-compact']" #compact="{ item }">
                        <ListItemButton class="h-full" :is-active="activeItem === item" @click="selectItem(item)">
                            <slot name="list-item-compact" :item="item" />
                        </ListItemButton>
                    </template>
                </Grid>

                <ActionBar v-if="enableAddAction" class="absolute right-4 bottom-(--safe-bottom-offset)" variant="add">
                    <template #action>
                        <PlusIcon />
                        <div class="flex flex-col items-start leading-tight">
                            <span class="text-xs leading-none">Add</span>
                            <span class="text-xs leading-none">Connection</span>
                        </div>
                    </template>
                </ActionBar>
            </div>

            <!-- Detail (Right) Pane -->
            <div
                v-if="displayIsWide || detailPaneIsVisible"
                class="mr-4 min-w-0 flex-1"
                :class="{ 'border-separator border-l': displayIsWide }"
                :style="getPaneStyle(maxDetailWidth)"
            >
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
                <div v-else class="pt-4 pl-4">
                    <slot name="no-selection" />
                </div>
            </div>
        </div>
    </div>
</template>
