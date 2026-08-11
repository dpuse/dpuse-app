<script setup lang="ts">
// ── External Dependencies & Registrations
import { PlusIcon } from '@lucide/vue';
import { computed, defineAsyncComponent, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

// ── DPUse Framework
import { AppError } from '@dpuse/dpuse-shared/errors';
import type { ConnectionConfig } from '@dpuse/dpuse-shared/component/connection';
import type { EngineCallbackData } from '@dpuse/dpuse-shared/component/module/engine';
import type { EventQueryConfig } from '@dpuse/dpuse-shared/component/eventQuery';
import type { LocalisedConfig } from '@dpuse/dpuse-shared/locale';
import type { CreateObjectOptions, FindObjectOptions, FindObjectResult, RetrieveRecordsOptions } from '@dpuse/dpuse-shared/component/module/connector';

// ── Local Framework
import { reportAppError } from '@/observability/errorTracking';
import { t } from '@/state/locale';
import T from './EventQueryList.json';
import { useEngine } from '@/services/useEngine';
import { activeMetaStoreConnectionConfig, eventQueryConfigs } from '@/state/session';

// ── Local Components - Static
import Button from '@/components/ui/button/Button.vue';
import ConfigCard from '@/components/framework/ConfigCard.vue';
import type { DataSource } from '@/composables/useDataWindow';
import Grid from '@/components/framework/Grid.vue';
import ScrollArea from '@/components/ui/ScrollArea2.vue';

// ── Local Components - Dynamic
const EmptyPlaceholder = defineAsyncComponent(() => import('@/components/ui/placeholders/EmptyPlaceholder.vue'));

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

const eventQueryRetrievalIsActive = ref(false);
const route = useRoute();
const router = useRouter();

// ── Derived State ────────────────────────────────────────────────────────────────────────────────────────────────────

const dataSource = computed((): DataSource<LocalisedConfig<EventQueryConfig>> => ({
    rowCount: eventQueryConfigs.value?.length ?? 0,
    getRows: (start: number, end: number): Promise<{ rows: LocalisedConfig<EventQueryConfig>[] }> =>
        Promise.resolve({ rows: ((eventQueryConfigs.value as unknown as LocalisedConfig<EventQueryConfig>[]) ?? []).slice(start, end) })
}));

// ── Side Effects ─────────────────────────────────────────────────────────────────────────────────────────────────────

watch(activeMetaStoreConnectionConfig, (newConnectionConfig) => retrieveEventQueries(newConnectionConfig), { immediate: true });

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

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
    <div class="mx-4 flex flex-none border-b border-separator py-1">
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
        <template #default="{ item }">
            <ConfigCard v-if="item" :config="item" />
        </template>
    </Grid>

    <ScrollArea v-else-if="eventQueryRetrievalIsActive">
        <EmptyPlaceholder :message-item-label="t(T, 'event_queries')" :description-item-label="t(T, 'event_query')" :action-item-label="t(T, 'Event_Query')" />
    </ScrollArea>
</template>
