<script setup lang="ts">
import { useWorkbenchChrome } from '@/composables/useWorkbenchChrome';

import { computed } from 'vue';

// Properties
type Properties = { title: string };
const properties = defineProps<Properties>();
const { isAssistantPanelVisible, isOptionBarVisible } = useWorkbenchChrome();

const headerOffsets = computed(() => ({
    paddingLeft: isOptionBarVisible.value ? undefined : '3.5rem',
    paddingRight: isAssistantPanelVisible.value ? undefined : '3.5rem'
}));
</script>

<template>
    <div class="flex h-14 w-full flex-none items-center border-b px-4" :style="headerOffsets">
        <div class="min-w-0 flex-1 truncate">
            {{ properties.title }} {{ properties.title }} {{ properties.title }} {{ properties.title }} {{ properties.title }} {{ properties.title }} {{ properties.title }}
            {{ properties.title }} {{ properties.title }} {{ properties.title }} {{ properties.title }} {{ properties.title }}
        </div>
    </div>
</template>
