<script setup lang="ts">
// ── External Dependencies & Registrations
import { useConfirmDialog } from '@vueuse/core';
import { CircleXIcon, SaveIcon } from '@lucide/vue';
import { computed, ref, watch } from 'vue';
import { isNavigationFailure, NavigationFailureType, onBeforeRouteLeave, onBeforeRouteUpdate, type RouteLocationNormalized, useRoute, useRouter } from 'vue-router';

// ── DPUse Framework
import type { LocalisedConfig } from '@dpuse/dpuse-shared';
import { AppError, localiseConfig, localiseConfigs } from '@dpuse/dpuse-shared';

// ── Local Framework
import { dataViewRecordsAreLoading } from './_dataViewStore';
import { PILL_CLASSES } from '@/components/ui/action/action';
import { raiseAppFailure } from '@/state/errors';
import { resolveCurrentDataViewStepId } from './dataViewSummary';
import { sessionIsAuthenticated } from '@/state/session';
import { useQueryFailure } from '@/services/queryClient';
import { useUnsavedWork } from '@/state/unsavedWork';
import { workspaceStoreId } from '@/services/workspaceStore';
import { accountConfigStatus, configStatus, connectionLocalisedConfigs, findConnectionLocalisedConfig } from '@/state/configs';
import { completeDataViewDraft, dataViewCanBeSaved, dataViewHasChanges, discardDataViewDraft } from './_dataViewDraft';
import {
    DATA_VIEW_ADD_ACTION_ID,
    DATA_VIEW_SCROLL_ACTIONS_ID,
    DATA_VIEW_STEP_ACTION_ID,
    dataViewActionLabelsAreHidden,
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
import ErrorNotice from '@/components/ui/error/ErrorNotice.vue';
import ItemTrail from './ItemTrail.vue';
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
// The task bar and trail follow the view on screen rather than the route. Leaving the list, they open only once the list
// has faded out, so nothing below them jumps while the list fades. Undefined while the list is on screen.
const taskIdOnScreen = ref(constructTaskIdOnScreen());
const closingTaskId = ref(taskIdOnScreen.value); // The last task on screen, so the bar keeps it marked while it closes.

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
const { data: dataViewConfig, error: dataViewError, refetch: refetchDataView } = useCurrentDataView(() => (routeIsTask.value ? route.params.dataViewId : undefined));
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
            (taskLocalisedConfig.id === 'data' && dataViewConfig.value?.sampleConfig == null) // A new connection or item has nothing to explore until it is previewed.
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
        item: itemConfig ? `${itemConfig.folderPath}/${itemConfig.label}` : undefined // The folder path and label, as the item step's trail shows them.
    };
});
const taskBarLocalisedItems = computed(() =>
    taskLocalisedConfigs.value.map((config) => ({
        ...config,
        detail: taskDetails.value[config.id],
        to: config.disabled || !routeIsTask.value ? undefined : { name: config.id, query: route.query } // No links while the task bar closes on the way back to the list, whose URL may have no data view for them to take.
    }))
);
const summaryItemTypeId = computed(() => dataViewConnectionLocalisedConfig.value?.connectorConfig.itemTypeId); // The connector's kind of item, which names the item task.

// After a reload, the task bar stays hidden until the data view and the connection list have loaded, then fades in.
// Otherwise step 2 first reads 'Select Item', and changes once the connection says which kind of item it holds. Nothing
// waits on a load that has failed, because its values will never arrive.
const connectionsArePending = computed(() => configStatus.value.typeId === 'pending' || (sessionIsAuthenticated.value !== false && accountConfigStatus.value.typeId === 'pending')); // Signed out, there are no account connections to wait for.
const summaryAndTaskBarArePending = computed(() => headerTitleIsPending.value || (dataViewConfig.value != null && connectionsArePending.value));

// ── List and Task Panel ─ The layout's own 'RouterView' sits one level in, so the layout shows the spinner while the
// list or a task panel loads. 'App.vue' shows the spinner for the layout itself, which keeps the header and task bar in
// place when the panel changes.
const taskPanelIsLoading = computed(() => navigationPendingDepth.value === 1);

// ── Save and Discard ─ Why each is dimmed, shown as its tooltip. A change of connection or item cannot be saved until an
// item is open. Both wait while records load, because the load records its table under the data view as it was when
// the load started.
const saveDisabledReason = computed(() => {
    if (dataViewRecordsAreLoading.value) return t(TEXT, 'save.loading.text');
    return t(TEXT, dataViewHasChanges.value ? 'save.noItem.text' : 'save.noChanges.text');
});
const discardDisabledReason = computed(() => t(TEXT, dataViewRecordsAreLoading.value ? 'discard.loading.text' : 'discard.noChanges.text'));

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
    if (taskIdOnScreen.value != null) closingTaskId.value = taskIdOnScreen.value;
}

