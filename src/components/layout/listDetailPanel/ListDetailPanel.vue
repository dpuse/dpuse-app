<script setup lang="ts" generic="T extends { id: string; label: string }">
// External Dependencies
import { ArrowBigLeftIcon } from 'lucide-vue-next';
import { computed, shallowRef } from 'vue';

// App Framework
import type { DataSource } from '@/composables/useDataWindow';
import { displayIsWide } from '@/state/appLayout';

// App Static Components
import Button from '../../ui/button/Button.vue';
import ContentScroller from '../../layout/contentScroller/ContentScroller.vue';
import Grid from '../../ui/grid/Grid.vue';

// Properties, Emits & Slots ───────────────────────────────────────────────────────────────────────────────────────────

const { items, maxDetailWidth } = defineProps<{ items: T[]; maxDetailWidth?: string }>();

const emit = defineEmits<{ 'select-item': [item: T] }>();

defineSlots<{
    detail(properties: { item: T }): unknown;
    'list-item-compact'(properties: { item: T }): unknown;
    'list-item-default'(properties: { item: T }): unknown;
}>();

// State ───────────────────────────────────────────────────────────────────────────────────────────────────────────────

const activeItem = shallowRef<T | undefined>();

// Derived State ───────────────────────────────────────────────────────────────────────────────────────────────────────

const dataSource = computed<DataSource>(() => ({
    rowCount: items.length,
    getRows: (start, end): Promise<unknown[]> => Promise.resolve(items.slice(start, end))
}));

// UI Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

function selectItem(item: T): void {
    activeItem.value = item;
    emit('select-item', item);
}
</script>

<template>
    <div class="flex overflow-y-hidden">
        <div v-if="displayIsWide || !activeItem" class="flex flex-1 flex-col">
            <Grid class="flex-1" :data-source="dataSource" :row-height="150" :target-column-width="350">
                <template #default="{ row }">
                    <Button class="h-full" variant="listItem" @click="selectItem(row as T)">
                        <slot name="list-item-default" :item="row as T" />
                    </Button>
                </template>

                <template #compact="{ row }">
                    <Button class="h-full" variant="listItem" @click="selectItem(row as T)">
                        <slot name="list-item-compact" :item="row as T" />
                    </Button>
                </template>
            </Grid>
        </div>

        <div
            v-if="displayIsWide || activeItem"
            class="bg-backdrop border-boundary flex flex-1 flex-col border-l px-4"
            :style="{ maxWidth: maxDetailWidth != null && displayIsWide ? maxDetailWidth : undefined }"
        >
            <div v-if="activeItem" class="flex flex-col overflow-y-hidden">
                <div class="border-separator flex h-12 flex-none items-center gap-x-1 border-b">
                    <Button v-if="!displayIsWide" variant="iconSmall" @click="activeItem = undefined">
                        <ArrowBigLeftIcon stroke-width="1.25" />
                    </Button>
                    {{ activeItem?.label ?? 'Unknown' }}
                </div>

                <ContentScroller class="flex-1 pt-4 pb-20">
                    <slot name="detail" :item="activeItem" />
                </ContentScroller>
            </div>

            <div v-else>Select an item...</div>
        </div>
    </div>
</template>
