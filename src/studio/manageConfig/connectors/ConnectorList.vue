<script setup lang="ts">
// ── External Dependencies & Registrations
import { computed, shallowRef, watch } from 'vue';

// ── DPUse Framework
import type { ConnectorConfig } from '@dpuse/dpuse-shared/component/module/connector';
import { localiseConfigs, type LocalisedConfig } from '@dpuse/dpuse-shared/locale';

// ── Local Framework
import type { DataSource } from '@/composables/useDataWindow';
import { localeId } from '@/state/locale';
import { configsAreRetrieved, connectorConfigs } from '@/state/session';

// ── Local Components - Static
import ConfigCard from '@/components/framework/ConfigCard.vue';
import ConnectorPanel from './ConnectorPanel.vue';
import GridDetailPanel from '~/src/components/framework/GridDetailPanel.vue';
import SelectPlaceholder from '@/components/ui/placeholders/SelectPlaceholder.vue';

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

const activeConnectorConfig = shallowRef<LocalisedConfig<ConnectorConfig> | undefined>();
const connectorLocalisedConfigs = shallowRef<LocalisedConfig<ConnectorConfig>[]>([]);

// ── Derived State ────────────────────────────────────────────────────────────────────────────────────────────────────

const connectorConfigsDataSource = computed<DataSource<LocalisedConfig<ConnectorConfig>>>(() => ({
    rowCount: configsAreRetrieved.value ? connectorLocalisedConfigs.value.length : undefined,
    getRows: (start, end): Promise<{ rows: LocalisedConfig<ConnectorConfig>[] }> => Promise.resolve({ rows: connectorLocalisedConfigs.value.slice(start, end) })
}));

// ── Side Effects ─────────────────────────────────────────────────────────────────────────────────────────────────────

watch(connectorConfigs, (newConnectorConfigs) => (connectorLocalisedConfigs.value = localiseConfigs<ConnectorConfig>(newConnectorConfigs, localeId.value, true)), {
    immediate: true
});

// ── Event Handlers ───────────────────────────────────────────────────────────────────────────────────────────────────

function handleSelectConnector(connectorLocalisedConfig: LocalisedConfig<ConnectorConfig> | undefined): void {
    activeConnectorConfig.value = connectorLocalisedConfig;
}
</script>

<template>
    <GridDetailPanel
        :active-item="activeConnectorConfig"
        class="min-h-0 flex-1"
        :data-source="connectorConfigsDataSource"
        max-detail-width="650px"
        :row-height="122"
        @select="handleSelectConnector"
    >
        <template #grid-item="{ item }">
            <ConfigCard v-if="item" :config="item" :selected="item.id === activeConnectorConfig?.id" />
        </template>

        <template #detail="{ item, clear }">
            <ConnectorPanel :connector-localised-config="item" @clear="clear" />
        </template>

        <template #no-selection>
            <SelectPlaceholder :message="'Select a connector from the list.'" />
        </template>
    </GridDetailPanel>
</template>
