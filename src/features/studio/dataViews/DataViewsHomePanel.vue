<script setup lang="ts">
// ── External Dependencies & Registrations
import { ArrowRightIcon, PlusIcon } from '@lucide/vue';
import { computed, nextTick, ref, shallowRef, useTemplateRef, watch } from 'vue';
import { useConfirmDialog, useTimeoutFn } from '@vueuse/core';
import { useRoute, useRouter } from 'vue-router';

// ── DPUse Framework
import { AppError, localiseConfig, localiseConfigs } from '@dpuse/dpuse-shared';
import type { ConnectionConfig, ConnectorConfig, DataViewConfig, LocalisedConfig } from '@dpuse/dpuse-shared';

// ── Local Framework
import { changeDataView } from './_dataViewDraft';
import { connectionLocalisedConfigs } from '@/state/configs';
import { isDataViewLoaded } from './_dataViewStore';
import { raiseAppFailure } from '@/state/errors';
import { TEXT } from './DataViewsHomePanel_.json';
import { useQueryFailure } from '@/services/queryClient';
import { useSetupOptions } from '@/features/studio/setup/useSetupOptions';
import { assertDefined, defineLazyComponent } from '@/utilities/index.ts';
import { cancelDataViewRetrieval, constructDataViewsViewRoute, constructNewDataViewConfig, NEW_DATA_VIEW_ID, useDataViews, useDeleteDataView } from '@/features/studio/dataViews/_dataViews';
import { findDataViewConnection, resolveCurrentDataViewStepId } from './dataViewSummary';
import { findFocusedDataViewDiagramNode, readDataViewDiagramFocus } from './_dataViewDiagram';
import { ignoreReportedNavigationFailure, navigationPendingDepth } from '@/router';
import { localeId, t } from '@/state/locale';

// ── Static Components
import ConfirmDialog from '@/components/ui/dialog/ConfirmDialog.vue';
import DataViewPanel from './DataViewPanel.vue';
import ErrorNotice from '@/components/ui/error/ErrorNotice.vue';
import MasterDetailPanel from '@/components/ui/MasterDetailPanel.vue';
import PillButton from '@/components/ui/action/PillButton.vue';
import RectangleButton from '@/components/ui/action/RectangleButton.vue';
import RouterViewTransition from '@/components/ui/RouterViewTransition.vue';
import SelectPlaceholder from '@/components/ui/placeholder/SelectPlaceholder.vue';
import StudioListLayout from '@/features/studio/_components/StudioListLayout.vue';

// ── Dynamic Components ─ Only the diagram selects a connector or a connection, so their panels load when first shown.
const PluginConnectorPanel = defineLazyComponent(() => import('@/features/studio/setup/plugins/PluginConnectorPanel.vue'), 'PluginConnectorPanel');
const SelectConnectionPanel = defineLazyComponent(() => import('./selectConnection/SelectConnectionPanel.vue'), 'SelectConnectionPanel');

// ── Types ────────────────────────────────────────────────────────────────────────────────────────────────────────────

// What the detail panel shows. The id carries the kind, so a connection and a data view can never share one.
type DetailItem =
    | { id: string; typeId: 'dataView'; dataViewLocalisedConfig: LocalisedConfig<DataViewConfig> }
    | { id: string; typeId: 'connection'; connectionLocalisedConfig: LocalisedConfig<ConnectionConfig> }
    | { id: string; typeId: 'connector'; connectorLocalisedConfig: LocalisedConfig<ConnectorConfig> };

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

const CONNECTORS_SETUP_OPTION_ID = 'connectors'; // The Setup page a connector's panel belongs to, which the panel names above its title.
const SLOW_RETRIEVAL_MS = 2000; // Long enough that a normal load never shows the slow-load message.

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

// ── Route
const route = useRoute();
const router = useRouter();
const setupOptionLocalisedConfigs = useSetupOptions();

