<script setup lang="ts">
// ── External Dependencies & Registrations
import { ArrowRightIcon } from '@lucide/vue';
import { computed, ref, shallowRef, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

// ── DPUse Framework
import { AppError, constructConnectorCategoryConfig } from '@dpuse/dpuse-shared';
import type { ConnectionConfig, DataViewConfig, LocalisedConfig } from '@dpuse/dpuse-shared';

// ── Local Framework
import { activeMetaStoreConnectionConfig } from '@/state/session';
import type { DataSource } from '@/composables/useDataWindow';
import { defineAsyncPanel } from '@/utilities/index.ts';
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
import { constructDataViewSteps, type DataViewConnector, type DataViewStep, resolveCurrentDataViewStepId } from './dataViewSummary';
import { localeId, t } from '@/state/locale';

// ── Static Components
import ConfigCard from '@/components/ui/config/ConfigCard.vue';
import DataViewPanel from './DataViewPanel.vue';
import ErrorNotice from '@/components/ui/error/ErrorNotice.vue';
import GridDetailPanel from '@/components/ui/grid/GridDetailPanel.vue';
import PillButton from '@/components/ui/action/PillButton.vue';
import SelectPlaceholder from '@/components/ui/placeholder/SelectPlaceholder.vue';
import Separator from '@/components/ui/Separator.vue';
import StepDots from '@/components/ui/StepDots.vue';
import StudioListPanel from '@/features/studio/_components/StudioListPanel.vue';

// ── Dynamic Components
const EmptyPlaceholder = defineAsyncPanel(() => import('~/src/components/ui/placeholder/EmptyPlaceholder.vue'), 'EmptyPlaceholder');

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

const activeDataViewLocalisedConfig = shallowRef<LocalisedConfig<DataViewConfig> | undefined>();
const detailActionId = ref<string>();
const route = useRoute();
const router = useRouter();

// ── Derived State ────────────────────────────────────────────────────────────────────────────────────────────────────

// Cards here carry actions, which take a second row, and an overline naming the connector.
const cardRowHeight = useCardRowHeight(true, true);

// The connector behind each data view, keyed by data view id; undefined until a connection is chosen.
const dataViewConnectorMap = computed(() => new Map(dataViewLocalisedConfigs.value.map((config) => [config.id, constructDataViewConnector(config)])));

// Constructs a computed data source wrapper for the data view configurations, which are retrieved by the meta store
// connection watcher in '@/state/dataViews'.
// rowCount stays undefined (busy) until retrieval settles, distinct from 0 (confirmed empty) — see DataSource.rowCount.
const dataViewConfigsDataSource = computed((): DataSource<LocalisedConfig<DataViewConfig>> => ({
    rowCount: dataViewRetrievalSucceeded.value || dataViewRetrievalFailed.value ? dataViewLocalisedConfigs.value.length : undefined,
    getRows: (start: number, end: number): Promise<{ rows: LocalisedConfig<DataViewConfig>[] }> => Promise.resolve({ rows: dataViewLocalisedConfigs.value.slice(start, end) })
}));

// ── Side Effects ─────────────────────────────────────────────────────────────────────────────────────────────────────

// Restores the selection from the URL once the list arrives, for reload and deep links.
watch(
    dataViewLocalisedConfigs,
    (newConfigs) => {
        if (typeof route.params.dataViewId !== 'string') return;
        activeDataViewLocalisedConfig.value = newConfigs.find((config) => config.id === route.params.dataViewId);
    },
    { immediate: true }
);

// Detail action bar reports clicks via v-model rather than dedicated events, so route them to the matching handler here.
watch(detailActionId, (newDetailActionId) => {
    if (newDetailActionId == null || !activeDataViewLocalisedConfig.value) return;
    const dataViewLocalisedConfig = activeDataViewLocalisedConfig.value;
    detailActionId.value = undefined;
    if (newDetailActionId === 'continue') handleContinueDataView(dataViewLocalisedConfig);
    else if (newDetailActionId === 'delete') void handleDeleteDataView(dataViewLocalisedConfig);
});

// ── Event Handlers ───────────────────────────────────────────────────────────────────────────────────────────────────

function handleAddDataView(): void {
    setActiveDataViewConfig();
    void router.push({ name: 'connections', params: { dataViewId: NEW_DATA_VIEW_ID }, query: route.query }).catch(() => {
        // Already reported by 'router.onError'.
    });
}

async function handleDeleteDataView(dataViewLocalisedConfig: LocalisedConfig<DataViewConfig>): Promise<void> {
    if (activeDataViewLocalisedConfig.value?.id === dataViewLocalisedConfig.id) activeDataViewLocalisedConfig.value = undefined;
    try {
        await removeDataViewRecord(activeMetaStoreConnectionConfig.value, dataViewLocalisedConfig.id);
    } catch (error) {
        // Announced rather than shown in the list: the delete did not happen, so the row and everything around it are
        // still there and still work. There is no space here this failure has taken, which is what makes it a modal.
        raiseAppFailure(new AppError('Failed to remove data view.', 'dpuse-app.DataViewList.handleDeleteDataView', { typeId: 'handled' }, { cause: error }));
    }
}

function handleFilterByCategory(): void {
    // TODO: Filter the list to the connector category of the data view whose category was clicked.
}

function handleRetryRetrieve(): void {
    if (activeMetaStoreConnectionConfig.value) void retrieveDataViewConfigs(activeMetaStoreConnectionConfig.value);
}

function handleOpenDataView(dataViewLocalisedConfig: LocalisedConfig<DataViewConfig>): void {
    activeDataViewLocalisedConfig.value = dataViewLocalisedConfig;
    detailActionId.value = 'continue';
}

function handleSelectDataView(dataViewLocalisedConfig: LocalisedConfig<DataViewConfig> | undefined): void {
    activeDataViewLocalisedConfig.value = activeDataViewLocalisedConfig.value === dataViewLocalisedConfig ? undefined : dataViewLocalisedConfig;
    updateDataViewIdParameter(activeDataViewLocalisedConfig.value?.id);
}

function handleContinueDataView(dataViewLocalisedConfig: LocalisedConfig<DataViewConfig>): void {
    const dataViewConfig = dataViewConfigs.value.find((config) => config.id === dataViewLocalisedConfig.id);
    if (!dataViewConfig) return;

    setActiveDataViewConfig(dataViewConfig);
    void router.push({ name: resolveCurrentDataViewStepId(dataViewConfig), params: { dataViewId: dataViewConfig.id }, query: route.query }).catch(() => {
        // Already reported by 'router.onError'.
    });
}

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

function constructDataViewConnector(dataViewLocalisedConfig: LocalisedConfig<DataViewConfig>): DataViewConnector | undefined {
    const connectionLocalisedConfig = resolveConnection(dataViewLocalisedConfig);
    if (!connectionLocalisedConfig) return undefined;
    return {
        categoryLabel: constructConnectorCategoryConfig(connectionLocalisedConfig.connectorConfig.categoryId, localeId.value).label,
        icon: connectionLocalisedConfig.icon,
        iconDark: connectionLocalisedConfig.iconDark,
        label: connectionLocalisedConfig.label
    };
}

// TODO: Remove this sample pre-release tag, which exists only to test how the card shows one.
function constructSamplePrereleaseLabel(dataViewLocalisedConfig: LocalisedConfig<DataViewConfig>): string | undefined {
    return resolveTestSeed(dataViewLocalisedConfig) % 3 === 2 ? 'Beta' : undefined;
}

function constructStepDots(dataViewLocalisedConfig: LocalisedConfig<DataViewConfig>): DataViewStep[] {
    // TODO: Remove this test override, which marks a made-up number of steps done so done dots can be seen.
    const testDoneCount = resolveTestSeed(dataViewLocalisedConfig) % 4;
    return constructDataViewSteps(dataViewLocalisedConfig).map((step, index) => ({
        ...step,
        state: index >= testDoneCount ? step.state : 'done'
    }));
}

function resolveConnection(dataViewLocalisedConfig: LocalisedConfig<DataViewConfig>): LocalisedConfig<ConnectionConfig> | undefined {
    const connectionId = dataViewLocalisedConfig.connectionId;
    if (connectionId != null) return connectionLocalisedConfigs.value.find((config) => config.id === connectionId);
    // TODO: Remove this test fallback, which lends a data view a connection whenever its faked step dots claim one.
    return constructStepDots(dataViewLocalisedConfig)[0]?.state === 'done'
        ? connectionLocalisedConfigs.value[resolveTestSeed(dataViewLocalisedConfig) % Math.max(connectionLocalisedConfigs.value.length, 1)]
        : undefined;
}

// Read after the open action's name, standing in for the step dots, which screen readers do not see.
function resolveProgressDescription(dataViewLocalisedConfig: LocalisedConfig<DataViewConfig>): string {
    const steps = constructStepDots(dataViewLocalisedConfig);
    const done = steps.filter((step) => step.state === 'done').length;
    return done === steps.length ? t(TEXT, 'progress.complete.text') : t(TEXT, 'progress.text', { done, total: steps.length });
}

// TODO: Remove with the test overrides above. Seeded by id so each card's made-up values hold across renders.
function resolveTestSeed(dataViewLocalisedConfig: LocalisedConfig<DataViewConfig>): number {
    return dataViewLocalisedConfig.id.codePointAt(dataViewLocalisedConfig.id.length - 1) ?? 0;
}

// An explicit 'name' is required even though this stays on the same route: it is what makes an absent 'dataViewId'
// actually clear the param instead of inheriting the one already in the URL — see 'router/index.ts' for why.
function updateDataViewIdParameter(dataViewId?: string): void {
    void router.replace({ name: 'dataViews', params: { dataViewId }, query: route.query }).catch(() => {
        // Already reported by 'router.onError'.
    });
}
</script>

<template>
    <StudioListPanel>
        <Separator class="flex-none" />

        <!-- Covers the region: nothing was retrieved, so an empty list with no explanation is what this replaces. The
             grid gives way to it rather than sitting behind it — an empty list and a detail pane asking the user to
             pick from it are exactly what the failure is there to account for. -->
        <ErrorNotice v-if="dataViewRetrievalFailure" covers-region :failures="[dataViewRetrievalFailure]" @retry="handleRetryRetrieve" />

        <GridDetailPanel
            v-else
            :active-item="activeDataViewLocalisedConfig"
            add-label="Data View"
            class="min-h-0 flex-1"
            :data-source="dataViewConfigsDataSource"
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
                    :category-label="dataViewConnectorMap.get(item.id)?.categoryLabel"
                    :config="item"
                    :icon="dataViewConnectorMap.get(item.id)?.icon"
                    :icon-dark="dataViewConnectorMap.get(item.id)?.iconDark"
                    :overline="dataViewConnectorMap.get(item.id)?.label ?? t(TEXT, 'noConnection.label')"
                    :prerelease-label="constructSamplePrereleaseLabel(item)"
                    :selected="item.id === activeDataViewLocalisedConfig?.id"
                    @category-click="handleFilterByCategory"
                    @click="handleSelectDataView(item)"
                >
                    <!-- Only while a step is outstanding: a complete data view shows the plain open button. -->
                    <template v-if="constructStepDots(item).some((step) => step.state === 'pending')" #status>
                        <StepDots :steps="constructStepDots(item)" />
                    </template>
                </ConfigCard>
            </template>

            <template #detail="{ item, close }">
                <DataViewPanel
                    :data-view-connector="dataViewConnectorMap.get(item.id)"
                    :data-view-localised-config="item"
                    :data-view-steps="constructStepDots(item)"
                    @close="close"
                />
                <PillButton :icon="ArrowRightIcon" label="Open" @click="handleOpenDataView(item)" />
            </template>

            <template #no-items>
                <EmptyPlaceholder
                    :message-item-label="t(TEXT, 'dataView.other.text')"
                    :description-item-label="t(TEXT, 'dataView.one.text')"
                    :action-item-label="t(TEXT, 'dataView.label')"
                />
            </template>

            <template #no-selection>
                <SelectPlaceholder :message="'Select a data view from the list.'" />
            </template>
        </GridDetailPanel>
    </StudioListPanel>
</template>
