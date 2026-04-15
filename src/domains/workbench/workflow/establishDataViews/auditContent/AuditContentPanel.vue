<script setup lang="ts">
// App Framework
import type { TaskLocalisedConfig } from '../EstablishDataViewsLayout.vue';

// Properties, Emits & Slots ───────────────────────────────────────────────────────────────────────────────────────────

const { taskLocalisedConfig } = defineProps<{ taskLocalisedConfig: TaskLocalisedConfig }>();

const emit = defineEmits<{ complete: [taskLocalisedConfig: TaskLocalisedConfig] }>();

// UI Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

function triggerComplete(): void {
    emit('complete', taskLocalisedConfig);
}
</script>

<template>
    <div class="px-4 pt-1">
        <div>Audit content...</div>
        <RouterLink :to="{ name: 'auditRelationships', query: { ...$route.query, wbView: 'auditRelationships' } }" @click="triggerComplete">Next...</RouterLink>
    </div>
</template>
