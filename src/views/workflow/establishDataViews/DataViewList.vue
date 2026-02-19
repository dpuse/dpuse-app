<script setup lang="ts">
// External dependencies
import { PlusIcon } from 'lucide-vue-next';
import { useRouter } from 'vue-router';
import { computed, defineAsyncComponent, ref, watch } from 'vue';

// DPU framework
import { AppError } from '@datapos/datapos-shared/errors';
import type { EngineCallbackData } from '@datapos/datapos-shared/engine';
import type {
    ConnectionConfig,
    CreateObjectOptions,
    FindObjectOptions,
    FindObjectResult,
    RetrieveRecordsOptions,
    UpsertRecordsOptions
} from '@datapos/datapos-shared/component/connector';

// App core
import { logErrorToConsole } from '@/composables/useMonitor';
import { useEngineWorker } from '@/composables/useEngineWorker';
import { useSessionStore } from '@/stores/sessionStore';

// App components
import BenchtopScroller from '@/components/benchtop/BenchtopScroller.vue';
import Card from '@/components/card/Card.vue';
import GridScroller from '@/components/gridScroller/GridScroller.vue';
import IconActionContent from '@/components/action/IconActionContent.vue';

// App components (lazy loaded)
const EmptyStatePlaceholder = defineAsyncComponent(() => import('@/components/emptyState/EmptyStatePlaceholder.vue'));

// Global state ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const router = useRouter();
const sessionState = useSessionStore();

// Local state ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const dataViewRetrievalIsActive = ref(false);

// Local meta store connection configuration state ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const localMetaStoreConnectionConfig = computed(() => sessionState.localMetaStoreConnectionConfig);
watch(localMetaStoreConnectionConfig, (newConnectionConfig) => retrieveDataViews(newConnectionConfig), { immediate: true });

// Local data view configurations state ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const dataViewConfigs = computed(() => sessionState.dataViewConfigs);

// Helpers ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function retrieveDataViews(connectionConfig?: ConnectionConfig): Promise<void> {
    try {
        if (!connectionConfig) return;

        const { processRequest } = await useEngineWorker();
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
        // // const response = await fetch('https://sample-data-eu.datapos.app/fileStore/ENGAGEMENT_START_EVENTS_202405121858.csv');
        // const response = await fetch('https://sample-data-eu.datapos.app/WDI_Data.csv');

        // const auditObjectContentSettings: AuditContentSettings = { encodingId: 'utf-8', path: '/WDI_Data.csv', valueDelimiterId: ',' };
        // const auditObjectContentResult = (await processRequest('auditObjectContent', testConnectionConfig!, auditObjectContentSettings)) as AuditContentResult;
        // const elapsedMs = performance.now() - startTime;
        // console.log('auditObjectContentResult', elapsedMs, auditObjectContentResult);

        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    } catch (error) {
        logErrorToConsole(new AppError('Failed to retrieve data views.', 'dpu-appRoutes.EstablishDataViews.retrieveDataViews', { cause: error }));
    } finally {
        // Pending...
    }
}
</script>

<template>
    <div class="border-separator mx-4 flex flex-none border-b py-1">
        <div class="flex-1"></div>
        <button class="group outline-none" @click="router.push({ name: 'connectionSelector', query: router.currentRoute.value.query })">
            <IconActionContent size="sm">
                <PlusIcon stroke-width="1.25" />
            </IconActionContent>
        </button>
    </div>

    <GridScroller
        v-if="dataViewRetrievalIsActive && dataViewConfigs && dataViewConfigs.length > 0"
        class="flex-1 pb-6"
        :items="dataViewConfigs"
        :row-height="150"
        :target-column-width="350"
    >
        <template #default="{ item }">
            <!-- <Card
                    v-if="item"
                    :badges="item.badges"
                    :icon="activeBenchtopOptionConfig ? activeBenchtopOptionConfig.icon : undefined"
                    :icon-color="activeBenchtopOptionConfig ? activeBenchtopOptionConfig.color : undefined"
                    :label="item.label"
                /> -->
            <Card v-if="item" :label="item.label" />
        </template>
    </GridScroller>

    <BenchtopScroller v-else-if="dataViewRetrievalIsActive" class="flex-1">
        <EmptyStatePlaceholder message-item-label="data views" description-item-label="data view" action-item-label="Data View" />
    </BenchtopScroller>
</template>
