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

function getPaneStyle(maxWidth?: string): { maxWidth?: string } {
    return { maxWidth: maxWidth != null && displayIsWide.value ? maxWidth : undefined };
}

function selectItem(item: T): void {
    activeItem.value = item;
    emit('select-item', item);
}
</script>

<template>
    <div class="flex flex-1 overflow-hidden">
        <!-- Grid -->
        <Grid v-if="displayIsWide || !activeItem" class="mr-4 flex-1" :data-source="dataSource" :row-height="150" :target-column-width="350" :style="getPaneStyle(maxListWidth)">
            <template v-if="slots['list-item-default']" #default="{ row }">
                <Button class="h-full" variant="listItem" @click="selectItem(row as T)">
                    <slot name="list-item-default" :item="row as T" />
                </Button>
            </template>

            <template v-if="slots['list-item-compact']" #compact="{ row }">
                <Button class="h-full" variant="listItem" @click="selectItem(row as T)">
                    <slot name="list-item-compact" :item="row as T" />
                </Button>
            </template>
        </Grid>

        <!-- Detail -->
        <div v-if="displayIsWide || activeItem" class="border-boundary mr-4 min-w-0 flex-1" :class="{ 'ml-4': !displayIsWide }" :style="getPaneStyle(maxDetailWidth)">
            <div v-if="activeItem" class="flex h-full flex-col">
                <div class="border-separator flex h-12 min-w-0 flex-none items-center gap-x-1 border-b">
                    <Button v-if="!displayIsWide" variant="iconSmall" @click="activeItem = undefined">
                        <ArrowBigLeftIcon stroke-width="1.25" />
                    </Button>
                    <span class="min-w-0 flex-1 truncate">{{ activeItem?.label ?? 'Unknown' }}</span>
                </div>

                <div class="flex-1 overflow-hidden">
                    <slot name="detail" :item="activeItem" />
                </div>
            </div>

            <div v-else class="h-full overflow-hidden">
                <slot name="no-selection" />
            </div>
        </div>
    </div>
</template>
