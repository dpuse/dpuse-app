<script setup lang="ts" generic="T extends { id: string; label: string }">
// External Dependencies
import { ArrowBigLeftIcon } from 'lucide-vue-next';
import { ref, shallowRef } from 'vue';

// Local Framework
import type { DataSource } from '@/composables/useDataWindow';
import { displayIsWide } from '@/state/appLayout';

// Local Components - Static
import Button from '@/components/ui/button/Button.vue';
import Grid from '@/components/ui/grid/Grid.vue';
import type { Tab } from '@/components/ui/tabs/Tabs.vue';
import Breadcrumbs, { type Breadcrumb } from '@/components/ui/breadcrumbs/Breadcrumbs.vue';

// Properties, Slots & Emits ───────────────────────────────────────────────────────────────────────────────────────────

const { dataSource, maxListWidth, maxDetailWidth } = defineProps<{ dataSource: DataSource<T>; maxListWidth?: string; maxDetailWidth?: string }>();

const slots = defineSlots<{
    detail(properties: { item: T }): unknown;
    'no-selection'(): unknown;
    'list-item-compact'(properties: { item: T }): unknown;
    'list-item-default'(properties: { item: T }): unknown;
}>();

const emit = defineEmits<{ 'select-breadcrumb': [breadcrumb: Breadcrumb]; 'select-item': [item: T] }>();

// State ───────────────────────────────────────────────────────────────────────────────────────────────────────────────

const activeItem = shallowRef<T | undefined>();

const breadcrumbs = ref<Breadcrumb[]>([{ id: 'home', label: 'Home' }]);

const tabs = ref<Tab[]>([
    { id: 'table', label: 'Table' },
    { id: 'text', label: 'Text' }
]);

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
    <div class="flex flex-1 flex-col overflow-hidden">
        <!-- Breadcrumbs -->
        <div class="mx-4 flex flex-none py-2">
            <button v-for="(breadcrumb, index) in breadcrumbs" :key="breadcrumb.id" @click="$emit('select-breadcrumb', breadcrumb)">
                <span v-if="index > 0" class="mx-1">&gt;</span>{{ breadcrumb.label }}
            </button>
        </div>

        <!-- Body -->
        <div class="flex h-full overflow-hidden">
            <!-- Grid -->
            <Grid
                v-if="displayIsWide || !activeItem"
                class="mr-4 flex-1"
                :data-source="dataSource"
                :row-height="150"
                :target-column-width="350"
                :style="getPaneStyle(maxListWidth)"
            >
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
    </div>
</template>
