<script setup lang="ts">
// ── External Dependencies & Registrations
import { computed, ref, shallowRef, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

// ── DPUse Framework
import type { ConnectorConfig } from '@dpuse/dpuse-shared/component/module/connector';
import { localiseConfigs, type LocalisedConfig } from '@dpuse/dpuse-shared/locale';

// ── Local (App) Framework
import { connectorConfigs } from '@/state/session';
import type { DataSource } from '@/composables/useDataWindow';
import { localeId } from '@/state/locale';

// ── Local Components - Static
import Card from '@/components/ui/Card.vue';
import ConnectorForm from './ConnectorForm.vue';
import GridDetailPanel from '@/components/framework/gridDetailPanel/GridDetailPanel.vue';
import SelectPlaceholder from '@/components/ui/placeholders/SelectPlaceholder.vue';
// import type { TaskConfig } from '@/components/ui/TaskBar.vue';

// ── Options, Properties, Slots & Emits ───────────────────────────────────────────────────────────────────────────────

// const { taskLocalisedConfig } = defineProps<{ taskLocalisedConfig: LocalisedConfig<TaskConfig> }>();

// defineEmits<{ 'task-completed': [taskLocalisedConfig: LocalisedConfig<TaskConfig>] }>();

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

const activeConnectorConfig = shallowRef<LocalisedConfig<ConnectorConfig> | undefined>();
const connectorLocalisedConfigs = shallowRef<LocalisedConfig<ConnectorConfig>[]>([]);

const route = useRoute();
const router = useRouter();

// ── Derived State ────────────────────────────────────────────────────────────────────────────────────────────────────

const connectorConfigsDataSource = computed<DataSource<LocalisedConfig<ConnectorConfig>>>(() => ({
    rowCount: connectorLocalisedConfigs.value.length,
    getRows: (start, end): Promise<LocalisedConfig<ConnectorConfig>[]> => Promise.resolve(connectorLocalisedConfigs.value.slice(start, end))
}));

// ── Side Effects ─────────────────────────────────────────────────────────────────────────────────────────────────────

watch(connectorConfigs, (newConnectorConfigs) => (connectorLocalisedConfigs.value = localiseConfigs<ConnectorConfig>(newConnectorConfigs, localeId.value, true)), {
    immediate: true
});

// ── UI Event Handlers ────────────────────────────────────────────────────────────────────────────────────────────────

function handleAddConnection(): void {
    router.replace({ query: { ...route.query, dlg: 'connection' } });
}

function handleCommitDetail(): void {
    router.push({ name: 'selectItem', query: { ...route.query, wbView: 'selectItem' } });
}

function handleSelectConnection(connectionLocalisedConfig: LocalisedConfig<ConnectorConfig> | undefined): void {
    activeConnectorConfig.value = connectionLocalisedConfig;
}

type ItemAction = { id: string; label: string };
const ITEM_ACTIONS: ItemAction[] = [{ id: 'addConnection', label: 'Add Connection' }];
const activeItemAction = ref<ItemAction | undefined>();
</script>

<template>
    <!-- {{ activeItemAction }} -->

    <!-- <GridDetailPanel
        v-model:active-item-action="activeItemAction"
        :active-item="activeConnectorConfig"
        add-label="Connection"
        :data-source="connectorConfigsDataSource"
        :item-actions="ITEM_ACTIONS"
        max-detail-width="400px"
        @add="handleAddConnection"
        @commit-detail="handleCommitDetail"
        @select="handleSelectConnection"
    > -->
    <GridDetailPanel
        v-model:active-item-action="activeItemAction"
        :active-item="activeConnectorConfig"
        :data-source="connectorConfigsDataSource"
        :item-actions="ITEM_ACTIONS"
        max-detail-width="400px"
        @commit-detail="handleCommitDetail"
        @select="handleSelectConnection"
    >
        <template #grid-item="{ item }">
            <Card v-if="item" :icon="item.icon ?? undefined" :icon-dark="item.iconDark ?? undefined" :icon-neutral="item.iconNeutral ?? undefined" :label="item.label" />
        </template>

        <template #detail="{ item }">
            <!-- <ConnectorForm :connector-localised-config="item" @submit="$emit('task-completed', taskLocalisedConfig)" /> -->
            <ConnectorForm :connector-localised-config="item" />
        </template>

        <template #no-selection>
            <SelectPlaceholder :message="'Select a connector from the list on the left.'" />
        </template>
    </GridDetailPanel>
</template>
