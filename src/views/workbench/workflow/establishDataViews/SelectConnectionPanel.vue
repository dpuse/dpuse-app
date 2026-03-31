<script setup lang="ts">
// External Dependencies
import { computed, shallowRef, watch } from 'vue';

// DPUse Framework
import type { EngineAuthActionOptions } from '@dpuse/dpuse-shared/engine';
import type { ConnectionConfig, ConnectionLocalisedConfig, ConnectorConfig } from '@dpuse/dpuse-shared/component/connector';

// App Core
import T from '@/locales/components/session/LoginForm.json';
import { useEngine } from '~/src/composables/useEngine';
import { useSessionStore } from '@/stores/sessionStore';
import { localeId, localiseConfigs, t } from '@/locales';

// App Components & Views - Statically imported so always available, even after app goes offline.
import Button from '@/components/button/Button.vue';
import Card from '@/components/card/Card.vue';
import Input from '@/components/input/Input.vue';
import ListDetailPanel from '@/components/listDetailPanel/ListDetailPanel.vue';
import type { TaskLocalisedConfig } from './EstablishDataViews.vue';

// Properties & Emits
const { taskLocalisedConfig } = defineProps<{ taskLocalisedConfig: TaskLocalisedConfig }>();
const emit = defineEmits<{ (event: 'complete', taskLocalisedConfig: TaskLocalisedConfig): void }>();

// Global State ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const sessionState = useSessionStore();

// Local State ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const connectionConfigs = computed(() => sessionState.connectionConfigs);
const localisedConnectionConfigs = shallowRef<ConnectionLocalisedConfig[]>();

// Side Effects ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

watch(connectionConfigs, (newConnectionConfigs) => (localisedConnectionConfigs.value = localiseConfigs<ConnectionLocalisedConfig>(newConnectionConfigs, localeId.value)), {
    immediate: true
});

// UI Helpers ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function triggerComplete(): void {
    emit('complete', taskLocalisedConfig);
}

// EXPERIMENTAL ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const connectorConfigs = computed(() => sessionState.connectorConfigs);
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

async function testAuth(): Promise<void> {
    if (connectorConfig.value == null || connectionConfig.value == null) return;
    const { processRequest } = await useEngine();
    (await processRequest('authenticateConnection', connectionConfig.value, {
        accountId: "JMT's Account",
        windowCenterX: screen.width / 2,
        windowCenterY: screen.height / 2
    })) as EngineAuthActionOptions;
}

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
            {{ item?.connectorConfig.implementations }}

            <Input name="email" autocomplete="email" :placeholder="t(T, 'Label')" :required="true" type="text" />

            <Button @click="testAuth">Auth...</Button>

            <RouterLink :to="{ name: 'selectNode', query: { ...$route.query, wbView: 'selectNode' } }" @click="triggerComplete">Select</RouterLink>
        </template>
    </ListDetailPanel>
</template>
