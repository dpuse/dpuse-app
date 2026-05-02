<script setup lang="ts" generic="T extends { icon?: string | null; label: string }">
// External Dependencies
import { XIcon } from 'lucide-vue-next';
import { nextTick, ref, watch } from 'vue';

// Local (App) Framework
import type { DataSource } from '@/composables/useDataWindow';
import { displayIsWide } from '@/state/appLayout';

// Local Components - Static
import Button from '@/components/ui/button/Button.vue';
import FloatingButton from '@/components/ui/button/FloatingButton.vue';
import Grid from '@/components/ui/grid/Grid.vue';

// Properties, Slots & Emits ───────────────────────────────────────────────────────────────────────────────────────────

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

// UI Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

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
    <div class="flex flex-1 flex-col overflow-hidden">
        <!-- Header -->
        <header class="mx-4">
            <slot name="header" />
        </header>

        <!-- Body -->
        <div class="flex flex-1 overflow-hidden">
            <!-- Grid Pane -->
            <div v-show="displayIsWide || !detailPaneIsVisible" class="relative flex-1 overflow-hidden" :style="getPaneStyle(maxListWidth)">
                <Grid class="flex-1" :data-source="dataSource" :row-height="150" :target-column-width="350">
                    <template v-if="slots['list-item-default']" #default="{ item }">
                        <Button class="h-full" :is-active="activeItem === item" variant="listItem" @click="selectItem(item)">
                            <slot name="list-item-default" :item="item" />
                        </Button>
                    </template>

                    <template v-if="slots['list-item-compact']" #compact="{ item }">
                        <Button class="h-full" :is-active="activeItem === item" variant="listItem" @click="selectItem(item)">
                            <slot name="list-item-compact" :item="item" />
                        </Button>
                    </template>
                </Grid>

                <FloatingButton
                    v-if="enableAddAction"
                    class="right-[calc(env(safe-area-inset-left)+32px)] bottom-[max(calc(env(safe-area-inset-bottom)+16px),20px+16px)]"
                    variant="add"
                />
            </div>

            <!-- Detail Pane -->
            <div
                v-if="displayIsWide || detailPaneIsVisible"
                class="mr-4 min-w-0 flex-1"
                :class="{ 'border-separator border-l': displayIsWide }"
                :style="getPaneStyle(maxDetailWidth)"
            >
                <div v-if="activeItem" class="flex h-full flex-col">
                    <!-- Detail Header -->
                    <div class="border-separator ml-4 flex h-10 items-center justify-between gap-x-1 overflow-hidden border-b">
                        <div v-if="activeItem.icon" aria-hidden="true" style="width: 22px" v-html="activeItem.icon" />
                        <span class="min-w-0 truncate text-sm">{{ activeItem.label }}</span>
                        <Button
                            variant="iconSmall"
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

                <div v-else class="h-full">
                    <slot name="no-selection" />
                </div>
            </div>
        </div>
    </div>
</template>
