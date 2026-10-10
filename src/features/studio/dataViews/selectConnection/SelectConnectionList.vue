<script setup lang="ts">
// Template Notes — TODO: Revisit later. These belong beside their elements in the template, but a comment at the
// template's root breaks the fade between route views in development: Vue never reports the old view as gone, so the
// next one never appears. Production builds strip comments, so only development is affected.
// - Configuration error notice: the list is empty because the configurations never arrived, not because there are no
//   connections. Covers the region: there is nothing to pick here, and no way to add one either, until the connection
//   is back.

// ── External Dependencies & Registrations
import { ArrowRightIcon } from '@lucide/vue';
import { computed, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

// ── DPUse Framework
import { AppError } from '@dpuse/dpuse-shared';
import type { ConnectionConfig, DataViewConfig, LocalisedConfig } from '@dpuse/dpuse-shared';

// ── Local Framework
import type { DataSource } from '@/composables/useDataWindow';
import { ignoreReportedNavigationFailure } from '@/router';
import { raiseAppFailure } from '@/state/errors';
import { t } from '@/state/locale';
import { TEXT } from './SelectConnectionList_.json';
import { useDialogs } from '@/state/dialogs';
import { type Action, useCardRowHeight } from '@/components/ui/config/configCard';
import { configRetrievalFailed, configRetrievalFailure, configRetrievalSucceeded } from '@/state/session';
import { connectionLocalisedConfigs, useDataView, useUpdateDataView } from '@/state/dataViews';

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

const emit = defineEmits<{
    'choice-changed': [choiceDataViewConfig: DataViewConfig | undefined]; // The data view as the pick would leave it, shown above the step until it is saved.
    'task-completed': [taskLocalisedConfig: LocalisedConfig<TaskConfig>];
}>();

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

const route = useRoute();
const router = useRouter();

const { openDialog } = useDialogs();

// Data View — 'isPending' stops a second commit while the first is still saving.
const { data: dataViewConfig } = useDataView(() => (typeof route.params.dataViewId === 'string' ? route.params.dataViewId : undefined));
const { isPending: dataViewIsSaving, mutateAsync: updateDataView } = useUpdateDataView();

// Choice — the connection picked in this step, saved only when it is committed. Starts as the saved one.
const pickedConnectionId = ref<string>();

// ── Derived State ────────────────────────────────────────────────────────────────────────────────────────────────────

const pickedConnectionLocalisedConfig = computed(() => connectionLocalisedConfigs.value.find((config) => config.id === pickedConnectionId.value));

// Cards here carry actions, which take a second row.
const cardRowHeight = useCardRowHeight(true);

const connectionLocalisedConfigsDataSource = computed<DataSource<LocalisedConfig<ConnectionConfig>>>(() => ({
    // Known once retrieval has finished, whether or not it worked: an undefined count keeps the grid busy.
    rowCount: configRetrievalSucceeded.value || configRetrievalFailed.value ? connectionLocalisedConfigs.value.length : undefined,
    rows: connectionLocalisedConfigs.value
}));

// ── Side Effects ─────────────────────────────────────────────────────────────────────────────────────────────────────

// Taken from the data view once it arrives, so a reload or a return to this step shows the saved connection picked.
watch(
    () => dataViewConfig.value?.id,
    () => {
        pickedConnectionId.value = dataViewConfig.value?.connectionId;
    },
    { immediate: true }
);

// ── Event Handlers ───────────────────────────────────────────────────────────────────────────────────────────────────

function handleAddConnection(): void {
    void openDialog('connection');
}

// Saved before moving on, so a reload on the next step restores the connection from the store. The saved connection
// picked again is not saved, so the data view keeps the later steps worked out from it.
async function handleCommitDetail(): Promise<void> {
    if (dataViewConfig.value == null || pickedConnectionId.value == null || dataViewIsSaving.value) return;

    try {
        const choiceDataViewConfig = constructChoiceDataViewConfig(dataViewConfig.value, pickedConnectionId.value);
        if (choiceDataViewConfig !== dataViewConfig.value) await updateDataView(choiceDataViewConfig);
        void ignoreReportedNavigationFailure(router.push({ name: 'item', params: { dataViewId: choiceDataViewConfig.id }, query: route.query }));
    } catch (error) {
        // Announced rather than shown in the list: the save did not happen, so the selection is still here to commit
        // again, and there is no space here this failure has taken.
        raiseAppFailure(new AppError('Failed to save data view.', 'dpuse-app.SelectConnectionList.handleCommitDetail', { typeId: 'handled' }, { cause: error }));
    }
}

function handleDeleteConnection(_connectionLocalisedConfig: LocalisedConfig<ConnectionConfig>): void {
    // TODO
}

// Opening never deselects.
function handleOpenConnection(connectionLocalisedConfig: LocalisedConfig<ConnectionConfig>): void {
    pickConnection(connectionLocalisedConfig.id);
    void handleCommitDetail();
}

function handleSelectConnection(connectionLocalisedConfig: LocalisedConfig<ConnectionConfig>): void {
    pickConnection(pickedConnectionId.value === connectionLocalisedConfig.id ? undefined : connectionLocalisedConfig.id);
}

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

// The saved data view itself when the connection is unchanged. A different one clears the later steps, because they were
// worked out from the connection it replaces.
function constructChoiceDataViewConfig(savedDataViewConfig: DataViewConfig, connectionId: string | undefined): DataViewConfig {
    if (connectionId === savedDataViewConfig.connectionId) return savedDataViewConfig;
    return {
        ...savedDataViewConfig,
        connectionId,
        connectionNodeConfig: undefined,
        previewConfig: undefined,
        contentAuditConfig: undefined,
        relationshipsAuditConfig: undefined
    };
}

// Does nothing while the data view is still loading, because the pick is a choice for that data view.
function pickConnection(connectionId: string | undefined): void {
    if (dataViewConfig.value == null) return;
    pickedConnectionId.value = connectionId;
    emit('choice-changed', constructChoiceDataViewConfig(dataViewConfig.value, connectionId));
}
</script>

<template>
    <ErrorNotice v-if="configRetrievalFailure" covers-region :can-retry="false" :failures="[configRetrievalFailure]" />

    <GridDetailPanel
        v-else
        :active-item="pickedConnectionLocalisedConfig"
        :add-label="t(TEXT, 'connection.label')"
        :data-source="connectionLocalisedConfigsDataSource"
        max-detail-width="65ch"
        :row-height="cardRowHeight"
        @add="handleAddConnection"
    >
        <template #item="{ item }">
            <ConfigCard v-if="item" :actions="ACTION_CONFIGS" :config="item" :selected="item.id === pickedConnectionId" @click="handleSelectConnection(item)" />
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
