<script setup lang="ts">
// ── External Dependencies & Registrations
import { ArrowRightIcon } from '@lucide/vue';
import { useRoute, useRouter } from 'vue-router';

// ── DPUse Framework
import type { LocalisedConfig } from '@dpuse/dpuse-shared';

// ── Local Framework
import { ignoreReportedNavigationFailure } from '@/router';
import { t } from '@/state/locale';
import { TEXT } from './AuditContentPanel_.json';

// ── Static Components
import PillButton from '@/components/ui/action/PillButton.vue';
import type { TaskConfig } from '@/components/ui/TaskBar.vue';

// ── Options, Props, Slots & Emits ────────────────────────────────────────────────────────────────────────────────────

const { taskLocalisedConfig } = defineProps<{ taskLocalisedConfig: LocalisedConfig<TaskConfig> }>();

const emit = defineEmits<{ 'task-completed': [taskLocalisedConfig: LocalisedConfig<TaskConfig>] }>();

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

const route = useRoute();
const router = useRouter();

// ── Event Handlers ───────────────────────────────────────────────────────────────────────────────────────────────────

// TODO: Run the audit when an item is committed on Select Item, save its result as the data view's
// 'contentAuditConfig', and show the saved audit's details here. This panel never starts an audit by itself. Add a
// 'Redo audit' action for when the item's data may have changed since it was audited.
// TODO: Import the audited records into a DPUse store, so Explore Data can show them, before moving on.
function handleCommitDetail(): void {
    emit('task-completed', taskLocalisedConfig);
    void ignoreReportedNavigationFailure(router.push({ name: 'data', query: route.query }));
}

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
    <div class="relative flex min-h-0 flex-1 flex-col" data-region="AuditContentPanel">
        <PillButton :icon="ArrowRightIcon" :label="t(TEXT, 'explore.label')" @click="handleCommitDetail" />
    </div>
</template>
