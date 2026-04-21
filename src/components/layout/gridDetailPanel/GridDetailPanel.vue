<script setup lang="ts" generic="T extends { id: string; label: string }">
// External Dependencies
import { ArrowBigLeftIcon } from 'lucide-vue-next';
import { shallowRef } from 'vue';

// Local Framework
import type { DataSource } from '@/composables/useDataWindow';
import { displayIsWide } from '@/state/appLayout';

// Local Components - Static
import Button from '../../ui/button/Button.vue';
import Grid from '../../ui/grid/Grid.vue';

// Properties, Slots & Emits ───────────────────────────────────────────────────────────────────────────────────────────

const { dataSource, maxListWidth, maxDetailWidth } = defineProps<{ dataSource: DataSource<T>; maxListWidth?: string; maxDetailWidth?: string }>();

const emit = defineEmits<{ 'select-item': [item: T] }>();

const slots = defineSlots<{
    detail(properties: { item: T }): unknown;
    'no-selection'(): unknown;
    'list-item-compact'(properties: { item: T }): unknown;
    'list-item-default'(properties: { item: T }): unknown;
}>();

// State ───────────────────────────────────────────────────────────────────────────────────────────────────────────────

const activeItem = shallowRef<T | undefined>();

// UI Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

function selectItem(item: T): void {
    activeItem.value = item;
    emit('select-item', item);
}
</script>

<template>
    <div class="flex flex-1 overflow-y-hidden">
        <!-- Grid -->
        <div v-if="displayIsWide || !activeItem" class="flex flex-1 flex-col" :style="{ maxWidth: maxListWidth != null && displayIsWide ? maxListWidth : undefined }">
            <Grid class="flex-1" :data-source="dataSource" :row-height="150" :target-column-width="350">
                <template v-if="slots['list-item-default']" #default="{ row }">
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

        <!-- Detail -->
        <div
            v-if="displayIsWide || activeItem"
            class="bg-backdrop border-boundary flex flex-1 flex-col border-l"
            :style="{ maxWidth: maxDetailWidth != null && displayIsWide ? maxDetailWidth : undefined }"
        >
            <div v-if="activeItem" class="flex flex-col overflow-y-hidden">
                <div class="border-separator mx-4 flex h-12 flex-none items-center gap-x-1 border-b">
                    <Button v-if="!displayIsWide" variant="iconSmall" @click="activeItem = undefined">
                        <ArrowBigLeftIcon stroke-width="1.25" />
                    </Button>
                    {{ activeItem?.label ?? 'Unknown' }}
                </div>

                <slot name="detail" :item="activeItem" />
            </div>

            <div v-else>
                <slot name="no-selection" />
            </div>
        </div>
    </div>
</template>
