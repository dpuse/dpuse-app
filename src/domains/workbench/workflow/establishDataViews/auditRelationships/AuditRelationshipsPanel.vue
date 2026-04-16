<script setup lang="ts">
// App Framework
import type { TaskLocalisedConfig } from '../EstablishDataViewsLayout.vue';

// Properties, Slots & Emits
const { taskLocalisedConfig } = defineProps<{ taskLocalisedConfig: TaskLocalisedConfig }>();

defineEmits<{ 'task-completed': [taskLocalisedConfig: TaskLocalisedConfig] }>();
</script>

<template>
    <div class="px-4 pt-1">
        <div>Audit relationships...</div>
        <RouterLink :to="{ name: 'transform', query: { ...$route.query, wbView: 'transform' } }" @click="$emit('task-completed', taskLocalisedConfig)">Next...</RouterLink>
    </div>
</template>
