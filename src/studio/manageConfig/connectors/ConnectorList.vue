<script setup lang="ts">
// ── External Dependencies & Registrations
import { computed, shallowRef, watch } from 'vue';

// ── DPUse Framework
import type { ConnectorConfig } from '@dpuse/dpuse-shared/component/module/connector';
import { localiseConfigs, type LocalisedConfig } from '@dpuse/dpuse-shared/locale';

// ── Local Framework
import { connectorConfigs } from '@/state/session';
import type { DataSource } from '@/composables/useDataWindow';
import { localeId } from '@/state/locale';

// ── Local Components - Static
import ComponentCard from '@/components/framework/ComponentCard.vue';
import ConnectorForm from './ConnectorForm.vue';
import DetailActionBar from '@/components/framework/gridDetailPanel/DetailActionBar.vue';
import GridDetailPanel from '@/components/framework/gridDetailPanel/GridDetailPanel.vue';
import SelectPlaceholder from '@/components/ui/placeholders/SelectPlaceholder.vue';

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

const activeConnectorConfig = shallowRef<LocalisedConfig<ConnectorConfig> | undefined>();
const connectorLocalisedConfigs = shallowRef<LocalisedConfig<ConnectorConfig>[]>([]);

// ── Derived State ────────────────────────────────────────────────────────────────────────────────────────────────────

const connectorConfigsDataSource = computed<DataSource<LocalisedConfig<ConnectorConfig>>>(() => ({
    rowCount: connectorLocalisedConfigs.value.length,
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
    <GridDetailPanel :active-item="activeConnectorConfig" class="min-h-0 flex-1" :data-source="connectorConfigsDataSource" max-detail-width="650px" @select="handleSelectConnector">
        <template #grid-item="{ item }">
            <ComponentCard v-if="item" :icon="item.icon ?? undefined" :icon-dark="item.iconDark ?? undefined" :label="item.label" />
        </template>

        <template #detail="{ item, clear }">
            <div class="relative flex min-h-0 flex-1 flex-col">
                <ConnectorForm :connector-localised-config="item" />
                <DetailActionBar class="absolute right-4 bottom-(--safe-bottom-offset)" @clear="clear" />
            </div>
        </template>

        <template #no-selection>
            <SelectPlaceholder :message="'Select a connector from the list.'" />
        </template>
    </GridDetailPanel>
</template>
