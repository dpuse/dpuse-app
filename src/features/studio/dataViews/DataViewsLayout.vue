<script setup lang="ts">
// ── External Dependencies & Registrations
import { computed, ref, watch } from 'vue';
import { type RouteLocationNamedRaw, useRoute, useRouter } from 'vue-router';

// ── DPUse Framework
import { localiseConfig } from '@dpuse/dpuse-shared';

// ── Local Framework
import { accountConnectionsStatusTypeId } from '@/state/session';
import { constructDataViewTrail } from '@/features/studio/dataViews/_state/dataViewTrail';
import { dataViewHasChanges } from '@/features/studio/dataViews/_state/dataViewDraft';
import { itemStepTrail } from '@/features/studio/dataViews/_state/itemStepTrail';
import { readDataViewDiagramFocus } from './_state/dataViewFocus';
import { TEXT } from './DataViewsLayout_.json';
import { useDataViewRedirects } from './_useDataViewRedirects';
import { useQueryFailure } from '@/services/queryClient';
import { useUnsavedWork } from '@/state/unsavedWork';
import { configStatus, findConnectionLocalisedConfig } from '@/state/configs';
import { constructDataViewsViewRoute, type DataViewsViewId, lastDataViewsViewId, NEW_DATA_VIEW_ID } from '@/features/studio/dataViews/_state/dataViews';
import { ignoreReportedNavigationFailure, navigationPendingDepth } from '@/router';
import { isDataViewTaskRoute, useDataViewTasks } from './_useDataViewTasks';
import { localeId, t } from '@/state/locale';
import { resolveDataViewIdParameter, useCurrentDataView } from '@/features/studio/dataViews/_state/dataViews';

// ── Static Components
import ConfirmDialog from '@/components/ui/dialog/ConfirmDialog.vue';
import DataViewActions from './_components/DataViewActions.vue';
import ErrorNotice from '@/components/ui/error/ErrorNotice.vue';
import RetrievalGate from '@/components/ui/RetrievalGate.vue';
import RouterViewTransition from '@/components/ui/RouterViewTransition.vue';
import type { TaskTrailContent } from '@/components/ui/taskTrail';
import TaskLayout, { type TaskLayoutView } from '@/features/studio/_components/TaskLayout.vue';

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

// ── Route
const route = useRoute();
const router = useRouter();

// ── Discard
const stepResetCount = ref(0); // Bumped by Discard, which rebuilds the step, because it holds its own picks and preview.

// ── Derived State ────────────────────────────────────────────────────────────────────────────────────────────────────

// ── Data View ─ Loads the data view the user is building, for the header, task bar and task panel.
const routeIsTask = computed(() => isDataViewTaskRoute(route.name));
const currentDataViewId = computed(() => (routeIsTask.value ? resolveDataViewIdParameter(route.params.dataViewId) : undefined)); // On the diagram or list, the same id in the URL selects that data view instead.
const selectedDataViewId = computed(() => (routeIsTask.value ? undefined : resolveDataViewIdParameter(route.params.dataViewId)));
const dataViewIsNew = computed(() => routeIsTask.value && route.params.dataViewId === NEW_DATA_VIEW_ID); // Being added, so not saved yet.

// The data view selected on the diagram or list loads too, so the task bar can open it at any task it has reached.
const { data: dataViewConfig, error: dataViewError, refetch: refetchDataView } = useCurrentDataView(() => (routeIsTask.value ? route.params.dataViewId : selectedDataViewId.value));
const dataViewQueryFailure = useQueryFailure(dataViewError);
const dataViewFailure = computed(() => (routeIsTask.value ? dataViewQueryFailure.value : undefined)); // Shown in place of the task, which has nothing to work on without its data view. The diagram and list have their own panel for it.

// The data view's connection is looked up again from the list, so it follows a change of language. Undefined when none
// is chosen, or the chosen one has gone.
const dataViewConnectionLocalisedConfig = computed(() => findConnectionLocalisedConfig(dataViewConfig.value?.connectionId));

