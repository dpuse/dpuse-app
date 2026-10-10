<script setup lang="ts">
// ── External Dependencies & Registrations
import { FileIcon } from '@lucide/vue';
import { computed, ref, shallowRef, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

// ── DPUse Framework
import type { ConnectionConfig, DataViewConfig, LocalisedConfig } from '@dpuse/dpuse-shared';
import { localiseConfig, localiseConfigs } from '@dpuse/dpuse-shared';

// ── Local Framework
import { useQueryFailure } from '@/services/queryClient';
import { accountConfigsAreRetrieved, configRetrievalSucceeded } from '@/state/session';
import { connectionLocalisedConfigs, useDataView } from '@/state/dataViews';
import { constructItemPath, resolveCurrentDataViewStepId } from './dataViewSummary';
import { ignoreReportedNavigationFailure, navigationPendingDepth } from '@/router';
import { localeId, t } from '@/state/locale';
import { TASK_CONFIGS, TEXT } from './DataViewsLayout_.json';

// ── Static Components
import ConfigIcon from '@/components/ui/config/ConfigIcon.vue';
import ErrorNotice from '@/components/ui/error/ErrorNotice.vue';
import RouterViewTransition from '@/components/ui/RouterViewTransition.vue';
import StudioHeader from '@/features/studio/_components/StudioHeader.vue';
import StudioLayout from '@/features/studio/_components/StudioLayout.vue';
import TaskBar, { type TaskConfig } from '@/components/ui/TaskBar.vue';

// ── State - Route ────────────────────────────────────────────────────────────────────────────────────────────────────

const route = useRoute();
const router = useRouter();

// ── State - Task Bar ─────────────────────────────────────────────────────────────────────────────────────────────────

const unlockedUpToTaskNumber = ref(0);

// ── State - Choice ───────────────────────────────────────────────────────────────────────────────────────────────────

// The data view as the open step's pick would leave it, reported by the step. Shown in the summary, dimmed, until the
// step saves it; the step's own pick, so it goes when the step does.
const choiceDataViewConfig = shallowRef<DataViewConfig>();

// ── Derived State - Data View ────────────────────────────────────────────────────────────────────────────────────────

// Only a task's URL names the data view being built; on the list the same parameter is the selected card.
const dataViewId = computed(() => (TASK_CONFIGS.some((config) => config.id === route.name) && typeof route.params.dataViewId === 'string' ? route.params.dataViewId : undefined));
const { data: dataViewConfig, error: dataViewError, refetch: refetchDataView } = useDataView(dataViewId);
const dataViewFailure = useQueryFailure(dataViewError); // Shown in place of the task, which has nothing to work on without its data view.

// Looked up again from the list, so it follows a change of language. Undefined when none is chosen, or the chosen one
// has gone.
const connectionConfig = computed(() => findConnectionLocalisedConfig(dataViewConfig.value?.connectionId));

// ── Derived State - Task Localised Configuration ─────────────────────────────────────────────────────────────────────

// The data view's saved progress unlocks every step up to the first one not done yet, so a reload or a data view opened
// from the list shows the steps it has already reached.
const progressUnlockedUpToTaskNumber = computed(() => {
    if (dataViewConfig.value == null) return 0;
    const currentStepId = resolveCurrentDataViewStepId(dataViewConfig.value);
    return TASK_CONFIGS.find((config) => config.id === currentStepId)?.number ?? 0;
});
const taskLocalisedConfigs = computed((): (LocalisedConfig<TaskConfig> & { disabled: boolean })[] =>
    localiseConfigs<TaskConfig>(TASK_CONFIGS, localeId.value).map((taskLocalisedConfig) => ({
        ...taskLocalisedConfig,
        disabled: taskLocalisedConfig.number > Math.max(unlockedUpToTaskNumber.value, progressUnlockedUpToTaskNumber.value)
    }))
);
const activeTaskLocalisedConfig = computed(() => taskLocalisedConfigs.value.find((config) => config.id === route.name));

// ── Derived State - Header ───────────────────────────────────────────────────────────────────────────────────────────

const headerOverline = computed(() => t(TEXT, activeTaskLocalisedConfig.value ? 'establishDataViews.title' : 'studio.label'));
const headerTitle = computed(() => {
    if (!activeTaskLocalisedConfig.value) return t(TEXT, 'establishDataViews.title');
    if (dataViewConfig.value) return localiseConfig(dataViewConfig.value, localeId.value).label;
    return t(TEXT, dataViewFailure.value ? 'dataView.failed.title' : 'dataView.pending.title');
});
const headerBackRouteName = computed(() => (route.name === 'dataViews' ? 'studio' : 'dataViews'));

// ── Derived State - Task Bar ─────────────────────────────────────────────────────────────────────────────────────────

// What each step saved, read out with its step. A pick not saved yet is not, since the step it belongs to says it.
const taskStepChoices = computed((): Record<string, string | undefined> => {
    const itemConfig = dataViewConfig.value?.connectionNodeConfig;
    return {
        connection: connectionConfig.value?.label,
        item: itemConfig ? constructItemPath(itemConfig) : undefined
    };
});
const taskBarLocalisedItems = computed(() =>
    taskLocalisedConfigs.value.map((config) => ({
        ...config,
        detail: taskStepChoices.value[config.id],
        to: config.disabled ? undefined : { name: config.id, query: route.query }
    }))
);

// ── Derived State - Summary ──────────────────────────────────────────────────────────────────────────────────────────

// The open step's pick where there is one, otherwise what was saved. A part the pick changed is dimmed until it is saved.
const summaryDataViewConfig = computed(() => choiceDataViewConfig.value ?? dataViewConfig.value);
const summaryConnectionConfig = computed(() => findConnectionLocalisedConfig(summaryDataViewConfig.value?.connectionId));
const summaryConnectionIsUnsaved = computed(() => summaryDataViewConfig.value?.connectionId !== dataViewConfig.value?.connectionId);
const summaryItemConfig = computed(() => summaryDataViewConfig.value?.connectionNodeConfig);
const summaryItemPath = computed(() => (summaryItemConfig.value ? constructItemPath(summaryItemConfig.value) : undefined));
const summaryItemIsUnsaved = computed(() => summaryItemPath.value !== taskStepChoices.value.item);
const summaryItemIconIsPresent = computed(() => [summaryItemConfig.value?.icon, summaryItemConfig.value?.iconDark].some((svg) => svg != null && svg !== ''));

// Split before the file name, so a long path is cut in the middle: the start of its folder path and the whole file name
// stay in view.
const summaryItemPathParts = computed(() => {
    const itemPath = summaryItemPath.value;
    if (itemPath == null) return;
    const nameStart = itemPath.lastIndexOf('/') + 1;
    return { folderPath: itemPath.slice(0, nameStart), name: itemPath.slice(nameStart) };
});

// ── Derived State - List and Task Panel ──────────────────────────────────────────────────────────────────────────────

// This layout hosts the 'RouterView' one level in, so it shows the spinner for its own panel. 'App.vue' covers the
// layout itself, which is what keeps the header and task bar in place through a panel swap.
const taskPanelIsLoading = computed(() => navigationPendingDepth.value === 1);

// ── Side Effects ─────────────────────────────────────────────────────────────────────────────────────────────────────

// Opening a task, including straight from a link or after a page reload, unlocks the task bar up to that task. Tasks that
// are already unlocked stay unlocked when the user goes back to an earlier one, but not into another data view, which
// starts again from its own progress.
watch(
    [(): unknown => route.name, dataViewId],
    ([newRouteName, newDataViewId], oldValues) => {
        const routeEnableUpTo = TASK_CONFIGS.find((config) => config.id === newRouteName)?.enableUpTo ?? 0;
        unlockedUpToTaskNumber.value = newDataViewId === oldValues[1] ? Math.max(unlockedUpToTaskNumber.value, routeEnableUpTo) : routeEnableUpTo;
        choiceDataViewConfig.value = undefined; // The pick belonged to the step being left.
    },
    { immediate: true }
);

// A data view with no connection yet can only be worked on from the connection task, so any later task sends it there.
watch(
    [dataViewConfig, (): unknown => route.name],
    ([newDataViewConfig, newRouteName]) => {
        if (newRouteName === 'connection' || newDataViewConfig == null || newDataViewConfig.connectionId != null) return;

        void ignoreReportedNavigationFailure(router.replace({ name: 'connection', query: route.query }));
    },
    { immediate: true }
);

// If the data view's connection disappears from the list (the user signed out, or its connector was removed), go back
// to the data view list, whose panel says the connection has gone. Only from a task, since the list is where it goes.
// Checked on mount too, because it may have gone while the user was elsewhere.
watch(
    [connectionLocalisedConfigs, (): string | undefined => dataViewConfig.value?.connectionId],
    ([newConnectionLocalisedConfigs, newConnectionId]) => {
        if (!configRetrievalSucceeded.value || !accountConfigsAreRetrieved.value) return; // Still loading, so a short list proves nothing.
        if (newConnectionId == null || activeTaskLocalisedConfig.value == null || newConnectionLocalisedConfigs.some((config) => config.id === newConnectionId)) return;

        void ignoreReportedNavigationFailure(router.replace({ name: 'dataViews', query: route.query }));
    },
    { immediate: true }
);

// ── Event Handlers ───────────────────────────────────────────────────────────────────────────────────────────────────

function handleChoiceChanged(newChoiceDataViewConfig: DataViewConfig | undefined): void {
    choiceDataViewConfig.value = newChoiceDataViewConfig;
}

function handleRetryDataView(): void {
    void refetchDataView();
}

function handleTaskCompleted(taskLocalisedConfig: LocalisedConfig<TaskConfig>): void {
    unlockedUpToTaskNumber.value = Math.max(unlockedUpToTaskNumber.value, taskLocalisedConfig.enableUpTo); // Never locks a step reached already.
}

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

function findConnectionLocalisedConfig(connectionId: string | undefined): LocalisedConfig<ConnectionConfig> | undefined {
    return connectionId == null ? undefined : connectionLocalisedConfigs.value.find((config) => config.id === connectionId);
}
</script>

<template>
    <StudioLayout>
        <!-- Header -->
        <StudioHeader class="flex-none px-4" :overline="headerOverline" :title="headerTitle" :to="{ name: headerBackRouteName, query: route.query }" />

        <!-- Task Bar -->
        <TaskBar v-if="activeTaskLocalisedConfig" :active-id="activeTaskLocalisedConfig.id" :items="taskBarLocalisedItems">
            <!-- Summary - What the data view is built from so far, across the full width, each part with the icon it has
                 in its own list. Always there, empty until something is chosen, so choosing does not push the panel below
                 down. Hidden from screen readers, which hear each saved choice with its step. The connection is never cut
                 short; a long path is cut in its folder path, so its file name stays in view. -->
            <p aria-hidden="true" class="m-0 flex h-7 min-w-0 items-center gap-x-4 px-4 pb-2 text-sm whitespace-nowrap text-muted">
                <span v-if="summaryConnectionConfig" class="flex max-w-1/2 flex-none items-center gap-x-1.5" :class="{ 'opacity-60': summaryConnectionIsUnsaved }">
                    <ConfigIcon class="size-4" :icon="summaryConnectionConfig.icon" :icon-dark="summaryConnectionConfig.iconDark" />
                    <span class="truncate">{{ summaryConnectionConfig.label }}</span>
                </span>
                <span v-if="summaryItemConfig && summaryItemPathParts" class="flex min-w-0 items-center gap-x-1.5" :class="{ 'opacity-60': summaryItemIsUnsaved }">
                    <ConfigIcon v-if="summaryItemIconIsPresent" class="size-4" :icon="summaryItemConfig.icon" :icon-dark="summaryItemConfig.iconDark" />
                    <FileIcon v-else class="size-4 flex-none" :stroke-width="1.5" />
                    <span class="flex min-w-0">
                        <span class="min-w-0 shrink-100 truncate">{{ summaryItemPathParts.folderPath }}</span>
                        <span class="min-w-0 truncate">{{ summaryItemPathParts.name }}</span>
                    </span>
                </span>
            </p>
        </TaskBar>

        <!-- Data View Failure -->
        <ErrorNotice v-if="dataViewFailure" class="min-h-0 flex-1" covers-region :failures="[dataViewFailure]" @retry="handleRetryDataView" />

        <!-- List and Task Panel -->
        <RouterViewTransition v-else v-slot="{ component }" class="min-h-0 flex-1" :is-loading="taskPanelIsLoading">
            <component :is="component" v-if="route.name === 'dataViews'" key="dataViews" class="min-h-0 flex-1" />
            <component
                :is="component"
                v-else
                :key="route.name"
                class="min-h-0 flex-1"
                :task-localised-config="activeTaskLocalisedConfig"
                @choice-changed="handleChoiceChanged"
                @task-completed="handleTaskCompleted"
            />
        </RouterViewTransition>
    </StudioLayout>
</template>
