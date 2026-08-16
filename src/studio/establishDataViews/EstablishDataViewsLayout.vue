<script setup lang="ts">
// ── External Dependencies & Registrations
import { useRoute } from 'vue-router';
import { computed, ref, shallowRef, watch } from 'vue';

// ── DPUse Framework
import { localiseConfig, localiseConfigs, type LocalisedConfig } from '@dpuse/dpuse-shared/locale';

// ── Local Framework
import T from './EstablishDataViews.json';
import { activeDataViewConfig } from '@/state/dataViews';
import { localeId, t } from '@/state/locale';

// ── Local Components - Static
import StudioHeader from '../StudioHeader.vue';
import StudioLayout from '../StudioLayout.vue';
import TaskBar, { type TaskConfig } from '@/components/ui/TaskBar.vue';

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

const TASK_CONFIGS: TaskConfig[] = [
    { id: 'selectConnection', number: 1, label: { en: 'Connection' }, description: {}, disabled: true, enableUpTo: 1, verb: { en: 'Select' } },
    { id: 'selectItem', number: 2, label: { en: 'Item' }, description: {}, disabled: true, enableUpTo: 2, verb: { en: 'Select' } },
    { id: 'auditContent', number: 3, label: { en: 'Content' }, description: {}, disabled: true, enableUpTo: 3, verb: { en: 'Audit' } },
    { id: 'exploreData', number: 4, label: { en: 'Data' }, description: {}, disabled: true, enableUpTo: 4, verb: { en: 'Explore' } }
];

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

const headerOverline = ref('');
const headerTitle = ref('');
const route = useRoute();
const taskLocalisedConfigs = shallowRef<LocalisedConfig<TaskConfig>[]>([]);
const tasksEnabledUpToNumber = ref(0);

// ── Derived State ────────────────────────────────────────────────────────────────────────────────────────────────────

const activeTaskLocalisedConfig = computed(() => taskLocalisedConfigs.value.find((config) => config.id === route.query.sView));
const navigateBackRouteName = computed(() => (route.query.sView === 'establishDataViews' ? 'studio' : 'establishDataViews'));

// ── Side Effects ─────────────────────────────────────────────────────────────────────────────────────────────────────

watch(
    () => route.query.sView,
    (newSView) => {
        const pendingEnableStepsUpTo = TASK_CONFIGS.find((config) => config.id === newSView)?.enableUpTo ?? 0;
        if (pendingEnableStepsUpTo > tasksEnabledUpToNumber.value) tasksEnabledUpToNumber.value = pendingEnableStepsUpTo;
    },
    { immediate: true }
);

watch(
    [activeTaskLocalisedConfig, activeDataViewConfig, localeId],
    ([newActiveTaskLocalisedConfig, newActiveDataViewConfig, newLocaleId]) => {
        if (newActiveTaskLocalisedConfig) {
            headerOverline.value = t(T, 'Establish_Data_Views');
            headerTitle.value = newActiveDataViewConfig ? localiseConfig(newActiveDataViewConfig, newLocaleId).label : t(T, 'Establish_Data_Views');
        } else {
            headerOverline.value = t(T, 'Studio');
            headerTitle.value = t(T, 'Establish_Data_Views');
        }
    },
    { immediate: true }
);

watch(
    [tasksEnabledUpToNumber, localeId],
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
    tasksEnabledUpToNumber.value = taskLocalisedConfig.enableUpTo;
}
</script>

<template>
    <StudioLayout>
        <!-- Header -->
        <StudioHeader class="flex-none px-4" :overline="headerOverline" :title="headerTitle" :to="navigateBackRouteName" />

        <!-- Task Bar -->
        <TaskBar v-if="activeTaskLocalisedConfig" :active-task-id="activeTaskLocalisedConfig.id" class="mx-4 flex flex-none" :items="taskLocalisedConfigs" />

        <!-- Data View List or Active Task Panel -->
        <RouterView v-slot="{ Component }">
            <component :is="Component" v-if="route.name === 'establishDataViews'" class="min-h-0 flex-1" />
            <component :is="Component" v-else class="min-h-0 flex-1" :task-localised-config="activeTaskLocalisedConfig" @task-completed="handleTaskCompleted" />
        </RouterView>
    </StudioLayout>
</template>
