<script setup lang="ts">
// ── External Dependencies & Registrations
import { computed, ref, shallowRef, watch } from 'vue';
import { useBroadcastChannel, useConfirmDialog } from '@vueuse/core';
import { useRoute, useRouter } from 'vue-router';

// ── DPUse Framework
import { AppError, localiseConfig, localiseConfigs } from '@dpuse/dpuse-shared';
import type { DataViewConfig, LocalisedConfig } from '@dpuse/dpuse-shared';

// ── Local Framework
import { raiseAppFailure } from '@/state/errors';
import { sessionIsAuthenticated } from '@/state/session';
import { useQueryFailure } from '@/services/queryClient';
import { useUnsavedWork } from '@/state/unsavedWork';
import { workspaceStoreId } from '@/services/workspaceStore';
import { accountConfigStatus, configStatus, connectionLocalisedConfigs, findConnectionLocalisedConfig } from '@/state/configs';
import { constructItemPath, resolveCurrentDataViewStepId } from './dataViewSummary';
import { ignoreReportedNavigationFailure, navigationPendingDepth } from '@/router';
import { localeId, t } from '@/state/locale';
import {
    NEW_DATA_VIEW_ID,
    refreshDataViewWorkingCopies,
    resolveDataViewIdParameter,
    useDeleteDataView,
    useDiscardDataViewWorkingCopy,
    useSaveWorkingDataView,
    useWorkingDataView,
    workingCopyChangeCount
} from '@/features/studio/dataViews/_dataViews';
import { TASK_CONFIGS, TEXT } from './DataViewsLayout_.json';

// ── Static Components
import ActionWrapper from '@/components/ui/action/ActionWrapper.vue';
import ConfirmDialog from '@/components/ui/dialog/ConfirmDialog.vue';
import DataViewSource from './DataViewSource.vue';
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
// The summary and task bar follow the view on screen rather than the route. Leaving the list, they appear only once the
// list has faded out, so nothing below them jumps while it fades. Undefined while the list is on screen.
const taskIdOnScreen = ref(constructTaskIdOnScreen());

// ── Draft ─ The data view as the current task's unsaved changes would leave it, reported by that task. The summary
// shows it, dimmed, until the task saves it. It is cleared when the user moves to another task.
const draftDataViewConfig = shallowRef<DataViewConfig>();

// ── Save and Discard ─ A data view that has never had a preview saved is still being added, so Discard removes it.
const { isPending: dataViewIsSaving, mutateAsync: saveWorkingDataView } = useSaveWorkingDataView();
const { isPending: workingCopyIsDiscarding, mutateAsync: discardDataViewWorkingCopy } = useDiscardDataViewWorkingCopy();
const { mutateAsync: deleteDataView } = useDeleteDataView();
const { cancel: cancelDiscard, confirm: confirmDiscard, isRevealed: discardConfirmIsOpen, reveal: revealDiscardConfirm } = useConfirmDialog();

// ── Other Tabs ─ Working copies are shared by every tab, so the last save wins. Each tab is told of the other's changes.
const workingCopyChangedElsewhere = ref(false);
const { data: otherTabMessage, post: postWorkingCopyChange } = useBroadcastChannel<number, number>({ name: 'dpuse-data-view-working-copies' });

// ── Derived State ────────────────────────────────────────────────────────────────────────────────────────────────────

// ── Data View ─ Loads the data view the user is building, for the header, task bar and task panel.
const routeIsTask = computed(() => TASK_CONFIGS.some((config) => config.id === route.name));
const currentDataViewId = computed(() => (routeIsTask.value ? resolveDataViewIdParameter(route.params.dataViewId) : undefined)); // On the list, the same id in the URL just highlights that data view's card.
const dataViewIsNew = computed(() => routeIsTask.value && route.params.dataViewId === NEW_DATA_VIEW_ID); // Being added, so not saved yet.
const {
    data: dataViewConfig,
    error: dataViewError,
    refetch: refetchDataView,
    savedData: savedDataViewConfig,
    workingCopy: dataViewWorkingCopy
} = useWorkingDataView(currentDataViewId);
const dataViewFailure = useQueryFailure(dataViewError); // Shown in place of the task, which has nothing to work on without its data view.

