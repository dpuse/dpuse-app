<script setup lang="ts">
// ── External Dependencies & Registrations
import { useConfirmDialog } from '@vueuse/core';
import { computed, ref, watch } from 'vue';
import { isNavigationFailure, NavigationFailureType, onBeforeRouteLeave, onBeforeRouteUpdate, type RouteLocationNormalized, useRoute, useRouter } from 'vue-router';
import { SaveIcon, Undo2Icon } from '@lucide/vue';

// ── DPUse Framework
import type { LocalisedConfig } from '@dpuse/dpuse-shared';
import { AppError, localiseConfig, localiseConfigs } from '@dpuse/dpuse-shared';

// ── Local Framework
import { PILL_CLASSES } from '@/components/ui/action/action';
import { raiseAppFailure } from '@/state/errors';
import { sessionIsAuthenticated } from '@/state/session';
import { useQueryFailure } from '@/services/queryClient';
import { useUnsavedWork } from '@/state/unsavedWork';
import { workspaceStoreId } from '@/services/workspaceStore';
import { accountConfigStatus, configStatus, connectionLocalisedConfigs, findConnectionLocalisedConfig } from '@/state/configs';
import { completeDataViewDraft, dataViewCanBeSaved, dataViewHasChanges, discardDataViewDraft } from './_dataViewDraft';
import { constructItemPath, resolveCurrentDataViewStepId } from './dataViewSummary';
import {
    DATA_VIEW_SCROLL_ACTIONS_ID,
    DATA_VIEW_SIDE_ACTION_ID,
    DATA_VIEW_STEP_ACTION_ID,
    NEW_DATA_VIEW_ID,
    resolveDataViewIdParameter,
    useCurrentDataView,
    useUpdateDataView
} from '@/features/studio/dataViews/_dataViews';
import { ignoreReportedNavigationFailure, navigationPendingDepth } from '@/router';
import { localeId, t } from '@/state/locale';
import { TASK_CONFIGS, TEXT } from './DataViewsLayout_.json';

// ── Static Components
import ConfirmDialog from '@/components/ui/dialog/ConfirmDialog.vue';
import DataViewSource from './DataViewSource.vue';
import ErrorNotice from '@/components/ui/error/ErrorNotice.vue';
import PillSegment from '@/components/ui/action/PillSegment.vue';
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

// ── Save and Discard
const { isPending: dataViewIsSaving, mutateAsync: saveDataView } = useUpdateDataView();
const { cancel: cancelDiscard, confirm: confirmDiscard, isRevealed: discardConfirmIsOpen, reveal: revealDiscardConfirm } = useConfirmDialog();
const discardIsForLeaving = ref(false); // Asked on the way out, so the safe answer is to stay.
const stepResetCount = ref(0); // Bumped by Discard, which rebuilds the step, because it holds its own picks and preview.

// ── Derived State ────────────────────────────────────────────────────────────────────────────────────────────────────

// ── Data View ─ Loads the data view the user is building, for the header, task bar and task panel.
const routeIsTask = computed(() => TASK_CONFIGS.some((config) => config.id === route.name));
const currentDataViewId = computed(() => (routeIsTask.value ? resolveDataViewIdParameter(route.params.dataViewId) : undefined)); // On the list, the same id in the URL just highlights that data view's card.
const dataViewIsNew = computed(() => routeIsTask.value && route.params.dataViewId === NEW_DATA_VIEW_ID); // Being added, so not saved yet.
const {
    data: dataViewConfig,
    error: dataViewError,
    refetch: refetchDataView,
    savedData: savedDataViewConfig
} = useCurrentDataView(() => (routeIsTask.value ? route.params.dataViewId : undefined));
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
        disabled:
            taskLocalisedConfig.number > Math.max(unlockedUpToTaskNumber.value, progressUnlockedUpToTaskNumber.value) ||
            (taskLocalisedConfig.id === 'data' && dataViewConfig.value?.previewConfig == null) // A new connection or item has nothing to explore until it is previewed.
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

// ── Task Bar ─ Each task's choice, which screen readers hear with the task.
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

