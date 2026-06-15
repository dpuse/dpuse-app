<script setup lang="ts">
// External Dependencies & Registrations
import { computed, defineAsyncComponent, ref, watch } from 'vue';

// DPUse Framework
import { AppError } from '@dpuse/dpuse-shared/errors';
import type { ConnectionConfig } from '@dpuse/dpuse-shared/component/connection';
import type { DimensionConfig } from '@dpuse/dpuse-shared/component/dimension';
import type { EngineCallbackData } from '@dpuse/dpuse-shared/engine';
import type { CreateObjectOptions, FindObjectOptions, FindObjectResult, RetrieveRecordsOptions } from '@dpuse/dpuse-shared/component/module/connector';

// Local (App) Framework
import type { DataSource } from '@/composables/useDataWindow';
import { reportAppError } from '@/observability/errorTracking';
import { t } from '@/state/locale';
import T from './ConnectorList.json';
import { useEngine } from '@/services/useEngine';
import { activeMetaStoreConnectionConfig, dimensionConfigs } from '@/state/session';

// Local Components - Static
import Card from '@/components/ui/Card.vue';
import Grid from '@/components/framework/Grid.vue';
import ScrollArea from '@/components/ui/ScrollArea.vue';

// Local Components - Dynamic
const EmptyPlaceholder = defineAsyncComponent(() => import('~/src/components/ui/placeholders/EmptyPlaceholder.vue'));

// State ───────────────────────────────────────────────────────────────────────────────────────────────────────────────

const dimensionRetrievalIsActive = ref(false);

// Derived State ───────────────────────────────────────────────────────────────────────────────────────────────────────

const dataSource = computed(
    (): DataSource<DimensionConfig> => ({
        rowCount: dimensionConfigs.value?.length ?? 0,
        getRows: (start: number, end: number): Promise<DimensionConfig[]> => Promise.resolve((dimensionConfigs.value ?? []).slice(start, end))
    })
);

// Side Effects ────────────────────────────────────────────────────────────────────────────────────────────────────────

watch(activeMetaStoreConnectionConfig, (newConnectionConfig) => retrieveDimensions(newConnectionConfig), { immediate: true });

// Helpers ─────────────────────────────────────────────────────────────────────────────────────────────────────────────

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
                dimensionConfigs.value = (data.properties.records as DimensionConfig[]).map((record) => {
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
    <Grid
        v-if="dimensionRetrievalIsActive && dimensionConfigs && dimensionConfigs.length > 0"
        class="flex-1 pb-6"
        :data-source="dataSource"
        :row-height="150"
        :target-column-width="350"
    >
        <template #default="{ item }">
            <Card v-if="item" :label="item.label as string" />
        </template>
    </Grid>

    <ScrollArea v-else-if="dimensionRetrievalIsActive">
        <EmptyPlaceholder :message-item-label="t(T, 'dimensions')" :description-item-label="t(T, 'dimension')" :action-item-label="t(T, 'Dimension')" />
    </ScrollArea>
</template>
