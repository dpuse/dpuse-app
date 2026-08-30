<script setup lang="ts">
// ── External Dependencies & Registrations
import { PlusIcon } from '@lucide/vue';
import { computed, ref, shallowRef, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

// ── DPUse Framework
import { AppError } from '@dpuse/dpuse-shared/errors';
import type { ConnectionConfig } from '@dpuse/dpuse-shared/component/connection';
import type { EngineCallbackData } from '@dpuse/dpuse-shared/component/module/engine';
import type { EventQueryConfig } from '@dpuse/dpuse-shared/component/eventQuery';
import type { LocalisedConfig } from '@dpuse/dpuse-shared/locale';
import type { CreateObjectOptions, FindObjectOptions, FindObjectResult, RetrieveRecordsOptions } from '@dpuse/dpuse-shared/component/module/connector';

// ── Local Framework
import { defineAsyncPanel } from '@/utilities/index.ts';
import { t } from '@/state/locale';
import { type AppFailure, raiseFailure } from '@/state/errors';
import { useEngine } from '@/services/useEngine';
import { activeMetaStoreConnectionConfig, eventQueryConfigs } from '@/state/session';

// ── Static Components
import Button from '@/components/ui/button/Button.vue';
import ConfigCard from '@/components/ui/config/ConfigCard.vue';
import ErrorDisplay from '@/components/ui/error/ErrorDisplay.vue';
import type { DataSource } from '@/composables/useDataWindow';
import Grid from '@/components/ui/grid/Grid.vue';
import ScrollArea from '@/components/ui/scroll/ScrollArea.vue';

// ── Dynamic Components
const EmptyPlaceholder = defineAsyncPanel(() => import('@/components/ui/placeholder/EmptyPlaceholder.vue'), 'EmptyPlaceholder');

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

const T = {
    event_query: { en: 'event query', es: 'consulta de eventos' }
};

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

const eventQueryRetrievalIsActive = ref(false);
const retrieveFailure = shallowRef<AppFailure | undefined>();
const route = useRoute();
const router = useRouter();

// ── Derived State ────────────────────────────────────────────────────────────────────────────────────────────────────

const dataSource = computed((): DataSource<LocalisedConfig<EventQueryConfig>> => ({
    rowCount: eventQueryConfigs.value.length,
    getRows: (start: number, end: number): Promise<{ rows: LocalisedConfig<EventQueryConfig>[] }> =>
        Promise.resolve({ rows: (eventQueryConfigs.value as unknown as LocalisedConfig<EventQueryConfig>[]).slice(start, end) })
}));

// ── Side Effects ─────────────────────────────────────────────────────────────────────────────────────────────────────

watch(activeMetaStoreConnectionConfig, (newConnectionConfig) => retrieveEventQueries(newConnectionConfig), { immediate: true });

// ── Event Handlers ───────────────────────────────────────────────────────────────────────────────────────────────────

function handleRetryRetrieve(): void {
    void retrieveEventQueries(activeMetaStoreConnectionConfig.value);
}

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

async function retrieveEventQueries(connectionConfig?: ConnectionConfig): Promise<void> {
    retrieveFailure.value = undefined;
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
        retrieveFailure.value = raiseFailure(new AppError('Failed to retrieve event queries.', 'dpuse-app.EventQueryList.retrieveEventQueries', { typeId: 'handled' }, { cause: error }));
    } finally {
        // Pending...
    }
}
</script>

<template>
    <div class="mx-4 flex flex-none border-b border-separator py-1">
        <div class="flex-1"></div>

        <Button @click="router.push({ name: '???', query: route.query }).catch(() => undefined)">
            <PlusIcon stroke-width="1.25" />
        </Button>
    </div>

    <!-- Covers the region: nothing was retrieved, so an empty list with no explanation is what this replaces. -->
    <ErrorDisplay v-if="retrieveFailure" covers-region :failures="[retrieveFailure]" @retry="handleRetryRetrieve" />

    <Grid
        v-else-if="eventQueryRetrievalIsActive && eventQueryConfigs && eventQueryConfigs.length > 0"
        class="flex-1 pb-6"
        :data-source="dataSource"
        :row-height="150"
        :target-column-width="350"
    >
        <template #default="{ item }">
            <ConfigCard v-if="item" :config="item" />
        </template>
    </Grid>

    <ScrollArea v-else-if="eventQueryRetrievalIsActive">
        <EmptyPlaceholder :message-item-label="t(T, 'event_queries')" :description-item-label="t(T, 'event_query')" :action-item-label="t(T, 'Event_Query')" />
    </ScrollArea>
</template>
