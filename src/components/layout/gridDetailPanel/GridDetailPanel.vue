<script setup lang="ts" generic="T extends { label: string }">
// External Dependencies
import { ArrowBigLeftIcon } from 'lucide-vue-next';
import { ref } from 'vue';

// Local (App) Framework
import type { DataSource } from '@/composables/useDataWindow';
import { displayIsWide } from '@/state/appLayout';

// Local Components - Static
import Button from '@/components/ui/button/Button.vue';
import FloatingButton from '@/components/ui/button/FloatingButton.vue';
import Grid from '@/components/ui/grid/Grid.vue';

// Properties, Slots & Emits ───────────────────────────────────────────────────────────────────────────────────────────

type Properties = { dataSource: DataSource<T>; enableAddAction?: boolean; maxListWidth?: string; maxDetailWidth?: string };
const { dataSource, enableAddAction = false, maxListWidth, maxDetailWidth } = defineProps<Properties>();

const slots = defineSlots<{
    'header'(): unknown;
    'list-item-compact'(properties: { item: T }): unknown;
    'list-item-default'(properties: { item: T }): unknown;
    detail(properties: { item: T }): unknown;
    'no-selection'(): unknown;
}>();

const emit = defineEmits<{ select: [item: T] }>();

// State ───────────────────────────────────────────────────────────────────────────────────────────────────────────────

const activeItem = defineModel<T | undefined>();

const detailPaneIsVisible = ref(false);

// UI Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

function getPaneStyle(maxWidth?: string): { maxWidth?: string } {
    return { maxWidth: maxWidth != null && displayIsWide.value ? maxWidth : undefined };
}

function selectItem(row: T): void {
    emit('select', row);
    activeItem.value = row;
    detailPaneIsVisible.value = true;
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
            <div v-if="displayIsWide || !detailPaneIsVisible" class="relative flex-1" :style="getPaneStyle(maxListWidth)">
                <Grid class="flex-1" :data-source="dataSource" :row-height="150" :target-column-width="350">
                    <template v-if="slots['list-item-default']" #default="{ item }">
                        <Button class="h-full" variant="listItem" @click="selectItem(item)">
                            <slot name="list-item-default" :item="item" />
                        </Button>
                    </template>

                    <template v-if="slots['list-item-compact']" #compact="{ item }">
                        <Button class="h-full" variant="listItem" @click="selectItem(item)">
                            <slot name="list-item-compact" :item="item" />
                        </Button>
                    </template>
                </Grid>

                <FloatingButton v-if="enableAddAction" variant="add" />
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
                    <div class="border-separator ml-4 flex h-10 items-center gap-x-1 border-b">
                        <Button v-if="!displayIsWide" variant="iconSmall" @click="detailPaneIsVisible = false">
                            <ArrowBigLeftIcon class="flex-none" :stroke-width="1.25" />
                        </Button>

                        <span>{{ activeItem.label }}</span>
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
