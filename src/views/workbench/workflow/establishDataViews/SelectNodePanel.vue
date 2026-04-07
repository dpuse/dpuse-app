<script setup lang="ts">
// External Dependencies
import { shallowRef, watch } from 'vue';

// DPUse Framework
import type { ConnectionConfig, ConnectorConfig, ListNodesOptions } from '@dpuse/dpuse-shared/component/connector';

// App Core
import { useEngine } from '@/services/useEngine';
import { useSession } from '@/state/useSession';

// App Components - Statically imported so always available, even after app goes offline.
import type { TaskLocalisedConfig } from './EstablishDataViewsLayout.vue';

// Properties & Emits
const { taskLocalisedConfig } = defineProps<{ taskLocalisedConfig: TaskLocalisedConfig }>();
const emit = defineEmits<{ (event: 'complete', taskLocalisedConfig: TaskLocalisedConfig): void }>();

// Global State ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const { connectorConfigs } = useSession();

// UI Helpers ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function triggerComplete(): void {
    emit('complete', taskLocalisedConfig);
}

// EXPERIMENTAL ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const connectorConfig = shallowRef();
const connectionConfig = shallowRef();
const listNodesResult = shallowRef();

watch(
    connectorConfigs,
    async (newConnectorConfigs) => {
        if (newConnectorConfigs == null) return;
        connectorConfig.value = newConnectorConfigs.find((config) => config.id === 'dpuse-connector-file-store-emulator');
        if (connectorConfig.value == null) return;
        connectionConfig.value = constructConnectionConfig(connectorConfig.value);
        const { processRequest } = await useEngine();
        listNodesResult.value = await processRequest('listNodes', connectionConfig.value, { folderPath: '/' } as ListNodesOptions);
    },
    { immediate: true }
);

function constructConnectionConfig(connectorConfig: ConnectorConfig): ConnectionConfig {
    return {
        id: connectorConfig.id,
        label: connectorConfig.label,
        description: {},
        authorisation: {},
        connectorConfig,
        icon: connectorConfig.icon,
        iconDark: null,
        lastVerifiedAt: 0,
        lastUpdatedAt: null,
        notation: undefined,
        status: null,
        statusId: connectorConfig.statusId,
        typeId: 'connectorConnection'
    };
}
</script>

<template>
    <div class="px-4 pt-1">
        <div>Select node...</div>

        <div>
            <div v-for="node in listNodesResult?.connectionNodeConfigs ?? []" :key="node.id">{{ node.label }}</div>
        </div>

        <RouterLink :to="{ name: 'auditContent', query: { ...$route.query, wbView: 'auditContent' } }" @click="triggerComplete">Next...</RouterLink>
    </div>
</template>
