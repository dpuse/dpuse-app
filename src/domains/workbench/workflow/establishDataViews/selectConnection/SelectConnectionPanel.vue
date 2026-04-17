<script setup lang="ts">
// External Dependencies
import { shallowRef, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

// DPUse Framework
import type { ConnectionLocalisedConfig } from '@dpuse/dpuse-shared/component/connector';

// App Framework
import { activeDataViewConfig } from '@/state/establishDataViews';
import { connectionConfigs } from '@/state/session';
import { localeId, localiseConfigs } from '@/translations';

// App Static Components
import Card from '@/components/ui/card/Card.vue';
import GridDetailPanel from '@/components/layout/gridDetailPanel/GridDetailPanel.vue';
import SelectConnectionForm from './SelectConnectionForm.vue';
import type { TaskLocalisedConfig } from '../EstablishDataViewsLayout.vue';
import Tile from '@/components/ui/tile/Tile.vue';

// Properties, Slots & Emits ───────────────────────────────────────────────────────────────────────────────────────────

const { taskLocalisedConfig } = defineProps<{ taskLocalisedConfig: TaskLocalisedConfig }>();

defineEmits<{ 'task-completed': [taskLocalisedConfig: TaskLocalisedConfig] }>();

// State ───────────────────────────────────────────────────────────────────────────────────────────────────────────────

const connectionLocalisedConfigs = shallowRef<ConnectionLocalisedConfig[]>([]);
const route = useRoute();
const router = useRouter();

// Side Effects ────────────────────────────────────────────────────────────────────────────────────────────────────────

watch(connectionConfigs, (newConnectionConfigs) => (connectionLocalisedConfigs.value = localiseConfigs<ConnectionLocalisedConfig>(newConnectionConfigs, localeId.value)), {
    immediate: true
});

// UI Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

function selectConnection(connectionLocalisedConfigs: ConnectionLocalisedConfig): void {
    if (activeDataViewConfig.value) {
        activeDataViewConfig.value.connectionId = connectionLocalisedConfigs.id;
        router.replace({ query: { ...route.query, conId: connectionLocalisedConfigs.id } });
    }
}

// EXPERIMENTAL ────────────────────────────────────────────────────────────────────────────────────────────────────────

// const connectorConfig = shallowRef();
// const connectionConfig = shallowRef();

// watch(
//     connectorConfigs,
//     (newConnectorConfigs) => {
//         if (newConnectorConfigs == null) return;
//         connectorConfig.value = newConnectorConfigs.find((config) => config.id === 'dpuse-connector-dropbox');
//         if (connectorConfig.value == null) return;
//         connectionConfig.value = constructConnectionConfig(connectorConfig.value);
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
    <GridDetailPanel :items="connectionLocalisedConfigs || []" max-detail-width="400px" @select-item="selectConnection($event)">
        <template #list-item-default="{ item }">
            <Card v-if="item" :label="item.label" />
        </template>

        <template #list-item-compact="{ item }">
            <Tile v-if="item" :label="item.label" />
        </template>

        <template #detail="{ item }">
            <SelectConnectionForm :connection-localised-config="item" @submit="$emit('task-completed', taskLocalisedConfig)" />
        </template>

        <template #no-selection>
            <div class="p-4">Select a connection...</div>
        </template>
    </GridDetailPanel>
</template>
