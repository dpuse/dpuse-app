<script setup lang="ts">
// ── External Dependencies & Registrations
import { computed, shallowRef, watch } from 'vue';

// ── DPUse Framework
import type { ConnectorConfig } from '@dpuse/dpuse-shared/component/module/connector';
import { localiseConfigs, type LocalisedConfig } from '@dpuse/dpuse-shared/locale';

// ── Local Framework
import type { ConfigOptionConfig } from '../ManageConfigLayout.vue';
import type { DataSource } from '@/composables/useDataWindow';
import { configsAreRetrieved, connectorConfigs } from '@/state/session';
import { localeId, t } from '@/state/locale';

// ── Local Components - Static
import ConfigCard from '@/components/framework/ConfigCard.vue';
import ConnectorPanel from './ConnectorPanel.vue';
import GridDetailPanel from '@/components/framework/GridDetailPanel.vue';
import SelectPlaceholder from '@/components/ui/placeholders/SelectPlaceholder.vue';

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

const T = {
    Select_connector: { en: 'Select a connector from the list.', es: 'Selecciona un conector de la lista.' }
};

// ── Options, Properties, Slots & Emits ───────────────────────────────────────────────────────────────────────────────

defineProps<{ activeConfigOptionConfig: LocalisedConfig<ConfigOptionConfig> }>();

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

const activeConnectorLocalisedConfig = shallowRef<LocalisedConfig<ConnectorConfig> | undefined>();
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
    activeConnectorLocalisedConfig.value = connectorLocalisedConfig;
}
</script>

<template>
    <GridDetailPanel
        :active-item="activeConnectorLocalisedConfig"
        class="min-h-0 flex-1"
        :data-source="connectorConfigsDataSource"
        max-detail-width="65ch"
        :row-height="122"
        @select="handleSelectConnector"
    >
        <template #grid-item="{ item }">
            <ConfigCard v-if="item" :config="item" :selected="item.id === activeConnectorLocalisedConfig?.id" />
        </template>

        <template #detail="{ item, clear }">
            <ConnectorPanel :active-config-option-config="activeConfigOptionConfig" :connector-localised-config="item" @close="clear" />
        </template>

        <template #no-selection>
            <SelectPlaceholder :message="t(T, 'Select_connector')" />
        </template>
    </GridDetailPanel>
</template>