// ── Header
const headerOverline = computed(() => t(TEXT, routeIsTask.value ? 'establishDataViews.title' : 'studio.label'));
const headerTitleIsPending = computed(
    () => routeIsTask.value && !dataViewIsNew.value && dataViewConfig.value == null && !dataViewFailure.value && configStatus.value.typeId !== 'failed'
); // A saved data view's name is not known until it loads, e.g. after a reload.
const headerTitle = computed(() => {
    if (!routeIsTask.value) return t(TEXT, 'establishDataViews.title');
    if (dataViewIsNew.value) return t(TEXT, 'dataView.new.title');
    if (dataViewConfig.value) return localiseConfig(dataViewConfig.value, localeId.value).label;
    return t(TEXT, headerTitleIsPending.value ? 'dataView.pending.title' : 'dataView.failed.title');
});
const headerBackRoute = computed(() =>
    routeIsTask.value ? { ...constructOpenDataViewRoute(lastDataViewsViewId.value), state: { detailIsClosed: true } } : { name: 'studio', query: route.query }
); // From a task, back to the view it was opened from with this data view still selected, but on a narrow screen its detail closed, as the link names the list.

// ── Tasks
const { completeTask, currentTaskLocalisedConfig, taskBarLocalisedItems } = useDataViewTasks({ currentDataViewId, dataViewConfig, dataViewConnectionLocalisedConfig, routeIsTask });

// After a reload, the task bar stays hidden until the data view and the connection list have loaded, then fades in.
// Otherwise step 2 first reads 'Select Item', and changes once the connection says which kind of item it holds. Nothing
// waits on a load that has failed, because its values will never arrive.
const connectionsArePending = computed(() => configStatus.value.typeId === 'pending' || accountConnectionsStatusTypeId.value === 'pending');
const tasksArePending = computed(() => headerTitleIsPending.value || (dataViewConfig.value != null && connectionsArePending.value));

// ── Trail ─ The same on the diagram, the list and every task, because it comes from the route and the data view rather
// than from the view on screen. It shows the open or selected data view, or else the connection the diagram is drilled
// down to. The connection task shows no item, so a connection being changed is not shown with an item from the one
// before it. On the item task its folders can be opened.
const trailConnectionLocalisedConfig = computed(() =>
    dataViewConfig.value != null || routeIsTask.value ? dataViewConnectionLocalisedConfig.value : findConnectionLocalisedConfig(readDataViewDiagramFocus(route.params).connectionId)
);
const trail = computed((): TaskTrailContent => {
    const labels = { home: t(TEXT, 'trail.home.label'), trail: t(TEXT, 'trail.aria') };
    if (!routeIsTask.value && dataViewConfig.value == null && trailConnectionLocalisedConfig.value == null) return { items: [], label: labels.trail };
    const savedItemConfig = route.name === 'connection' ? undefined : dataViewConfig.value?.connectionNodeConfig;
    return constructDataViewTrail(trailConnectionLocalisedConfig.value, savedItemConfig, routeIsTask.value ? itemStepTrail.value : undefined, labels);
});

// ── Views ─ The diagram and the list of data views. Each opens with the open or selected data view selected.
const currentViewId = computed((): DataViewsViewId | undefined => {
    if (route.name === 'dataViewDiagram') return 'diagram';
    return route.name === 'dataViewList' ? 'list' : undefined;
});
const viewItems = computed((): TaskLayoutView[] => [
    { id: 'diagram', label: t(TEXT, 'view.diagram.label'), to: constructOpenDataViewRoute('diagram') },
    { id: 'list', label: t(TEXT, 'view.list.label'), to: constructOpenDataViewRoute('list') }
]);

// ── Views and Task Panel ─ The layout's own 'RouterView' sits one level in, so the layout shows the spinner while the
// diagram and list or a task panel loads. 'App.vue' shows the spinner for the layout itself, which keeps the header and
// task bar in place when the panel changes.
const taskPanelIsLoading = computed(() => navigationPendingDepth.value === 1);

// ── Side Effects ─────────────────────────────────────────────────────────────────────────────────────────────────────

useUnsavedWork(dataViewHasChanges); // A draft is lost by a reload, because only Save stores it.

