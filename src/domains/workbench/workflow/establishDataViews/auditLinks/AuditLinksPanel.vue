<script setup lang="ts">
// DPUse Framework
import type { LocalisedConfig } from '@dpuse/dpuse-shared/locale';

// Local Framework
import type { TaskConfig } from '../EstablishDataViewsLayout.vue';

// Properties, Slots & Emits
const { taskLocalisedConfig } = defineProps<{ taskLocalisedConfig: LocalisedConfig<TaskConfig> }>();
defineEmits<{ 'task-completed': [taskLocalisedConfig: LocalisedConfig<TaskConfig>] }>();
</script>

<template>
    <div class="px-4 pt-1">
        <div>Audit links will be implemented in a future release...</div>
    </div>
</template>
