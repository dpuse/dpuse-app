<script setup lang="ts">
// ── External Dependencies & Registrations
import { ArrowRightIcon } from '@lucide/vue';
import { useConfirmDialog } from '@vueuse/core';
import { computed, shallowRef, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

// ── DPUse Framework
import { AppError, constructConnectorCategoryConfig } from '@dpuse/dpuse-shared';
import type { DataViewConfig, LocalisedConfig } from '@dpuse/dpuse-shared';

// ── Local Framework
import { activeMetaStoreConnectionConfig } from '@/state/session';
import type { DataSource } from '@/composables/useDataWindow';
import { defineAsyncPanel } from '@/utilities/index.ts';
import { ignoreReportedNavigationFailure } from '@/router';
import { raiseAppFailure } from '@/state/errors';
import { TEXT } from './DataViewList_.json';
import { useCardRowHeight } from '@/components/ui/config/configCard';
import {
    connectionLocalisedConfigs,
    dataViewConfigs,
    dataViewLocalisedConfigs,
    dataViewRetrievalFailed,
    dataViewRetrievalFailure,
    dataViewRetrievalSucceeded,
    NEW_DATA_VIEW_ID,
    removeDataViewRecord,
    retrieveDataViewConfigs,
    setActiveDataViewConfig
} from '@/state/dataViews';
import { constructDataViewSteps, type DataViewConnector, resolveCurrentDataViewStepId } from './dataViewSummary';
import { localeId, t } from '@/state/locale';

// ── Static Components
import ConfigCard from '@/components/ui/config/ConfigCard.vue';
import ConfirmDialog from '@/components/ui/dialog/ConfirmDialog.vue';
import DataViewPanel from './DataViewPanel.vue';
import ErrorNotice from '@/components/ui/error/ErrorNotice.vue';
import GridDetailPanel from '@/components/ui/grid/GridDetailPanel.vue';
import PillButton from '@/components/ui/action/PillButton.vue';
import SelectPlaceholder from '@/components/ui/placeholder/SelectPlaceholder.vue';
import Separator from '@/components/ui/Separator.vue';
import StepDots from '@/components/ui/StepDots.vue';
import StudioListPanel from '@/features/studio/_components/StudioListPanel.vue';

// ── Dynamic Components
const EmptyPlaceholder = defineAsyncPanel(() => import('@/components/ui/placeholder/EmptyPlaceholder.vue'), 'EmptyPlaceholder');

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

const route = useRoute();
const router = useRouter();
const activeDataViewLocalisedConfig = shallowRef<LocalisedConfig<DataViewConfig> | undefined>();
const deletingDataViewLocalisedConfig = shallowRef<LocalisedConfig<DataViewConfig>>(); // Kept after the dialog closes, so its text does not blank while it fades out.
const { cancel: cancelDelete, confirm: confirmDelete, isRevealed: deleteConfirmIsOpen, reveal: revealDeleteConfirm } = useConfirmDialog();

// ── Derived State ────────────────────────────────────────────────────────────────────────────────────────────────────

// 'rowCount' stays undefined, which keeps the grid busy, until retrieval settles either way; 0 means confirmed empty.
const dataViewDataSource = computed((): DataSource<LocalisedConfig<DataViewConfig>> => ({
    rowCount: dataViewRetrievalSucceeded.value || dataViewRetrievalFailed.value ? dataViewLocalisedConfigs.value.length : undefined,
    getRows: (start, end): Promise<{ rows: LocalisedConfig<DataViewConfig>[] }> => Promise.resolve({ rows: dataViewLocalisedConfigs.value.slice(start, end) })
}));

// Cards here carry actions, which take a second row, and an overline naming the connector.
const cardRowHeight = useCardRowHeight(true, true);

// The connector behind each data view, keyed by data view id; undefined until a connection is chosen.
const dataViewConnectorsById = computed(() => new Map(dataViewLocalisedConfigs.value.map((config) => [config.id, constructDataViewConnector(config)])));

const dataViewStepsById = computed(() => new Map(dataViewLocalisedConfigs.value.map((config) => [config.id, constructDataViewSteps(config)]))); // Each card reads its steps in several places.

// ── Side Effects ─────────────────────────────────────────────────────────────────────────────────────────────────────

// The URL is the one source of the selection, so reload, deep links and back/forward all land on the same card. It is
// matched again whenever the list arrives or is rebuilt, which also drops a selection whose data view has gone.
watch(
    [dataViewLocalisedConfigs, (): string | string[] | undefined => route.params.dataViewId],
    ([newDataViewLocalisedConfigs, newDataViewId]) => {
        activeDataViewLocalisedConfig.value = newDataViewLocalisedConfigs.find((config) => config.id === newDataViewId);
    },
    { immediate: true }
);

// ── Event Handlers ───────────────────────────────────────────────────────────────────────────────────────────────────

function handleRetryRetrieval(): void {
    if (activeMetaStoreConnectionConfig.value) void retrieveDataViewConfigs(activeMetaStoreConnectionConfig.value);
}

function handleAddDataView(): void {
    setActiveDataViewConfig();
    void ignoreReportedNavigationFailure(router.push({ name: 'connection', params: { dataViewId: NEW_DATA_VIEW_ID }, query: route.query }));
}

function handleSelectDataView(dataViewLocalisedConfig: LocalisedConfig<DataViewConfig>): void {
    updateDataViewIdParameter(activeDataViewLocalisedConfig.value?.id === dataViewLocalisedConfig.id ? undefined : dataViewLocalisedConfig.id);
}

function handleOpenDataView(dataViewLocalisedConfig: LocalisedConfig<DataViewConfig>): void {
    const dataViewConfig = dataViewConfigs.value.find((config) => config.id === dataViewLocalisedConfig.id);
    if (!dataViewConfig) return;

    setActiveDataViewConfig(dataViewConfig);
    void ignoreReportedNavigationFailure(router.push({ name: resolveCurrentDataViewStepId(dataViewConfig), params: { dataViewId: dataViewConfig.id }, query: route.query }));
}

async function handleDeleteDataView(dataViewLocalisedConfig: LocalisedConfig<DataViewConfig>): Promise<void> {
    deletingDataViewLocalisedConfig.value = dataViewLocalisedConfig;
    const { isCanceled } = await revealDeleteConfirm();
    if (isCanceled) return;

    try {
        await removeDataViewRecord(activeMetaStoreConnectionConfig.value, dataViewLocalisedConfig.id);
        if (activeDataViewLocalisedConfig.value?.id === dataViewLocalisedConfig.id) updateDataViewIdParameter();
    } catch (error) {
        // Announced rather than shown in the list: the delete did not happen, so the row and everything around it are
        // still there and still work. There is no space here this failure has taken, which is what makes it a modal.
        raiseAppFailure(new AppError('Failed to remove data view.', 'dpuse-app.DataViewList.handleDeleteDataView', { typeId: 'handled' }, { cause: error }));
    }
}

function handleFilterByCategory(): void {
    // TODO: Filter the list to the connector category of the data view whose category was clicked.
}

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

function constructDataViewConnector(dataViewLocalisedConfig: LocalisedConfig<DataViewConfig>): DataViewConnector | undefined {
    const connectionLocalisedConfig = connectionLocalisedConfigs.value.find((config) => config.id === dataViewLocalisedConfig.connectionId);
    if (!connectionLocalisedConfig) return undefined;
    return {
        categoryLabel: constructConnectorCategoryConfig(connectionLocalisedConfig.connectorConfig.categoryId, localeId.value).label,
        icon: connectionLocalisedConfig.icon,
        iconDark: connectionLocalisedConfig.iconDark,
        label: connectionLocalisedConfig.label
    };
}

// Read after the open action's name, standing in for the step dots, which screen readers do not see.
function resolveProgressDescription(dataViewLocalisedConfig: LocalisedConfig<DataViewConfig>): string {
    const steps = dataViewStepsById.value.get(dataViewLocalisedConfig.id) ?? [];
    const done = steps.filter((step) => step.state === 'done').length;
    return done === steps.length ? t(TEXT, 'progress.complete.text') : t(TEXT, 'progress.text', { done, total: steps.length });
}

// An explicit 'name' is required even though this stays on the same route: it is what makes an absent 'dataViewId'
// actually clear the param instead of inheriting the one already in the URL — see 'router/index.ts' for why.
function updateDataViewIdParameter(dataViewId?: string): void {
    void ignoreReportedNavigationFailure(router.replace({ name: 'dataViews', params: { dataViewId }, query: route.query }));
}
</script>

<template>
    <StudioListPanel>
        <Separator class="flex-none" />

        <!-- Covers the region: nothing was retrieved, so an empty list with no explanation is what this replaces. The
             grid gives way to it rather than sitting behind it — an empty list and a detail pane asking the user to
             pick from it are exactly what the failure is there to account for. -->
        <ErrorNotice v-if="dataViewRetrievalFailure" covers-region :failures="[dataViewRetrievalFailure]" @retry="handleRetryRetrieval" />

        <!-- List and Detail Panel -->
        <GridDetailPanel
            v-else
            :active-item="activeDataViewLocalisedConfig"
            :add-label="t(TEXT, 'dataView.label')"
            class="min-h-0 flex-1"
            :data-source="dataViewDataSource"
            max-detail-width="65ch"
            :row-height="cardRowHeight"
            @add="handleAddDataView"
        >
            <template #item="{ item }">
                <ConfigCard
                    :actions="[
                        { typeId: 'delete', onClick: handleDeleteDataView },
                        { typeId: 'open', description: resolveProgressDescription(item), label: t(TEXT, 'open.label', { name: item.label }), onClick: handleOpenDataView }
                    ]"
                    :category-label="dataViewConnectorsById.get(item.id)?.categoryLabel"
                    :config="item"
                    :icon="dataViewConnectorsById.get(item.id)?.icon"
                    :icon-dark="dataViewConnectorsById.get(item.id)?.iconDark"
                    :overline="dataViewConnectorsById.get(item.id)?.label ?? t(TEXT, 'noConnection.label')"
                    :selected="item.id === activeDataViewLocalisedConfig?.id"
                    @category-click="handleFilterByCategory"
                    @click="handleSelectDataView(item)"
                >
                    <!-- Only while a step is outstanding: a complete data view shows the plain open button. -->
                    <template v-if="dataViewStepsById.get(item.id)?.some((step) => step.state === 'pending')" #status>
                        <StepDots :steps="dataViewStepsById.get(item.id) ?? []" />
                    </template>
                </ConfigCard>
            </template>

            <template #detail="{ item, close }">
                <DataViewPanel
                    :data-view-connector="dataViewConnectorsById.get(item.id)"
                    :data-view-localised-config="item"
                    :data-view-steps="dataViewStepsById.get(item.id) ?? []"
                    @close="close"
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
    </StudioListPanel>
</template>
