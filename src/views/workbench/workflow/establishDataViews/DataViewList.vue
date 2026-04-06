<script setup lang="ts">
// External Dependencies
import { useRoute } from 'vue-router';
import { computed, defineAsyncComponent, ref, watch } from 'vue';

// DPUse Framework
import { AppError } from '@dpuse/dpuse-shared/errors';
import type { EngineCallbackData } from '@dpuse/dpuse-shared/engine';
import type {
    ConnectionConfig,
    CreateObjectOptions,
    FindObjectOptions,
    FindObjectResult,
    RetrieveRecordsOptions,
    UpsertRecordsOptions
} from '@dpuse/dpuse-shared/component/connector';

// App Core
import { reportAppError } from '@/observability/errorTracking';
import { t } from '@/locales';
import T from '@/locales/views/workbench/workflow/establishDataViews/EstablishDataViews.json';
import { useEngine } from '@/composables/useEngine';
import { useSessionStore } from '@/stores/sessionStore';

// App Components - Statically imported so always available, even after app goes offline.
import Card from '@/components/card/Card.vue';
import List from '@/components/list/List.vue';
import PanelScroller from '@/components/panelScroller/PanelScroller.vue';

// App Components - Lazy loaded as required.
const EmptyStatePlaceholder = defineAsyncComponent(() => import('@/components/emptyState/EmptyStatePlaceholder.vue'));

// Global State ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const route = useRoute();
const sessionState = useSessionStore();

// Local States ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const dataViewRetrievalIsActive = ref(false);

// Local meta store connection configuration state ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const localMetaStoreConnectionConfig = computed(() => sessionState.localMetaStoreConnectionConfig);
watch(localMetaStoreConnectionConfig, (newConnectionConfig) => retrieveDataViews(newConnectionConfig), { immediate: true });

// Local data view configurations state ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const dataViewConfigs = computed(() => sessionState.dataViewConfigs);
const dataSource = computed(() => ({
    rowCount: dataViewConfigs.value?.length ?? 0,
    getRows: (start: number, end: number): Promise<unknown[]> => Promise.resolve((dataViewConfigs.value ?? []).slice(start, end))
}));

// Helpers ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function retrieveDataViews(connectionConfig?: ConnectionConfig): Promise<void> {
    try {
        if (!connectionConfig) return;

        const { processRequest } = await useEngine();
        const findObjectOptions: FindObjectOptions = { storeId: 'dpuMetaStore', nodeId: 'dataViews' };
        const findObjectResult = (await processRequest('findObject', connectionConfig, findObjectOptions)) as FindObjectResult;
        if (findObjectResult.path == null) {
            const createObjectOptions: CreateObjectOptions = { path: '/dpuMetaStore/dataViews', structure: 'id' };
            await processRequest('createObject', connectionConfig, createObjectOptions);
        }

        const options: UpsertRecordsOptions = {
            path: '/dpuMetaStore/dataViews',
            records: [
                { id: '1', label: 'One' },
                { id: '2', label: 'Two' },
                { id: '3', label: 'Three' },
                { id: '4', label: 'Four' }
            ]
        };
        await processRequest('upsertRecords', connectionConfig, options, (data: EngineCallbackData) => {
            console.log('UPSERT RECORDS', data);
        });

        const retrieveRecordOptions: RetrieveRecordsOptions = { encodingId: '', path: '/dpuMetaStore/dataViews', valueDelimiterId: '', chunkSize: undefined }; // TODO: Implement paging.
        await processRequest('retrieveRecords', connectionConfig, retrieveRecordOptions, (data: EngineCallbackData) => {
            if (data.typeId === 'chunk') {
                sessionState.dataViewConfigs = (data.properties.records as { id: string; label: string }[]).map((record) => {
                    const localisedConfig = record;
                    return localisedConfig;
                });
            } else {
                dataViewRetrievalIsActive.value = true;
            }
        });

        // // TODO: Temporary code.
        // if (!sessionState.dataViewConfigs.length) {
        //     sessionState.dataViewConfigs = [];
        //     for (let index = 1; index < 26; index++)
        //         sessionState.dataViewConfigs.push({
        //             id: `id${index}`,
        //             label: `Data View ${index}`,
        //             description: `Data view ${index} description...`,
        //             statusId: 'alpha',
        //             status: { id: 'alpha', label: 'alpha', color: 'red' },
        //             typeId: 'dataView'
        //         });
        // }

        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

        // const startTime = performance.now();
        // // const response = await fetch('https://sample-data-eu.dpuse.app/fileStore/ENGAGEMENT_START_EVENTS_202405121858.csv');
        // const response = await fetch('https://sample-data-eu.dpuse.app/WDI_Data.csv');

        // const auditObjectContentSettings: AuditContentSettings = { encodingId: 'utf-8', path: '/WDI_Data.csv', valueDelimiterId: ',' };
        // const auditObjectContentResult = (await processRequest('auditObjectContent', testConnectionConfig!, auditObjectContentSettings)) as AuditContentResult;
        // const elapsedMs = performance.now() - startTime;
        // console.log('auditObjectContentResult', elapsedMs, auditObjectContentResult);

        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    } catch (error) {
        reportAppError(new AppError('Failed to retrieve data views.', 'dpuse-app.EstablishDataViews.retrieveDataViews', { typeId: 'handled' }, { cause: error }));
    } finally {
        // Pending...
    }
}
</script>

<template>
    <List
        v-if="dataViewRetrievalIsActive && dataViewConfigs && dataViewConfigs.length > 0"
        class="flex-1 pb-20"
        :data-source="dataSource"
        :row-height="150"
        :target-column-width="350"
    >
        <template #default="{ row }">
            <!-- <Card
                    v-if="row"
                    :badges="row.badges"
                    :icon="activeBenchtopOptionConfig ? activeBenchtopOptionConfig.icon : undefined"
                    :icon-color="activeBenchtopOptionConfig ? activeBenchtopOptionConfig.color : undefined"
                    :label="row.label"
                /> -->
            <RouterLink :to="{ name: 'selectNode', query: { ...route.query, wbView: 'selectNode' } }">
                <Card v-if="row" :label="row.label as string" />
            </RouterLink>
        </template>
    </List>

    <PanelScroller v-else-if="dataViewRetrievalIsActive">
        <EmptyStatePlaceholder :message-item-label="t(T, 'data_views')" :description-item-label="t(T, 'data_view')" :action-item-label="t(T, 'Data_View')" />
    </PanelScroller>
</template>
