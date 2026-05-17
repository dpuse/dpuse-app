<script setup lang="ts">
// External Dependencies
import { computed, defineAsyncComponent, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

// DPUse Framework
import type { DataViewConfig } from '@dpuse/dpuse-shared/component/dataView';

// Local (App) Framework
import type { DataSource } from '@/composables/useDataWindow';
import { t } from '@/state/locale';
import T from './DataViewList.json';
import { dataViewConfigs, localMetaStoreConnectionConfig } from '@/state/session';
import { establishDataViews, isDataViewRetrievalFinalised, NEW_DATA_VIEW_ID, setActiveDataViewConfig } from '@/state/establishDataViews';

// Local Components - Static
import Button from '@/components/ui/button/Button.vue';
import Card from '@/components/ui/card/Card.vue';
import Grid from '@/components/ui/grid/Grid.vue';
import ScrollArea from '@/components/layout/scrollArea/ScrollArea.vue';

// Local Components - Dynamic
const EmptyPlaceholder = defineAsyncComponent(() => import('@/components/layout/placeholders/EmptyPlaceholder.vue'));

// State ───────────────────────────────────────────────────────────────────────────────────────────────────────────────

const route = useRoute();
const router = useRouter();

// Initialisation ──────────────────────────────────────────────────────────────────────────────────────────────────────

watch(
    localMetaStoreConnectionConfig,
    (newLocalMetaStoreConnectionConfig) => {
        if (newLocalMetaStoreConnectionConfig == null) {
            isDataViewRetrievalFinalised.value = false;
        } else if (dataViewConfigs.value == null) {
            establishDataViews(newLocalMetaStoreConnectionConfig);
        }
    },
    { immediate: true }
);

// Derived State ───────────────────────────────────────────────────────────────────────────────────────────────────────

const dataSource = computed(
    (): DataSource<DataViewConfig> => ({
        rowCount: dataViewConfigs.value?.length ?? 0,
        getRows: (start: number, end: number): Promise<DataViewConfig[]> => Promise.resolve((dataViewConfigs.value ?? []).slice(start, end))
    })
);

// Handlers ────────────────────────────────────────────────────────────────────────────────────────────────────────────

function handleAddDataView(): void {
    setActiveDataViewConfig();
    router.push({ name: 'selectConnection', params: { dataViewId: NEW_DATA_VIEW_ID }, query: { ...route.query, wbView: 'selectConnection' } });
}

function handleSelectDataView(item: DataViewConfig): void {
    setActiveDataViewConfig(item);
}
</script>

<template>
    <Grid v-if="dataViewConfigs && dataViewConfigs.length > 0" add-label="Data View" :data-source="dataSource" :row-height="83" :target-column-width="350" @add="handleAddDataView">
        <template #default="{ item }">
            <Button
                shape="minimal"
                :to="{ name: 'selectNode', params: { dataViewId: item.id }, query: { ...$route.query, wbView: 'selectNode' } }"
                @click="handleSelectDataView(item)"
            >
                <Card :icon="item.icon ?? undefined" icon-color="#4d83e0" :label="item.label as string" />
            </Button>
        </template>
    </Grid>

    <ScrollArea v-else-if="isDataViewRetrievalFinalised">
        <EmptyPlaceholder :message-item-label="t(T, 'data_views')" :description-item-label="t(T, 'data_view')" :action-item-label="t(T, 'Data_View')" />
    </ScrollArea>

    <div v-else>Loading...</div>
</template>
