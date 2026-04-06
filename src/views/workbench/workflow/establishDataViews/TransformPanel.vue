<script setup lang="ts">
// App Core
import type { TaskLocalisedConfig } from './EstablishDataViewsLayout.vue';

// Properties & Emits
const { taskLocalisedConfig } = defineProps<{ taskLocalisedConfig: TaskLocalisedConfig }>();
const emit = defineEmits<{ (event: 'complete', taskLocalisedConfig: TaskLocalisedConfig): void }>();

// UI Helpers ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function triggerComplete(): void {
    emit('complete', taskLocalisedConfig);
}
</script>

<template>
    <div class="px-4 pt-1">
        <div>Transform...</div>
        <RouterLink :to="{ name: 'investigate', query: { ...$route.query, wbView: 'investigate' } }" @click="triggerComplete">Next...</RouterLink>
    </div>
</template>