// The data view's connection is looked up again from the list, so it follows a change of language. Undefined when none
// is chosen, or the chosen one has gone.
const dataViewConnectionLocalisedConfig = computed(() => findConnectionLocalisedConfig(dataViewConfig.value?.connectionId));

// ── Tasks ─ The data view's saved progress unlocks every task up to the one it opens at. After a reload, or when the
// data view is opened from the list, the task bar therefore shows every task it has already reached.
const progressUnlockedUpToTaskNumber = computed(() => {
    if (dataViewConfig.value == null) return 0;
    const currentTaskId = resolveCurrentDataViewStepId(dataViewConfig.value);
    const unlockedTaskId = currentTaskId === 'connection' ? 'item' : currentTaskId; // A saved data view always has a connection, so its item can always be chosen.
    return TASK_CONFIGS.find((config) => config.id === unlockedTaskId)?.number ?? 0;
});
const taskLocalisedConfigs = computed((): (LocalisedConfig<TaskConfig> & { disabled: boolean })[] =>
    localiseConfigs<TaskConfig>(TASK_CONFIGS, localeId.value).map((taskLocalisedConfig) => ({
        ...taskLocalisedConfig,
        ...constructItemTaskLabels(taskLocalisedConfig.id),
        disabled: taskLocalisedConfig.number > Math.max(unlockedUpToTaskNumber.value, progressUnlockedUpToTaskNumber.value)
    }))
);
const currentTaskLocalisedConfig = computed(() => taskLocalisedConfigs.value.find((config) => config.id === route.name));

// ── Header
const headerOverline = computed(() => t(TEXT, currentTaskLocalisedConfig.value ? 'establishDataViews.title' : 'studio.label'));
const headerTitleIsPending = computed(
    () => currentTaskLocalisedConfig.value != null && !dataViewIsNew.value && dataViewConfig.value == null && !dataViewFailure.value && configStatus.value.typeId !== 'failed'
); // A saved data view's name is not known until it loads, e.g. after a reload.
const headerTitle = computed(() => {
    if (!currentTaskLocalisedConfig.value) return t(TEXT, 'establishDataViews.title');
    if (dataViewIsNew.value) return t(TEXT, 'dataView.new.title');
    if (dataViewConfig.value) return localiseConfig(dataViewConfig.value, localeId.value).label;
    return t(TEXT, headerTitleIsPending.value ? 'dataView.pending.title' : 'dataView.failed.title');
});
const headerBackRoute = computed(() =>
    route.name === 'dataViews'
        ? { name: 'studio', query: route.query }
        : { name: 'dataViews', params: { dataViewId: currentDataViewId.value }, query: route.query, state: { detailIsClosed: true } }
); // From a task, back to the list with this data view's card still selected, but on a narrow screen its detail closed, as the link names the list.

// ── Save and Discard
const dataViewIsBeingAdded = computed(() => savedDataViewConfig.value != null && savedDataViewConfig.value.previewConfig == null);
const saveBarIsShown = computed(() => routeIsTask.value && dataViewConfig.value != null && (dataViewWorkingCopy.value != null || dataViewIsBeingAdded.value));
const dataViewCanBeSaved = computed(() => dataViewWorkingCopy.value != null && dataViewConfig.value?.previewConfig != null);

// ── Task Bar ─ Each task's saved choice, which screen readers hear with the task. A draft is left out, because the
// current task already shows it.
const taskDetails = computed((): Record<string, string | undefined> => {
    const itemConfig = dataViewConfig.value?.connectionNodeConfig;
    return {
        connection: dataViewConnectionLocalisedConfig.value?.label,
        item: itemConfig ? `${itemConfig.folderPath}/${itemConfig.label}` : undefined // The folder path and label, as the summary above the task bar shows them.
    };
});
const taskBarLocalisedItems = computed(() =>
    taskLocalisedConfigs.value.map((config) => ({
        ...config,
        detail: taskDetails.value[config.id],
        to: config.disabled || !routeIsTask.value ? undefined : { name: config.id, query: route.query } // No links while the task bar fades out on the way back to the list, whose URL may have no data view for them to take.
    }))
);

