<script setup lang="ts">
// External Dependencies
import { shallowRef, watch } from 'vue';

// DPUse Framework
import type { ConnectionConfig, ConnectionLocalisedConfig, ConnectorConfig } from '@dpuse/dpuse-shared/component/connector';

// App Core
import { connectionConfigs, connectorConfigs } from '@/state/session';
import { localeId, localiseConfigs } from '@/translations';

// App Components - Statically imported so always available, even after app goes offline.
import Card from '@/components/card/Card.vue';
import ListDetailPanel from '@/components/listDetailPanel/ListDetailPanel.vue';
import SelectConnectionForm from './SelectConnectionForm.vue';
import type { TaskLocalisedConfig } from './EstablishDataViewsLayout.vue';

// Properties & Emits
const { taskLocalisedConfig } = defineProps<{ taskLocalisedConfig: TaskLocalisedConfig }>();
const emit = defineEmits<{ (event: 'complete', taskLocalisedConfig: TaskLocalisedConfig): void }>();

// State ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const localisedConnectionConfigs = shallowRef<ConnectionLocalisedConfig[]>([]);

// Side Effects ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

watch(connectionConfigs, (newConnectionConfigs) => (localisedConnectionConfigs.value = localiseConfigs<ConnectionLocalisedConfig>(newConnectionConfigs, localeId.value)), {
    immediate: true
});

// UI Helpers ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function triggerComplete(): void {
    emit('complete', taskLocalisedConfig);
}

// EXPERIMENTAL ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const connectorConfig = shallowRef();
const connectionConfig = shallowRef();

watch(
    connectorConfigs,
    (newConnectorConfigs) => {
        if (newConnectorConfigs == null) return;
        connectorConfig.value = newConnectorConfigs.find((config) => config.id === 'dpuse-connector-dropbox');
        if (connectorConfig.value == null) return;
        connectionConfig.value = constructConnectionConfig(connectorConfig.value);
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
    <ListDetailPanel class="flex-1" :items="localisedConnectionConfigs || []" max-right-width="400px">
        <template #list-item="{ item }">
            <Card v-if="item" :label="item.label" />
        </template>

        <template #detail="{ item }">
            <SelectConnectionForm :connection-localised-config="item" @complete="triggerComplete" />
        </template>
    </ListDetailPanel>
</template>
