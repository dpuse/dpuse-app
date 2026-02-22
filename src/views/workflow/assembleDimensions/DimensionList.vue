<script setup lang="ts">
// External dependencies
import { PlusIcon } from 'lucide-vue-next';
import { useRouter } from 'vue-router';
import { computed, defineAsyncComponent, ref, watch } from 'vue';

// DPU framework
import { AppError } from '@datapos/datapos-shared/errors';
import type { EngineCallbackData } from '@datapos/datapos-shared/engine';
import type { ConnectionConfig, CreateObjectOptions, FindObjectOptions, FindObjectResult, RetrieveRecordsOptions } from '@datapos/datapos-shared/component/connector';

// App core
import { logErrorToConsole } from '@/composables/useMonitor';
import { t } from '@/locales';
import T from '@/locales/views/workflow/assembleDimensions/AssembleDimensions.json';
import { useEngineWorker } from '@/composables/useEngineWorker';
import { useSessionStore } from '@/stores/sessionStore';

// App components
import ActionButton from '@/components/action/ActionButton.vue';
import BenchtopScroller from '@/components/benchtop/BenchtopScroller.vue';
import Card from '@/components/card/Card.vue';
import GridScroller from '@/components/gridScroller/GridScroller.vue';

// App components (lazy loaded)
const EmptyStatePlaceholder = defineAsyncComponent(() => import('@/components/emptyState/EmptyStatePlaceholder.vue'));

// Global state ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const router = useRouter();
const sessionState = useSessionStore();

// Local state ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const dimensionRetrievalIsActive = ref(false);

// Local meta store connection configuration state ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const localMetaStoreConnectionConfig = computed(() => sessionState.localMetaStoreConnectionConfig);
watch(localMetaStoreConnectionConfig, (newConnectionConfig) => retrieveDimensions(newConnectionConfig), { immediate: true });

// Local dimensions configurations state ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const dataViewConfigs = computed(() => sessionState.dataViewConfigs);

// Helpers ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function retrieveDimensions(connectionConfig?: ConnectionConfig): Promise<void> {
    try {
        console.log(1111, connectionConfig);
        if (!connectionConfig) return;

        const { processRequest } = await useEngineWorker();
        const findObjectOptions: FindObjectOptions = { storeId: 'dpuMetaStore', nodeId: 'dimensions' };
        const findObjectResult = (await processRequest('findObject', connectionConfig, findObjectOptions)) as FindObjectResult;
        if (findObjectResult.path == null) {
            const createObjectOptions: CreateObjectOptions = { path: '/dpuMetaStore/dimensions', structure: 'id' };
            await processRequest('createObject', connectionConfig, createObjectOptions);
        }

        const retrieveRecordOptions: RetrieveRecordsOptions = { encodingId: '', path: '/dpuMetaStore/dimensions', valueDelimiterId: '', chunkSize: undefined }; // TODO: Implement paging.
        await processRequest('retrieveRecords', connectionConfig, retrieveRecordOptions, (data: EngineCallbackData) => {
            if (data.typeId === 'chunk') {
                sessionState.dataViewConfigs = (data.properties.records as { id: string; label: string }[]).map((record) => {
                    const localisedConfig = record;
                    return localisedConfig;
                });
            } else {
                dimensionRetrievalIsActive.value = true;
            }
        });
    } catch (error) {
        logErrorToConsole(new AppError('Failed to retrieve dimensions.', 'dpu-app.AssembleDimensions.retrieveDimensions', { cause: error }));
    } finally {
        // Pending...
    }
}
</script>

<template>
    <div class="border-separator mx-4 flex flex-none border-b py-1">
        <div class="flex-1"></div>

        <ActionButton @click="router.push({ name: 'connectionSelector', query: router.currentRoute.value.query })">
            <PlusIcon stroke-width="1.25" />
        </ActionButton>
    </div>

    <GridScroller
        v-if="dimensionRetrievalIsActive && dataViewConfigs && dataViewConfigs.length > 0"
        class="flex-1 pb-6"
        :items="dataViewConfigs"
        :row-height="150"
        :target-column-width="350"
    >
        <template #default="{ item }">
            <Card v-if="item" :label="item.label" />
        </template>
    </GridScroller>

    <BenchtopScroller v-else-if="dimensionRetrievalIsActive" class="flex-1">
        <EmptyStatePlaceholder :message-item-label="t(T, 'dimensions')" :description-item-label="t(T, 'dimension')" :action-item-label="t(T, 'Dimension')" />
    </BenchtopScroller>
</template>