// ── Summary ─ Any part the user has changed is dimmed until it is saved.
const summaryConnectionIsDraft = computed(() => dataViewConfig.value?.connectionId !== savedDataViewConfig.value?.connectionId);
const summaryItemConfig = computed(() => dataViewConfig.value?.connectionNodeConfig);
const summaryItemPath = computed(() => (summaryItemConfig.value ? constructItemPath(summaryItemConfig.value) : undefined));
const savedItemConfig = computed(() => savedDataViewConfig.value?.connectionNodeConfig);
const savedItemPath = computed(() => (savedItemConfig.value ? constructItemPath(savedItemConfig.value) : undefined)); // Compared by the engine's path, which tells two items apart even where their labels match.
const summaryItemIsDraft = computed(() => summaryItemPath.value !== savedItemPath.value);
const summaryItemTypeId = computed(() => dataViewConnectionLocalisedConfig.value?.connectorConfig.itemTypeId);

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

useUnsavedWork(dataViewHasChanges); // A draft is lost by a reload, because only Save stores it.

// Leaving a data view settles its changes, so the list never holds unsaved work. Moving between its steps keeps them.
onBeforeRouteUpdate(canLeaveDataView);
onBeforeRouteLeave(canLeaveDataView);

// Opening a task, including straight from a link or after a page reload, unlocks the task bar up to that task. Tasks
// that are already unlocked stay unlocked when the user goes back to an earlier one, but not into another data view,
// which starts again from its own progress.
watch(
    [(): unknown => route.name, currentDataViewId],
    ([newRouteName, newCurrentDataViewId], oldValues) => {
        const routeEnableUpTo = TASK_CONFIGS.find((config) => config.id === newRouteName)?.enableUpTo ?? 0;
        unlockedUpToTaskNumber.value = newCurrentDataViewId === oldValues[1] ? Math.max(unlockedUpToTaskNumber.value, routeEnableUpTo) : routeEnableUpTo;
    },
    { immediate: true }
);

// A data view being added exists only as a draft, so a later task reached by a reload has nothing to work on. It goes
// back to the list. A saved data view always has a connection.
watch(
    [dataViewIsNew, dataViewHasChanges, (): unknown => route.name],
    () => {
        void returnAbandonedDataViewToList();
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

        discardDataViewDraft(); // The connection has gone, so there is nothing left to ask about.
        void ignoreReportedNavigationFailure(router.replace({ name: 'dataViews', params: { dataViewId: currentDataViewId.value }, query: route.query }));
    },
    { immediate: true }
);

