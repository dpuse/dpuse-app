<script setup lang="ts">
// ── External Dependencies & Registrations
import { useRoute } from 'vue-router';
import { computed, ref, shallowRef, watch } from 'vue';

// ── DPUse Framework
import { localiseConfigs, type LocalisedConfig } from '@dpuse/dpuse-shared/locale';

// ── Local (App) Framework
import T from './EstablishDataViewsLayout.json';
import { localeId, t } from '@/state/locale';

// ── Local Components - Static
import WorkbenchHeader from '@/components/framework/header/WorkbenchHeader.vue';
import WorkbenchLayout from '../WorkbenchLayout.vue';
import TaskBar, { type TaskConfig } from '@/components/ui/TaskBar.vue';

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

const TASK_CONFIGS: TaskConfig[] = [
    { id: 'selectConnection', number: 1, label: { en: 'Connection' }, description: {}, disabled: true, enableUpTo: 1, verb: { en: 'Select' } },
    { id: 'selectItem', number: 2, label: { en: 'Item' }, description: {}, disabled: true, enableUpTo: 2, verb: { en: 'Select' } },
    { id: 'auditContent', number: 3, label: { en: 'Content' }, description: {}, disabled: true, enableUpTo: 3, verb: { en: 'Audit' } },
    { id: 'exploreData', number: 4, label: { en: 'Data' }, description: {}, disabled: true, enableUpTo: 5, verb: { en: 'Explore' } }
];

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

const route = useRoute();

const taskLocalisedConfigs = shallowRef<LocalisedConfig<TaskConfig>[]>([]);

const tasksEnabledToNumber = ref(0);

// ── Derived State ────────────────────────────────────────────────────────────────────────────────────────────────────

const activeTaskLocalisedConfig = computed(() => TASK_CONFIGS.find((config) => config.id === route.query.wbView));

const navigateBackRouteName = computed(() => (route.query.wbView === 'establishDataViews' ? 'workbench' : 'establishDataViews'));

// ── Side Effects ─────────────────────────────────────────────────────────────────────────────────────────────────────

watch(
    route,
    (newRoute) => {
        const pendingEnableStepsUpTo = TASK_CONFIGS.find((config) => config.id === newRoute.query.wbView)?.enableUpTo ?? 0;
        if (pendingEnableStepsUpTo > tasksEnabledToNumber.value) tasksEnabledToNumber.value = pendingEnableStepsUpTo;
    },
    { immediate: true }
);

watch(
    [tasksEnabledToNumber, localeId],
    ([newTasksEnabledToNumber, newLocaleId]) => {
        taskLocalisedConfigs.value = localiseConfigs<TaskConfig>(TASK_CONFIGS, newLocaleId).map((taskLocalisedConfig) => ({
            ...taskLocalisedConfig,
            disabled: taskLocalisedConfig.number > newTasksEnabledToNumber
        }));
    },
    { immediate: true }
);

// ── Event Handlers ───────────────────────────────────────────────────────────────────────────────────────────────────

function handleTaskCompleted(taskLocalisedConfig: LocalisedConfig<TaskConfig>): void {
    tasksEnabledToNumber.value = taskLocalisedConfig.enableUpTo;
}
</script>

<template>
    <WorkbenchLayout>
        <!-- Header -->
        <WorkbenchHeader class="flex-none px-4" :overline="t(T, 'wb.label')" :title="t(T, 'Establish_Data_Views')" :to="navigateBackRouteName" />

        <!-- Task Bar -->
        <TaskBar v-if="activeTaskLocalisedConfig" :active-task-id="activeTaskLocalisedConfig.id" class="mx-4 flex flex-none" :items="taskLocalisedConfigs" />

        <!-- Data View List or Active Task Panel -->
        <div class="relative flex min-h-0 flex-1 flex-col">
            <RouterView v-slot="{ Component }">
                <component :is="Component" v-if="route.name === 'establishDataViews'" class="min-h-0 flex-1" />
                <component :is="Component" v-else class="min-h-0 flex-1" :task-localised-config="activeTaskLocalisedConfig" @task-completed="handleTaskCompleted" />
            </RouterView>
        </div>
    </WorkbenchLayout>
</template>
