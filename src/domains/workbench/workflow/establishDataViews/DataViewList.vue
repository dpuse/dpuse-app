<script setup lang="ts">
// External Dependencies
import { computed, defineAsyncComponent, ref, watch } from 'vue';

// DPUse Framework
import { AppError } from '@dpuse/dpuse-shared/errors';
import type { ConnectionConfig } from '@dpuse/dpuse-shared/component/connection';
import type { DataViewConfig } from '@dpuse/dpuse-shared/component/dataView';
import type { EngineCallbackData } from '@dpuse/dpuse-shared/engine';
import type { CreateObjectOptions, FindObjectOptions, FindObjectResult, RetrieveRecordsOptions, UpsertRecordsOptions } from '@dpuse/dpuse-shared/component/module/connector';

// Local Framework
import { activeDataViewConfig } from '@/state/establishDataViews';
import type { DataSource } from '@/composables/useDataWindow';
import { reportAppError } from '@/observability/errorTracking';
import { t } from '@/state/locale';
import T from './DataViewList.json';
import { useEngine } from '@/services/useEngine';
import { dataViewConfigs, localMetaStoreConnectionConfig } from '@/state/session';

// Local Components - Static
import Card from '@/components/ui/card/Card.vue';
import ContentScroller from '@/components/layout/contentScroller/ContentScroller.vue';
import Grid from '@/components/ui/grid/Grid.vue';

// Local Components - Dynamic
const EmptyPlaceholder = defineAsyncComponent(() => import('@/components/ui/emptyPlaceholder/EmptyPlaceholder.vue'));

// State ───────────────────────────────────────────────────────────────────────────────────────────────────────────────

const dataViewRetrievalIsActive = ref(false);

// Derived State ───────────────────────────────────────────────────────────────────────────────────────────────────────

const dataSource = computed(
    (): DataSource<DataViewConfig> => ({
        rowCount: dataViewConfigs.value?.length ?? 0,
        getRows: (start: number, end: number): Promise<DataViewConfig[]> => Promise.resolve((dataViewConfigs.value ?? []).slice(start, end))
    })
);

// Side Effects ────────────────────────────────────────────────────────────────────────────────────────────────────────

watch(localMetaStoreConnectionConfig, (newConnectionConfig) => retrieveDataViews(newConnectionConfig), { immediate: true });

// Helpers ─────────────────────────────────────────────────────────────────────────────────────────────────────────────

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
                dataViewConfigs.value = (data.properties.records as DataViewConfig[]).map((record) => {
                    const localisedConfig = record;
                    return localisedConfig;
                });
            } else {
                dataViewRetrievalIsActive.value = true;
            }
        });

        // // TODO: Temporary code.
        // if (!sessionStore.dataViewConfigs.length) {
        //     sessionStore.dataViewConfigs = [];
        //     for (let index = 1; index < 26; index++)
        //         sessionStore.dataViewConfigs.push({
        //             id: `id${index}`,
        //             label: `Data View ${index}`,
        //             description: `Data view ${index} description...`,
        //             statusId: 'alpha',
        //             status: { id: 'alpha', label: 'alpha', color: 'red' },
        //             typeId: 'dataView'
        //         });
        // }

        // ─────────────────────────────────────────────────────────────────────────────────────────────────────────────

        // const startTime = performance.now();
        // // const response = await fetch('https://sample-data-eu.dpuse.app/fileStore/ENGAGEMENT_START_EVENTS_202405121858.csv');
        // const response = await fetch('https://sample-data-eu.dpuse.app/WDI_Data.csv');

        // const auditObjectContentSettings: AuditContentSettings = { encodingId: 'utf-8', path: '/WDI_Data.csv', valueDelimiterId: ',' };
        // const auditObjectContentResult = (await processRequest('auditObjectContent', testConnectionConfig!, auditObjectContentSettings)) as AuditContentResult;
        // const elapsedMs = performance.now() - startTime;
        // console.log('auditObjectContentResult', elapsedMs, auditObjectContentResult);

        // ─────────────────────────────────────────────────────────────────────────────────────────────────────────────
    } catch (error) {
        reportAppError(new AppError('Failed to retrieve data views.', 'dpuse-app.EstablishDataViews.retrieveDataViews', { typeId: 'handled' }, { cause: error }));
    } finally {
        // Pending...
    }
}
</script>

<template>
    <Grid
        v-if="dataViewRetrievalIsActive && dataViewConfigs && dataViewConfigs.length > 0"
        class="flex-1 pb-20"
        :data-source="dataSource"
        :row-height="150"
        :target-column-width="350"
    >
        <template #default="{ row }">
            <RouterLink
                v-if="row"
                :to="{ name: 'selectNode', params: { dataViewId: row.id }, query: { ...$route.query, wbView: 'selectNode' } }"
                @click="activeDataViewConfig = row"
            >
                <!-- <Card
                    v-if="row"
                    :badges="row.badges"
                    :icon="activeBenchtopOptionConfig ? activeBenchtopOptionConfig.icon : undefined"
                    :icon-color="activeBenchtopOptionConfig ? activeBenchtopOptionConfig.color : undefined"
                    :label="row.label"
                /> -->
                <Card :label="row.label as string" />
            </RouterLink>
        </template>
    </Grid>

    <ContentScroller v-else-if="dataViewRetrievalIsActive" class="pb-16">
        <EmptyPlaceholder :message-item-label="t(T, 'data_views')" :description-item-label="t(T, 'data_view')" :action-item-label="t(T, 'Data_View')" />
    </ContentScroller>
</template>
