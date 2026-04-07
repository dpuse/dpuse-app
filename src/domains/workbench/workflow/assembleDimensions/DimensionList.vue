<script setup lang="ts">
// External Dependencies
import { PlusIcon } from 'lucide-vue-next';
import { useRouter } from 'vue-router';
import { computed, defineAsyncComponent, ref, watch } from 'vue';

// DPUse Framework
import { AppError } from '@dpuse/dpuse-shared/errors';
import type { EngineCallbackData } from '@dpuse/dpuse-shared/engine';
import type { ConnectionConfig, CreateObjectOptions, FindObjectOptions, FindObjectResult, RetrieveRecordsOptions } from '@dpuse/dpuse-shared/component/connector';

// App Core
import { reportAppError } from '@/observability/errorTracking';
import { t } from '@/locales';
import T from '@/locales/domains/workbench/workflow/assembleDimensions/DimensionsList.json';
import { useEngine } from '@/services/useEngine';
import { dimensionConfigs, localMetaStoreConnectionConfig } from '@/state/session';

// App Components - Statically imported so always available, even after app goes offline.
import Button from '@/components/button/Button.vue';
import Card from '@/components/card/Card.vue';
import List from '@/components/list/List.vue';
import PanelScroller from '@/components/panelScroller/PanelScroller.vue';

// App Components - Lazy loaded as required.
const EmptyStatePlaceholder = defineAsyncComponent(() => import('@/components/emptyState/EmptyStatePlaceholder.vue'));

// State ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const dimensionRetrievalIsActive = ref(false);
const router = useRouter();

// Derived State ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const dataSource = computed(() => ({
    rowCount: dimensionConfigs.value?.length ?? 0,
    getRows: (start: number, end: number): Promise<unknown[]> => Promise.resolve((dimensionConfigs.value ?? []).slice(start, end))
}));

// Side Effects ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

watch(localMetaStoreConnectionConfig, (newConnectionConfig) => retrieveDimensions(newConnectionConfig), { immediate: true });

// Helpers ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function retrieveDimensions(connectionConfig?: ConnectionConfig): Promise<void> {
    try {
        if (!connectionConfig) return;

        const { processRequest } = await useEngine();
        const findObjectOptions: FindObjectOptions = { storeId: 'dpuMetaStore', nodeId: 'dimensions' };
        const findObjectResult = (await processRequest('findObject', connectionConfig, findObjectOptions)) as FindObjectResult;
        if (findObjectResult.path == null) {
            const createObjectOptions: CreateObjectOptions = { path: '/dpuMetaStore/dimensions', structure: 'id' };
            await processRequest('createObject', connectionConfig, createObjectOptions);
        }

        const retrieveRecordOptions: RetrieveRecordsOptions = { encodingId: '', path: '/dpuMetaStore/dimensions', valueDelimiterId: '', chunkSize: undefined }; // TODO: Implement paging.
        await processRequest('retrieveRecords', connectionConfig, retrieveRecordOptions, (data: EngineCallbackData) => {
            if (data.typeId === 'chunk') {
                dimensionConfigs.value = (data.properties.records as { id: string; label: string }[]).map((record) => {
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

        <Button @click="router.push({ name: '???', query: $route.query })">
            <PlusIcon stroke-width="1.25" />
        </Button>
    </div>

    <List
        v-if="dimensionRetrievalIsActive && dimensionConfigs && dimensionConfigs.length > 0"
        class="flex-1 pb-6"
        :data-source="dataSource"
        :row-height="150"
        :target-column-width="350"
    >
        <template #default="{ row }">
            <Card v-if="row" :label="row.label as string" />
        </template>
    </List>

    <PanelScroller v-else-if="dimensionRetrievalIsActive">
        <EmptyStatePlaceholder :message-item-label="t(T, 'dimensions')" :description-item-label="t(T, 'dimension')" :action-item-label="t(T, 'Dimension')" />
    </PanelScroller>
</template>