// ── Data Views ─ 'isPending' on each change stops a second click starting a second one while the first is saving.
const {
    data: dataViewConfigs,
    error: dataViewRetrievalError,
    isError: dataViewRetrievalFailed,
    isFetching: dataViewIsRetrieving,
    isSuccess: dataViewRetrievalSucceeded,
    refetch: refetchDataViews
} = useDataViews();
const { isPending: dataViewIsDeleting, mutateAsync: deleteDataView } = useDeleteDataView();

// ── Slow Retrieval ─ A load that takes a while says so and offers Cancel and Retry, so a stuck read never leaves the
// user watching a busy bar with no way out.
const dataViewRetrievalIsCancelled = ref(false);
const dataViewRetrievalIsSlow = ref(false);
const { start: startSlowRetrievalTimer, stop: stopSlowRetrievalTimer } = useTimeoutFn(
    () => {
        dataViewRetrievalIsSlow.value = true;
    },
    SLOW_RETRIEVAL_MS,
    { immediate: false }
);

// ── Delete Confirmation
const { cancel: cancelDelete, confirm: confirmDelete, isRevealed: deleteConfirmIsOpen, reveal: revealDeleteConfirm } = useConfirmDialog();
const deletingDataViewLocalisedConfig = shallowRef<LocalisedConfig<DataViewConfig>>(); // Kept after the dialog closes, so its text does not blank while it fades out.
const deletedDataViewLabel = ref<string>(); // Named in the message read out once a delete finishes.
const deleteStatusElement = useTemplateRef<HTMLParagraphElement>('deleteStatus');

// ── Derived State ────────────────────────────────────────────────────────────────────────────────────────────────────

// ── Views ─ Two ways round the same data views: a diagram of the connections they come from, or the list. Each is a
// route of its own, shown in this panel's 'RouterView', and they share the one detail panel. The selected data view
// stays selected across a switch, because both routes carry its id.
const currentViewId = computed(() => (route.name === 'dataViewList' ? 'list' : 'diagram'));
const viewIsLoading = computed(() => navigationPendingDepth.value === 2); // The panel's own 'RouterView' is two levels in, so the panel shows the spinner while a view loads.

// ── Data Views
const dataViewLocalisedConfigs = computed((): LocalisedConfig<DataViewConfig>[] => localiseConfigs<DataViewConfig>(dataViewConfigs.value ?? [], localeId.value));
const dataViewRetrievalFailure = useQueryFailure(dataViewRetrievalError);

// ── Delete Status
const deleteStatusText = computed(() => (deletedDataViewLabel.value == null ? '' : t(TEXT, 'delete.done.text', { name: deletedDataViewLabel.value })));

// ── Retrieval ─ A load under way with nothing to show yet. A cancelled load stays cancelled until another one starts.
const dataViewRetrievalIsPending = computed(() => dataViewIsRetrieving.value && dataViewConfigs.value == null);
const dataViewRetrievalShowsSlow = computed(() => dataViewRetrievalIsPending.value && dataViewRetrievalIsSlow.value);
const dataViewRetrievalShowsCancelled = computed(() => dataViewRetrievalIsCancelled.value && !dataViewIsRetrieving.value && dataViewConfigs.value == null);

// ── Selection ─ The URL is the one source of the selection, so reload, deep links and back/forward all land on the
// same card. It is matched again whenever the list arrives or is rebuilt, which also drops a selection whose data view
// has gone.
const selectedDataViewLocalisedConfig = computed(() => dataViewLocalisedConfigs.value.find((config) => config.id === route.params.dataViewId));
const isSelectedDataViewDetailClosed = (history.state as { detailIsClosed?: boolean } | null)?.detailIsClosed === true; // Set by the header's link back from a task, which returns to the list rather than the data view's detail.

