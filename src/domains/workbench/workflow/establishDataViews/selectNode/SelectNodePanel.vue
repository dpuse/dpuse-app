<script setup lang="ts">
// External Dependencies
import { computed, onMounted, shallowRef } from 'vue';

// DPUse Framework
import type { ConnectionNodeConfig } from '@dpuse/dpuse-shared/component/connection';
import type { ListNodesOptions, ListNodesResult } from '@dpuse/dpuse-shared/component/module/connector';

// Local Framework
import type { DataSource } from '@/composables/useDataWindow';
import { useEngine } from '@/services/useEngine';
import { activeConnectionConfig, activeConnectionNodeConfig } from '@/state/establishDataViews';

// Local Components - Static
import GridDetailPanel from '@/components/layout/gridDetailPanel/GridDetailPanel.vue';
import type { TaskLocalisedConfig } from '../EstablishDataViewsLayout.vue';
import Tile from '@/components/ui/tile/Tile.vue';

// Properties, Slots & Emits ───────────────────────────────────────────────────────────────────────────────────────────

const { taskLocalisedConfig } = defineProps<{ taskLocalisedConfig: TaskLocalisedConfig }>();

defineEmits<{ 'task-completed': [taskLocalisedConfig: TaskLocalisedConfig] }>();

// State

const listNodesResult = shallowRef<ListNodesResult | undefined>();

// Derived State ───────────────────────────────────────────────────────────────────────────────────────────────────────

const connectionNodeConfigs = computed<ConnectionNodeConfig[]>(() => listNodesResult.value?.connectionNodeConfigs ?? []);

const dataSource = computed(
    (): DataSource<ConnectionNodeConfig> => ({
        rowCount: connectionNodeConfigs.value.length,
        getRows: (start: number, end: number): Promise<ConnectionNodeConfig[]> => Promise.resolve(connectionNodeConfigs.value.slice(start, end))
    })
);

// Side Effects ────────────────────────────────────────────────────────────────────────────────────────────────────────

onMounted(async () => {
    if (activeConnectionConfig.value == null) throw new Error('Must be a reload, we need to establish the active connection config using th e url param.');
    const { processRequest } = await useEngine();
    listNodesResult.value = (await processRequest('listNodes', activeConnectionConfig.value, { folderPath: '/' } as ListNodesOptions)) as ListNodesResult; // TODO: use of !.
});

// UI Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

function selectConnectionNode(connectionNodeConfig: ConnectionNodeConfig): void {
    activeConnectionNodeConfig.value = connectionNodeConfig;
}

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
    <GridDetailPanel :data-source="dataSource" max-list-width="400px" @select-item="selectConnectionNode($event)">
        <template #list-item-compact="{ item }">
            <Tile v-if="item" :label="item.label" />
        </template>

        <template #detail="{ item }">{{ item }}</template>

        <template #no-selection>
            <div class="p-4">Select a node...</div>
        </template>
    </GridDetailPanel>
</template>
