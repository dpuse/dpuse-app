<script setup lang="ts">
// External Dependencies
import { computed, shallowRef, watch } from 'vue';

// App Core
import type { TaskConfig } from './EstablishDataViews.vue';
import { useEngineWorker } from '@/composables/useEngineWorker';
import { useSessionStore } from '@/stores/sessionStore';
import { localeId, localiseConfigs } from '@/locales';

// App Components & Views - Statically imported so always available, even after app goes offline.
import Button from '@/components/button/Button.vue';
import Card from '@/components/card/Card.vue';
import GridScroller from '@/components/gridScroller/GridScroller.vue';
import ViewScroller from '@/components/view/ViewScroller.vue';
import type { ConnectionConfig, ConnectorConfig } from '@dpuse/dpuse-shared/component/connector';

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

// UI Helpers  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function triggerComplete(): void {
    emit('complete', taskConfig);
}

const connectorConfigs = computed(() => sessionState.connectorConfigs);
const dropboxConnectorConfig = shallowRef();
const dropboxConnectionConfig = shallowRef();
watch(
    connectorConfigs,
    (newConnectorConfigs) => {
        if (newConnectorConfigs == null) return;
        dropboxConnectorConfig.value = newConnectorConfigs.find((config) => config.id === 'dpuse-connector-dropbox');
        if (dropboxConnectorConfig.value == null) return;
        dropboxConnectionConfig.value = constructConnectionConfig(dropboxConnectorConfig.value);
    },
    { immediate: true }
);

async function testAuth(): Promise<void> {
    if (dropboxConnectorConfig.value == null || dropboxConnectionConfig.value == null) return;
    const { processRequest } = await useEngineWorker();
    await processRequest('authenticateConnection', dropboxConnectionConfig.value, {});
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
    <div class="flex flex-1">
        <GridScroller class="flex-1 pb-20" :items="localisedConnectionConfigs" :row-height="150" :target-column-width="350">
            <template #default="{ item }">
                <RouterLink :to="{ name: 'selectNode', query: { ...$route.query, wbView: 'selectNode' } }">
                    <Card v-if="item" :label="item.label" />
                </RouterLink>
            </template>
        </GridScroller>

        <div class="mr-4 bg-zinc-100 pb-20">
            <Button @click="testAuth">Auth...</Button>
            <RouterLink :to="{ name: 'selectNode', query: { ...$route.query, wbView: 'selectNode' } }" @click="triggerComplete">Next...</RouterLink>
        </div>
    </div>
</template>
