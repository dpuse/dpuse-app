<script setup lang="ts">
// ── External Dependencies & Registrations
import { ArrowRightIcon, PlusIcon } from '@lucide/vue';
import { computed, onUnmounted, ref, shallowRef, useTemplateRef, watch } from 'vue';
import { useConfirmDialog, useElementSize } from '@vueuse/core';
import { useRoute, useRouter } from 'vue-router';

// ── DPUse Framework
import { constructConnectorCategoryConfig } from '@dpuse/dpuse-shared';
import type { ConnectionConfig, DataViewConfig, LocalisedConfig } from '@dpuse/dpuse-shared';

// ── Local Framework
import { changeDataView } from '@/features/studio/dataViews/_dataViewDraft';
import type { DataSource } from '@/composables/useDataWindow';
import { defineLazyComponent } from '@/utilities/index.ts';
import { ignoreReportedNavigationFailure } from '@/router';
import { TEXT } from './SelectConnectionList_.json';
import { useDialogs } from '@/state/dialogs';
import { type Action, useCardRowHeight } from '@/components/ui/config/configCard';
import { connectionLocalisedConfigs, findConnectionLocalisedConfig } from '@/state/configs';
import {
    constructNewDataViewConfig,
    DATA_VIEW_ADD_ACTION_ID,
    DATA_VIEW_STEP_ACTION_ID,
    dataViewActionLabelsAreHidden,
    NEW_DATA_VIEW_ID,
    useCurrentDataView,
    useDataViews
} from '@/features/studio/dataViews/_dataViews';
import { localeId, t } from '@/state/locale';

// ── Static Components
import ConfigCard from '@/components/ui/config/ConfigCard.vue';
import ConfirmDialog from '@/components/ui/dialog/ConfirmDialog.vue';
import GridDetailPanel from '@/components/ui/grid/GridDetailPanel.vue';
import PillSegment from '@/components/ui/action/PillSegment.vue';
import SelectConnectionPanel from './SelectConnectionPanel.vue';
import SelectPlaceholder from '@/components/ui/placeholder/SelectPlaceholder.vue';
import type { TaskConfig } from '@/components/ui/TaskBar.vue';

// ── Dynamic Components
const EmptyPlaceholder = defineLazyComponent(() => import('@/components/ui/placeholder/EmptyPlaceholder.vue'), 'EmptyPlaceholder');

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

const ACTION_CONFIGS: Action<ConnectionConfig>[] = [{ typeId: 'open', onClick: handleOpenConnection }];
const LABELLED_ACTIONS_MIN_WIDTH_PX = 420; // The scroll buttons and the pill with its labels, with room to spare.

// ── Options, Props, Slots & Emits ────────────────────────────────────────────────────────────────────────────────────

const { taskLocalisedConfig } = defineProps<{ taskLocalisedConfig: LocalisedConfig<TaskConfig> }>();

const emit = defineEmits<{
    'task-completed': [taskLocalisedConfig: LocalisedConfig<TaskConfig>];
}>();

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

const route = useRoute();
const router = useRouter();

const { openDialog } = useDialogs();

const gridDetailPanelComponent = useTemplateRef<{ detailPaneIsVisible: boolean; gridPaneIsVisible: boolean; isNarrow: boolean }>('gridDetailPanel'); // Typed by what it exposes, because 'GridDetailPanel' is generic.
const connectionPanelComponent = useTemplateRef('connectionPanel');
const { width: connectionPanelWidth } = useElementSize(() => connectionPanelComponent.value?.$el as HTMLElement | undefined);

// ── Data View
const { data: dataViewConfig, savedData: savedDataViewConfig } = useCurrentDataView(() => route.params.dataViewId);

// ── Choice ─ The connection picked in this step. Starts as the data view's own.
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

// ── Add Pill ─ Under the list, as on the data view list. When the list fills the pane, that spot is under the data
// view's pill, so the add action joins that pill instead. It goes with the list when a detail replaces it.
const addPillIsInActionRow = computed(() => gridDetailPanelComponent.value?.isNarrow === true);
const addPillIsShownInActionRow = computed(() => addPillIsInActionRow.value && gridDetailPanelComponent.value?.gridPaneIsVisible === true);

// ── Detail Actions ─ The scroll buttons act on the detail, so they go when the list covers it. Beside the list, the
// pill must fit inside the detail pane, or it would run into the list's add pill. A narrow pane leaves the labels to the
// row's own width.
const detailActionsAreShown = computed(() => gridDetailPanelComponent.value?.detailPaneIsVisible === true);
const actionLabelsAreHidden = computed(() => !addPillIsInActionRow.value && connectionPanelWidth.value > 0 && connectionPanelWidth.value < LABELLED_ACTIONS_MIN_WIDTH_PX);

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

