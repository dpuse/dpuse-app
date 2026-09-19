<script setup lang="ts">
// ── External Dependencies & Registrations
import { ArrowRightIcon } from '@lucide/vue';
import { computed, ref, shallowRef, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

// ── DPUse Framework
import { AppError } from '@dpuse/dpuse-shared/errors';
import type { DataViewConfig } from '@dpuse/dpuse-shared/component/dataView';
import type { LocalisedConfig } from '@dpuse/dpuse-shared/locale';

// ── Local Framework
import { activeMetaStoreConnectionConfig } from '@/state/session';
import type { DataSource } from '@/composables/useDataWindow';
import { defineAsyncPanel } from '@/utilities/index.ts';
import { raiseAppFailure } from '@/state/errors';
import { t } from '@/state/locale';
import { TEXT } from './DataViewList_.json';
import { type Badge, useCardRowHeight } from '@/components/ui/config/configCard';
import { constructDataViewSteps, type DataViewStep, resolveCurrentDataViewStepId } from './dataViewSteps';
import {
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

// Cards here carry actions, which take a second row.
const cardRowHeight = useCardRowHeight(true);

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

// TODO: Remove these sample badges, which exist only to test the card's badge row. Seeded by id so they hold across
// renders, and varied so some cards have none, one, or enough to clip.
function constructSampleBadges(dataViewLocalisedConfig: LocalisedConfig<DataViewConfig>): Badge[] {
    const samples: Badge[][] = [
        [],
        [{ id: 'shared', color: 'info', label: 'Shared' }],
        [
            { id: 'draft', color: 'warning', label: 'Draft' },
            { id: 'refreshFailed', color: 'danger', label: 'Refresh failed' },
            { id: 'owner', label: 'Owned by Finance' }
        ]
    ];
    return samples[(dataViewLocalisedConfig.id.codePointAt(dataViewLocalisedConfig.id.length - 1) ?? 0) % samples.length] ?? [];
}

function constructStepDots(dataViewLocalisedConfig: LocalisedConfig<DataViewConfig>): DataViewStep[] {
    // TODO: Remove this test override, which marks a made-up number of steps done so green dots can be seen.
    const testDoneCount = (dataViewLocalisedConfig.id.codePointAt(dataViewLocalisedConfig.id.length - 1) ?? 0) % 4; // Seeded by id so it holds across renders.
    return constructDataViewSteps(dataViewLocalisedConfig).map((step, index) => ({
        ...step,
        state: index >= testDoneCount ? step.state : 'done'
    }));
}

function resolveOpenLabel(dataViewLocalisedConfig: LocalisedConfig<DataViewConfig>): string {
    const steps = constructStepDots(dataViewLocalisedConfig);
    const pendingStep = steps.find((step) => step.state === 'pending');
    if (!pendingStep) return t(TEXT, 'open.complete.label', { name: dataViewLocalisedConfig.label });
    const done = steps.filter((step) => step.state === 'done').length;
    return t(TEXT, 'open.label', { done, name: dataViewLocalisedConfig.label, step: t(TEXT, `step.${pendingStep.id}.label`), total: steps.length });
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
                        { typeId: 'open', label: resolveOpenLabel(item), onClick: handleOpenDataView }
                    ]"
                    :badges="constructSampleBadges(item)"
                    :config="item"
                    :selected="item.id === activeDataViewLocalisedConfig?.id"
                    @click="handleSelectDataView(item)"
                >
                    <!-- Only while a step is outstanding: a complete data view shows the plain open button. -->
                    <template v-if="constructStepDots(item).some((step) => step.state === 'pending')" #status>
                        <StepDots :steps="constructStepDots(item)" />
                    </template>
                </ConfigCard>
            </template>

            <template #detail="{ item, close }">
                <DataViewPanel :data-view-localised-config="item" @close="close" />
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