// ── Detail ─ What the one detail panel shows: the selected data view, or else, in the diagram, the connector or
// connection it has been drilled down to. The list selects only data views. The connector behind the selected data
// view is named in its panel, and is undefined until a connection is chosen.
const selectedDetailItem = computed((): DetailItem | undefined => {
    const dataViewLocalisedConfig = selectedDataViewLocalisedConfig.value;
    if (dataViewLocalisedConfig) return { id: `dataView.${dataViewLocalisedConfig.id}`, typeId: 'dataView', dataViewLocalisedConfig };
    if (currentViewId.value !== 'diagram') return undefined;

    const connections = connectionLocalisedConfigs.value.map((config) => ({ id: config.id, connectorId: config.connectorConfig.id }));
    const focusedNode = findFocusedDataViewDiagramNode(connections, readDataViewDiagramFocus(route.params));
    const connectionLocalisedConfig = connectionLocalisedConfigs.value.find((config) =>
        focusedNode?.typeId === 'connection' ? config.id === focusedNode.connectionId : config.connectorConfig.id === focusedNode?.connectorId
    );
    if (focusedNode == null || connectionLocalisedConfig == null) return undefined;
    if (focusedNode.typeId === 'connection') return { id: `connection.${connectionLocalisedConfig.id}`, typeId: 'connection', connectionLocalisedConfig };
    return { id: `connector.${focusedNode.connectorId}`, typeId: 'connector', connectorLocalisedConfig: localiseConfig(connectionLocalisedConfig.connectorConfig, localeId.value) };
});
const selectedDataViewConnection = computed(() =>
    selectedDataViewLocalisedConfig.value ? findDataViewConnection(selectedDataViewLocalisedConfig.value, localeId.value) : undefined
);
const connectorsSetupOptionLocalisedConfig = computed(() => assertDefined(setupOptionLocalisedConfigs.value.find((config) => config.id === CONNECTORS_SETUP_OPTION_ID)));

// ── Side Effects ─────────────────────────────────────────────────────────────────────────────────────────────────────

// Each load starts its own wait for the slow-load message, so one that finishes quickly never shows it.
watch(
    dataViewRetrievalIsPending,
    (isPending) => {
        dataViewRetrievalIsSlow.value = false;
        if (isPending) startSlowRetrievalTimer();
        else stopSlowRetrievalTimer();
    },
    { immediate: true }
);

// ── Event Handlers ───────────────────────────────────────────────────────────────────────────────────────────────────

// Starts a fresh load, cancelling any still under way. The slow-load wait restarts here too, because a load replaced
// mid-way may never stop being pending.
function handleRetryRetrieval(): void {
    dataViewRetrievalIsCancelled.value = false;
    dataViewRetrievalIsSlow.value = false;
    startSlowRetrievalTimer();
    void refetchDataViews();
}

function handleCancelRetrieval(): void {
    dataViewRetrievalIsCancelled.value = true;
    void cancelDataViewRetrieval();
}

// Starts at the connection step with nothing saved, because a data view is only saved once its connection is chosen.
// From a connection in the diagram, the new data view starts as a draft on that connection, as choosing it in the
// connection step would start one, and opens at the item step.
function handleAddDataView(connectionId?: string): void {
    if (connectionId != null) changeDataView(constructNewDataViewConfig(connectionId));
    const routeName = connectionId == null ? 'connection' : 'item';
    void ignoreReportedNavigationFailure(router.push({ name: routeName, params: { dataViewId: NEW_DATA_VIEW_ID }, query: route.query }));
}

// A card stays selected when tapped again, as in a select. On a narrow screen, coming back to the list hides the
// selected card's detail, so the tap opens it again. Beside the list the detail is already showing, so the tap changes
// nothing.
function handleSelectDataView(dataViewLocalisedConfig: LocalisedConfig<DataViewConfig>, openDetail: () => void): void {
    if (selectedDataViewLocalisedConfig.value?.id === dataViewLocalisedConfig.id) openDetail();
    else updateDataViewIdParameter(dataViewLocalisedConfig.id);
}

