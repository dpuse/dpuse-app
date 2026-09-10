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
import { t } from '@/state/locale';
import { raiseAppFailure } from '@/state/errors';
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
import ErrorShell from '@/components/ui/error/ErrorShell.vue';
import DataViewPanel from './DataViewPanel.vue';
import GridDetailPanel from '@/components/ui/grid/GridDetailPanel.vue';
import SelectPlaceholder from '@/components/ui/placeholder/SelectPlaceholder.vue';
import Separator from '@/components/ui/Separator.vue';
import PillButton from '@/components/ui/action/PillButton.vue';
import StudioListPanel from '@/features/studio/_components/StudioListPanel.vue';

// ── Dynamic Components
const EmptyPlaceholder = defineAsyncPanel(() => import('~/src/components/ui/placeholder/EmptyPlaceholder.vue'), 'EmptyPlaceholder');

const T = {
    'dataView.label': { en: 'Data View', es: 'Vista de Datos' },
    'dataView.one.text': { en: 'data view', es: 'vista de datos' },
    'dataView.other.text': { en: 'data views', es: 'vistas de datos' }
};

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

const activeDataViewLocalisedConfig = shallowRef<LocalisedConfig<DataViewConfig> | undefined>();
const detailActionId = ref<string>();
const route = useRoute();
const router = useRouter();

// ── Derived State ────────────────────────────────────────────────────────────────────────────────────────────────────

// Constructs a computed data source wrapper for the data view configurations, which are retrieved by the meta store
// connection watcher in '@/state/dataViews'.
// rowCount stays undefined (busy) until retrieval settles, distinct from 0 (confirmed empty) — see DataSource.rowCount.
const dataViewConfigsDataSource = computed((): DataSource<LocalisedConfig<DataViewConfig>> => ({
    rowCount: dataViewRetrievalSucceeded.value || dataViewRetrievalFailed.value ? dataViewLocalisedConfigs.value.length : undefined,
    getRows: (start: number, end: number): Promise<{ rows: LocalisedConfig<DataViewConfig>[] }> => Promise.resolve({ rows: dataViewLocalisedConfigs.value.slice(start, end) })
}));

// ── Side Effects ─────────────────────────────────────────────────────────────────────────────────────────────────────

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
    void router.push({ name: 'connections', params: { dataViewId: NEW_DATA_VIEW_ID }, query: { ...route.query, sView: 'connections' } }).catch(() => {
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
}

function handleContinueDataView(dataViewLocalisedConfig: LocalisedConfig<DataViewConfig>): void {
    const dataViewConfig = dataViewConfigs.value.find((config) => config.id === dataViewLocalisedConfig.id);
    if (!dataViewConfig) return;

    setActiveDataViewConfig(dataViewConfig);
    if (dataViewConfig.connectionId == null) {
        void router.push({ name: 'connections', params: { dataViewId: dataViewConfig.id }, query: { ...route.query, sView: 'connections' } }).catch(() => {
            // Already reported by 'router.onError'.
        });
    } else if (dataViewConfig.connectionNodeConfig == null) {
        void router.push({ name: 'items', params: { dataViewId: dataViewConfig.id }, query: { ...route.query, sView: 'items' } }).catch(() => {
            // Already reported by 'router.onError'.
        });
    } else if (dataViewConfig.contentAuditConfig == null) {
        void router.push({ name: 'content', params: { dataViewId: dataViewConfig.id }, query: { ...route.query, sView: 'content' } }).catch(() => {
            // Already reported by 'router.onError'.
        });
    } else {
        void router.push({ name: 'data', params: { dataViewId: dataViewConfig.id }, query: { ...route.query, sView: 'data' } }).catch(() => {
            // Already reported by 'router.onError'.
        });
    }
}
</script>

<template>
    <StudioListPanel>
        <Separator class="flex-none" />

        <!-- Covers the region: nothing was retrieved, so an empty list with no explanation is what this replaces. The
             grid gives way to it rather than sitting behind it — an empty list and a detail pane asking the user to
             pick from it are exactly what the failure is there to account for. -->
        <ErrorShell v-if="dataViewRetrievalFailure" covers-region :failures="[dataViewRetrievalFailure]" @retry="handleRetryRetrieve" />

        <GridDetailPanel
            v-else
            :active-item="activeDataViewLocalisedConfig"
            add-label="Data View"
            class="min-h-0 flex-1"
            :data-source="dataViewConfigsDataSource"
            max-detail-width="65ch"
            :row-height="16 + 16 + 28 + 32 + 16"
            @add="handleAddDataView"
        >
            <template #item="{ item }">
                <ConfigCard
                    :actions="[
                        { typeId: 'delete', onClick: handleDeleteDataView },
                        { typeId: 'open', onClick: handleOpenDataView }
                    ]"
                    :config="item"
                    :selected="item.id === activeDataViewLocalisedConfig?.id"
                    status-message="4 steps left"
                    @click="handleSelectDataView(item)"
                />
            </template>

            <template #detail="{ item, close }">
                <DataViewPanel :data-view-localised-config="item" @close="close" />
                <PillButton :icon="ArrowRightIcon" label="Open" @click="handleOpenDataView(item)" />
            </template>

            <template #no-items>
                <EmptyPlaceholder
                    :message-item-label="t(T, 'dataView.other.text')"
                    :description-item-label="t(T, 'dataView.one.text')"
                    :action-item-label="t(T, 'dataView.label')"
                />
            </template>

            <template #no-selection>
                <SelectPlaceholder :message="'Select a data view from the list.'" />
            </template>
        </GridDetailPanel>
    </StudioListPanel>
</template>
