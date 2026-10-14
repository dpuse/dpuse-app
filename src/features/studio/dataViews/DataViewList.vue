<script setup lang="ts">
// ── External Dependencies & Registrations
import { ArrowRightIcon } from '@lucide/vue';
import { useConfirmDialog } from '@vueuse/core';
import { computed, shallowRef } from 'vue';
import { useRoute, useRouter } from 'vue-router';

// ── DPUse Framework
import { AppError, constructConnectorCategoryConfig, getComponentStatus, localiseConfig, localiseConfigs } from '@dpuse/dpuse-shared';
import type { DataViewConfig, LocalisedConfig } from '@dpuse/dpuse-shared';

// ── Local Framework
import type { DataSource } from '@/composables/useDataWindow';
import { defineLazyComponent } from '@/utilities/index.ts';
import { findConnectionLocalisedConfig } from '@/state/configs';
import { ignoreReportedNavigationFailure } from '@/router';
import { raiseAppFailure } from '@/state/errors';
import { TEXT } from './DataViewList_.json';
import { useCardRowHeight } from '@/components/ui/config/configCard';
import { useQueryFailure } from '@/services/queryClient';
import { type DataViewConnection, resolveCurrentDataViewStepId } from './dataViewSummary';
import { localeId, t } from '@/state/locale';
import { useCreateDataView, useDataViews, useDeleteDataView } from '@/features/studio/dataViews/_dataViews';

// ── Static Components
import ConfirmDialog from '@/components/ui/dialog/ConfirmDialog.vue';
import DataViewCard from './DataViewCard.vue';
import DataViewPanel from './DataViewPanel.vue';
import ErrorNotice from '@/components/ui/error/ErrorNotice.vue';
import GridDetailPanel from '@/components/ui/grid/GridDetailPanel.vue';
import PillButton from '@/components/ui/action/PillButton.vue';
import SelectPlaceholder from '@/components/ui/placeholder/SelectPlaceholder.vue';
import Separator from '@/components/ui/Separator.vue';
import StudioListLayout from '@/features/studio/_components/StudioListLayout.vue';

// ── Dynamic Components
const EmptyPlaceholder = defineLazyComponent(() => import('@/components/ui/placeholder/EmptyPlaceholder.vue'), 'EmptyPlaceholder');

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

// ── Route
const route = useRoute();
const router = useRouter();

// ── Data Views ─ 'isPending' on each change stops a second click starting a second one while the first is saving.
const { data: dataViewConfigs, error: dataViewRetrievalError, isError: dataViewRetrievalFailed, isSuccess: dataViewRetrievalSucceeded, refetch: refetchDataViews } = useDataViews();
const { isPending: dataViewIsAdding, mutateAsync: createDataView } = useCreateDataView();
const { isPending: dataViewIsDeleting, mutateAsync: deleteDataView } = useDeleteDataView();

// ── Delete Confirmation
const { cancel: cancelDelete, confirm: confirmDelete, isRevealed: deleteConfirmIsOpen, reveal: revealDeleteConfirm } = useConfirmDialog();
const deletingDataViewLocalisedConfig = shallowRef<LocalisedConfig<DataViewConfig>>(); // Kept after the dialog closes, so its text does not blank while it fades out.

// ── Derived State ────────────────────────────────────────────────────────────────────────────────────────────────────

// ── Data Views
const dataViewLocalisedConfigs = computed((): LocalisedConfig<DataViewConfig>[] => localiseConfigs<DataViewConfig>(dataViewConfigs.value ?? [], localeId.value));
const dataViewRetrievalFailure = useQueryFailure(dataViewRetrievalError);

// ── Selection ─ The URL is the one source of the selection, so reload, deep links and back/forward all land on the
// same card. It is matched again whenever the list arrives or is rebuilt, which also drops a selection whose data view
// has gone.
const selectedDataViewLocalisedConfig = computed(() => dataViewLocalisedConfigs.value.find((config) => config.id === route.params.dataViewId));

// ── Grid ─ 'rowCount' stays undefined, which keeps the grid busy, until retrieval settles either way; 0 means
// confirmed empty.
const dataViewDataSource = computed((): DataSource<LocalisedConfig<DataViewConfig>> => ({
    rowCount: dataViewRetrievalSucceeded.value || dataViewRetrievalFailed.value ? dataViewLocalisedConfigs.value.length : undefined,
    getRows: (start, end): Promise<{ rows: LocalisedConfig<DataViewConfig>[] }> => Promise.resolve({ rows: dataViewLocalisedConfigs.value.slice(start, end) })
}));

// Cards here carry actions, which take a second row, and an overline naming the connector.
const cardRowHeight = useCardRowHeight(true, true);

// ── Data View Summary ─ The connector behind each data view, keyed by data view id; undefined until a connection is
// chosen.
const dataViewConnectionsById = computed(() => new Map(dataViewLocalisedConfigs.value.map((config) => [config.id, constructDataViewConnection(config)])));

// ── Event Handlers ───────────────────────────────────────────────────────────────────────────────────────────────────

function handleRetryRetrieval(): void {
    void refetchDataViews();
}

async function handleAddDataView(): Promise<void> {
    if (dataViewIsAdding.value) return;

    try {
        const dataViewConfig = await createDataView();
        void ignoreReportedNavigationFailure(router.push({ name: 'connection', params: { dataViewId: dataViewConfig.id }, query: route.query }));
    } catch (error) {
        // The failure goes to the app-level failure dialog, not the list. Nothing was added, so the list is unchanged
        // and still works.
        raiseAppFailure(new AppError('Failed to add data view.', 'dpuse-app.DataViewList.handleAddDataView', { typeId: 'handled' }, { cause: error }));
    }
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
        if (selectedDataViewLocalisedConfig.value?.id === dataViewLocalisedConfig.id) updateDataViewIdParameter();
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
    return {
        categoryLabel: constructConnectorCategoryConfig(connectorConfig.categoryId, localeId.value).label,
        connectorId: connectorConfig.id,
        connectorLabel: localiseConfig(connectorConfig, localeId.value).label,
        icon: connectionLocalisedConfig.icon,
        iconDark: connectionLocalisedConfig.iconDark,
        label: connectionLocalisedConfig.label,
        status: connectorConfig.statusId ? getComponentStatus(connectorConfig.statusId, localeId.value) : undefined,
        version: connectorConfig.version
    };
}

// An explicit 'name' is needed even though this stays on the same route. Without it, an absent 'dataViewId' keeps the
// one already in the URL instead of clearing it.
function updateDataViewIdParameter(dataViewId?: string): void {
    void ignoreReportedNavigationFailure(router.replace({ name: 'dataViews', params: { dataViewId }, query: route.query }));
}
</script>

<template>
    <StudioListLayout>
        <Separator class="flex-none" />

        <!-- Retrieval Failure ─ Replaces the list and detail pane when the data views could not be retrieved. Otherwise
             the user would see an empty list, and a detail pane asking them to choose from it, with no explanation. -->
        <ErrorNotice v-if="dataViewRetrievalFailure" :failures="[dataViewRetrievalFailure]" @retry="handleRetryRetrieval" />

        <!-- List and Detail Panel -->
        <GridDetailPanel
            v-else
            :selected-item="selectedDataViewLocalisedConfig"
            :add-label="t(TEXT, 'dataView.label')"
            class="min-h-0 flex-1"
            :data-source="dataViewDataSource"
            max-detail-width="65ch"
            :row-height="cardRowHeight"
            @add="handleAddDataView"
        >
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
