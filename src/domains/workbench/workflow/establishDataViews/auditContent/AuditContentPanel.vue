<script setup lang="ts">
// DPUse Framework
import type { LocalisedConfig } from '@dpuse/dpuse-shared/locale';

// Local Components - Static
import type { TaskConfig } from '@/components/layout/tasks/Tasks.vue';

// Options, Properties, Slots & Emits
const { taskLocalisedConfig } = defineProps<{ taskLocalisedConfig: LocalisedConfig<TaskConfig> }>();
defineEmits<{ 'task-completed': [taskLocalisedConfig: LocalisedConfig<TaskConfig>] }>();
</script>

<template>
    <div class="px-4 pt-1">
        <div>Audit content...</div>

        <RouterLink :to="{ name: 'exploreData', query: { ...$route.query, wbView: 'exploreData' } }" @click="$emit('task-completed', taskLocalisedConfig)">Next...</RouterLink>
    </div>
</template>
