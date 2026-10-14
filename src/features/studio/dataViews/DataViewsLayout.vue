<script setup lang="ts">
// ── External Dependencies & Registrations
import { FileIcon } from '@lucide/vue';
import { computed, ref, shallowRef, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

// ── DPUse Framework
import type { DataViewConfig, LocalisedConfig } from '@dpuse/dpuse-shared';
import { localiseConfig, localiseConfigs } from '@dpuse/dpuse-shared';

// ── Local Framework
import { sessionIsAuthenticated } from '@/state/session';
import { useDataView } from '@/state/dataViews';
import { useQueryFailure } from '@/services/queryClient';
import { useUnsavedWork } from '@/state/unsavedWork';
import { accountConfigStatus, configStatus, connectionLocalisedConfigs, findConnectionLocalisedConfig } from '@/state/configs';
import { constructItemPath, resolveCurrentDataViewStepId } from './dataViewSummary';
import { ignoreReportedNavigationFailure, navigationPendingDepth } from '@/router';
import { localeId, t } from '@/state/locale';
import { TASK_CONFIGS, TEXT } from './DataViewsLayout_.json';

// ── Static Components
import ConfigIcon from '@/components/ui/config/ConfigIcon.vue';
import ErrorNotice from '@/components/ui/error/ErrorNotice.vue';
import RetrievalGate from '@/components/ui/RetrievalGate.vue';
import RouterViewTransition from '@/components/ui/RouterViewTransition.vue';
import StudioHeader from '@/features/studio/_components/StudioHeader.vue';
import StudioLayout from '@/features/studio/_components/StudioLayout.vue';
import TaskBar, { type TaskConfig } from '@/components/ui/TaskBar.vue';

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

// ── Route
const route = useRoute();
const router = useRouter();

// ── Task Bar
const unlockedUpToTaskNumber = ref(0);

// ── Draft ─ The data view as the current task's unsaved changes would leave it, reported by that task. The summary
// shows it, dimmed, until the task saves it. It is cleared when the user moves to another task.
const draftDataViewConfig = shallowRef<DataViewConfig>();

// ── Derived State ────────────────────────────────────────────────────────────────────────────────────────────────────

// ── Data View ─ Loads the data view the user is building, for the header, task bar and task panel.
const currentDataViewId = computed(() =>
    TASK_CONFIGS.some((config) => config.id === route.name) && typeof route.params.dataViewId === 'string' ? route.params.dataViewId : undefined
); // On the list, the same id in the URL just highlights that data view's card.
const { data: dataViewConfig, error: dataViewError, refetch: refetchDataView } = useDataView(currentDataViewId);
const dataViewFailure = useQueryFailure(dataViewError); // Shown in place of the task, which has nothing to work on without its data view.

// The data view's connection is looked up again from the list, so it follows a change of language. Undefined when none
// is chosen, or the chosen one has gone.
const dataViewConnectionLocalisedConfig = computed(() => findConnectionLocalisedConfig(dataViewConfig.value?.connectionId));

// ── Tasks ─ The data view's saved progress unlocks every task up to the first one not done yet. After a reload, or
// when the data view is opened from the list, the task bar therefore shows every task it has already reached.
const progressUnlockedUpToTaskNumber = computed(() => {
    if (dataViewConfig.value == null) return 0;
    const currentTaskId = resolveCurrentDataViewStepId(dataViewConfig.value);
    return TASK_CONFIGS.find((config) => config.id === currentTaskId)?.number ?? 0;
});
const taskLocalisedConfigs = computed((): (LocalisedConfig<TaskConfig> & { disabled: boolean })[] =>
    localiseConfigs<TaskConfig>(TASK_CONFIGS, localeId.value).map((taskLocalisedConfig) => ({
        ...taskLocalisedConfig,
        disabled: taskLocalisedConfig.number > Math.max(unlockedUpToTaskNumber.value, progressUnlockedUpToTaskNumber.value)
    }))
);
const currentTaskLocalisedConfig = computed(() => taskLocalisedConfigs.value.find((config) => config.id === route.name));

// ── Header
const headerOverline = computed(() => t(TEXT, currentTaskLocalisedConfig.value ? 'establishDataViews.title' : 'studio.label'));
const headerTitle = computed(() => {
    if (!currentTaskLocalisedConfig.value) return t(TEXT, 'establishDataViews.title');
    if (dataViewConfig.value) return localiseConfig(dataViewConfig.value, localeId.value).label;
    return t(TEXT, dataViewFailure.value || configStatus.value.typeId === 'failed' ? 'dataView.failed.title' : 'dataView.pending.title');
});
const headerBackRoute = computed(() =>
    route.name === 'dataViews' ? { name: 'studio', query: route.query } : { name: 'dataViews', params: { dataViewId: currentDataViewId.value }, query: route.query }
); // From a task, back to the list with this data view's card still selected.

// ── Task Bar ─ Each task's saved choice, which screen readers hear with the task. A draft is left out, because the
// current task already shows it.
const taskDetails = computed((): Record<string, string | undefined> => {
    const itemConfig = dataViewConfig.value?.connectionNodeConfig;
    return {
        connection: dataViewConnectionLocalisedConfig.value?.label,
        item: itemConfig ? constructItemPath(itemConfig) : undefined
    };
});
const taskBarLocalisedItems = computed(() =>
    taskLocalisedConfigs.value.map((config) => ({
        ...config,
        detail: taskDetails.value[config.id],
        to: config.disabled ? undefined : { name: config.id, query: route.query }
    }))
);

// ── Summary ─ Shows the current task's draft when there is one, otherwise what was saved. Any part the draft changed
// is dimmed until it is saved.
const summaryDataViewConfig = computed(() => draftDataViewConfig.value ?? dataViewConfig.value);
const summaryConnectionLocalisedConfig = computed(() => findConnectionLocalisedConfig(summaryDataViewConfig.value?.connectionId));
const summaryConnectionIsDraft = computed(() => summaryDataViewConfig.value?.connectionId !== dataViewConfig.value?.connectionId);
const summaryItemConfig = computed(() => summaryDataViewConfig.value?.connectionNodeConfig);
const summaryItemPath = computed(() => (summaryItemConfig.value ? constructItemPath(summaryItemConfig.value) : undefined));
const summaryItemIsDraft = computed(() => summaryItemPath.value !== taskDetails.value.item);
const summaryItemIconIsPresent = computed(() => [summaryItemConfig.value?.icon, summaryItemConfig.value?.iconDark].some((svg) => svg != null && svg !== ''));

// Split before the file name, so a long path is cut in the middle: the start of its folder path and the whole file name
// stay in view.
const summaryItemPathParts = computed(() => {
    const itemPath = summaryItemPath.value;
    if (itemPath == null) return;
    const nameStart = itemPath.lastIndexOf('/') + 1;
    return { folderPath: itemPath.slice(0, nameStart), name: itemPath.slice(nameStart) };
});

// ── List and Task Panel ─ The layout's own 'RouterView' sits one level in, so the layout shows the spinner while the
// list or a task panel loads. 'App.vue' shows the spinner for the layout itself, which keeps the header and task bar in
// place when the panel changes.
const taskPanelIsLoading = computed(() => navigationPendingDepth.value === 1);

// ── Side Effects ─────────────────────────────────────────────────────────────────────────────────────────────────────

useUnsavedWork(() => draftDataViewConfig.value != null); // A draft is lost by a reload, because only the task's save keeps it.

// Opening a task, including straight from a link or after a page reload, unlocks the task bar up to that task. Tasks
// that are already unlocked stay unlocked when the user goes back to an earlier one, but not into another data view,
// which starts again from its own progress.
watch(
    [(): unknown => route.name, currentDataViewId],
    ([newRouteName, newCurrentDataViewId], oldValues) => {
        const routeEnableUpTo = TASK_CONFIGS.find((config) => config.id === newRouteName)?.enableUpTo ?? 0;
        unlockedUpToTaskNumber.value = newCurrentDataViewId === oldValues[1] ? Math.max(unlockedUpToTaskNumber.value, routeEnableUpTo) : routeEnableUpTo;
        draftDataViewConfig.value = undefined; // The draft belonged to the task being left.
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
// to the data view list with its card selected, so its panel says the connection has gone. Only from a task, since the
// list is where it goes. Checked on mount too, because it may have gone while the user was elsewhere.
watch(
    [connectionLocalisedConfigs, (): string | undefined => dataViewConfig.value?.connectionId],
    ([newConnectionLocalisedConfigs, newConnectionId]) => {
        const areAccountConnectionsKnown = sessionIsAuthenticated.value === false || accountConfigStatus.value.typeId === 'ready'; // Signed out means none.
        if (!areAccountConnectionsKnown || configStatus.value.typeId !== 'ready') return; // Still loading, so a short list proves nothing.
        if (newConnectionId == null || currentTaskLocalisedConfig.value == null || newConnectionLocalisedConfigs.some((config) => config.id === newConnectionId)) return;

        void ignoreReportedNavigationFailure(router.replace({ name: 'dataViews', params: { dataViewId: currentDataViewId.value }, query: route.query }));
    },
    { immediate: true }
);

// ── Event Handlers ───────────────────────────────────────────────────────────────────────────────────────────────────

function handleRetryDataView(): void {
    void refetchDataView();
}

function handleDraftChanged(newDraftDataViewConfig: DataViewConfig | undefined): void {
    draftDataViewConfig.value = newDraftDataViewConfig;
}

function handleTaskCompleted(taskLocalisedConfig: LocalisedConfig<TaskConfig>): void {
    unlockedUpToTaskNumber.value = Math.max(unlockedUpToTaskNumber.value, taskLocalisedConfig.enableUpTo); // Never locks a task reached already.
}
</script>

<template>
    <StudioLayout>
        <!-- Header -->
        <StudioHeader class="flex-none px-4" :overline="headerOverline" :title="headerTitle" :to="headerBackRoute" />

        <!-- Task Bar -->
        <TaskBar v-if="currentTaskLocalisedConfig" :current-id="currentTaskLocalisedConfig.id" :items="taskBarLocalisedItems">
            <!-- Summary ─ What the data view is built from so far, each part with the icon it has in its own list. The
                 row is always there, even when empty, so the first choice does not push the panel down. Screen readers
                 skip it, because they hear each saved choice with its task. The connection takes at most half the row.
                 A long item path is cut in its folder path, so the file name stays in view. -->
            <p aria-hidden="true" class="m-0 flex h-7 min-w-0 items-center gap-x-4 px-4 pb-2 text-sm whitespace-nowrap text-muted">
                <span v-if="summaryConnectionLocalisedConfig" class="flex max-w-1/2 flex-none items-center gap-x-1.5" :class="{ 'opacity-60': summaryConnectionIsDraft }">
                    <ConfigIcon class="size-4" :icon="summaryConnectionLocalisedConfig.icon" :icon-dark="summaryConnectionLocalisedConfig.iconDark" />
                    <span class="truncate">{{ summaryConnectionLocalisedConfig.label }}</span>
                </span>
                <span v-if="summaryItemConfig && summaryItemPathParts" class="flex min-w-0 items-center gap-x-1.5" :class="{ 'opacity-60': summaryItemIsDraft }">
                    <ConfigIcon v-if="summaryItemIconIsPresent" class="size-4" :icon="summaryItemConfig.icon" :icon-dark="summaryItemConfig.iconDark" />
                    <FileIcon v-else class="size-4 flex-none" :stroke-width="1.5" />
                    <span class="flex min-w-0">
                        <span class="min-w-0 shrink-100 truncate">{{ summaryItemPathParts.folderPath }}</span>
                        <span class="min-w-0 truncate">{{ summaryItemPathParts.name }}</span>
                    </span>
                </span>
            </p>
        </TaskBar>

        <!-- Body ─ Waits for the configuration, because no data view can be read without it. -->
        <RetrievalGate class="min-h-0 flex-1" :status="configStatus">
            <!-- Data View Failure -->
            <ErrorNotice v-if="dataViewFailure" class="min-h-0 flex-1" :failures="[dataViewFailure]" @retry="handleRetryDataView" />

            <!-- List and Task Panel ─ The list takes no task props or events, so it is rendered apart from the
                 tasks. -->
            <RouterViewTransition v-else v-slot="{ component }" class="min-h-0 flex-1" :is-loading="taskPanelIsLoading">
                <component :is="component" v-if="route.name === 'dataViews'" key="dataViews" class="min-h-0 flex-1" />
                <component
                    :is="component"
                    v-else
                    :key="route.name"
                    class="min-h-0 flex-1"
                    :task-localised-config="currentTaskLocalisedConfig"
                    @draft-changed="handleDraftChanged"
                    @task-completed="handleTaskCompleted"
                />
            </RouterViewTransition>
        </RetrievalGate>
    </StudioLayout>
</template>
