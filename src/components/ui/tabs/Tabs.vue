<script setup lang="ts">
// Local Framework
import type { TabConfig } from '@/composables/useTabs';

// Properties, Slots & Emits
const { items = [] } = defineProps<{ items?: TabConfig[] }>();
defineSlots<{ 'default'(properties: { item: TabConfig }): unknown }>();
defineEmits<{ select: [tab: TabConfig] }>();
</script>

<template>
    <div v-if="items" class="flex gap-x-2">
        <!-- TODO: Is there enough room around tabs to effectively tap on touch devices? -->
        <component
            :is="item.to ? 'RouterLink' : 'div'"
            v-for="item in items"
            :key="item.id"
            :to="{ name: item.to, query: { ...$route.query, wbView: item.to } }"
            class="-center flex min-w-0 flex-col justify-center truncate border-y-2 border-t-transparent border-b-zinc-500 px-2 leading-tight"
            role="tab"
            @click="$emit('select', item)"
        >
            <slot :item="item" />
        </component>
    </div>
</template>