const { cancelLeave, confirmLeave, leaveConfirmIsOpen } = useDataViewRedirects({ constructOpenDataViewRoute, dataViewConfig, dataViewIsNew, routeIsTask });

// The diagram or list the user is on, so the way back from a task returns to it.
watch(
    currentViewId,
    (newCurrentViewId) => {
        if (newCurrentViewId != null) lastDataViewsViewId.value = newCurrentViewId;
    },
    { immediate: true }
);

// ── Event Handlers ───────────────────────────────────────────────────────────────────────────────────────────────────

function handleRetryDataView(): void {
    void refetchDataView();
}

// A data view being added has nothing saved to go back to, so Discard leaves it. A saved one is read again, because
// another tab may have saved since and Discard returns to what is saved now.
async function handleDataViewDiscarded(): Promise<void> {
    if (dataViewIsNew.value) {
        void ignoreReportedNavigationFailure(router.replace(constructDataViewsViewRoute(lastDataViewsViewId.value, route.query)));
        return;
    }
    await refetchDataView();
    stepResetCount.value++;
}

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

// The diagram or list with the open or selected data view selected. A data view being added is not saved, so neither
// can show it.
function constructOpenDataViewRoute(viewId: DataViewsViewId): RouteLocationNamedRaw {
    const dataViewId = resolveDataViewIdParameter(route.params.dataViewId);
    const dataView = dataViewId == null || dataViewConfig.value == null ? undefined : { id: dataViewId, connectionId: dataViewConfig.value.connectionId };
    return constructDataViewsViewRoute(viewId, route.query, { dataView });
}
</script>

<template>
    <TaskLayout
        :current-task-id="currentTaskLocalisedConfig?.id"
        :current-view-id="currentViewId"
        :overline="headerOverline"
        :task-items="taskBarLocalisedItems"
        :tasks-are-pending="tasksArePending"
        :title="headerTitle"
        :title-is-pending="headerTitleIsPending"
        :to="headerBackRoute"
        :trail="trail"
        :view-items="viewItems"
        :views-label="t(TEXT, 'views.aria')"
    >
        <!-- Body ─ Waits for the configuration, because no data view can be read without it. -->
        <RetrievalGate class="min-h-0 flex-1" :status="configStatus">
            <!-- Data View Failure -->
            <ErrorNotice v-if="dataViewFailure" class="min-h-0 flex-1" :failures="[dataViewFailure]" @retry="handleRetryDataView" />

            <!-- Views and Task Panel ─ The diagram and list take no task props or events, so they are rendered apart from
                 the tasks. They share one key, so moving between them keeps the panel that holds them. -->
            <RouterViewTransition v-else v-slot="{ component }" class="min-h-0 flex-1" :is-loading="taskPanelIsLoading">
                <component :is="component" v-if="!routeIsTask" key="views" class="min-h-0 flex-1" />
                <component
                    :is="component"
                    v-else
                    :key="`${String(route.name)}-${stepResetCount}`"
                    class="min-h-0 flex-1"
                    :task-localised-config="currentTaskLocalisedConfig"
                    @task-completed="completeTask"
                />
            </RouterViewTransition>
        </RetrievalGate>

        <!-- Actions ─ 'v-show' rather than 'v-if' keeps the 'Teleport' targets in the page at all times, so a step never
             teleports into a target that is not there, even while it enters or leaves. -->
        <DataViewActions v-show="routeIsTask" :data-view-config="dataViewConfig" :data-view-is-new="dataViewIsNew" @discarded="handleDataViewDiscarded" />

        <!-- Leave Confirmation ─ Asked on the way out of a data view with unsaved changes, so the safe answer is to stay. -->
        <ConfirmDialog
            :cancel-label="t(TEXT, 'discard.stay.label')"
            :confirm-label="t(TEXT, 'discard.label')"
            :is-open="leaveConfirmIsOpen"
            :message="t(TEXT, dataViewIsNew ? 'discard.new.text' : 'discard.text')"
            :title="t(TEXT, 'discard.title')"
            @cancel="cancelLeave"
            @confirm="confirmLeave"
        />
    </TaskLayout>
</template>
