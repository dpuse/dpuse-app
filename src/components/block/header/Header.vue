<script setup lang="ts">
// External dependencies
import { computed } from 'vue';

// Application modules
import { useWorkbenchShell } from '@/composables/useWorkbenchShell';

// Properties
type Properties = { title: string };
const properties = defineProps<Properties>();
const { isAssistantPanelVisible, isOptionBarVisible } = useWorkbenchShell();

// Header offsets
const headerOffsets = computed(() => ({
    paddingLeft: isOptionBarVisible.value ? undefined : '2.5rem',
    paddingRight: isAssistantPanelVisible.value ? undefined : '2.5rem'
}));
</script>

<template>
    <div class="flex-none px-4">
        <div class="flex h-14 items-center border-b" :style="headerOffsets">
            <div class="truncate">
                {{ properties.title }}
            </div>
        </div>
    </div>
</template>
