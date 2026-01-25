<script setup lang="ts">
import { useWorkbenchChrome } from '@/composables/useWorkbenchChrome';

import { computed } from 'vue';

// Properties
type Properties = { title: string };
const properties = defineProps<Properties>();
const { isAssistantPanelVisible, isOptionBarVisible } = useWorkbenchChrome();

const headerOffsets = computed(() => ({
    paddingLeft: isOptionBarVisible.value ? undefined : '2.5rem',
    paddingRight: isAssistantPanelVisible.value ? undefined : '2.5rem'
}));
</script>

<template>
    <div class="px-4">
        <div class="flex h-14 w-full flex-none items-center border-b" :style="headerOffsets">
            <div class="truncate">
                {{ properties.title }} {{ properties.title }} {{ properties.title }} {{ properties.title }} {{ properties.title }} {{ properties.title }} {{ properties.title }}
                {{ properties.title }} {{ properties.title }} {{ properties.title }} {{ properties.title }} {{ properties.title }}
            </div>
        </div>
    </div>
</template>