// Signing in or out moves to another account's store, where the open or selected data view does not exist, so go back
// to the list with nothing selected. The first store chosen after the session check is not a move.
watch(workspaceStoreId, (_newWorkspaceStoreId, oldWorkspaceStoreId) => {
    if (oldWorkspaceStoreId == null || (route.name === 'dataViews' && route.params.dataViewId === '')) return;

    discardDataViewDraft(); // The draft belongs to the account just left.
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

async function handleSaveDataView(): Promise<void> {
    const draftDataViewConfig = dataViewConfig.value;
    if (draftDataViewConfig == null || !dataViewCanBeSaved.value || dataViewIsSaving.value) return;

    try {
        await saveDataView(draftDataViewConfig);
        if (dataViewIsNew.value) {
            await ignoreReportedNavigationFailure(router.replace({ params: { dataViewId: draftDataViewConfig.id }, query: route.query })); // It has a real id now, so a reload can restore it.
        }
        completeDataViewDraft();
    } catch (error) {
        // Announced rather than shown in the task: the draft is untouched, so nothing is lost by trying again.
        raiseAppFailure(new AppError('Failed to save data view.', 'dpuse-app.DataViewsLayout.handleSaveDataView', { typeId: 'handled' }, { cause: error }));
    }
}

async function handleDiscardDataView(): Promise<void> {
    if (!dataViewHasChanges.value) return;

    discardIsForLeaving.value = false;
    const { isCanceled } = await revealDiscardConfirm();
    if (isCanceled) return;

    const wasNew = dataViewIsNew.value;
    discardDataViewDraft();
    if (wasNew) {
        void ignoreReportedNavigationFailure(router.replace({ name: 'dataViews', params: { dataViewId: undefined }, query: route.query }));
        return;
    }
    await refetchDataView(); // Another tab may have saved since, and Discard returns to what is saved now.
    stepResetCount.value++;
}

function handleTaskCompleted(taskLocalisedConfig: LocalisedConfig<TaskConfig>): void {
    unlockedUpToTaskNumber.value = Math.max(unlockedUpToTaskNumber.value, taskLocalisedConfig.enableUpTo); // Never locks a task reached already.
}

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

// Saving a new data view moves from 'new' to its real id, which is still the same data view.
async function canLeaveDataView(to: RouteLocationNormalized): Promise<boolean> {
    const isSameDataView = String(to.params.dataViewId) === String(route.params.dataViewId) || String(to.params.dataViewId) === dataViewConfig.value?.id;
    if (!dataViewHasChanges.value || (isSameDataView && TASK_CONFIGS.some((config) => config.id === to.name))) return true;

    discardIsForLeaving.value = true;
    const { isCanceled } = await revealDiscardConfirm();
    if (isCanceled) return false;

    discardDataViewDraft();
    return true;
}

// The app's own change to the query at startup cancels a navigation made at the same moment, so a cancelled one tries again.
async function returnAbandonedDataViewToList(): Promise<void> {
    if (route.name === 'connection' || !dataViewIsNew.value || dataViewHasChanges.value) return;

    try {
        const failure = await router.replace({ name: 'dataViews', params: { dataViewId: undefined }, query: route.query });
        if (isNavigationFailure(failure, NavigationFailureType.cancelled)) await returnAbandonedDataViewToList();
    } catch {
        // Already reported by 'router.onError'.
    }
}

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
    <StudioLayout class="relative">
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
                        :connection-id="dataViewConfig?.connectionId"
                        :connection-is-draft="summaryConnectionIsDraft"
                        :connection-node-config="summaryItemConfig"
                        :data-format-id="dataViewConfig?.readConfig?.dataFormatId"
                        :data-view-connection="dataViewConnectionLocalisedConfig"
                        :item-is-draft="summaryItemIsDraft"
                        :item-type-id="summaryItemTypeId"
                    />
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
                    :key="`${String(route.name)}-${stepResetCount}`"
                    class="min-h-0 flex-1"
                    :task-localised-config="currentTaskLocalisedConfig"
                    @task-completed="handleTaskCompleted"
                    @vue:mounted="handleViewMounted"
                />
            </RouterViewTransition>
        </RetrievalGate>

        <!-- Actions ─ One row along the bottom on every step: the step's scroll buttons, the pill holding Discard, Save and
             the step's own action, then any control of the step's own. Steps place theirs here with 'Teleport', so each
             moves with the width of the others, and the row is always in the page for them to find. Labels depend on
             the pane's width, not the screen's, because the splitter resizes the pane. -->
        <div
            v-show="routeIsTask"
            class="@container pointer-events-none absolute inset-x-0 bottom-(--safe-bottom-offset) flex items-center justify-end gap-x-2 pr-6"
            data-region="DataViewActions"
        >
            <div :id="DATA_VIEW_SCROLL_ACTIONS_ID" class="pointer-events-auto contents" />
            <div class="pointer-events-auto flex h-10 overflow-hidden shadow-md" :class="PILL_CLASSES" data-region="DataViewPill">
                <PillSegment :disabled="!dataViewHasChanges" :icon="Undo2Icon" :label="t(TEXT, 'discard.label')" @click="handleDiscardDataView" />
                <PillSegment :disabled="!dataViewCanBeSaved || dataViewIsSaving" :icon="SaveIcon" is-separated :label="t(TEXT, 'save.label')" @click="handleSaveDataView" />
                <div :id="DATA_VIEW_STEP_ACTION_ID" class="contents" />
            </div>
            <div :id="DATA_VIEW_SIDE_ACTION_ID" class="pointer-events-auto contents" />
        </div>

        <ConfirmDialog
            :cancel-label="discardIsForLeaving ? t(TEXT, 'discard.stay.label') : undefined"
            :confirm-label="t(TEXT, 'discard.label')"
            :is-open="discardConfirmIsOpen"
            :message="t(TEXT, dataViewIsNew ? 'discard.new.text' : 'discard.text')"
            :title="t(TEXT, 'discard.title')"
            @cancel="cancelDiscard"
            @confirm="confirmDiscard"
        />
    </StudioLayout>
</template>
