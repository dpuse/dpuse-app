<script setup lang="ts">
// External Dependencies
import { PlusIcon } from 'lucide-vue-next';
import { computed, defineAsyncComponent, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

// DPUse Framework
import { AppError } from '@dpuse/dpuse-shared/errors';
import type { EngineCallbackData } from '@dpuse/dpuse-shared/engine';
import type { EventQueryConfig } from '@dpuse/dpuse-shared';
import type { ConnectionConfig, CreateObjectOptions, FindObjectOptions, FindObjectResult, RetrieveRecordsOptions } from '@dpuse/dpuse-shared/component/connector';

// App Core
import { reportAppError } from '@/observability/errorTracking';
import { t } from '@/translations';
import T from '@/translations/domains/workbench/workflow/contextualiseData/EventQueryList.json';
import { useEngine } from '@/services/useEngine';
import { eventQueryConfigs, localMetaStoreConnectionConfig } from '@/state/session';

// App Components - Statically imported.
import Button from '@/components/ui/button/Button.vue';
import Card from '@/components/ui/card/Card.vue';
import ContentScroller from '@/components/layout/contentScroller/ContentScroller.vue';
import type { DataSource } from '@/composables/useDataWindow';
import Grid from '@/components/ui/grid/Grid.vue';

// App Components - Dynamically imported.
const EmptyPlaceholder = defineAsyncComponent(() => import('@/components/ui/emptyPlaceholder/EmptyPlaceholder.vue'));

// State ───────────────────────────────────────────────────────────────────────────────────────────────────────────────

const eventQueryRetrievalIsActive = ref(false);
const route = useRoute();
const router = useRouter();

// Derived State ───────────────────────────────────────────────────────────────────────────────────────────────────────

const dataSource = computed(
    (): DataSource<EventQueryConfig> => ({
        rowCount: eventQueryConfigs.value?.length ?? 0,
        getRows: (start: number, end: number): Promise<EventQueryConfig[]> => Promise.resolve((eventQueryConfigs.value ?? []).slice(start, end))
    })
);

// Side Effects ────────────────────────────────────────────────────────────────────────────────────────────────────────

watch(localMetaStoreConnectionConfig, (newConnectionConfig) => retrieveEventQueries(newConnectionConfig), { immediate: true });

// Helpers ─────────────────────────────────────────────────────────────────────────────────────────────────────────────

async function retrieveEventQueries(connectionConfig?: ConnectionConfig): Promise<void> {
    try {
        if (!connectionConfig) return;

        const { processRequest } = await useEngine();
        const findObjectOptions: FindObjectOptions = { storeId: 'dpuMetaStore', nodeId: 'eventQueries' };
        const findObjectResult = (await processRequest('findObject', connectionConfig, findObjectOptions)) as FindObjectResult;
        if (findObjectResult.path == null) {
            const createObjectOptions: CreateObjectOptions = { path: '/dpuMetaStore/eventQueries', structure: 'id' };
            await processRequest('createObject', connectionConfig, createObjectOptions);
        }

        const retrieveRecordOptions: RetrieveRecordsOptions = { encodingId: '', path: '/dpuMetaStore/eventQueries', valueDelimiterId: '', chunkSize: undefined }; // TODO: Implement paging.
        await processRequest('retrieveRecords', connectionConfig, retrieveRecordOptions, (data: EngineCallbackData) => {
            if (data.typeId === 'chunk') {
                eventQueryConfigs.value = (data.properties.records as EventQueryConfig[]).map((record) => {
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

        <Button @click="router.push({ name: '???', query: route.query })">
            <PlusIcon stroke-width="1.25" />
        </Button>
    </div>

    <Grid
        v-if="eventQueryRetrievalIsActive && eventQueryConfigs && eventQueryConfigs.length > 0"
        class="flex-1 pb-6"
        :data-source="dataSource"
        :row-height="150"
        :target-column-width="350"
    >
        <template #default="{ row }">
            <Card v-if="row" :label="row.label as string" />
        </template>
    </Grid>

    <ContentScroller v-else-if="eventQueryRetrievalIsActive" class="pb-16">
        <EmptyPlaceholder :message-item-label="t(T, 'event_queries')" :description-item-label="t(T, 'event_query')" :action-item-label="t(T, 'Event_Query')" />
    </ContentScroller>
</template>
