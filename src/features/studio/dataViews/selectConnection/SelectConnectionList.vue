<script setup lang="ts">
// ── External Dependencies & Registrations
import { ArrowRightIcon } from '@lucide/vue';
import { computed, shallowRef, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

// ── DPUse Framework
import { AppError } from '@dpuse/dpuse-shared/errors';
import type { ConnectionConfig } from '@dpuse/dpuse-shared/component/connection';
import type { LocalisedConfig } from '@dpuse/dpuse-shared/locale';

// ── Local Framework
import type { DataSource } from '@/composables/useDataWindow';
import { useDialogs } from '@/state/dialogs';
import { type AppFailure, raiseFailure } from '@/state/errors';
import { activeConnectionConfig, activeConnectionNodeConfigs, activeDataViewConfig, connectionLocalisedConfigs, getDataViewRecord, NEW_DATA_VIEW_ID } from '@/state/dataViews';
import { activeMetaStoreConnectionConfig, configRetrievalFailed, configRetrievalFailure, configRetrievalSucceeded } from '@/state/session';

// ── Static Components
import ConfigCard from '@/components/ui/config/ConfigCard.vue';
import ErrorShell from '@/components/ui/error/ErrorShell.vue';
import GridDetailPanel from '@/components/ui/grid/GridDetailPanel.vue';
import SelectConnectionPanel from './SelectConnectionPanel.vue';
import SelectPlaceholder from '@/components/ui/placeholder/SelectPlaceholder.vue';
import ActionButton from '@/components/ui/button/ActionButton.vue';
import type { TaskConfig } from '@/components/ui/TaskBar.vue';

// ── Options, Props, Slots & Emits ────────────────────────────────────────────────────────────────────────────────────

const { taskLocalisedConfig } = defineProps<{ taskLocalisedConfig: LocalisedConfig<TaskConfig> }>();

defineEmits<{ 'task-completed': [taskLocalisedConfig: LocalisedConfig<TaskConfig>] }>();

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

const dataViewFailure = shallowRef<AppFailure | undefined>();
const { openDialog } = useDialogs();
const route = useRoute();
const router = useRouter();

// ── Derived State ────────────────────────────────────────────────────────────────────────────────────────────────────

const connectionConfigsDataSource = computed<DataSource<LocalisedConfig<ConnectionConfig>>>(() => ({
    // Settled either way: an undefined count means 'not yet known' and leaves the grid busy, so checking only the
    // success flag left it spinning for the rest of the session when retrieval failed.
    rowCount: configRetrievalSucceeded.value || configRetrievalFailed.value ? connectionLocalisedConfigs.value.length : undefined,
    getRows: (start, end): Promise<{ rows: LocalisedConfig<ConnectionConfig>[] }> => Promise.resolve({ rows: connectionLocalisedConfigs.value.slice(start, end) })
}));

// ── Side Effects ─────────────────────────────────────────────────────────────────────────────────────────────────────

// Caught rather than left to reject: this reaches the engine, and without the catch a failure there escapes as an
// unhandled rejection and is announced over the app as one, rather than said here in terms of what it cost.
watch(activeMetaStoreConnectionConfig, (newLocalMetaStoreConnectionConfig) => {
    dataViewFailure.value = undefined;
    void getDataViewRecord(newLocalMetaStoreConnectionConfig, route).catch((error: unknown) => {
        dataViewFailure.value = raiseFailure(
            new AppError('Failed to open this data view.', 'dpuse-app.selectConnectionList.getDataViewRecord', { typeId: 'handled' }, { cause: error })
        );
    });
});

// ── Event Handlers ───────────────────────────────────────────────────────────────────────────────────────────────────

function handleRetryDataView(): void {
    dataViewFailure.value = undefined;
    void getDataViewRecord(activeMetaStoreConnectionConfig.value, route).catch((error: unknown) => {
        dataViewFailure.value = raiseFailure(
            new AppError('Failed to open this data view.', 'dpuse-app.selectConnectionList.getDataViewRecord', { typeId: 'handled' }, { cause: error })
        );
    });
}

function handleAddConnection(): void {
    void openDialog('connection');
}

function handleCommitDetail(): void {
    void router.push({ name: 'items', query: { ...route.query, sView: 'items' } }).catch(() => {
        // Already reported by 'router.onError'.
    });
}

function handleDeleteDataView(connectionConfig: LocalisedConfig<ConnectionConfig>): void {
    // TODO
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
    <!-- The list is empty because the configurations never arrived, not because there are no connections. Covers the
         region: there is nothing to pick here, and no way to add one either, until the connection is back. -->
    <ErrorShell v-if="configRetrievalFailure" covers-region :can-retry="false" :failures="[configRetrievalFailure]" />

    <!-- Covers the region: the data view behind this connection is what the list exists to open, so there is nothing
         useful left to pick from. -->
    <ErrorShell v-else-if="dataViewFailure" covers-region :failures="[dataViewFailure]" @retry="handleRetryDataView" />

    <GridDetailPanel
        v-else
        :active-item="activeConnectionConfig"
        add-label="Connection"
        :data-source="connectionConfigsDataSource"
        max-detail-width="65ch"
        :row-height="16 + 16 + 28 + 32 + 16"
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

        <template #detail="{ item, clear, close }">
            <SelectConnectionPanel :connection-localised-config="item" @clear="clear" @close="close" />
            <ActionButton :icon="ArrowRightIcon" label="Select" @click="handleCommitDetail" />
        </template>

        <template #no-selection>
            <SelectPlaceholder :message="'Select a connection from the list.'" />
        </template>
    </GridDetailPanel>
</template>
