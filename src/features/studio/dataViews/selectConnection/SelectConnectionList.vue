<script setup lang="ts">
// ── External Dependencies & Registrations
import { ArrowRightIcon } from '@lucide/vue';
import { computed, shallowRef, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

// ── DPUse Framework
import { AppError } from '@dpuse/dpuse-shared';
import type { ConnectionConfig, LocalisedConfig } from '@dpuse/dpuse-shared';

// ── Local Framework
import type { DataSource } from '@/composables/useDataWindow';
import { useDialogs } from '@/state/dialogs';
import { type Action, useCardRowHeight } from '@/components/ui/config/configCard';
import { activeConnectionConfig, activeConnectionNodeConfigs, activeDataViewConfig, connectionLocalisedConfigs, getDataViewRecord, NEW_DATA_VIEW_ID } from '@/state/dataViews';
import { activeMetaStoreConnectionConfig, configRetrievalFailed, configRetrievalFailure, configRetrievalSucceeded } from '@/state/session';
import { type AppFailure, raiseFailure } from '@/state/errors';

// ── Static Components
import ConfigCard from '@/components/ui/config/ConfigCard.vue';
import ErrorNotice from '@/components/ui/error/ErrorNotice.vue';
import GridDetailPanel from '@/components/ui/grid/GridDetailPanel.vue';
import PillButton from '@/components/ui/action/PillButton.vue';
import SelectConnectionPanel from './SelectConnectionPanel.vue';
import SelectPlaceholder from '@/components/ui/placeholder/SelectPlaceholder.vue';
import type { TaskConfig } from '@/components/ui/TaskBar.vue';

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

const ACTION_CONFIGS: Action<ConnectionConfig>[] = [
    { typeId: 'delete', onClick: handleDeleteDataView },
    {
        typeId: 'open',
        onClick: (connectionConfig): void => {
            handleSelectConnection(connectionConfig);
            handleCommitDetail();
        }
    }
];

// ── Options, Props, Slots & Emits ────────────────────────────────────────────────────────────────────────────────────

const { taskLocalisedConfig } = defineProps<{ taskLocalisedConfig: LocalisedConfig<TaskConfig> }>();

defineEmits<{ 'task-completed': [taskLocalisedConfig: LocalisedConfig<TaskConfig>] }>();

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

const dataViewFailure = shallowRef<AppFailure | undefined>();
const { openDialog } = useDialogs();
const route = useRoute();
const router = useRouter();

// ── Derived State ────────────────────────────────────────────────────────────────────────────────────────────────────

// Cards here carry actions, which take a second row.
const cardRowHeight = useCardRowHeight(true);

const connectionConfigsDataSource = computed<DataSource<LocalisedConfig<ConnectionConfig>>>(() => ({
    // Settled either way: an undefined count means 'not yet known' and leaves the grid busy, so checking only the
    // success flag left it spinning for the rest of the session when retrieval failed.
    rowCount: configRetrievalSucceeded.value || configRetrievalFailed.value ? connectionLocalisedConfigs.value.length : undefined,
    getRows: (start, end): Promise<{ rows: LocalisedConfig<ConnectionConfig>[] }> => Promise.resolve({ rows: connectionLocalisedConfigs.value.slice(start, end) })
}));

// ── Side Effects ─────────────────────────────────────────────────────────────────────────────────────────────────────

// Restores the previewed connection from the URL on reload, when the data view record hasn't already resolved one.
watch(
    connectionLocalisedConfigs,
    (newConfigs) => {
        if (activeConnectionConfig.value != null || typeof route.query.connectionId !== 'string') return;
        const restoredConnectionConfig = newConfigs.find((config) => config.id === route.query.connectionId);
        if (restoredConnectionConfig) handleSelectConnection(restoredConnectionConfig);
    },
    { immediate: true }
);

// Caught rather than left to reject: this reaches the engine, and without the catch a failure there escapes as an
// unhandled rejection and is announced over the app as one, rather than said here in terms of what it cost.
watch(activeMetaStoreConnectionConfig, (newLocalMetaStoreConnectionConfig) => {
    dataViewFailure.value = undefined;
    void getDataViewRecord(newLocalMetaStoreConnectionConfig, route).catch((error: unknown) => {
        dataViewFailure.value = raiseFailure(new AppError('Failed to open this data view.', 'dpuse-app.SelectConnectionList', { typeId: 'handled' }, { cause: error }));
    });
});

// ── Event Handlers ───────────────────────────────────────────────────────────────────────────────────────────────────

function handleRetryDataView(): void {
    dataViewFailure.value = undefined;
    void getDataViewRecord(activeMetaStoreConnectionConfig.value, route).catch((error: unknown) => {
        dataViewFailure.value = raiseFailure(
            new AppError('Failed to open this data view.', 'dpuse-app.SelectConnectionList.handleRetryDataView', { typeId: 'handled' }, { cause: error })
        );
    });
}

function handleAddConnection(): void {
    void openDialog('connection');
}

function handleCommitDetail(): void {
    void router.push({ name: 'items', query: route.query }).catch(() => {
        // Already reported by 'router.onError'.
    });
}

function handleDeleteDataView(connectionConfig: LocalisedConfig<ConnectionConfig>): void {
    // TODO
}

function handleSelectConnection(connectionLocalisedConfig: LocalisedConfig<ConnectionConfig> | undefined): void {
    activeConnectionConfig.value = activeConnectionConfig.value === connectionLocalisedConfig ? undefined : connectionLocalisedConfig;
    activeConnectionNodeConfigs.value = [];
    resetActiveDataViewConfig(connectionLocalisedConfig);

    const query = { ...route.query };
    if (activeConnectionConfig.value) query.connectionId = activeConnectionConfig.value.id;
    else delete query.connectionId;
    void router.replace({ query }).catch(() => {
        // Already reported by 'router.onError'.
    });
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
    <ErrorNotice v-if="configRetrievalFailure" covers-region :can-retry="false" :failures="[configRetrievalFailure]" />

    <!-- Covers the region: the data view behind this connection is what the list exists to open, so there is nothing
         useful left to pick from. -->
    <ErrorNotice v-else-if="dataViewFailure" covers-region :failures="[dataViewFailure]" @retry="handleRetryDataView" />

    <GridDetailPanel
        v-else
        :active-item="activeConnectionConfig"
        add-label="Connection"
        :data-source="connectionConfigsDataSource"
        max-detail-width="65ch"
        :row-height="cardRowHeight"
        @add="handleAddConnection"
    >
        <template #item="{ item }">
            <ConfigCard v-if="item" :actions="ACTION_CONFIGS" :config="item" :selected="item.id === activeConnectionConfig?.id" @click="handleSelectConnection(item)" />
        </template>

        <template #detail="{ item, close }">
            <SelectConnectionPanel :connection-localised-config="item" @close="close" />
            <PillButton :icon="ArrowRightIcon" label="Select" @click="handleCommitDetail" />
        </template>

        <template #no-selection>
            <SelectPlaceholder :message="'Select a connection from the list.'" />
        </template>
    </GridDetailPanel>
</template>