// Opens the data view at the last task it has finished, or at Explore Data once every other task is done. Explore Data
// has nothing to show until the records are loaded, so a data view with none for its current columns opens at its item,
// where the load starts. No draft can be open here, because leaving a data view settles its changes.
function handleOpenDataView(dataViewLocalisedConfig: LocalisedConfig<DataViewConfig>): void {
    const stepId = resolveCurrentDataViewStepId(dataViewLocalisedConfig);
    const routeName = stepId === 'data' && !isDataViewLoaded(dataViewLocalisedConfig, false) ? 'item' : stepId;
    void ignoreReportedNavigationFailure(router.push({ name: routeName, params: { dataViewId: dataViewLocalisedConfig.id }, query: route.query }));
}

async function handleDeleteDataView(dataViewLocalisedConfig: LocalisedConfig<DataViewConfig>): Promise<void> {
    if (dataViewIsDeleting.value) return;

    deletingDataViewLocalisedConfig.value = dataViewLocalisedConfig;
    const { isCanceled } = await revealDeleteConfirm();
    if (isCanceled) return;

    try {
        await deleteDataView(dataViewLocalisedConfig.id);
        if (route.params.dataViewId === dataViewLocalisedConfig.id) updateDataViewIdParameter(); // The URL, not the list, which the delete has already changed.

        // The panel holding the Delete button closes with its data view, which would leave focus nowhere. Focus moves
        // to a message that screen readers read out, and the next Tab carries on into the list.
        deletedDataViewLabel.value = dataViewLocalisedConfig.label;
        await nextTick();
        deleteStatusElement.value?.focus();
    } catch (error) {
        // The failure goes to the app-level failure dialog, not the list. The delete did not happen, so the row is
        // still there and still works, and the list has nothing to explain.
        raiseAppFailure(new AppError('Failed to remove data view.', 'dpuse-app.DataViewsHomePanel.handleDeleteDataView', { data: { typeId: 'handled' }, cause: error }));
    }
}

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

// The route is built in full even though this stays in the same view. Without a 'name', an absent 'dataViewId' keeps the
// one already in the URL instead of clearing it. With no data view, the diagram stays at the level it shows.
// 'detailIsClosed' is reset because a replace keeps the history entry's other state, and the browser's back button
// would otherwise return to this entry with the new selection's detail closed.
function updateDataViewIdParameter(dataViewId?: string): void {
    const dataView = dataViewLocalisedConfigs.value.find((config) => config.id === dataViewId);
    const location = constructDataViewsViewRoute(currentViewId.value, route.query, { dataView, focus: readDataViewDiagramFocus(route.params) });
    void ignoreReportedNavigationFailure(router.replace({ ...location, state: { detailIsClosed: false } }));
}
</script>

