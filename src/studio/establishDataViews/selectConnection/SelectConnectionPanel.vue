<script setup lang="ts">
// ── External Dependencies & Registrations
import { computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

// ── DPUse Framework
import type { ConnectionConfig } from '@dpuse/dpuse-shared/component/connection';
import type { LocalisedConfig } from '@dpuse/dpuse-shared/locale';

// ── Local Framework
import { activeMetaStoreConnectionConfig } from '@/state/session';
import type { DataSource } from '@/composables/useDataWindow';
import { activeConnectionConfig, activeConnectionNodeConfigs, activeDataViewConfig, connectionLocalisedConfigs, getDataViewRecord, NEW_DATA_VIEW_ID } from '@/state/dataViews';

// ── Local Components - Static
import Card from '@/components/ui/Card.vue';
import DetailActionBar from '@/components/framework/gridDetailPanel/DetailActionBar.vue';
import GridDetailPanel from '@/components/framework/gridDetailPanel/GridDetailPanel.vue';
import SelectConnectionForm from './SelectConnectionForm.vue';
import SelectPlaceholder from '@/components/ui/placeholders/SelectPlaceholder.vue';
import type { TaskConfig } from '@/components/ui/TaskBar.vue';

// ── Options, Properties, Model Value, Slots & Emits ──────────────────────────────────────────────────────────────────

const { taskLocalisedConfig } = defineProps<{ taskLocalisedConfig: LocalisedConfig<TaskConfig> }>();

defineEmits<{ 'task-completed': [taskLocalisedConfig: LocalisedConfig<TaskConfig>] }>();

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

const route = useRoute();
const router = useRouter();

// ── Derived State ────────────────────────────────────────────────────────────────────────────────────────────────────

const connectionConfigsDataSource = computed<DataSource<LocalisedConfig<ConnectionConfig>>>(() => ({
    rowCount: connectionLocalisedConfigs.value.length,
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
        max-detail-width="400px"
        @add="handleAddConnection"
        @select="handleSelectConnection"
    >
        <template #grid-item="{ item }">
            <Card v-if="item" :icon="item.icon ?? undefined" :icon-dark="item.iconDark ?? undefined" :label="item.label" />
        </template>

        <template #detail="{ item, clear }">
            <div class="ml-4 flex h-10 flex-none items-center gap-x-1 border-b border-separator">
                <div class="flex size-7 items-center justify-center">
                    <div v-if="item.icon" aria-hidden="true" class="block w-6 dark:hidden" v-html="item.icon || item.iconDark" />
                    <div v-if="item.icon" aria-hidden="true" class="hidden w-6 dark:block" v-html="item.iconDark || item.icon" />
                </div>
                <span class="ml-1 min-w-0 truncate">{{ item.label }}</span>
            </div>
            <div class="relative min-h-0 flex-1">
                <SelectConnectionForm :connection-localised-config="item" @submit="$emit('task-completed', taskLocalisedConfig)" />
                <DetailActionBar class="absolute right-4 bottom-(--safe-bottom-offset)" commit-variant="add" @clear="clear" @commit="handleCommitDetail" />
            </div>
        </template>

        <template #no-selection>
            <SelectPlaceholder :message="'Select a connection from the list.'" />
        </template>
    </GridDetailPanel>
</template>
