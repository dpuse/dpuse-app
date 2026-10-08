<script setup lang="ts">
// ── External Dependencies & Registrations
import { computed, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

// ── DPUse Framework
import { localiseConfig, localiseConfigs, type LocalisedConfig } from '@dpuse/dpuse-shared';

// ── Local Framework
import { accountConfigsAreRetrieved, configRetrievalSucceeded } from '@/state/session';
import { activeConnectionConfig, activeDataViewConfig, connectionLocalisedConfigs } from '@/state/dataViews';
import { ignoreReportedNavigationFailure, navigationPendingDepth } from '@/router';
import { localeId, t } from '@/state/locale';
import { TASK_CONFIGS, TEXT } from './DataViewsLayout_.json';

// ── Static Components
import ComponentLoadingSpinner from '@/components/ui/placeholder/ComponentLoadingSpinner.vue';
import StudioHeader from '@/features/studio/_components/StudioHeader.vue';
import StudioLayout from '@/features/studio/_components/StudioLayout.vue';
import TaskBar, { type TaskConfig } from '@/components/ui/TaskBar.vue';

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

const route = useRoute();
const router = useRouter();
const unlockedUpToTaskNumber = ref(0);

// ── Derived State ────────────────────────────────────────────────────────────────────────────────────────────────────

// Task Localised Configuration
const taskLocalisedConfigs = computed((): (LocalisedConfig<TaskConfig> & { disabled: boolean })[] =>
    localiseConfigs<TaskConfig>(TASK_CONFIGS, localeId.value).map((taskLocalisedConfig) => ({
        ...taskLocalisedConfig,
        disabled: taskLocalisedConfig.number > unlockedUpToTaskNumber.value
    }))
);
const activeTaskLocalisedConfig = computed(() => taskLocalisedConfigs.value.find((config) => config.id === route.name));

// Header
const headerBackRouteName = computed(() => (route.name === 'dataViews' ? 'studio' : 'dataViews'));
const headerOverline = computed(() => t(TEXT, activeTaskLocalisedConfig.value ? 'establishDataViews.title' : 'studio.label'));
const headerTitle = computed(() => {
    if (!activeTaskLocalisedConfig.value) return t(TEXT, 'establishDataViews.title');
    return activeDataViewConfig.value ? localiseConfig(activeDataViewConfig.value, localeId.value).label : t(TEXT, 'dataView.pending.title');
});

// Task Bar — What was chosen in each step is shown under its label. The label is looked up again so it follows a change
// of language.
const taskBarUnderlineLabels = computed((): Record<string, string | undefined> => ({
    connection: connectionLocalisedConfigs.value.find((config) => config.id === activeConnectionConfig.value?.id)?.label
    // TODO: Add 'item' once the chosen item is in shared state — see item 10 in 'useDataWindow.ts'.
}));
const taskBarLocalisedItems = computed(() =>
    taskLocalisedConfigs.value.map((config) => ({
        ...config,
        detail: taskBarUnderlineLabels.value[config.id],
        to: config.disabled ? undefined : { name: config.id, query: route.query }
    }))
);

// List or Task Panel — This layout hosts the 'RouterView' one level in, so it shows the spinner for its own panel. 'App.vue'
// covers the layout itself, which is what keeps the header and task bar in place through a panel swap.
const taskPanelIsLoading = computed(() => navigationPendingDepth.value === 1);

// ── Side Effects ─────────────────────────────────────────────────────────────────────────────────────────────────────

// Opening a task, including straight from a link or after a page reload, unlocks the task bar up to that task. Tasks that
// are already unlocked stay unlocked when the user goes back to an earlier one.
watch(
    () => route.name,
    (newRouteName) => {
        const routeEnableUpTo = TASK_CONFIGS.find((config) => config.id === newRouteName)?.enableUpTo ?? 0;
        unlockedUpToTaskNumber.value = Math.max(unlockedUpToTaskNumber.value, routeEnableUpTo);
    },
    { immediate: true }
);

// If the chosen connection disappears from the list (the user signed out, or its connector was removed), clear it and
// go back to the data view list. Checked on mount too, because it may have gone while the user was elsewhere.
watch(
    connectionLocalisedConfigs,
    (newConnectionLocalisedConfigs) => {
        if (!configRetrievalSucceeded.value || !accountConfigsAreRetrieved.value) return; // Still loading, so a short list proves nothing.

        const activeConnection = activeConnectionConfig.value;
        if (activeConnection == null || newConnectionLocalisedConfigs.some((config) => config.id === activeConnection.id)) return;

        activeConnectionConfig.value = undefined;
        void ignoreReportedNavigationFailure(router.replace({ name: 'dataViews' }));
    },
    { immediate: true }
);

// ── Event Handlers ───────────────────────────────────────────────────────────────────────────────────────────────────

function handleTaskCompleted(taskLocalisedConfig: LocalisedConfig<TaskConfig>): void {
    unlockedUpToTaskNumber.value = taskLocalisedConfig.enableUpTo;
}
</script>

<template>
    <StudioLayout>
        <!-- Header -->
        <StudioHeader class="flex-none px-4" :overline="headerOverline" :title="headerTitle" :to="{ name: headerBackRouteName, query: route.query }" />

        <!-- Task Bar -->
        <TaskBar v-if="activeTaskLocalisedConfig" :active-id="activeTaskLocalisedConfig.id" :items="taskBarLocalisedItems" />

        <!-- List or Task Panel -->
        <RouterView v-slot="{ Component }">
            <ComponentLoadingSpinner v-if="taskPanelIsLoading" class="min-h-0 flex-1" />
            <component :is="Component" v-else-if="route.name === 'dataViews'" class="min-h-0 flex-1" />
            <component :is="Component" v-else class="min-h-0 flex-1" :task-localised-config="activeTaskLocalisedConfig" @task-completed="handleTaskCompleted" />
        </RouterView>
    </StudioLayout>
</template>
