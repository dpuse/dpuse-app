<script setup lang="ts">
// DPUse Framework
import type { LocalisedConfig } from '@dpuse/dpuse-shared/locale';

// Local Components - Static
import type { TaskConfig } from '~/src/components/composite/taskBar/TaskBar.vue';

// Options, Properties, Slots & Emits ──────────────────────────────────────────────────────────────────────────────────

const { taskLocalisedConfig } = defineProps<{ taskLocalisedConfig: LocalisedConfig<TaskConfig> }>();

defineEmits<{ 'task-completed': [taskLocalisedConfig: LocalisedConfig<TaskConfig>] }>();

// ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────

// const startTime = performance.now();
// // const response = await fetch('https://sample-data-eu.dpuse.app/fileStore/ENGAGEMENT_START_EVENTS_202405121858.csv');
// const response = await fetch('https://sample-data-eu.dpuse.app/WDI_Data.csv');

// const auditObjectContentSettings: AuditContentSettings = { encodingId: 'utf-8', path: '/WDI_Data.csv', valueDelimiterId: ',' };
// const auditObjectContentResult = (await processRequest('auditObjectContent', testConnectionConfig!, auditObjectContentSettings)) as AuditContentResult;
// const elapsedMs = performance.now() - startTime;
// console.log('auditObjectContentResult', elapsedMs, auditObjectContentResult);

// ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
</script>

<template>
    <div class="px-4 pt-1">
        <div>Audit content...</div>

        <RouterLink :to="{ name: 'exploreData', query: { ...$route.query, wbView: 'exploreData' } }" @click="$emit('task-completed', taskLocalisedConfig)">Next...</RouterLink>
    </div>
</template>
