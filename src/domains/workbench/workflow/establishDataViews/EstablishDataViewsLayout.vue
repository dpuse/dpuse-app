<script setup lang="ts">
// External Dependencies
import { computed, ref, shallowRef, watch } from 'vue';
import { type LocationQueryValue, type RouteLocationNormalizedLoadedGeneric, useRoute } from 'vue-router';

// DPUse Framework
import { localiseConfigs, type LocalisedConfig } from '@dpuse/dpuse-shared/locale';

// Local (App) Framework
import T from './EstablishDataViewsLayout.json';
import { localeId, t } from '@/state/locale';

// Local Components - Static
import Header from '@/components/layout/header/Header.vue';
import LayoutShell from '@/components/layout/layoutShell/LayoutShell.vue';
import Tasks, { type TaskConfig } from '@/components/layout/tasks/Tasks.vue';

// Constants ───────────────────────────────────────────────────────────────────────────────────────────────────────────

const TASK_CONFIGS: TaskConfig[] = [
    { id: 'selectConnection', number: 1, label: { en: 'Connection' }, description: {}, disabled: true, enableUpTo: 1, verb: { en: 'Select' } },
    { id: 'selectNode', number: 2, label: { en: 'Node' }, description: {}, disabled: true, enableUpTo: 2, verb: { en: 'Select' } },
    { id: 'auditContent', number: 3, label: { en: 'Content' }, description: {}, disabled: true, enableUpTo: 3, verb: { en: 'Audit' } },
    // { id: 'auditLinks', number: 4, label: { en: 'Links' }, description: {}, disabled: true, enableUpTo: 5, verb: { en: 'Audit' } }, // TODO: Could be named 'Relationships'?
    { id: 'exploreData', number: 4, label: { en: 'Data' }, description: {}, disabled: true, enableUpTo: 5, verb: { en: 'Explore' } } // TODO, Could be split into 'Transform' and 'Investigate'.
];

// State ───────────────────────────────────────────────────────────────────────────────────────────────────────────────

const route = useRoute();

const taskLocalisedConfigs = shallowRef<LocalisedConfig<TaskConfig>[]>([]);

const tasksEnabledToNumber = ref(initialiseEnabledTasks());

// Derived State ───────────────────────────────────────────────────────────────────────────────────────────────────────

const activeTaskLocalisedConfig = computed(() => TASK_CONFIGS.find((config) => config.id === route.query.wbView));

const backRouteName = computed(() => (route.query.wbView === 'establishDataViews' ? 'workflow' : 'establishDataViews'));

// Side Effects ────────────────────────────────────────────────────────────────────────────────────────────────────────

watch(route, (newRoute) => setEnabledTasks(newRoute, newRoute.query.wbView));

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

// Handlers ────────────────────────────────────────────────────────────────────────────────────────────────────────────

function handleTaskCompleted(taskLocalisedConfig: LocalisedConfig<TaskConfig>): void {
    tasksEnabledToNumber.value = taskLocalisedConfig.enableUpTo;
}

// Helpers ─────────────────────────────────────────────────────────────────────────────────────────────────────────────

function initialiseEnabledTasks(): number {
    // TODO: This also needs to check the actual state of the data view.
    return TASK_CONFIGS.find((config) => config.id === route.query.wbView)?.enableUpTo ?? 0;
}

function setEnabledTasks(route: RouteLocationNormalizedLoadedGeneric, wbView: LocationQueryValue | LocationQueryValue[]): void {
    const pendingEnableStepsUpTo = TASK_CONFIGS.find((config) => config.id === wbView)?.enableUpTo ?? 0;
    if (pendingEnableStepsUpTo > tasksEnabledToNumber.value) tasksEnabledToNumber.value = pendingEnableStepsUpTo;
}
</script>

<template>
    <LayoutShell>
        <!-- Header -->
        <Header class="px-4" :overline="t(T, 'wb.label')" :title="t(T, 'Establish_Data_Views')" :to="backRouteName" />

        <!-- Action Bar -->
        <nav class="border-separator mx-4 flex flex-none items-center justify-between border-b">
            <!-- Tasks -->
            <Tasks v-if="activeTaskLocalisedConfig" :active-task-id="activeTaskLocalisedConfig.id" :items="taskLocalisedConfigs" />
        </nav>
        <!-- Data View List or Active Step Panel -->
        <div class="relative flex flex-1 flex-col overflow-hidden">
            <RouterView v-slot="{ Component }">
                <component :is="Component" v-if="route.name === 'establishDataViews'" class="h-full" />
                <component :is="Component" v-else class="h-full" :task-localised-config="activeTaskLocalisedConfig" @task-completed="handleTaskCompleted" />
            </RouterView>
        </div>
    </LayoutShell>
</template>
