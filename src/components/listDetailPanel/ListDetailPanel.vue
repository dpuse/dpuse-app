<script setup lang="ts" generic="T extends { id: string; label: string }">
// External Dependencies
import { ArrowBigLeftIcon } from 'lucide-vue-next';
import { shallowRef } from 'vue';

// App Core
import { useDisplayBreakpoint } from '@/composables/useDisplayBreakpoint';

// App Components & Views - Statically imported so always available, even after app goes offline.
import Button from '@/components/button/Button.vue';
import GridScroller from '@/components/gridScroller/GridScroller.vue';

// Properties & Emits
const { items, maxRightWidth } = defineProps<{ items: T[]; maxRightWidth?: string }>();

// Global State ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const { displayIsWide } = useDisplayBreakpoint();

// Local State ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const activeItem = shallowRef<T | undefined>();
</script>

<template>
    <div class="flex">
        <div v-if="displayIsWide || !activeItem" class="flex flex-1 flex-col">
            <GridScroller class="flex-1 pb-20" :items="items" :row-height="150" :target-column-width="350">
                <template #default="{ item }">
                    <div class="h-full" @click="activeItem = item">
                        <slot name="list-item" :item="item" />
                    </div>
                </template>
            </GridScroller>
        </div>

        <div v-if="displayIsWide || activeItem" class="flex flex-1 flex-col" :style="{ maxWidth: maxRightWidth != null ? maxRightWidth : undefined }">
            <div class="border-separator flex h-12 flex-none items-center gap-x-1 border-b">
                <Button v-if="!displayIsWide" variant="iconSmall" @click="activeItem = undefined">
                    <ArrowBigLeftIcon stroke-width="1.25" />
                </Button>
                {{ activeItem?.label ?? 'Unknown' }}
            </div>

            <div class="mr-4 flex-1 pt-4 pb-20">
                <slot name="detail" />
            </div>
        </div>
    </div>
</template>