// Taken from the data view once it arrives, so a reload or a return to this step shows its connection picked.
watch(
    () => dataViewConfig.value?.id,
    () => {
        pickedConnectionId.value = dataViewConfig.value?.connectionId;
    },
    { immediate: true }
);

// The pill belongs to the layout, so its labels are hidden from here, and shown again when this step closes.
watch(
    actionLabelsAreHidden,
    (newActionLabelsAreHidden) => {
        dataViewActionLabelsAreHidden.value = newActionLabelsAreHidden;
    },
    { immediate: true }
);
onUnmounted(() => {
    dataViewActionLabelsAreHidden.value = false;
});

// ── Event Handlers ───────────────────────────────────────────────────────────────────────────────────────────────────

function handleAddConnection(): void {
    void openDialog('connection');
}

function handleMoveToItemStep(): void {
    if (pickedConnectionId.value == null) return;

    emit('task-completed', taskLocalisedConfig);
    void ignoreReportedNavigationFailure(router.push({ name: 'item', params: { dataViewId: route.params.dataViewId }, query: route.query }));
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
    handleMoveToItemStep();
}

// A card stays picked when tapped again, as in a select. On a narrow screen, coming back to the list hides the picked
// card's detail, so the tap opens it again. Beside the list the detail is already showing, so the tap changes nothing.
function handleSelectConnection(connectionLocalisedConfig: LocalisedConfig<ConnectionConfig>, openDetail: () => void): void {
    if (pickedConnectionId.value === connectionLocalisedConfig.id) openDetail();
    else pickConnection(connectionLocalisedConfig.id);
}

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

// A different connection clears the later steps, because they were worked out from the connection it replaces. Going
// back to the saved connection brings its later steps back too.
function constructDraftDataViewConfig(connectionId: string): DataViewConfig {
    if (savedDataViewConfig.value?.connectionId === connectionId) return savedDataViewConfig.value;
    if (dataViewConfig.value == null) return constructNewDataViewConfig(connectionId);
    return {
        ...dataViewConfig.value,
        connectionId,
        connectionNodeConfig: undefined,
        readingConfig: undefined,
        sampleConfig: undefined,
        contentAuditConfig: undefined,
        columnChoiceConfigs: undefined
    };
}

// Does nothing while a saved data view is still loading, because the pick is a choice for that data view.
function pickConnection(connectionId: string): void {
    if (dataViewConfig.value == null && !dataViewIsNew.value) return;

    pickedConnectionId.value = connectionId;
    if (connectionId !== dataViewConfig.value?.connectionId) changeDataView(constructDraftDataViewConfig(connectionId));
}
</script>

<template>
    <GridDetailPanel
        ref="gridDetailPanel"
        :selected-item="pickedConnectionLocalisedConfig"
        :add-label="addPillIsInActionRow ? undefined : t(TEXT, 'connection.label')"
        :data-source="connectionLocalisedConfigsDataSource"
        max-detail-width="65ch"
        :row-height="cardRowHeight"
        :target-column-width="340"
        @add="handleAddConnection"
    >
        <!-- Pill Actions ─ In the header slot because it is always rendered. Select stays in the pill, dimmed until a
             connection is picked, because it is the step's way on. -->
        <template #header>
            <Teleport defer :to="`#${DATA_VIEW_ADD_ACTION_ID}`">
                <Transition name="dpuse-pill-segment">
                    <PillSegment v-if="addPillIsShownInActionRow" :icon="PlusIcon" :label="t(TEXT, 'connection.label')" @click="handleAddConnection" />
                </Transition>
            </Teleport>
            <Teleport defer :to="`#${DATA_VIEW_STEP_ACTION_ID}`">
                <PillSegment
                    :disabled="pickedConnectionId == null"
                    :disabled-reason="t(TEXT, 'detail.select.disabled.text')"
                    :icon="ArrowRightIcon"
                    :is-label-hidden="actionLabelsAreHidden"
                    is-step-action
                    :label="t(TEXT, 'detail.select.label')"
                    @click="handleMoveToItemStep"
                />
            </Teleport>
        </template>

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
            <SelectConnectionPanel
                ref="connectionPanel"
                :connection-localised-config="item"
                :scroll-end-buttons-are-shown="detailActionsAreShown"
                @close="close"
                @delete="handleDeleteConnection(item)"
                @hide="handleHideConnection(item)"
            />
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
