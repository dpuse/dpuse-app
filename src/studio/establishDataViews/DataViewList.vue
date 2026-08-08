<script setup lang="ts">
// ── External Dependencies & Registrations
import { computed, defineAsyncComponent, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

// ── DPUse Framework
import type { DataViewConfig } from '@dpuse/dpuse-shared/component/dataView';
import type { LocalisedConfig } from '@dpuse/dpuse-shared/locale';

// ── Local Framework
import { activeMetaStoreConnectionConfig } from '@/state/session';
import type { DataSource } from '@/composables/useDataWindow';
import { t } from '@/state/locale';
import T from './DataViewList.json';
import { dataViewConfigs, dataViewConfigsAreRetrieved, dataViewLocalisedConfigs, NEW_DATA_VIEW_ID, retrieveDataViewConfigs, setActiveDataViewConfig } from '@/state/dataViews';

// ── Local Components - Static
import Button from '@/components/ui/button/Button.vue';
import Card from '@/components/ui/Card.vue';
import Grid from '@/components/framework/Grid.vue';
import ScrollArea from '@/components/ui/ScrollArea.vue';
import Separator from '@/components/ui/Separator.vue';

// ── Local Components - Dynamic
const EmptyPlaceholder = defineAsyncComponent(() => import('@/components/ui/placeholders/EmptyPlaceholder.vue'));

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

const route = useRoute();
const router = useRouter();

// ── Derived State ────────────────────────────────────────────────────────────────────────────────────────────────────

// Constructs a computed data source wrapper for the data view configurations which are set by the watcher below.
const dataViewConfigsDataSource = computed((): DataSource<LocalisedConfig<DataViewConfig>> => ({
    rowCount: dataViewLocalisedConfigs.value.length,
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

// ── Event Handlers ───────────────────────────────────────────────────────────────────────────────────────────────────

function handleAddDataView(): void {
    setActiveDataViewConfig();
    router.push({ name: 'selectConnection', params: { dataViewId: NEW_DATA_VIEW_ID }, query: { ...route.query, sView: 'selectConnection' } });
}

function handleDeleteDataView(dataViewLocalisedConfig: LocalisedConfig<DataViewConfig>): void {
    console.log(dataViewLocalisedConfig);
}

function handleSelectDataView(dataViewLocalisedConfig: LocalisedConfig<DataViewConfig>): void {
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
    <div class="flex flex-col">
        <Separator class="mx-4 flex-none" />

        <Grid
            v-if="dataViewConfigs && dataViewConfigs.length > 0"
            add-label="Data View"
            class="flex-1"
            :data-source="dataViewConfigsDataSource"
            :row-height="80"
            :target-column-width="350"
            @add="handleAddDataView"
        >
            <template #default="{ item }">
                <Button class="size-full" shape="minimal" @click="handleSelectDataView(item)">
                    <Card :actions="[{ typeId: 'delete', onClick: handleDeleteDataView }]" :icon="item.icon ?? undefined" :item="item" :label="item.label" />
                </Button>
            </template>
        </Grid>

        <ScrollArea v-else-if="dataViewConfigsAreRetrieved" class="flex-1">
            <EmptyPlaceholder :message-item-label="t(T, 'data_views')" :description-item-label="t(T, 'data_view')" :action-item-label="t(T, 'Data_View')" />
        </ScrollArea>

        <div v-else class="flex flex-1 flex-col items-center justify-center">Loading...</div>
    </div>
</template>
