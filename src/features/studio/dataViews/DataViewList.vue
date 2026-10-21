<script setup lang="ts">
// ── External Dependencies & Registrations
import { ArrowRightIcon } from '@lucide/vue';
import { computed, nextTick, ref, shallowRef, useTemplateRef, watch } from 'vue';
import { useConfirmDialog, useTimeoutFn } from '@vueuse/core';
import { useRoute, useRouter } from 'vue-router';

// ── DPUse Framework
import { AppError, constructConnectorCategoryConfig, constructConnectorItemTypeConfig, getComponentStatus, localiseConfig, localiseConfigs } from '@dpuse/dpuse-shared';
import type { ConnectorItemTypeId, DataViewConfig, LocalisedConfig } from '@dpuse/dpuse-shared';

// ── Local Framework
import type { DataSource } from '@/composables/useDataWindow';
import { defineLazyComponent } from '@/utilities/index.ts';
import { findConnectionLocalisedConfig } from '@/state/configs';
import { ignoreReportedNavigationFailure } from '@/router';
import { raiseAppFailure } from '@/state/errors';
import { TEXT } from './DataViewList_.json';
import { useCardRowHeight } from '@/components/ui/config/configCard';
import { useQueryFailure } from '@/services/queryClient';
import { cancelDataViewRetrieval, NEW_DATA_VIEW_ID, useDataViews, useDeleteDataView } from '@/features/studio/dataViews/_dataViews';
import { type DataViewConnection, resolveCurrentDataViewStepId } from './dataViewSummary';
import { localeId, t } from '@/state/locale';

// ── Static Components
import ConfirmDialog from '@/components/ui/dialog/ConfirmDialog.vue';
import DataViewCard from './DataViewCard.vue';
import DataViewPanel from './DataViewPanel.vue';
import ErrorNotice from '@/components/ui/error/ErrorNotice.vue';
import GridDetailPanel from '@/components/ui/grid/GridDetailPanel.vue';
import PillButton from '@/components/ui/action/PillButton.vue';
import RectangleButton from '@/components/ui/action/RectangleButton.vue';
import SelectPlaceholder from '@/components/ui/placeholder/SelectPlaceholder.vue';
import Separator from '@/components/ui/Separator.vue';
import StudioListLayout from '@/features/studio/_components/StudioListLayout.vue';

// ── Dynamic Components
const EmptyPlaceholder = defineLazyComponent(() => import('@/components/ui/placeholder/EmptyPlaceholder.vue'), 'EmptyPlaceholder');

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

const SLOW_RETRIEVAL_MS = 2000; // Long enough that a normal load never shows the slow-load message.

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

// ── Route
const route = useRoute();
const router = useRouter();

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

// ── Grid ─ 'rowCount' stays undefined, which keeps the grid busy, until retrieval settles either way; 0 means
// confirmed empty.
const dataViewDataSource = computed((): DataSource<LocalisedConfig<DataViewConfig>> => ({
    rowCount: dataViewRetrievalSucceeded.value || dataViewRetrievalFailed.value ? dataViewLocalisedConfigs.value.length : undefined,
    getRows: (start, end): Promise<{ rows: LocalisedConfig<DataViewConfig>[] }> => Promise.resolve({ rows: dataViewLocalisedConfigs.value.slice(start, end) })
}));

// Cards here carry actions, which take a second row, and details naming the connection and item.
const cardRowHeight = useCardRowHeight(true, true);

// ── Data View Summary ─ The connector behind each data view, keyed by data view id; undefined until a connection is
// chosen.
const dataViewConnectionsById = computed(() => new Map(dataViewLocalisedConfigs.value.map((config) => [config.id, constructDataViewConnection(config)])));

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
function handleAddDataView(): void {
    void ignoreReportedNavigationFailure(router.push({ name: 'connection', params: { dataViewId: NEW_DATA_VIEW_ID }, query: route.query }));
}

function handleSelectDataView(dataViewLocalisedConfig: LocalisedConfig<DataViewConfig>): void {
    updateDataViewIdParameter(selectedDataViewLocalisedConfig.value?.id === dataViewLocalisedConfig.id ? undefined : dataViewLocalisedConfig.id);
}

// Opens the data view at the first task it has not finished, or at Explore Data once every other task is done.
function handleOpenDataView(dataViewLocalisedConfig: LocalisedConfig<DataViewConfig>): void {
    const routeName = resolveCurrentDataViewStepId(dataViewLocalisedConfig);
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
        raiseAppFailure(new AppError('Failed to remove data view.', 'dpuse-app.DataViewList.handleDeleteDataView', { typeId: 'handled' }, { cause: error }));
    }
}

function handleFilterByCategory(): void {
    // TODO: Filter the list to the connector category of the data view whose category was clicked.
}

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

