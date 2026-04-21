<script setup lang="ts">
// External Dependencies
import { computed, onMounted, shallowRef } from 'vue';

// DPUse Framework
import type { ListNodesOptions } from '@dpuse/dpuse-shared/component/module/connector';

// Local Framework
import { activeConnectionConfig } from '@/state/establishDataViews';
import type { DataSource } from '@/composables/useDataWindow';
import { useEngine } from '@/services/useEngine';

// Local Components - Static
import Card from '@/components/ui/card/Card.vue';
import GridDetailPanel from '@/components/layout/gridDetailPanel/GridDetailPanel.vue';
import type { TaskLocalisedConfig } from '../EstablishDataViewsLayout.vue';
import Tile from '@/components/ui/tile/Tile.vue';

// Properties, Slots & Emits ───────────────────────────────────────────────────────────────────────────────────────────

const { taskLocalisedConfig } = defineProps<{ taskLocalisedConfig: TaskLocalisedConfig }>();

defineEmits<{ 'task-completed': [taskLocalisedConfig: TaskLocalisedConfig] }>();

const listNodesResult = shallowRef();

onMounted(async () => {
    const { processRequest } = await useEngine();
    console.log(activeConnectionConfig.value);
    listNodesResult.value = await processRequest('listNodes', activeConnectionConfig.value!, { folderPath: '/' } as ListNodesOptions); // TODO: use of !.
    console.log(1111, listNodesResult.value.connectionNodeConfigs);
    console.log(2222, listNodesResult.value.connectionNodeConfigs.length);
});

const dataSource = computed(
    (): DataSource<string> => ({
        rowCount: listNodesResult.value.connectionNodeConfigs?.length ?? 0,
        getRows: (start: number, end: number): Promise<string[]> => Promise.resolve((listNodesResult.value.connectionNodeConfigs ?? []).slice(start, end))
    })
);

// // EXPERIMENTAL ────────────────────────────────────────────────────────────────────────────────────────────────────────
// const connectorConfig = shallowRef();
// const connectionConfig = shallowRef();

// watch(
//     connectorConfigs,
//     async (newConnectorConfigs) => {
//         if (newConnectorConfigs == null) return;
//         connectorConfig.value = newConnectorConfigs.find((config) => config.id === 'dpuse-connector-file-store-emulator');
//         if (connectorConfig.value == null) return;
//         connectionConfig.value = constructConnectionConfig(connectorConfig.value);
//         const { processRequest } = await useEngine();
//         listNodesResult.value = await processRequest('listNodes', connectionConfig.value, { folderPath: '/' } as ListNodesOptions);
//     },
//     { immediate: true }
// );

// function constructConnectionConfig(connectorConfig: ConnectorConfig): ConnectionConfig {
//     return {
//         id: connectorConfig.id,
//         label: connectorConfig.label,
//         description: {},
//         authorisation: {},
//         connectorConfig,
//         icon: connectorConfig.icon,
//         iconDark: null,
//         lastVerifiedAt: 0,
//         lastUpdatedAt: null,
//         notation: undefined,
//         status: null,
//         statusId: connectorConfig.statusId,
//         typeId: 'connectorConnection'
//     };
// }
</script>

<template>
    <!-- <Grid class="flex-1 pb-20" :data-source="dataSource" :row-height="150" :target-column-width="350">
        <template #default="{ row }">
            {{ row.name }}
        </template>
    </Grid> -->
    <GridDetailPanel :items="listNodesResult.connectionNodeConfigs || []" max-detail-width="400px" @select-item="console.log($event)">
        <template #list-item-default="{ item }">
            <Card v-if="item" :label="item.label" />
        </template>

        <template #list-item-compact="{ item }">
            <Tile v-if="item" :label="item.label" />
        </template>

        <template #detail="{ item }">{{ item }}</template>

        <template #no-selection>
            <div class="p-4">Select a node...</div>
        </template>
    </GridDetailPanel>
    <!-- <RouterLink :to="{ name: 'auditContent', query: { ...$route.query, wbView: 'auditContent' } }" @click="$emit('task-completed', taskLocalisedConfig)">Next...</RouterLink> -->
</template>
