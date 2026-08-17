<script setup lang="ts">
// ── External Dependencies & Registrations
import { computed, defineAsyncComponent, ref, shallowRef, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

// ── DPUse Framework
import type { DataViewConfig } from '@dpuse/dpuse-shared/component/dataView';
import type { LocalisedConfig } from '@dpuse/dpuse-shared/locale';

// ── Local Framework
import { activeMetaStoreConnectionConfig } from '@/state/session';
import type { DataSource } from '@/composables/useDataWindow';
import { t } from '@/state/locale';
import T from './EstablishDataViews.json';
import {
    dataViewConfigs,
    dataViewConfigsAreRetrieved,
    dataViewLocalisedConfigs,
    NEW_DATA_VIEW_ID,
    removeDataViewRecord,
    retrieveDataViewConfigs,
    setActiveDataViewConfig
} from '@/state/dataViews';

// ── Local Components - Static
import ConfigCard from '@/components/framework/ConfigCard.vue';
import DataViewSummaryPanel from './DataViewSummaryPanel.vue';
import GridDetailPanel from '@/components/framework/gridDetailPanel/GridDetailPanel.vue';
import SelectPlaceholder from '@/components/ui/placeholders/SelectPlaceholder.vue';
import Separator from '@/components/ui/Separator.vue';
import StepActionButton from '@/components/ui/button/StepActionButton.vue';
import StudioListPanel from '../StudioListPanel.vue';

// ── Local Components - Dynamic
const EmptyPlaceholder = defineAsyncComponent(() => import('@/components/ui/placeholders/EmptyPlaceholder.vue'));

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

const activeDataViewLocalisedConfig = shallowRef<LocalisedConfig<DataViewConfig> | undefined>();
const detailActionId = ref<string>();
const route = useRoute();
const router = useRouter();

// ── Derived State ────────────────────────────────────────────────────────────────────────────────────────────────────

// Constructs a computed data source wrapper for the data view configurations which are set by the watcher below.
// rowCount stays undefined (busy) until retrieval completes, distinct from 0 (confirmed empty) — see DataSource.rowCount.
const dataViewConfigsDataSource = computed((): DataSource<LocalisedConfig<DataViewConfig>> => ({
    rowCount: dataViewConfigsAreRetrieved.value ? dataViewLocalisedConfigs.value.length : undefined,
    getRows: (start: number, end: number): Promise<{ rows: LocalisedConfig<DataViewConfig>[] }> => Promise.resolve({ rows: dataViewLocalisedConfigs.value.slice(start, end) })
}));

// ── Side Effects ─────────────────────────────────────────────────────────────────────────────────────────────────────

// On a page refresh, this component may load before the meta store connection configuration is available;
// otherwise it is likely already available. Uses this connection to set data view configurations which are referenced by the computed data source above.
watch(
    activeMetaStoreConnectionConfig,
    (newActiveMetaStoreConnectionConfig) => {
        if (newActiveMetaStoreConnectionConfig) {
            if (!dataViewConfigsAreRetrieved.value) retrieveDataViewConfigs(newActiveMetaStoreConnectionConfig);
        } else {
            dataViewConfigs.value = undefined;
            dataViewConfigsAreRetrieved.value = false;
        }
    },
    { immediate: true }
);

// Detail action bar reports clicks via v-model rather than dedicated events, so route them to the matching handler here.
watch(detailActionId, (newDetailActionId) => {
    if (newDetailActionId == null || !activeDataViewLocalisedConfig.value) return;
    const dataViewLocalisedConfig = activeDataViewLocalisedConfig.value;
    detailActionId.value = undefined;
    if (newDetailActionId === 'continue') handleContinueDataView(dataViewLocalisedConfig);
    else if (newDetailActionId === 'delete') handleDeleteDataView(dataViewLocalisedConfig);
});

// ── Event Handlers ───────────────────────────────────────────────────────────────────────────────────────────────────

function handleAddDataView(): void {
    setActiveDataViewConfig();
    router.push({ name: 'selectConnection', params: { dataViewId: NEW_DATA_VIEW_ID }, query: { ...route.query, sView: 'selectConnection' } });
}

function handleDeleteDataView(dataViewLocalisedConfig: LocalisedConfig<DataViewConfig>): void {
    if (activeDataViewLocalisedConfig.value?.id === dataViewLocalisedConfig.id) activeDataViewLocalisedConfig.value = undefined;
    removeDataViewRecord(activeMetaStoreConnectionConfig.value, dataViewLocalisedConfig.id);
}

function handleOpenDataView(dataViewLocalisedConfig: LocalisedConfig<DataViewConfig>): void {
    activeDataViewLocalisedConfig.value = dataViewLocalisedConfig;
    detailActionId.value = 'continue';
}

function handleSelectDataView(dataViewLocalisedConfig: LocalisedConfig<DataViewConfig> | undefined): void {
    activeDataViewLocalisedConfig.value = dataViewLocalisedConfig;
}

function handleContinueDataView(dataViewLocalisedConfig: LocalisedConfig<DataViewConfig>): void {
    const dataViewConfig = dataViewConfigs.value!.find((config) => config.id === dataViewLocalisedConfig.id)!;
    setActiveDataViewConfig(dataViewConfig);
    if (dataViewConfig.connectionId == null) {
        router.push({ name: 'selectConnection', params: { dataViewId: dataViewConfig.id }, query: { ...route.query, sView: 'selectConnection' } });
    } else if (dataViewConfig.connectionNodeConfig == null) {
        router.push({ name: 'selectItem', params: { dataViewId: dataViewConfig.id }, query: { ...route.query, sView: 'selectItem' } });
    } else if (dataViewConfig.contentAuditConfig == null) {
        router.push({ name: 'auditContent', params: { dataViewId: dataViewConfig.id }, query: { ...route.query, sView: 'auditContent' } });
    } else {
        router.push({ name: 'exploreData', params: { dataViewId: dataViewConfig.id }, query: { ...route.query, sView: 'exploreData' } });
    }
}
</script>

<template>
    <StudioListPanel>
        <Separator class="mx-4 flex-none" />

        <GridDetailPanel
            :active-item="activeDataViewLocalisedConfig"
            add-label="Data View"
            class="min-h-0 flex-1"
            :data-source="dataViewConfigsDataSource"
            max-detail-width="65ch"
            :row-height="162"
            @add="handleAddDataView"
            @select="handleSelectDataView"
        >
            <template #grid-item="{ item }">
                <ConfigCard
                    :actions="[
                        { typeId: 'delete', onClick: handleDeleteDataView },
                        { typeId: 'open', onClick: handleOpenDataView }
                    ]"
                    :config="item"
                    status-message="4 steps left"
                />
            </template>

            <template #empty>
                <EmptyPlaceholder :message-item-label="t(T, 'data_views')" :description-item-label="t(T, 'data_view')" :action-item-label="t(T, 'Data_View')" />
            </template>

            <template #detail="{ item, clear }">
                <DataViewSummaryPanel class="min-h-0 flex-1 pl-4" :data-view-localised-config="item" @close="clear" />
                <StepActionButton label="Open" @click="handleOpenDataView(item)" />
            </template>

            <template #no-selection>
                <SelectPlaceholder :message="'Select a data view from the list.'" />
            </template>
        </GridDetailPanel>
    </StudioListPanel>
</template>