<template>
    <StudioListLayout>
        <!-- Delete Status ─ Hidden from view. It takes focus once a delete finishes, so screen readers say what was
             deleted. -->
        <p ref="deleteStatus" class="sr-only" tabindex="-1">{{ deleteStatusText }}</p>

        <!-- Cancelled Retrieval ─ Replaces both views and the detail pane, as a failure does, because data views that
             never loaded leave nothing to show. -->
        <div v-if="dataViewRetrievalShowsCancelled" class="mx-page mt-6 flex flex-col items-start gap-3">
            <p class="text-sm text-muted" role="status">{{ t(TEXT, 'retrieval.cancelled.text') }}</p>
            <RectangleButton @click="handleRetryRetrieval">{{ t(TEXT, 'retrieval.retry.label') }}</RectangleButton>
        </div>

        <!-- Retrieval Failure ─ Replaces both views and the detail pane when the data views could not be retrieved.
             Otherwise the user would see an empty list, and a detail pane asking them to choose from it, with no
             explanation. -->
        <ErrorNotice v-else-if="dataViewRetrievalFailure" :failures="[dataViewRetrievalFailure]" @retry="handleRetryRetrieval" />

        <!-- Views and Detail Panel ─ The list and the diagram take turns in the left pane, and the one detail panel
             beside them serves both, so it stays as it is when the view changes. -->
        <MasterDetailPanel v-else class="min-h-0 flex-1" :is-detail-initially-closed="isSelectedDataViewDetailClosed" max-detail-width="65ch" :selected-item="selectedDetailItem">
            <template #master="{ isSplit, openDetail }">
                <!-- The list and the diagram take different props and events, so each is rendered by itself. -->
                <RouterViewTransition v-slot="{ component }" class="min-h-0 flex-1" :is-loading="viewIsLoading">
                    <component
                        :is="component"
                        v-if="currentViewId === 'list'"
                        key="list"
                        :data-view-localised-configs="dataViewLocalisedConfigs"
                        :is-split="isSplit"
                        :retrieval-is-settled="dataViewRetrievalSucceeded || dataViewRetrievalFailed"
                        :retrieval-is-slow="dataViewRetrievalShowsSlow"
                        :selected-data-view-id="selectedDataViewLocalisedConfig?.id"
                        @add="handleAddDataView()"
                        @cancel-retrieval="handleCancelRetrieval"
                        @open="handleOpenDataView"
                        @retry-retrieval="handleRetryRetrieval"
                        @select="handleSelectDataView($event, openDetail)"
                    />
                    <component
                        :is="component"
                        v-else
                        key="diagram"
                        :data-view-localised-configs="dataViewLocalisedConfigs"
                        :selected-data-view-id="selectedDataViewLocalisedConfig?.id"
                        @add="handleAddDataView"
                        @select="updateDataViewIdParameter"
                    />
                </RouterViewTransition>
            </template>

            <!-- Detail ─ The panel each kind of thing has elsewhere in the app. A connection's Delete and Hide are left
                 to the connection step, which asks before either. -->
            <template #detail="{ item, close }">
                <DataViewPanel
                    v-if="item.typeId === 'dataView'"
                    :data-view-connection="selectedDataViewConnection"
                    :data-view-localised-config="item.dataViewLocalisedConfig"
                    :is-deleting="dataViewIsDeleting"
                    @close="close"
                    @delete="handleDeleteDataView(item.dataViewLocalisedConfig)"
                />
                <SelectConnectionPanel
                    v-else-if="item.typeId === 'connection'"
                    :connection-localised-config="item.connectionLocalisedConfig"
                    hides-removal
                    :scroll-end-buttons-are-shown="false"
                    @close="close"
                />
                <PluginConnectorPanel
                    v-else
                    :plugin-localised-config="item.connectorLocalisedConfig"
                    :setup-option-localised-config="connectorsSetupOptionLocalisedConfig"
                    @close="close"
                />
            </template>

            <!-- Detail Action ─ What the selected thing is for: a data view opens, and a connection takes a new data view. -->
            <template #detail-action="{ item }">
                <PillButton
                    v-if="item.typeId === 'dataView'"
                    :icon="ArrowRightIcon"
                    :label="t(TEXT, 'detail.open.label')"
                    @click="handleOpenDataView(item.dataViewLocalisedConfig)"
                />
                <PillButton
                    v-else-if="item.typeId === 'connection'"
                    :icon="PlusIcon"
                    :label="t(TEXT, 'detail.add.label')"
                    @click="handleAddDataView(item.connectionLocalisedConfig.id)"
                />
            </template>

            <template #no-selection>
                <SelectPlaceholder :message="t(TEXT, currentViewId === 'diagram' ? 'noSelection.diagram.text' : 'noSelection.text')" />
            </template>
        </MasterDetailPanel>

        <ConfirmDialog
            :confirm-label="t(TEXT, 'delete.confirm.label')"
            :is-open="deleteConfirmIsOpen"
            :message="t(TEXT, 'delete.confirm.text', { name: deletingDataViewLocalisedConfig?.label ?? '' })"
            :title="t(TEXT, 'delete.confirm.title')"
            @cancel="cancelDelete"
            @confirm="confirmDelete"
        />
    </StudioListLayout>
</template>
