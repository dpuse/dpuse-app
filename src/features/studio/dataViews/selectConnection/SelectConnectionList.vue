<script setup lang="ts">
// Template Notes — TODO: Revisit later. These belong beside their elements in the template, but a comment at the
// template's root breaks the fade between route views in development: Vue never reports the old view as gone, so the
// next one never appears. Production builds strip comments, so only development is affected.
// - Configuration error notice: the list is empty because the configurations never arrived, not because there are no
//   connections. Covers the region: there is nothing to pick here, and no way to add one either, until the connection
//   is back.
// - Data view error notice: covers the region, because the data view behind this connection is what the list exists to
//   open, so there is nothing useful left to pick from.

// ── External Dependencies & Registrations
import { ArrowRightIcon } from '@lucide/vue';
import { computed, ref, shallowRef, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

// ── DPUse Framework
import { AppError } from '@dpuse/dpuse-shared';
import type { ConnectionConfig, LocalisedConfig } from '@dpuse/dpuse-shared';

// ── Local Framework
import type { DataSource } from '@/composables/useDataWindow';
import { ignoreReportedNavigationFailure } from '@/router';
import { t } from '@/state/locale';
import { TEXT } from './SelectConnectionList_.json';
import { useDialogs } from '@/state/dialogs';
import { type Action, useCardRowHeight } from '@/components/ui/config/configCard';
import { activeConnectionConfig, activeConnectionNodeConfigs, activeDataViewConfig, connectionLocalisedConfigs, getDataViewRecord, saveDataViewRecord } from '@/state/dataViews';
import { activeMetaStoreConnectionConfig, configRetrievalFailed, configRetrievalFailure, configRetrievalSucceeded } from '@/state/session';
import { type AppFailure, raiseAppFailure, raiseFailure } from '@/state/errors';

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
    { typeId: 'delete', onClick: handleDeleteConnection },
    { typeId: 'open', onClick: handleOpenConnection }
];

// ── Options, Props, Slots & Emits ────────────────────────────────────────────────────────────────────────────────────

defineProps<{ taskLocalisedConfig: LocalisedConfig<TaskConfig> }>();

defineEmits<{ 'task-completed': [taskLocalisedConfig: LocalisedConfig<TaskConfig>] }>();

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

const route = useRoute();
const router = useRouter();

const dataViewFailure = shallowRef<AppFailure | undefined>();
const dataViewIsSaving = ref(false); // Stops a second commit while the first is still saving.

const { openDialog } = useDialogs();

// ── Derived State ────────────────────────────────────────────────────────────────────────────────────────────────────

// Cards here carry actions, which take a second row.
const cardRowHeight = useCardRowHeight(true);

const connectionLocalisedConfigsDataSource = computed<DataSource<LocalisedConfig<ConnectionConfig>>>(() => ({
    // Known once retrieval has finished, whether or not it worked: an undefined count keeps the grid busy.
    rowCount: configRetrievalSucceeded.value || configRetrievalFailed.value ? connectionLocalisedConfigs.value.length : undefined,
    rows: connectionLocalisedConfigs.value
}));

// ── Side Effects ─────────────────────────────────────────────────────────────────────────────────────────────────────

// Restores the previewed connection from the URL on reload, when the data view record hasn't already resolved one.
watch(
    connectionLocalisedConfigs,
    (newConfigs) => {
        if (activeConnectionConfig.value != null || typeof route.query.connectionId !== 'string') return;
        const restoredConnectionConfig = newConfigs.find((config) => config.id === route.query.connectionId);
        if (restoredConnectionConfig) selectConnection(restoredConnectionConfig);
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

// Saved before moving on, so a reload on the next step restores the connection from the store.
async function handleCommitDetail(): Promise<void> {
    if (activeDataViewConfig.value == null || dataViewIsSaving.value) return;

    dataViewIsSaving.value = true;
    try {
        const savedDataViewConfig = await saveDataViewRecord(activeMetaStoreConnectionConfig.value, activeDataViewConfig.value);
        void ignoreReportedNavigationFailure(router.push({ name: 'item', params: { dataViewId: savedDataViewConfig.id }, query: route.query }));
    } catch (error) {
        // Announced rather than shown in the list: the save did not happen, so the selection is still here to commit
        // again, and there is no space here this failure has taken.
        raiseAppFailure(new AppError('Failed to save data view.', 'dpuse-app.SelectConnectionList.handleCommitDetail', { typeId: 'handled' }, { cause: error }));
    } finally {
        dataViewIsSaving.value = false;
    }
}

function handleDeleteConnection(_connectionLocalisedConfig: LocalisedConfig<ConnectionConfig>): void {
    // TODO
}

// Opening never deselects, and leaves an already-selected connection alone so the data view keeps its later steps.
function handleOpenConnection(connectionLocalisedConfig: LocalisedConfig<ConnectionConfig>): void {
    if (activeConnectionConfig.value?.id !== connectionLocalisedConfig.id) selectConnection(connectionLocalisedConfig);
    void handleCommitDetail();
}

function handleSelectConnection(connectionLocalisedConfig: LocalisedConfig<ConnectionConfig>): void {
    selectConnection(activeConnectionConfig.value?.id === connectionLocalisedConfig.id ? undefined : connectionLocalisedConfig);
}

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

function selectConnection(connectionLocalisedConfig: LocalisedConfig<ConnectionConfig> | undefined): void {
    activeConnectionConfig.value = connectionLocalisedConfig;
    activeConnectionNodeConfigs.value = [];
    resetActiveDataViewConfig(connectionLocalisedConfig);

    const query = { ...route.query };
    if (connectionLocalisedConfig) query.connectionId = connectionLocalisedConfig.id;
    else delete query.connectionId;
    void ignoreReportedNavigationFailure(router.replace({ query }));
}

// Does nothing while the data view is still loading; the selection alone is kept until it arrives.
function resetActiveDataViewConfig(connectionLocalisedConfig?: LocalisedConfig<ConnectionConfig>): void {
    if (activeDataViewConfig.value == null) return;
    activeDataViewConfig.value = {
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
    <ErrorNotice v-if="configRetrievalFailure" covers-region :can-retry="false" :failures="[configRetrievalFailure]" />

    <ErrorNotice v-else-if="dataViewFailure" covers-region :failures="[dataViewFailure]" @retry="handleRetryDataView" />

    <GridDetailPanel
        v-else
        :active-item="activeConnectionConfig"
        :add-label="t(TEXT, 'connection.label')"
        :data-source="connectionLocalisedConfigsDataSource"
        max-detail-width="65ch"
        :row-height="cardRowHeight"
        @add="handleAddConnection"
    >
        <template #item="{ item }">
            <ConfigCard v-if="item" :actions="ACTION_CONFIGS" :config="item" :selected="item.id === activeConnectionConfig?.id" @click="handleSelectConnection(item)" />
        </template>

        <template #detail="{ item, close }">
            <SelectConnectionPanel :connection-localised-config="item" @close="close" />
        </template>

        <template #detail-action>
            <PillButton :icon="ArrowRightIcon" :label="t(TEXT, 'detail.select.label')" @click="handleCommitDetail" />
        </template>

        <template #no-selection>
            <SelectPlaceholder :message="t(TEXT, 'noSelection.text')" />
        </template>
    </GridDetailPanel>
</template>
