<script setup lang="ts">
// External Dependencies
import { onMounted, shallowRef } from 'vue';

// DPUse Framework
import type { ListNodesOptions } from '@dpuse/dpuse-shared/component/connector';

// Local Framework
import { activeConnectionConfig } from '@/state/establishDataViews';
import { useEngine } from '@/services/useEngine';

// Local Components - Static
import type { TaskLocalisedConfig } from '../EstablishDataViewsLayout.vue';

// Properties, Slots & Emits ───────────────────────────────────────────────────────────────────────────────────────────

const { taskLocalisedConfig } = defineProps<{ taskLocalisedConfig: TaskLocalisedConfig }>();

defineEmits<{ 'task-completed': [taskLocalisedConfig: TaskLocalisedConfig] }>();

const listNodesResult = shallowRef();

onMounted(async () => {
    const { processRequest } = await useEngine();
    console.log(activeConnectionConfig.value);
    listNodesResult.value = await processRequest('listNodes', activeConnectionConfig.value!, { folderPath: '/' } as ListNodesOptions); // TODO: use of !
});

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
    <div class="px-4 pt-1">
        <div>Select node...</div>

        <div>
            <div v-for="node in listNodesResult?.connectionNodeConfigs ?? []" :key="node.id">{{ node.label }}</div>
        </div>

        <RouterLink :to="{ name: 'auditContent', query: { ...$route.query, wbView: 'auditContent' } }" @click="$emit('task-completed', taskLocalisedConfig)">Next...</RouterLink>
    </div>
</template>
