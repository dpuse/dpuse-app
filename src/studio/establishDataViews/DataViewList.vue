<script setup lang="ts">
// ── External Dependencies & Registrations
import { computed, defineAsyncComponent, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

// ── DPUse Framework
import type { DataViewConfig } from '@dpuse/dpuse-shared/component/dataView';

// ── Local Framework
import { activeMetaStoreConnectionConfig } from '@/state/session';
import type { DataSource } from '@/composables/useDataWindow';
import { t } from '@/state/locale';
import T from './DataViewList.json';
import { dataViewConfigs, dataViewConfigsAreRetrieved, NEW_DATA_VIEW_ID, retrieveDataViewConfigs, setActiveDataViewConfig } from '@/state/dataViews';

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

// Constructs a computed data source wrapper for the data view configurations. Data view configurations are set by watcher below.
const dataViewConfigsDataSource = computed((): DataSource<DataViewConfig> => ({
    rowCount: dataViewConfigs.value?.length ?? 0,
    getRows: (start: number, end: number): Promise<{ rows: DataViewConfig[] }> => Promise.resolve({ rows: (dataViewConfigs.value ?? []).slice(start, end) })
}));

// ── Side Effects ─────────────────────────────────────────────────────────────────────────────────────────────────────

// On a page refresh, this component may load before the configuration is available; otherwise it is likely already available. Sets data view configurations.
watch(
    activeMetaStoreConnectionConfig,
    (newActiveMetaStoreConnectionConfig) => {
        if (newActiveMetaStoreConnectionConfig && !dataViewConfigs.value) {
            retrieveDataViewConfigs(newActiveMetaStoreConnectionConfig);
        }
    },
    { immediate: true }
);

// ── Event Handlers ───────────────────────────────────────────────────────────────────────────────────────────────────

function handleAddDataView(): void {
    setActiveDataViewConfig();
    router.push({ name: 'selectConnection', params: { dataViewId: NEW_DATA_VIEW_ID }, query: { ...route.query, sView: 'selectConnection' } });
}

function handleSelectDataView(dataViewConfig: DataViewConfig): void {
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
                <Card :icon="item.icon ?? undefined" :label="item.label as string" />
            </Button>
        </template>
    </Grid>

    <ScrollArea v-else-if="dataViewConfigsAreRetrieved" class="flex-1">
        <EmptyPlaceholder :message-item-label="t(T, 'data_views')" :description-item-label="t(T, 'data_view')" :action-item-label="t(T, 'Data_View')" />
    </ScrollArea>

    <div v-else class="flex flex-1 flex-col items-center justify-center">Loading...</div>
</template>
