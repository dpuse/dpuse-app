<script setup lang="ts">
// External dependencies
import { computed, defineAsyncComponent, ref, watch } from 'vue';

// DPU framework
import type { EngineCallbackData } from '@datapos/datapos-shared/engine';
import type {
    ConnectionConfig,
    CreateObjectOptions,
    FindObjectOptions,
    FindObjectResult,
    RetrieveRecordsOptions,
    RetrieveRecordsSummary
} from '@datapos/datapos-shared/component/connector';

// Workbench core
import { t } from '@/locales';
import T from '@/locales/views/workflow/establishDataViews/EstablishDataViews.json';
import { useEngineWorker } from '@/composables/useEngineWorker';
import { useSessionStore } from '@/stores/sessionStore';

// Workbench components
import BenchtopScroller from '@/components/benchtop/BenchtopScroller.vue';
import BenchtopShell from '@/components/benchtop/BenchtopShell.vue';
import Header from '@/components/header/Header.vue';

// Workbench components (lazy loaded)
const EmptyStatePlaceholder = defineAsyncComponent(() => import('@/components/emptyState/EmptyStatePlaceholder.vue'));

// Properties
type Properties = { isWideDisplay: boolean };
defineProps<Properties>();

// Global state ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const sessionState = useSessionStore();

// Local state ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const isRetrievingMessageVisible = ref(false);

// Local meta node computed properties ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const localMetaNodeConnectionConfig = computed(() => sessionState.localMetaNodeConnectionConfig);
watch(localMetaNodeConnectionConfig, (newConnectionConfig) => retrieveDataViews(newConnectionConfig), { immediate: true });

// Helpers ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function retrieveDataViews(connectionConfig?: ConnectionConfig): Promise<void> {
    try {
        if (!connectionConfig) return;

        // const testConnectionConfig = useSessionStore().connectionConfigs[1];

        const { processRequest } = await useEngineWorker();

        const findObjectOptions: FindObjectOptions = { containerId: 'datapos-system-node', nodeId: 'data-views' };
        const findObjectResult = (await processRequest('findObject', connectionConfig, findObjectOptions)) as FindObjectResult;
        console.log('findObjectResult', findObjectResult);
        if (findObjectResult.folderPath != null) {
            const createObjectOptions: CreateObjectOptions = { path: '/datapos-system-node/data-views', structure: 'id' };
            const xxxx = await processRequest('createObject', connectionConfig, createObjectOptions);
        }

        // const startTime = performance.now();
        // // const response = await fetch('https://sample-data-eu.datapos.app/fileStore/ENGAGEMENT_START_EVENTS_202405121858.csv');
        // const response = await fetch('https://sample-data-eu.datapos.app/WDI_Data.csv');

        // const auditObjectContentSettings: AuditContentSettings = { encodingId: 'utf-8', path: '/WDI_Data.csv', valueDelimiterId: ',' };
        // const auditObjectContentResult = (await processRequest('auditObjectContent', testConnectionConfig!, auditObjectContentSettings)) as AuditContentResult;
        // const elapsedMs = performance.now() - startTime;
        // console.log('auditObjectContentResult', elapsedMs, auditObjectContentResult);

        // retrievingTimer = setTimeout(() => (isRetrievingMessageVisible.value = true), 300);

        // const { processRequest } = await useEngineWorker();

        // const findSettings: FindSettings = { containerName: 'datapos-system-node', objectName: 'data-views' };
        // const findResult = (await processRequest('findObject', connectionConfig, findSettings)) as FindResult;
        // if (!findResult.folderPath) {
        //     const createSettings: CreateSettings = { path: '/datapos-system-node/data-views', structure: 'id' };
        //     await processRequest('createObject', connectionConfig, createSettings);
        // }

        // const retrieveOptions: RetrieveRecordsOptions = { encodingId: '', path: '/datapos-system-node/data-views', valueDelimiterId: '', chunkSize: undefined }; // TODO: Implement paging.
        // console.log(2222, connectionConfig, retrieveOptions);
        // const retrieveResult = (await processRequest('retrieveRecords', connectionConfig, retrieveOptions, (data: EngineCallbackData) => {
        //     console.log(9999, data);
        // })) as RetrieveRecordsSummary;
        // console.log(retrieveResult);
        // sessionState.dataViewConfigs = (retrieveResult.records as unknown as DataViewConfig[]).map((dataViewConfig) => {
        //     const localisedConfig = localiseModuleConfig(selectedLocale.value, dataViewConfig);
        //     return { ...dataViewConfig, label: localisedConfig.label, description: localisedConfig.description };
        // });

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

        // areDataViewsRetrieved.value = true;
    } catch (error) {
        console.log('Failed to complete retrieve data views operation.', 'datapos-app|establishDataViews|retrieveDataViews', { cause: error });
    } finally {
        isRetrievingMessageVisible.value = false;
    }
}
</script>

<template>
    <BenchtopShell>
        <Header :breadcrumbs="[{ id: 'benchtop', label: t(T, 'overline') }]" :title="t(T, 'title')" :is-wide-display="isWideDisplay" />

        <BenchtopScroller class="flex-1">
            <EmptyStatePlaceholder message-item-label="data views" description-item-label="data view" action-item-label="Data View" />
        </BenchtopScroller>
    </BenchtopShell>
</template>