// ── Summary ─ Shows the current task's draft when there is one, otherwise what was saved. Any part the draft changed
// is dimmed until it is saved.
const summaryDataViewConfig = computed(() => draftDataViewConfig.value ?? dataViewConfig.value);
const summaryConnectionLocalisedConfig = computed(() => findConnectionLocalisedConfig(summaryDataViewConfig.value?.connectionId));
const summaryConnectionIsDraft = computed(() => summaryDataViewConfig.value?.connectionId !== dataViewConfig.value?.connectionId);
const summaryItemConfig = computed(() => summaryDataViewConfig.value?.connectionNodeConfig);
const summaryItemPath = computed(() => (summaryItemConfig.value ? constructItemPath(summaryItemConfig.value) : undefined));
const savedItemConfig = computed(() => dataViewConfig.value?.connectionNodeConfig);
const savedItemPath = computed(() => (savedItemConfig.value ? constructItemPath(savedItemConfig.value) : undefined)); // Compared by the engine's path, which tells two items apart even where their labels match.
const summaryItemIsDraft = computed(() => summaryItemPath.value !== savedItemPath.value);
const summaryItemTypeId = computed(() => summaryConnectionLocalisedConfig.value?.connectorConfig.itemTypeId);

// ── Summary and Task Bar ─ After a reload, both stay hidden until the data view and the connection list have loaded,
// then fade in together. Otherwise the summary first reads 'No connection' and step 2 'Select Item', and both change
// once the real values arrive. Nothing waits on a load that has failed, because its values will never arrive.
const connectionsArePending = computed(() => configStatus.value.typeId === 'pending' || (sessionIsAuthenticated.value !== false && accountConfigStatus.value.typeId === 'pending')); // Signed out, there are no account connections to wait for.
const summaryAndTaskBarArePending = computed(() => headerTitleIsPending.value || (dataViewConfig.value != null && connectionsArePending.value));

// ── List and Task Panel ─ The layout's own 'RouterView' sits one level in, so the layout shows the spinner while the
// list or a task panel loads. 'App.vue' shows the spinner for the layout itself, which keeps the header and task bar in
// place when the panel changes.
const taskPanelIsLoading = computed(() => navigationPendingDepth.value === 1);

// ── Side Effects ─────────────────────────────────────────────────────────────────────────────────────────────────────

useUnsavedWork(() => draftDataViewConfig.value != null); // A draft is lost by a reload, because only the task's save keeps it.

// Tells other tabs of a change here, and refreshes from a change there.
watch(workingCopyChangeCount, (changeCount) => {
    postWorkingCopyChange(changeCount);
});
watch(otherTabMessage, () => {
    workingCopyChangedElsewhere.value = true;
    void refreshDataViewWorkingCopies();
});

// Opening a task, including straight from a link or after a page reload, unlocks the task bar up to that task. Tasks
// that are already unlocked stay unlocked when the user goes back to an earlier one, but not into another data view,
// which starts again from its own progress.
watch(
    [(): unknown => route.name, currentDataViewId],
    ([newRouteName, newCurrentDataViewId], oldValues) => {
        const routeEnableUpTo = TASK_CONFIGS.find((config) => config.id === newRouteName)?.enableUpTo ?? 0;
        unlockedUpToTaskNumber.value = newCurrentDataViewId === oldValues[1] ? Math.max(unlockedUpToTaskNumber.value, routeEnableUpTo) : routeEnableUpTo;
        draftDataViewConfig.value = undefined; // The draft belonged to the task being left.
        workingCopyChangedElsewhere.value = false;
    },
    { immediate: true }
);

// A data view still being added has no connection yet, so it can only be worked on from the connection task, and any
// later task sends it there. A saved data view always has a connection, because it is only saved once one is chosen.
watch(
    [dataViewIsNew, (): unknown => route.name],
    ([newDataViewIsNew, newRouteName]) => {
        if (newRouteName === 'connection' || !newDataViewIsNew) return;

        void ignoreReportedNavigationFailure(router.replace({ name: 'connection', query: route.query }));
    },
    { immediate: true }
);

