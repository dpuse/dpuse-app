<script setup lang="ts">
// External Dependencies
import { computed, defineAsyncComponent, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

// DPUse Framework
import { AppError } from '@dpuse/dpuse-shared/errors';
import type { ConnectionConfig } from '@dpuse/dpuse-shared/component/connection';
import type { DataViewConfig } from '@dpuse/dpuse-shared/component/dataView';
import type { EngineCallbackData } from '@dpuse/dpuse-shared/engine';
import type { RetrieveRecordsOptions } from '@dpuse/dpuse-shared/component/module/connector';

// Local (App) Framework
import type { DataSource } from '@/composables/useDataWindow';
import { reportAppError } from '@/observability/errorTracking';
import { t } from '@/state/locale';
import T from './DataViewList.json';
import { useEngine } from '@/services/useEngine';
import { dataViewConfigs, activeMetaStoreConnectionConfig } from '@/state/session';
import { establishDataViewsObject, NEW_DATA_VIEW_ID, setActiveDataViewConfig } from '@/state/establishDataViews';

// Local Components - Static
import Button from '@/components/ui/button/Button.vue';
import Card from '@/components/ui/card/Card.vue';
import Grid from '@/components/ui/grid/Grid.vue';
import ScrollArea from '@/components/layout/scrollArea/ScrollArea.vue';
import Separator from '~/src/components/ui/separator/Separator.vue';

// Local Components - Dynamic
const EmptyPlaceholder = defineAsyncComponent(() => import('@/components/layout/placeholders/EmptyPlaceholder.vue'));

// State ───────────────────────────────────────────────────────────────────────────────────────────────────────────────

const isDataViewsRetrievalFinalised = ref(false);

const route = useRoute();
const router = useRouter();

// Derived State ───────────────────────────────────────────────────────────────────────────────────────────────────────

const dataViewConfigsDataSource = computed(
    (): DataSource<DataViewConfig> => ({
        rowCount: dataViewConfigs.value?.length ?? 0,
        getRows: (start: number, end: number): Promise<DataViewConfig[]> => Promise.resolve((dataViewConfigs.value ?? []).slice(start, end))
    })
);

// Side Effects ────────────────────────────────────────────────────────────────────────────────────────────────────────

watch(
    activeMetaStoreConnectionConfig,
    (newLocalMetaStoreConnectionConfig) => {
        if (newLocalMetaStoreConnectionConfig == null) {
            isDataViewsRetrievalFinalised.value = false;
        } else if (dataViewConfigs.value.length === 0) {
            retrieveDataViews(newLocalMetaStoreConnectionConfig);
        }
    },
    { immediate: true }
);

// Handlers ────────────────────────────────────────────────────────────────────────────────────────────────────────────

function handleAddDataView(): void {
    setActiveDataViewConfig();
    router.push({ name: 'selectConnection', params: { dataViewId: NEW_DATA_VIEW_ID }, query: { ...route.query, wbView: 'selectConnection' } });
}

function handleSelectDataView(dataViewConfig: DataViewConfig): void {
    setActiveDataViewConfig(dataViewConfig);
    if (dataViewConfig.connectionId == null) {
        router.push({ name: 'selectConnection', params: { dataViewId: dataViewConfig.id }, query: { ...route.query, wbView: 'selectConnection' } });
    } else if (dataViewConfig.connectionNodeConfig == null) {
        router.push({ name: 'selectItem', params: { dataViewId: dataViewConfig.id }, query: { ...route.query, wbView: 'selectItem' } });
    } else if (dataViewConfig.contentAuditConfig == null) {
        router.push({ name: 'auditContent', params: { dataViewId: dataViewConfig.id }, query: { ...route.query, wbView: 'auditContent' } });
    } else {
        router.push({ name: 'exploreData', params: { dataViewId: dataViewConfig.id }, query: { ...route.query, wbView: 'exploreData' } });
    }
}

// Helpers ─────────────────────────────────────────────────────────────────────────────────────────────────────────────

async function retrieveDataViews(metaStoreConnectionConfig: ConnectionConfig): Promise<void> {
    try {
        await establishDataViewsObject(metaStoreConnectionConfig);

        const { processRequest } = await useEngine();
        const pendingDataViewConfigs: DataViewConfig[] = [];
        const retrieveRecordOptions: RetrieveRecordsOptions = { encodingId: '', path: '/dpuMetaStore/dataViews', valueDelimiterId: '', chunkSize: undefined }; // TODO: Implement paging.
        await processRequest('retrieveRecords', metaStoreConnectionConfig, retrieveRecordOptions, (data: EngineCallbackData) => {
            if (data.typeId === 'chunk') {
                pendingDataViewConfigs.push(...(data.properties.records as DataViewConfig[]));
            } else {
                dataViewConfigs.value = pendingDataViewConfigs;
                isDataViewsRetrievalFinalised.value = true;
            }
        });
    } catch (error) {
        dataViewConfigs.value = [];
        isDataViewsRetrievalFinalised.value = true;
        reportAppError(new AppError('Failed to retrieve data views.', 'dpuse-app.DataViewList.retrieveDataViews', { typeId: 'handled' }, { cause: error }));
    }
}
</script>

<template>
    <div class="flex flex-col">
        <Separator class="mx-4 flex-none" />

        <Grid
            v-if="dataViewConfigs && dataViewConfigs.length > 0"
            add-label="Data View"
            class="flex-1"
            :data-source="dataViewConfigsDataSource"
            :row-height="83"
            :target-column-width="350"
            @add="handleAddDataView"
        >
            <template #default="{ item }">
                <Button class="w-full" shape="minimal" @click="handleSelectDataView(item)">
                    <Card :icon="item.icon ?? undefined" icon-color="#4d83e0" :label="item.label as string" />
                </Button>
            </template>
        </Grid>

        <ScrollArea v-else-if="isDataViewsRetrievalFinalised" class="flex-1">
            <EmptyPlaceholder :message-item-label="t(T, 'data_views')" :description-item-label="t(T, 'data_view')" :action-item-label="t(T, 'Data_View')" />
        </ScrollArea>

        <div v-else class="flex flex-1 flex-col items-center justify-center">Loading...</div>
    </div>
</template>