function handleRetryDataView(): void {
    void refetchDataView();
}

async function handleSaveDataView(): Promise<void> {
    const draftDataViewConfig = dataViewConfig.value;
    if (draftDataViewConfig == null || !dataViewCanBeSaved.value || dataViewIsSaving.value || dataViewRecordsAreLoading.value) return;

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
    if (!dataViewHasChanges.value || dataViewRecordsAreLoading.value) return;

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

        <!-- Task Bar and Trail ─ Slide open below the title as the first task's panel fades in, and close as the list
             fades back in, so the panel below moves with them rather than jumping. A grid row that grows from '0fr' to
             '1fr' animates to their own height, which a height transition cannot. While closed they are 'inert', so their
             links cannot be reached. The current task follows the route, so between tasks it moves on the click. While
             they wait for the data view after a reload, 'invisible' keeps their space, so nothing below them moves when
             they fade in. -->
        <div
            class="grid flex-none transition-[grid-template-rows] duration-250 ease-[ease] motion-reduce:transition-none"
            :class="taskIdOnScreen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'"
            :inert="!taskIdOnScreen"
        >
            <div
                class="min-h-0 overflow-hidden transition-opacity duration-250 ease-[ease] motion-reduce:transition-none"
                :class="{ 'opacity-0': !taskIdOnScreen, 'invisible opacity-0': summaryAndTaskBarArePending }"
            >
                <TaskBar :current-id="currentTaskLocalisedConfig?.id ?? closingTaskId" :items="taskBarLocalisedItems" />

                <!-- Trail ─ What the data view is built from, in the same row on every step. It reaches only as far as the
                     step on screen, so choosing a connection does not show a file from a later step as if it were still
                     chosen. On the item step its folders can be opened. -->
                <div class="flex h-10 min-w-0 items-center gap-x-3 border-b border-separator px-page text-sm">
                    <ItemTrail
                        class="min-w-0 flex-1"
                        :connection-node-config="taskIdOnScreen === 'connection' ? undefined : dataViewConfig?.connectionNodeConfig"
                        :data-view-connection="dataViewConnectionLocalisedConfig"
                    />
                </div>
            </div>
        </div>

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

        <!-- Actions ─ One row along the bottom on every step: one pill, then any control of the step's own. The pill
             holds the step's scroll buttons, its add action, Discard, Save and the step's own action, which the steps
             place with 'Teleport'. Segments that come and go grow and shrink, so the pill widens and narrows around
             them. Labels depend on the pane's width, not the screen's, because the splitter resizes the pane. -->
        <div
            v-show="routeIsTask"
            class="@container pointer-events-none absolute inset-x-0 bottom-(--safe-bottom-offset) z-10 flex items-center justify-end gap-x-2 pr-6"
            data-region="DataViewActions"
        >
            <!-- '-ml-px' moves the first segment's dividing line under the pill's border, whichever segment is first. -->
            <div
                :aria-label="t(TEXT, 'actions.aria')"
                class="pointer-events-auto h-10 overflow-hidden shadow-md"
                :class="PILL_CLASSES"
                data-region="DataViewPill"
                role="group"
            >
                <div class="-ml-px flex h-full">
                    <div :id="DATA_VIEW_SCROLL_ACTIONS_ID" class="contents" />
                    <div :id="DATA_VIEW_ADD_ACTION_ID" class="contents" />
                    <PillSegment
                        :disabled="!dataViewHasChanges || dataViewRecordsAreLoading"
                        :disabled-reason="discardDisabledReason"
                        :icon="CircleXIcon"
                        :is-label-hidden="dataViewActionLabelsAreHidden"
                        :label="t(TEXT, 'discard.label')"
                        @click="handleDiscardDataView"
                    />
                    <PillSegment
                        :disabled="!dataViewCanBeSaved || dataViewIsSaving || dataViewRecordsAreLoading"
                        :disabled-reason="dataViewIsSaving ? undefined : saveDisabledReason"
                        :icon="SaveIcon"
                        :is-label-hidden="dataViewActionLabelsAreHidden"
                        :label="t(TEXT, 'save.label')"
                        @click="handleSaveDataView"
                    />
                    <div :id="DATA_VIEW_STEP_ACTION_ID" class="contents" />
                </div>
            </div>
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
