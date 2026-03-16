<script setup lang="ts">
// External Dependencies
import { PlusIcon } from 'lucide-vue-next';
import { useRouter } from 'vue-router';
import { computed, defineAsyncComponent, ref, watch } from 'vue';

// DPUse Framework
import { AppError } from '@datapos/datapos-shared/errors';
import type { EngineCallbackData } from '@datapos/datapos-shared/engine';
import type { ConnectionConfig, CreateObjectOptions, FindObjectOptions, FindObjectResult, RetrieveRecordsOptions } from '@datapos/datapos-shared/component/connector';

// App Core
import { reportAppError } from '@/observability/errorTracking';
import { t } from '@/locales';
import T from '@/locales/views/workflow/contextualiseData/ContextualiseData.json';
import { useEngineWorker } from '@/composables/useEngineWorker';
import { useSessionStore } from '@/stores/sessionStore';

// App Components - Statically imported so always available, even after app goes offline.
import Button from '@/components/button/Button.vue';
import BenchtopScroller from '@/components/benchtop/BenchtopScroller.vue';
import Card from '@/components/card/Card.vue';
import GridScroller from '@/components/gridScroller/GridScroller.vue';

// App Components - Lazy loaded as required.
const EmptyStatePlaceholder = defineAsyncComponent(() => import('@/components/emptyState/EmptyStatePlaceholder.vue'));

// External State ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const router = useRouter();
const sessionState = useSessionStore();

// Local States ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const eventQueryRetrievalIsActive = ref(false);

// Local meta store connection configuration state ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const localMetaStoreConnectionConfig = computed(() => sessionState.localMetaStoreConnectionConfig);
watch(localMetaStoreConnectionConfig, (newConnectionConfig) => retrieveEventQueries(newConnectionConfig), { immediate: true });

// Local event query configurations state ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const eventQueryConfigs = computed(() => sessionState.eventQueryConfigs);

// Helpers ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function retrieveEventQueries(connectionConfig?: ConnectionConfig): Promise<void> {
    try {
        if (!connectionConfig) return;

        const { processRequest } = await useEngineWorker();
        const findObjectOptions: FindObjectOptions = { storeId: 'dpuMetaStore', nodeId: 'eventQueries' };
        const findObjectResult = (await processRequest('findObject', connectionConfig, findObjectOptions)) as FindObjectResult;
        if (findObjectResult.path == null) {
            const createObjectOptions: CreateObjectOptions = { path: '/dpuMetaStore/eventQueries', structure: 'id' };
            await processRequest('createObject', connectionConfig, createObjectOptions);
        }

        const retrieveRecordOptions: RetrieveRecordsOptions = { encodingId: '', path: '/dpuMetaStore/eventQueries', valueDelimiterId: '', chunkSize: undefined }; // TODO: Implement paging.
        await processRequest('retrieveRecords', connectionConfig, retrieveRecordOptions, (data: EngineCallbackData) => {
            if (data.typeId === 'chunk') {
                sessionState.eventQueryConfigs = (data.properties.records as { id: string; label: string }[]).map((record) => {
                    const localisedConfig = record;
                    return localisedConfig;
                });
            } else {
                eventQueryRetrievalIsActive.value = true;
            }
        });
    } catch (error) {
        reportAppError(new AppError('Failed to retrieve event queries.', 'dpuse-app.EventQueryList.retrieveEventQueries', { typeId: 'handled' }, { cause: error }));
    } finally {
        // Pending...
    }
}
</script>

<template>
    <div class="border-separator mx-4 flex flex-none border-b py-1">
        <div class="flex-1"></div>

        <Button @click="router.push({ name: 'connectionSelector', query: router.currentRoute.value.query })">
            <PlusIcon stroke-width="1.25" />
        </Button>
    </div>

    <GridScroller
        v-if="eventQueryRetrievalIsActive && eventQueryConfigs && eventQueryConfigs.length > 0"
        class="flex-1 pb-6"
        :items="eventQueryConfigs"
        :row-height="150"
        :target-column-width="350"
    >
        <template #default="{ item }">
            <Card v-if="item" :label="item.label" />
        </template>
    </GridScroller>

    <BenchtopScroller v-else-if="eventQueryRetrievalIsActive">
        <EmptyStatePlaceholder :message-item-label="t(T, 'event_queries')" :description-item-label="t(T, 'event_query')" :action-item-label="t(T, 'Event_Query')" />
    </BenchtopScroller>
</template>
