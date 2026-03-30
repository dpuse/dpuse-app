<script setup lang="ts">
// External Dependencies
import { computed, shallowRef, watch } from 'vue';

// DPUse Framework
import type { EngineAuthActionOptions } from '@dpuse/dpuse-shared/engine';
import type { ConnectionConfig, ConnectorConfig } from '@dpuse/dpuse-shared/component/connector';

// App Core
import { useEngine } from '~/src/composables/useEngine';
import { useSessionStore } from '@/stores/sessionStore';
import { localeId, localiseConfigs } from '@/locales';

// App Components & Views - Statically imported so always available, even after app goes offline.
import Button from '@/components/button/Button.vue';
import Card from '@/components/card/Card.vue';
import GridScroller from '@/components/gridScroller/GridScroller.vue';
import SideBySidePanels from '@/components/sideBySidePanels/SideBySidePanels.vue';
import type { TaskConfig } from './EstablishDataViews.vue';
import ViewScroller from '@/components/view/ViewScroller.vue';

// Properties & Emits
const { taskConfig } = defineProps<{ taskConfig: TaskConfig }>();
const emit = defineEmits<{ (event: 'complete', taskConfig: TaskConfig): void }>();

// Global State ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const sessionState = useSessionStore();

// Local State ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const connectionConfigs = computed(() => sessionState.connectionConfigs);
const localisedConnectionConfigs = shallowRef();

// Side Effects ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

watch(connectionConfigs, (newConnectionConfigs) => (localisedConnectionConfigs.value = localiseConfigs(newConnectionConfigs, localeId.value)), { immediate: true });

// UI Helpers ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function triggerComplete(): void {
    emit('complete', taskConfig);
}

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
    <SideBySidePanels class="flex-1" max-right-width="400px">
        <template #left>
            <GridScroller class="flex-1 pb-20" :items="localisedConnectionConfigs" :row-height="150" :target-column-width="350">
                <template #default="{ item }">
                    <RouterLink :to="{ name: 'selectNode', query: { ...$route.query, wbView: 'selectNode' } }">
                        <Card v-if="item" :label="item.label" />
                    </RouterLink>
                </template>
            </GridScroller>
        </template>

        <template #right>
            <div class="mr-4 flex-1 pt-4 pb-20">
                <Button @click="testAuth">Auth...</Button>
                <RouterLink :to="{ name: 'selectNode', query: { ...$route.query, wbView: 'selectNode' } }" @click="triggerComplete">Next...</RouterLink>
            </div>
        </template>
    </SideBySidePanels>
</template>
