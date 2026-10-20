<script setup lang="ts">
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
import { connectionLocalisedConfigs, findConnectionLocalisedConfig } from '@/state/configs';
import {
    constructNewDataViewConfig,
    NEW_DATA_VIEW_ID,
    resolveDataViewIdParameter,
    useCreateDataView,
    useDataView,
    useUpdateDataView
} from '@/features/studio/dataViews/_dataViews';

// ── Static Components
import ConfigCard from '@/components/ui/config/ConfigCard.vue';
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
    'draft-changed': [draftDataViewConfig?: DataViewConfig]; // The data view as the pick would leave it, shown above the step until it is saved.
    'task-completed': [taskLocalisedConfig: LocalisedConfig<TaskConfig>];
}>();

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

const route = useRoute();
const router = useRouter();

const { openDialog } = useDialogs();

// ── Data View ─ 'isPending' stops a second commit while the first is still saving. A data view being added is not
// saved until its connection is committed.
const { data: dataViewConfig } = useDataView(() => resolveDataViewIdParameter(route.params.dataViewId));
const { isPending: dataViewIsCreating, mutateAsync: createDataView } = useCreateDataView();
const { isPending: dataViewIsSaving, mutateAsync: updateDataView } = useUpdateDataView();

// ── Choice ─ The connection picked in this step, saved only when it is committed. Starts as the saved one.
const pickedConnectionId = ref<string>();

// ── Derived State ────────────────────────────────────────────────────────────────────────────────────────────────────

// ── Data View
const dataViewIsNew = computed(() => route.params.dataViewId === NEW_DATA_VIEW_ID);

const pickedConnectionLocalisedConfig = computed(() => findConnectionLocalisedConfig(pickedConnectionId.value));

// Cards here carry actions, which take a second row.
const cardRowHeight = useCardRowHeight(true);

const connectionLocalisedConfigsDataSource = computed<DataSource<LocalisedConfig<ConnectionConfig>>>(() => ({
    rowCount: connectionLocalisedConfigs.value.length, // Known, because 'DataViewsLayout' shows this list only once the configuration has arrived.
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
// picked again is not saved, so the data view keeps the later steps worked out from it. A data view being added is
// created here, and the URL is replaced rather than added to, so Back returns to the list rather than to an add that
// was never saved.
async function handleCommitDetail(): Promise<void> {
    if (pickedConnectionId.value == null || dataViewIsCreating.value || dataViewIsSaving.value) return;

    try {
        if (dataViewIsNew.value) {
            const createdDataViewConfig = await createDataView(pickedConnectionId.value);
            void ignoreReportedNavigationFailure(router.replace({ name: 'item', params: { dataViewId: createdDataViewConfig.id }, query: route.query }));
            return;
        }
        if (dataViewConfig.value == null) return; // Still loading, so there is nothing yet to save the pick to.
        const draftDataViewConfig = constructDraftDataViewConfig(dataViewConfig.value, pickedConnectionId.value);
        if (draftDataViewConfig !== dataViewConfig.value) await updateDataView(draftDataViewConfig);
        void ignoreReportedNavigationFailure(router.push({ name: 'item', params: { dataViewId: draftDataViewConfig.id }, query: route.query }));
    } catch (error) {
        // Announced rather than shown in the list: the save did not happen, so the selection is still here to commit
        // again, and there is no space here this failure has taken.
        const message = dataViewIsNew.value ? 'Failed to add data view.' : 'Failed to save data view.';
        raiseAppFailure(new AppError(message, 'dpuse-app.SelectConnectionList.handleCommitDetail', { typeId: 'handled' }, { cause: error }));
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
function constructDraftDataViewConfig(savedDataViewConfig: DataViewConfig, connectionId: string): DataViewConfig {
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

// Does nothing while a saved data view is still loading, because the pick is a choice for that data view. With nothing
// picked there is no draft, so the step shows the data view as it was. A data view being added starts from new.
function pickConnection(connectionId: string | undefined): void {
    const savedDataViewConfig = dataViewConfig.value;
    if (savedDataViewConfig == null && !dataViewIsNew.value) return;
    pickedConnectionId.value = connectionId;
    if (connectionId == null) emit('draft-changed');
    else if (savedDataViewConfig == null) emit('draft-changed', constructNewDataViewConfig(connectionId));
    else emit('draft-changed', constructDraftDataViewConfig(savedDataViewConfig, connectionId));
}
</script>

<template>
    <GridDetailPanel
        :selected-item="pickedConnectionLocalisedConfig"
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
