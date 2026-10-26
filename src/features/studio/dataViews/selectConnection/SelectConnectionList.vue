<script setup lang="ts">
// ── External Dependencies & Registrations
import { ArrowRightIcon } from '@lucide/vue';
import { useConfirmDialog } from '@vueuse/core';
import { computed, ref, shallowRef, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

// ── DPUse Framework
import { AppError, constructConnectorCategoryConfig } from '@dpuse/dpuse-shared';
import type { ConnectionConfig, DataViewConfig, LocalisedConfig } from '@dpuse/dpuse-shared';

// ── Local Framework
import type { DataSource } from '@/composables/useDataWindow';
import { defineLazyComponent } from '@/utilities/index.ts';
import { ignoreReportedNavigationFailure } from '@/router';
import { raiseAppFailure } from '@/state/errors';
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
    useDataViews,
    useUpdateDataView
} from '@/features/studio/dataViews/_dataViews';
import { localeId, t } from '@/state/locale';

// ── Static Components
import ConfigCard from '@/components/ui/config/ConfigCard.vue';
import ConfirmDialog from '@/components/ui/dialog/ConfirmDialog.vue';
import GridDetailPanel from '@/components/ui/grid/GridDetailPanel.vue';
import PillButton from '@/components/ui/action/PillButton.vue';
import SelectConnectionPanel from './SelectConnectionPanel.vue';
import SelectPlaceholder from '@/components/ui/placeholder/SelectPlaceholder.vue';
import type { TaskConfig } from '@/components/ui/TaskBar.vue';

// ── Dynamic Components
const EmptyPlaceholder = defineLazyComponent(() => import('@/components/ui/placeholder/EmptyPlaceholder.vue'), 'EmptyPlaceholder');

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

const ACTION_CONFIGS: Action<ConnectionConfig>[] = [{ typeId: 'open', onClick: handleOpenConnection }];

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

// ── Removal Confirmation ─ One dialog for deleting and hiding, because a connection offers one or the other.
const { data: dataViewConfigs } = useDataViews(); // Counted in the warning about the data views that use the connection.
const { cancel: cancelRemoval, confirm: confirmRemoval, isRevealed: removalConfirmIsOpen, reveal: revealRemovalConfirm } = useConfirmDialog();
const removingConnection = shallowRef<{ action: 'delete' | 'hide'; connectionLocalisedConfig: LocalisedConfig<ConnectionConfig> }>(); // Kept after the dialog closes, so its text does not blank while it fades out.

// ── Derived State ────────────────────────────────────────────────────────────────────────────────────────────────────

// ── Data View
const dataViewIsNew = computed(() => route.params.dataViewId === NEW_DATA_VIEW_ID);

const pickedConnectionLocalisedConfig = computed(() => findConnectionLocalisedConfig(pickedConnectionId.value));

// Cards here carry actions, which take a second row.
const cardRowHeight = useCardRowHeight(true);

// ── Removal Confirmation ─ The data views that use the connection are named in the question, so the user decides
// knowing what it leaves without a connection.
const removalConfirmText = computed(() => {
    const removal = removingConnection.value;
    if (removal == null) return '';
    const { action, connectionLocalisedConfig } = removal;
    const questionText = t(TEXT, `${action}.confirm.text`, { name: connectionLocalisedConfig.label });
    const count = dataViewConfigs.value?.filter((dataViewConfig) => dataViewConfig.connectionId === connectionLocalisedConfig.id).length ?? 0;
    if (count === 0) return questionText;
    const inUseKey: keyof typeof TEXT = count === 1 ? `${action}.inUse.one.text` : `${action}.inUse.other.text`;
    return `${questionText} ${t(TEXT, inUseKey, { count })}`;
});

// ── Connector Categories ─ The category each card names, keyed by connection id, as data view cards name theirs.
const connectorCategoryLabelsById = computed(
    () => new Map(connectionLocalisedConfigs.value.map((config) => [config.id, constructConnectorCategoryConfig(config.connectorConfig.categoryId, localeId.value).label]))
);

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

async function handleDeleteConnection(connectionLocalisedConfig: LocalisedConfig<ConnectionConfig>): Promise<void> {
    removingConnection.value = { action: 'delete', connectionLocalisedConfig };
    const { isCanceled } = await revealRemovalConfirm();
    if (isCanceled) return;
    // TODO: Delete the connection, once connections can be deleted.
}

async function handleHideConnection(connectionLocalisedConfig: LocalisedConfig<ConnectionConfig>): Promise<void> {
    removingConnection.value = { action: 'hide', connectionLocalisedConfig };
    const { isCanceled } = await revealRemovalConfirm();
    if (isCanceled) return;
    // TODO: Hide the connection, once connections can be hidden.
}

// Opening never deselects.
function handleOpenConnection(connectionLocalisedConfig: LocalisedConfig<ConnectionConfig>): void {
    pickConnection(connectionLocalisedConfig.id);
    void handleCommitDetail();
}

// A card stays picked when tapped again, as in a select. On a narrow screen, coming back to the list hides the picked
// card's detail, so the tap opens it again. Beside the list the detail is already showing, so the tap changes nothing.
function handleSelectConnection(connectionLocalisedConfig: LocalisedConfig<ConnectionConfig>, openDetail: () => void): void {
    if (pickedConnectionId.value === connectionLocalisedConfig.id) openDetail();
    else pickConnection(connectionLocalisedConfig.id);
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
        :target-column-width="340"
        @add="handleAddConnection"
    >
        <!-- 'is-inert' ─ Beside the list, the picked card's detail is already showing, so a click on it does nothing and the
             card does not look clickable. -->
        <template #item="{ isSplit, item, openDetail }">
            <ConfigCard
                v-if="item"
                :actions="ACTION_CONFIGS"
                :category-label="connectorCategoryLabelsById.get(item.id)"
                :config="item"
                :is-inert="isSplit && item.id === pickedConnectionId"
                :selected="item.id === pickedConnectionId"
                @click="handleSelectConnection(item, openDetail)"
            />
        </template>

        <template #detail="{ item, close }">
            <SelectConnectionPanel :connection-localised-config="item" @close="close" @delete="handleDeleteConnection(item)" @hide="handleHideConnection(item)" />
            <!-- In the detail rather than beside the list, because this component must stay single-root for the route's
                 transition, and only the detail offers Delete and Hide. A dialog takes no room in the layout. -->
            <ConfirmDialog
                :confirm-label="t(TEXT, `${removingConnection?.action ?? 'delete'}.confirm.label`)"
                :confirm-variant="removingConnection?.action === 'hide' ? 'guarded' : 'destructive'"
                :is-open="removalConfirmIsOpen"
                :message="removalConfirmText"
                :title="t(TEXT, `${removingConnection?.action ?? 'delete'}.confirm.title`)"
                @cancel="cancelRemoval"
                @confirm="confirmRemoval"
            />
        </template>

        <template #detail-action>
            <PillButton :icon="ArrowRightIcon" :label="t(TEXT, 'detail.select.label')" @click="handleCommitDetail" />
        </template>

        <template #no-items>
            <EmptyPlaceholder
                :message-item-label="t(TEXT, 'connection.other.text')"
                :description-item-label="t(TEXT, 'connection.new.text')"
                :action-item-label="t(TEXT, 'connection.label')"
                @add="handleAddConnection"
            />
        </template>

        <template #no-selection>
            <SelectPlaceholder :message="t(TEXT, 'noSelection.text')" />
        </template>
    </GridDetailPanel>
</template>