// If the data view's connection disappears from the list (the user signed out, or its connector was removed), go back
// to the data view list with its card selected, so its panel says the connection has gone. Only from a task, since the
// list is where it goes. Checked on mount too, because it may have gone while the user was elsewhere. Nothing happens
// while the lists are still loading, because a short list proves nothing then.
watch(
    [connectionLocalisedConfigs, (): string | undefined => dataViewConfig.value?.connectionId],
    ([newConnectionLocalisedConfigs, newConnectionId]) => {
        const areAccountConnectionsKnown = sessionIsAuthenticated.value === false || accountConfigStatus.value.typeId === 'ready'; // Signed out means none.
        if (
            !areAccountConnectionsKnown ||
            newConnectionId == null ||
            configStatus.value.typeId !== 'ready' ||
            currentTaskLocalisedConfig.value == null ||
            newConnectionLocalisedConfigs.some((config) => config.id === newConnectionId)
        )
            return;

        void ignoreReportedNavigationFailure(router.replace({ name: 'dataViews', params: { dataViewId: currentDataViewId.value }, query: route.query }));
    },
    { immediate: true }
);

// Signing in or out moves to another account's store, where the open or selected data view does not exist, so go back
// to the list with nothing selected. The first store chosen after the session check is not a move.
watch(workspaceStoreId, (_newWorkspaceStoreId, oldWorkspaceStoreId) => {
    if (oldWorkspaceStoreId == null || (route.name === 'dataViews' && route.params.dataViewId === '')) return;

    void ignoreReportedNavigationFailure(router.replace({ name: 'dataViews', params: { dataViewId: undefined }, query: route.query }));
});

// ── Event Handlers ───────────────────────────────────────────────────────────────────────────────────────────────────

// A view mounts only once the one before it has faded out, so this is when the header switches between its list and
// task forms.
function handleViewMounted(): void {
    taskIdOnScreen.value = constructTaskIdOnScreen();
}

function handleRetryDataView(): void {
    void refetchDataView();
}

function handleDraftChanged(newDraftDataViewConfig: DataViewConfig | undefined): void {
    draftDataViewConfig.value = newDraftDataViewConfig;
}

async function handleSaveDataView(): Promise<void> {
    if (dataViewConfig.value == null || dataViewIsSaving.value) return;

    try {
        await saveWorkingDataView(dataViewConfig.value);
    } catch (error) {
        // Announced rather than shown in the task: the working copy is untouched, so nothing is lost by trying again.
        raiseAppFailure(new AppError('Failed to save data view.', 'dpuse-app.DataViewsLayout.handleSaveDataView', { typeId: 'handled' }, { cause: error }));
    }
}

async function handleDiscardDataView(): Promise<void> {
    const dataViewId = currentDataViewId.value;
    if (dataViewId == null || workingCopyIsDiscarding.value) return;

    const { isCanceled } = await revealDiscardConfirm();
    if (isCanceled) return;

    try {
        if (dataViewIsBeingAdded.value) {
            await deleteDataView(dataViewId);
            void ignoreReportedNavigationFailure(router.replace({ name: 'dataViews', params: { dataViewId: undefined }, query: route.query }));
        } else await discardDataViewWorkingCopy(dataViewId);
    } catch (error) {
        raiseAppFailure(new AppError('Failed to discard the changes.', 'dpuse-app.DataViewsLayout.handleDiscardDataView', { typeId: 'handled' }, { cause: error }));
    }
}

function handleTaskCompleted(taskLocalisedConfig: LocalisedConfig<TaskConfig>): void {
    unlockedUpToTaskNumber.value = Math.max(unlockedUpToTaskNumber.value, taskLocalisedConfig.enableUpTo); // Never locks a task reached already.
}

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

function constructTaskIdOnScreen(): string | undefined {
    return typeof route.name === 'string' && TASK_CONFIGS.some((config) => config.id === route.name) ? route.name : undefined;
}

// The item task is named for the connector's kind of item, e.g. 'Select File', once a connection that says which is
// chosen. Otherwise it keeps its own 'Select Item'.
function constructItemTaskLabels(taskId: string): Partial<Pick<LocalisedConfig<TaskConfig>, 'label' | 'labelLine2'>> {
    const itemTypeId = summaryItemTypeId.value;
    return taskId === 'item' && itemTypeId != null ? { label: t(TEXT, `itemTask.${itemTypeId}.label`), labelLine2: TEXT[`itemTask.${itemTypeId}.short.label`] } : {};
}
</script>

