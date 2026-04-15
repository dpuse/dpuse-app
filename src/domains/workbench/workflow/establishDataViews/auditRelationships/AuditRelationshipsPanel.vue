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
        <div>Audit relationships...</div>
        <RouterLink :to="{ name: 'transform', query: { ...$route.query, wbView: 'transform' } }" @click="triggerComplete">Next...</RouterLink>
    </div>
</template>
