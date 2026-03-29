<script setup lang="ts">
// External Dependencies
import { PlusIcon } from 'lucide-vue-next';
import { computed, defineAsyncComponent, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

// DPUse Framework
import { AppError } from '@dpuse/dpuse-shared/errors';
import type { EngineCallbackData } from '@dpuse/dpuse-shared/engine';
import type { ConnectionConfig, CreateObjectOptions, FindObjectOptions, FindObjectResult, RetrieveRecordsOptions } from '@dpuse/dpuse-shared/component/connector';

// App Core
import { reportAppError } from '@/observability/errorTracking';
import { t } from '@/locales';
import T from '@/locales/views/workbench/workflow/assembleDimensions/AssembleDimensions.json';
import { useEngineWorker } from '@/composables/useEngineWorker';
import { useSessionStore } from '@/stores/sessionStore';

// App Components & Views - Statically imported so always available, even after app goes offline.
import Button from '@/components/button/Button.vue';
import Card from '@/components/card/Card.vue';
import GridScroller from '@/components/gridScroller/GridScroller.vue';
import ViewScroller from '@/components/view/ViewScroller.vue';

// App Components & Views - Lazy loaded as required.
const EmptyStatePlaceholder = defineAsyncComponent(() => import('@/components/emptyState/EmptyStatePlaceholder.vue'));

// Global State ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const route = useRoute();
const router = useRouter();
const sessionState = useSessionStore();

// Local States ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const dimensionRetrievalIsActive = ref(false);

// Local meta store connection configuration state ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const localMetaStoreConnectionConfig = computed(() => sessionState.localMetaStoreConnectionConfig);
watch(localMetaStoreConnectionConfig, (newConnectionConfig) => retrieveDimensions(newConnectionConfig), { immediate: true });

// Local dimensions configurations state ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const dimensionConfigs = computed(() => sessionState.dimensionConfigs);

// Helpers ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function retrieveDimensions(connectionConfig?: ConnectionConfig): Promise<void> {
    try {
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
                sessionState.dimensionConfigs = (data.properties.records as { id: string; label: string }[]).map((record) => {
                    const localisedConfig = record;
                    return localisedConfig;
                });
            } else {
                dimensionRetrievalIsActive.value = true;
            }
        });
    } catch (error) {
        reportAppError(new AppError('Failed to retrieve dimensions.', 'dpuse-app.AssembleDimensions.retrieveDimensions', { typeId: 'handled' }, { cause: error }));
    } finally {
        // Pending...
    }
}
</script>

<template>
    <div class="border-separator mx-4 flex flex-none border-b py-1">
        <div class="flex-1"></div>

        <Button @click="router.push({ name: '???', query: route.query })">
            <PlusIcon stroke-width="1.25" />
        </Button>
    </div>

    <GridScroller
        v-if="dimensionRetrievalIsActive && dimensionConfigs && dimensionConfigs.length > 0"
        class="flex-1 pb-6"
        :items="dimensionConfigs"
        :row-height="150"
        :target-column-width="350"
    >
        <template #default="{ item }">
            <Card v-if="item" :label="item.label" />
        </template>
    </GridScroller>

    <ViewScroller v-else-if="dimensionRetrievalIsActive">
        <EmptyStatePlaceholder :message-item-label="t(T, 'dimensions')" :description-item-label="t(T, 'dimension')" :action-item-label="t(T, 'Dimension')" />
    </ViewScroller>
</template>