<template>
    <StudioLayout>
        <!-- Header -->
        <StudioHeader class="flex-none px-page" :overline="headerOverline" :title="headerTitle" :title-is-pending="headerTitleIsPending" :to="headerBackRoute" />

        <!-- Summary ─ What the data view is built from so far, under its name as on its card. The row is always there,
             even when empty, so the first choice does not push the panel down. Screen readers skip it, because they hear
             each saved choice with its task. -->
        <!-- Summary and Task Bar ─ Fade in with the first task's panel, and go at once when the list comes back, so the
             list never sits below them. The current task follows the route, so between tasks it moves on the click. While
             they wait for the data view after a reload, 'invisible' keeps their space, so nothing below them moves when
             they fade in. -->
        <Transition enter-active-class="dpuse-action-fade-enter-active" enter-from-class="dpuse-action-fade-enter-from">
            <div v-if="taskIdOnScreen" class="flex flex-none flex-col transition-opacity duration-250 ease-[ease]" :class="{ 'invisible opacity-0': summaryAndTaskBarArePending }">
                <div class="flex h-7 flex-none items-start gap-x-3 px-page pb-2 text-sm">
                    <DataViewSource
                        aria-hidden="true"
                        class="min-w-0 flex-1"
                        is-single-line
                        :connection-id="summaryDataViewConfig?.connectionId"
                        :connection-is-draft="summaryConnectionIsDraft"
                        :connection-node-config="summaryItemConfig"
                        :data-format-id="summaryDataViewConfig?.previewConfig?.dataFormatId"
                        :data-view-connection="summaryConnectionLocalisedConfig"
                        :item-is-draft="summaryItemIsDraft"
                        :item-type-id="summaryItemTypeId"
                    />
                    <!-- Save Bar ─ In the summary row, which is always there, so nothing moves when it appears. -->
                    <div v-if="saveBarIsShown" class="flex flex-none items-center gap-x-3">
                        <span class="hidden text-muted sm:inline" role="status">{{ t(TEXT, workingCopyChangedElsewhere ? 'otherTab.text' : 'unsaved.text') }}</span>
                        <ActionWrapper class="text-accent hover:underline" :disabled="workingCopyIsDiscarding" @click="handleDiscardDataView">{{
                            t(TEXT, 'discard.label')
                        }}</ActionWrapper>
                        <ActionWrapper v-if="dataViewCanBeSaved" class="font-medium text-accent hover:underline" :disabled="dataViewIsSaving" @click="handleSaveDataView">{{
                            t(TEXT, 'save.label')
                        }}</ActionWrapper>
                    </div>
                </div>

                <!-- Task Bar -->
                <TaskBar :current-id="currentTaskLocalisedConfig?.id ?? taskIdOnScreen" :items="taskBarLocalisedItems" />
            </div>
        </Transition>

        <!-- Body ─ Waits for the configuration, because no data view can be read without it. -->
        <RetrievalGate class="min-h-0 flex-1" :status="configStatus">
            <!-- Data View Failure -->
            <ErrorNotice v-if="dataViewFailure" class="min-h-0 flex-1" :failures="[dataViewFailure]" @retry="handleRetryDataView" @vue:mounted="handleViewMounted" />

            <!-- List and Task Panel ─ The list takes no task props or events, so it is rendered apart from the
                 tasks. -->
            <RouterViewTransition v-else v-slot="{ component }" class="min-h-0 flex-1" :is-loading="taskPanelIsLoading">
                <component :is="component" v-if="route.name === 'dataViews'" key="dataViews" class="min-h-0 flex-1" @vue:mounted="handleViewMounted" />
                <component
                    :is="component"
                    v-else
                    :key="route.name"
                    class="min-h-0 flex-1"
                    :task-localised-config="currentTaskLocalisedConfig"
                    @draft-changed="handleDraftChanged"
                    @task-completed="handleTaskCompleted"
                    @vue:mounted="handleViewMounted"
                />
            </RouterViewTransition>
        </RetrievalGate>

        <ConfirmDialog
            :confirm-label="t(TEXT, 'discard.label')"
            :is-open="discardConfirmIsOpen"
            :message="t(TEXT, dataViewIsBeingAdded ? 'discard.new.text' : 'discard.text')"
            :title="t(TEXT, 'discard.title')"
            @cancel="cancelDiscard"
            @confirm="confirmDiscard"
        />
    </StudioLayout>
</template>
