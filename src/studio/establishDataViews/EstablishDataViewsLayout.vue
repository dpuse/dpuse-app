<script setup lang="ts">
// ── External Dependencies & Registrations
import { computed, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

// ── DPUse Framework
import { localiseConfig, localiseConfigs, type LocalisedConfig } from '@dpuse/dpuse-shared/locale';

// ── Local Framework
import { accountConfigsAreRetrieved, configRetrievalSucceeded } from '@/state/session';
import { activeConnectionConfig, activeDataViewConfig, connectionLocalisedConfigs } from '@/state/dataViews';
import { localeId, t } from '@/state/locale';
import { navigationPendingDepth } from '@/router';

// ── Static Components
import ComponentLoadingSpinner from '@/components/ui/placeholder/ComponentLoadingSpinner.vue';
import StudioHeader from '../StudioHeader.vue';
import StudioLayout from '../StudioLayout.vue';
import TaskBar, { type TaskConfig } from '@/components/ui/TaskBar.vue';

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

const T = {
    Establish_Data_Views: { en: 'Establish Data Views', es: 'Establecer Vistas de Datos' },
    Studio: { en: 'Studio', es: 'Estudio' }
};

const TASK_CONFIGS: TaskConfig[] = [
    { id: 'selectConnection', number: 1, label: { en: 'Connection' }, description: {}, disabled: true, enableUpTo: 1, verb: { en: 'Select' } },
    { id: 'selectItem', number: 2, label: { en: 'Item' }, description: {}, disabled: true, enableUpTo: 2, verb: { en: 'Select' } },
    { id: 'auditContent', number: 3, label: { en: 'Content' }, description: {}, disabled: true, enableUpTo: 3, verb: { en: 'Audit' } },
    { id: 'exploreData', number: 4, label: { en: 'Data' }, description: {}, disabled: true, enableUpTo: 4, verb: { en: 'Explore' } }
];

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

const route = useRoute();
const router = useRouter();
const tasksEnabledUpToNumber = ref(0);

// ── Derived State ────────────────────────────────────────────────────────────────────────────────────────────────────

const taskLocalisedConfigs = computed(() => localiseConfigs<TaskConfig>(TASK_CONFIGS, localeId.value));
const taskLocalisedConfigsWithDisabled = computed((): LocalisedConfig<TaskConfig>[] =>
    taskLocalisedConfigs.value.map((taskLocalisedConfig) => ({
        ...taskLocalisedConfig,
        disabled: taskLocalisedConfig.number > tasksEnabledUpToNumber.value
    }))
);

// This layout hosts the 'RouterView' one level in, so it stands in for its own panel while 'App.vue' stands in for the
// layout — which is what keeps the header and task bar in place through a panel swap.
const panelIsLoading = computed(() => navigationPendingDepth.value === 1);

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

// Single place (shared by all four tasks) that notices the active connection has genuinely gone away —
// reconnect races, sign-out, or the connector being removed all look the same from here. Gated on both
// configMonitor and accountMonitor having delivered data since connecting, so a momentary gap in either
// feed isn't mistaken for the connection actually disappearing. A no-op on selectConnection since nothing
// is active there until the user picks something.
watch(connectionLocalisedConfigs, (newConnectionLocalisedConfigs) => {
    const active = activeConnectionConfig.value;
    if (active == null) return;
    if (!configRetrievalSucceeded.value || !accountConfigsAreRetrieved.value) return;
    if (newConnectionLocalisedConfigs.some((config) => config.id === active.id)) return;

    activeConnectionConfig.value = undefined;
    void router.replace({ name: 'establishDataViews' }).catch(() => {
        // Already reported by 'router.onError'.
    });
});

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
        <TaskBar v-if="activeTaskLocalisedConfig" :active-task-id="activeTaskLocalisedConfig.id" class="flex flex-none" :items="taskLocalisedConfigsWithDisabled" />

        <!-- Data View List or Active Task Panel -->
        <RouterView v-slot="{ Component }">
            <ComponentLoadingSpinner v-if="panelIsLoading" class="min-h-0 flex-1" />
            <component :is="Component" v-else-if="route.name === 'establishDataViews'" class="min-h-0 flex-1" />
            <component :is="Component" v-else class="min-h-0 flex-1" :task-localised-config="activeTaskLocalisedConfig" @task-completed="handleTaskCompleted" />
        </RouterView>
    </StudioLayout>
</template>
