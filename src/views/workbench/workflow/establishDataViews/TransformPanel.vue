<script setup lang="ts">
// App Core
import type { TaskConfig } from './EstablishDataViews.vue';

// Properties & Emits
const { taskConfig } = defineProps<{ taskConfig: TaskConfig }>();
const emit = defineEmits<{ (event: 'complete', taskConfig: TaskConfig): void }>();

// UI Helpers ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function triggerComplete(): void {
    emit('complete', taskConfig);
}
</script>

<template>
    <div class="px-4 pt-1">
        <div>Transform...</div>
        <RouterLink :to="{ name: 'investigate', query: { ...$route.query, wbView: 'investigate' } }" @click="triggerComplete">Next...</RouterLink>
    </div>
</template>
