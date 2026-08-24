<script setup lang="ts">
// ── External Dependencies & Registrations
import { computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

// ── DPUse Framework
import type { ConnectionConfig } from '@dpuse/dpuse-shared/component/connection';
import type { LocalisedConfig } from '@dpuse/dpuse-shared/locale';

// ── Local Framework
import type { DataSource } from '@/composables/useDataWindow';
import { activeConnectionConfig, activeConnectionNodeConfigs, activeDataViewConfig, connectionLocalisedConfigs, getDataViewRecord, NEW_DATA_VIEW_ID } from '@/state/dataViews';
import { activeMetaStoreConnectionConfig, configsAreRetrieved } from '@/state/session';

// ── Static Components
import ConfigCard from '@/components/ui/ConfigCard.vue';
import GridDetailPanel from '@/components/ui/grid/GridDetailPanel.vue';
import SelectConnectionPanel from './SelectConnectionPanel.vue';
import SelectPlaceholder from '@/components/ui/placeholder/SelectPlaceholder.vue';
import StepActionButton from '@/components/ui/button/StepActionButton.vue';
import type { TaskConfig } from '@/components/ui/TaskBar.vue';

// ── Options, Props, Slots & Emits ────────────────────────────────────────────────────────────────────────────────────

const { taskLocalisedConfig } = defineProps<{ taskLocalisedConfig: LocalisedConfig<TaskConfig> }>();

defineEmits<{ 'task-completed': [taskLocalisedConfig: LocalisedConfig<TaskConfig>] }>();

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

const route = useRoute();
const router = useRouter();

// ── Derived State ────────────────────────────────────────────────────────────────────────────────────────────────────

const connectionConfigsDataSource = computed<DataSource<LocalisedConfig<ConnectionConfig>>>(() => ({
    rowCount: configsAreRetrieved.value ? connectionLocalisedConfigs.value.length : undefined,
    getRows: (start, end): Promise<{ rows: LocalisedConfig<ConnectionConfig>[] }> => Promise.resolve({ rows: connectionLocalisedConfigs.value.slice(start, end) })
}));

// ── Side Effects ─────────────────────────────────────────────────────────────────────────────────────────────────────

watch(activeMetaStoreConnectionConfig, (newLocalMetaStoreConnectionConfig) => getDataViewRecord(newLocalMetaStoreConnectionConfig, route));

// ── Event Handlers ───────────────────────────────────────────────────────────────────────────────────────────────────

function handleAddConnection(): void {
    router.replace({ query: { ...route.query, dlg: 'connection' } });
}

function handleCommitDetail(): void {
    router.push({ name: 'selectItem', query: { ...route.query, sView: 'selectItem' } });
}

function handleDeleteDataView(connectionConfig: LocalisedConfig<ConnectionConfig>): void {}

function handleSelectConnection(connectionLocalisedConfig: LocalisedConfig<ConnectionConfig> | undefined): void {
    activeConnectionConfig.value = connectionLocalisedConfig;
    activeConnectionNodeConfigs.value = [];
    resetActiveDataViewConfig(connectionLocalisedConfig);
}

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

function resetActiveDataViewConfig(connectionLocalisedConfig?: LocalisedConfig<ConnectionConfig>): void {
    activeDataViewConfig.value =
        activeDataViewConfig.value == null
            ? {
                  id: NEW_DATA_VIEW_ID,
                  label: { en: 'New Data View' },
                  description: { en: 'A new data view.' },
                  firstCreatedAt: null,
                  icon: null,
                  iconDark: null,
                  lastUpdatedAt: null,
                  status: null,
                  statusId: null,
                  typeId: 'dataView',
                  connectionId: connectionLocalisedConfig?.id,
                  connectionNodeConfig: undefined,
                  previewConfig: undefined,
                  contentAuditConfig: undefined,
                  relationshipsAuditConfig: undefined
              }
            : {
                  ...activeDataViewConfig.value,
                  connectionId: connectionLocalisedConfig?.id,
                  connectionNodeConfig: undefined,
                  previewConfig: undefined,
                  contentAuditConfig: undefined,
                  relationshipsAuditConfig: undefined
              };
}
</script>

<template>
    <GridDetailPanel
        :active-item="activeConnectionConfig"
        add-label="Connection"
        :data-source="connectionConfigsDataSource"
        max-detail-width="65ch"
        :row-height="162"
        @add="handleAddConnection"
        @select="handleSelectConnection"
    >
        <template #grid-item="{ item }">
            <ConfigCard
                v-if="item"
                :actions="[
                    { typeId: 'delete', onClick: handleDeleteDataView },
                    {
                        typeId: 'open',
                        onClick: () => {
                            handleSelectConnection(item);
                            handleCommitDetail();
                        }
                    }
                ]"
                :config="item"
                :selected="item.id === activeConnectionConfig?.id"
            />
        </template>

        <template #detail="{ item, clear }">
            <SelectConnectionPanel :connection-localised-config="item" @close="clear" />
            <StepActionButton label="Select" @click="handleCommitDetail" />
        </template>

        <template #no-selection>
            <SelectPlaceholder :message="'Select a connection from the list.'" />
        </template>
    </GridDetailPanel>
</template>
