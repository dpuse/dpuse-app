<script setup lang="ts" generic="T extends { id: string; label: string }">
// External Dependencies
import { ArrowBigLeftIcon } from 'lucide-vue-next';
import { computed, shallowRef } from 'vue';

// App Core
import type { DataSource } from '@/composables/useDataWindow';
import { displayIsWide } from '@/state/displayBreakpoint';

// App Components - Statically imported so always available, even after app goes offline.
import Button from '@/components/button/Button.vue';
import List from '@/components/list/List.vue';

// Properties & Emits
const { items, maxRightWidth } = defineProps<{ items: T[]; maxRightWidth?: string }>();
const emit = defineEmits<{ (event: 'select', item: T | undefined): void }>();

// State ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const activeItem = shallowRef<T | undefined>();

// Derived State ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const dataSource = computed<DataSource>(() => ({
    rowCount: items.length,
    getRows: (start, end): Promise<unknown[]> => Promise.resolve(items.slice(start, end))
}));

// UI Helpers ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function selectItem(item: T | undefined): void {
    activeItem.value = item;
    emit('select', item);
}
</script>

<template>
    <div class="flex">
        <div v-if="displayIsWide || !activeItem" class="flex flex-1 flex-col">
            <List class="flex-1 pb-20" :data-source="dataSource" :row-height="150" :target-column-width="350">
                <template #default="{ row }">
                    <div class="h-full" @click="selectItem(row as T)">
                        <slot name="list-item" :item="row as T" />
                    </div>
                </template>
            </List>
        </div>

        <div v-if="displayIsWide || activeItem" class="mx-4 flex flex-1 flex-col" :style="{ maxWidth: maxRightWidth != null ? maxRightWidth : undefined }">
            <div v-if="activeItem">
                <div class="border-separator flex h-12 flex-none items-center gap-x-1 border-b">
                    <Button v-if="!displayIsWide" variant="iconSmall" @click="activeItem = undefined">
                        <ArrowBigLeftIcon stroke-width="1.25" />
                    </Button>
                    {{ activeItem?.label ?? 'Unknown' }}
                </div>

                <div class="flex-1 pt-4 pr-4 pb-20">
                    <slot name="detail" :item="activeItem" />
                </div>
            </div>

            <div v-else>Select an item...</div>
        </div>
    </div>
</template>
