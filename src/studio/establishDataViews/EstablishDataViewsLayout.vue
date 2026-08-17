<script setup lang="ts">
// ── External Dependencies & Registrations
import { useRoute } from 'vue-router';
import { computed, ref, watch } from 'vue';

// ── DPUse Framework
import { localiseConfig, localiseConfigs, type LocalisedConfig } from '@dpuse/dpuse-shared/locale';

// ── Local Framework
import { activeDataViewConfig } from '@/state/dataViews';
import T from './EstablishDataViews.json';
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

const route = useRoute();
const tasksEnabledUpToNumber = ref(0);

// ── Derived State ────────────────────────────────────────────────────────────────────────────────────────────────────

const taskLocalisedConfigs = computed(() => localiseConfigs<TaskConfig>(TASK_CONFIGS, localeId.value));
const taskLocalisedConfigsWithDisabled = computed((): LocalisedConfig<TaskConfig>[] =>
    taskLocalisedConfigs.value.map((taskLocalisedConfig) => ({
        ...taskLocalisedConfig,
        disabled: taskLocalisedConfig.number > tasksEnabledUpToNumber.value
    }))
);

const activeTaskLocalisedConfig = computed(() => taskLocalisedConfigsWithDisabled.value.find((config) => config.id === route.query.sView));
const navigateBackRouteName = computed(() => (route.query.sView === 'establishDataViews' ? 'studio' : 'establishDataViews'));
const headerOverline = computed(() => t(T, activeTaskLocalisedConfig.value ? 'Establish_Data_Views' : 'Studio'));
const headerTitle = computed(() => {
    if (!activeTaskLocalisedConfig.value) return t(T, 'Establish_Data_Views');
    return activeDataViewConfig.value ? localiseConfig(activeDataViewConfig.value, localeId.value).label : 'Loading...';
});

// ── Side Effects ─────────────────────────────────────────────────────────────────────────────────────────────────────

watch(
    () => route.query.sView,
    (newSView) => {
        const pendingEnableStepsUpTo = TASK_CONFIGS.find((config) => config.id === newSView)?.enableUpTo ?? 0;
        if (pendingEnableStepsUpTo > tasksEnabledUpToNumber.value) tasksEnabledUpToNumber.value = pendingEnableStepsUpTo;
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
        <TaskBar v-if="activeTaskLocalisedConfig" :active-task-id="activeTaskLocalisedConfig.id" class="mx-4 flex flex-none" :items="taskLocalisedConfigsWithDisabled" />

        <!-- Data View List or Active Task Panel -->
        <RouterView v-slot="{ Component }">
            <component :is="Component" v-if="route.name === 'establishDataViews'" class="min-h-0 flex-1" />
            <component :is="Component" v-else class="min-h-0 flex-1" :task-localised-config="activeTaskLocalisedConfig" @task-completed="handleTaskCompleted" />
        </RouterView>
    </StudioLayout>
</template>