function constructDataViewConnection(dataViewLocalisedConfig: LocalisedConfig<DataViewConfig>): DataViewConnection | undefined {
    const connectionLocalisedConfig = findConnectionLocalisedConfig(dataViewLocalisedConfig.connectionId);
    if (!connectionLocalisedConfig) return undefined;
    const { connectorConfig } = connectionLocalisedConfig;
    const itemTypeId = connectorConfig.itemTypeId as ConnectorItemTypeId | undefined; // Missing from a connector released before the field existed.
    return {
        categoryLabel: constructConnectorCategoryConfig(connectorConfig.categoryId, localeId.value).label,
        connectorId: connectorConfig.id,
        connectorLabel: localiseConfig(connectorConfig, localeId.value).label,
        icon: connectionLocalisedConfig.icon,
        iconDark: connectionLocalisedConfig.iconDark,
        itemTypeId,
        itemTypeLabel: itemTypeId ? constructConnectorItemTypeConfig(itemTypeId, localeId.value).label : undefined,
        label: connectionLocalisedConfig.label,
        status: connectorConfig.statusId ? getComponentStatus(connectorConfig.statusId, localeId.value) : undefined,
        version: connectorConfig.version
    };
}

// An explicit 'name' is needed even though this stays on the same route. Without it, an absent 'dataViewId' keeps the
// one already in the URL instead of clearing it. 'detailIsClosed' is reset because a replace keeps the history entry's
// other state, and the browser's back button would otherwise return to this entry with the new selection's detail closed.
function updateDataViewIdParameter(dataViewId?: string): void {
    void ignoreReportedNavigationFailure(router.replace({ name: 'dataViews', params: { dataViewId }, query: route.query, state: { detailIsClosed: false } }));
}
</script>

<template>
    <StudioListLayout>
        <Separator class="flex-none" />

        <!-- Delete Status ─ Hidden from view. It takes focus once a delete finishes, so screen readers say what was
             deleted. -->
        <p ref="deleteStatus" class="sr-only" tabindex="-1">{{ deleteStatusText }}</p>

        <!-- Cancelled Retrieval ─ Replaces the list and detail pane, as a failure does, because a list that never
             loaded has nothing to show. -->
        <div v-if="dataViewRetrievalShowsCancelled" class="mx-page mt-6 flex flex-col items-start gap-3">
            <p class="text-sm text-muted" role="status">{{ t(TEXT, 'retrieval.cancelled.text') }}</p>
            <RectangleButton @click="handleRetryRetrieval">{{ t(TEXT, 'retrieval.retry.label') }}</RectangleButton>
        </div>

        <!-- Retrieval Failure ─ Replaces the list and detail pane when the data views could not be retrieved. Otherwise
             the user would see an empty list, and a detail pane asking them to choose from it, with no explanation. -->
        <ErrorNotice v-else-if="dataViewRetrievalFailure" :failures="[dataViewRetrievalFailure]" @retry="handleRetryRetrieval" />

        <!-- List and Detail Panel -->
        <GridDetailPanel
            v-else
            :selected-item="selectedDataViewLocalisedConfig"
            :add-label="t(TEXT, 'dataView.label')"
            class="min-h-0 flex-1"
            :data-source="dataViewDataSource"
            :is-detail-initially-closed="isSelectedDataViewDetailClosed"
            max-detail-width="65ch"
            :row-height="cardRowHeight"
            :target-column-width="340"
            @add="handleAddDataView"
        >
            <!-- Slow Retrieval ─ Below the list's busy bar. Cancel is the safe choice, so it comes first. -->
            <template #busy>
                <div v-if="dataViewRetrievalShowsSlow" class="mx-page mt-3 flex flex-wrap items-center gap-x-3 gap-y-2">
                    <p class="text-sm text-muted" role="status">{{ t(TEXT, 'retrieval.slow.text') }}</p>
                    <div class="flex gap-2">
                        <RectangleButton @click="handleCancelRetrieval">{{ t(TEXT, 'retrieval.cancel.label') }}</RectangleButton>
                        <RectangleButton @click="handleRetryRetrieval">{{ t(TEXT, 'retrieval.retry.label') }}</RectangleButton>
                    </div>
                </div>
            </template>

            <template #item="{ item }">
                <DataViewCard
                    :data-view-connection="dataViewConnectionsById.get(item.id)"
                    :data-view-localised-config="item"
                    :selected="item.id === selectedDataViewLocalisedConfig?.id"
                    @category-click="handleFilterByCategory"
                    @click="handleSelectDataView(item)"
                    @open="handleOpenDataView(item)"
                />
            </template>

            <template #detail="{ item, close }">
                <DataViewPanel
                    :data-view-connection="dataViewConnectionsById.get(item.id)"
                    :data-view-localised-config="item"
                    :is-deleting="dataViewIsDeleting"
                    @close="close"
                    @delete="handleDeleteDataView(item)"
                />
            </template>

            <template #detail-action="{ item }">
                <PillButton :icon="ArrowRightIcon" :label="t(TEXT, 'detail.open.label')" @click="handleOpenDataView(item)" />
            </template>

            <template #no-items>
                <EmptyPlaceholder
                    :message-item-label="t(TEXT, 'dataView.other.text')"
                    :description-item-label="t(TEXT, 'dataView.one.text')"
                    :action-item-label="t(TEXT, 'dataView.label')"
                    @add="handleAddDataView"
                />
            </template>

            <template #no-selection>
                <SelectPlaceholder :message="t(TEXT, 'noSelection.text')" />
            </template>
        </GridDetailPanel>

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
