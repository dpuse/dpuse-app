<script setup lang="ts">
// Template Notes — TODO: Revisit later. These belong beside their elements in the template, but a comment at the
// template's root breaks the fade between route views in development: Vue never reports the old view as gone, so the
// next one never appears. Production builds strip comments, so only development is affected.
// - Engine error notice: covers the region, because without the engine there is nothing to list, preview or open here.

// ── External Dependencies & Registrations
import type { ColumnDef } from '@tanstack/vue-table';
import { until } from '@vueuse/core';
import { ArrowRightIcon, FileIcon, FolderIcon, HomeIcon } from '@lucide/vue';
import { computed, markRaw, ref, shallowRef, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

// ── DPUse Framework
import { AppError, formatNumberAsDecimalNumber, formatNumberAsStorageSize } from '@dpuse/dpuse-shared';
import type {
    ConnectionConfig,
    ConnectionNodeConfig,
    DataViewConfig,
    GetInfoOptions,
    GetInfoResult,
    ListNodesOptions,
    ListNodesResult,
    LocalisedConfig,
    PreviewConfig,
    PreviewObjectOptions
} from '@dpuse/dpuse-shared';

// ── Local Framework
import { constructItemPath } from '../dataViewSummary';
import type { DataSource } from '@/composables/useDataWindow';
import { ignoreReportedNavigationFailure } from '@/router';
import { t } from '@/state/locale';
import { TEXT } from './SelectItemPanel_.json';
import { useEngine } from '@/services/useEngine';
import { type AppFailure, raiseAppFailure, raiseFailure } from '@/state/errors';
import { connectionLocalisedConfigs, useDataView, useUpdateDataView } from '@/state/dataViews';

// ── Static Components
import Breadcrumbs from '@/components/ui/Breadcrumbs.vue';
import ConfigCard from '@/components/ui/config/ConfigCard.vue';
import ErrorNotice from '@/components/ui/error/ErrorNotice.vue';
import GridDetailPanel from '@/components/ui/grid/GridDetailPanel.vue';
import PillButton from '@/components/ui/action/PillButton.vue';
import SelectPlaceholder from '@/components/ui/placeholder/SelectPlaceholder.vue';
import Table from '@/components/ui/table/Table.vue';
import type { TableFeatureSet } from '@/components/ui/table/tableFeatures';
import type { TaskConfig } from '@/components/ui/TaskBar.vue';
import TextViewer from '@/components/ui/text/TextViewer.vue';

const ITEM_ACTIONS = [
    { id: 'table', label: 'Table' },
    { id: 'text', label: 'Text' },
    { id: 'details', label: 'Details' }
];

// useDataWindow's retry-with-backoff (~900ms total) is tuned for transient blips, not a cold app boot — on a fresh
// deploy in particular, downloading new bundles, waking configMonitor/accountMonitor's Durable Objects, and then
// resolving the active connection via the data view's own engine round-trip can easily take longer than that. So instead of a short fixed retry, wait directly on the value itself.
// Deciding whether the connection has genuinely disappeared (vs. just not resolved yet) is DataViewsLayout's
// job, not this function's — it redirects away (unmounting this component) once that's confirmed, so this only
// needs a generous timeout as a last-resort bail-out for the case where neither ever happens.
const ACTIVE_CONNECTION_CONFIG_WAIT_TIMEOUT_MS = 20_000;

// The header record and ten data records: enough for the data view document to show the item's data, without storing
// the whole preview in every data view record.
const SAVED_PREVIEW_RECORD_COUNT = 11;

// ── Options, Props, Slots & Emits ────────────────────────────────────────────────────────────────────────────────────

const { taskLocalisedConfig } = defineProps<{ taskLocalisedConfig: LocalisedConfig<TaskConfig> }>();

const emit = defineEmits<{
    'choice-changed': [choiceDataViewConfig: DataViewConfig | undefined]; // The data view as the pick would leave it, shown above the step until it is saved.
    'task-completed': [taskLocalisedConfig: LocalisedConfig<TaskConfig>];
}>();

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

const activeItemAction = ref('table');

const activeConnectionObjectConfig = shallowRef<ConnectionNodeConfig | undefined>();

// Whatever the engine could not do for this panel — list a folder, preview an item, read its info. One ref for all
// three, because they are one loss to the user: the panel cannot reach the connection.
const engineFailure = shallowRef<AppFailure | undefined>();
const engineAttempt = ref(0); // Bumped on retry, which rebuilds the data source and makes the window fetch again.

const currentFolderNodes = shallowRef<ConnectionNodeConfig[]>([]);

const currentFolderPath = ref('');

const previewRequestId = ref(0);
const activePreviewConfig = shallowRef<PreviewConfig>(); // Kept so the commit can save it with the item.

const previewPercentage = ref(0);
const previewMessage = ref<string>();
const previewTableColumnDefinitions = shallowRef<ColumnDef<TableFeatureSet, Record<string, string | null>>[]>([]);
const previewTableDataSource = shallowRef<DataSource<Record<string, string | null>>>({
    rowCount: 0,
    getRows: (): Promise<{ rows: Record<string, string | null>[] }> => Promise.resolve({ rows: [] })
});

const route = useRoute();
const router = useRouter();

// Data View — 'isPending' stops a second commit while the first is still saving.
const { data: dataViewConfig } = useDataView(() => (typeof route.params.dataViewId === 'string' ? route.params.dataViewId : undefined));
const { isPending: dataViewIsSaving, mutateAsync: updateDataView } = useUpdateDataView();

const text = ref<string | undefined>();

// TODO: Fix this icon data type compatibility issue.
const homeBreadcrumb = { id: 'home', icon: markRaw(HomeIcon), label: 'Home' } as unknown as ConnectionNodeConfig;

// ── Derived State ────────────────────────────────────────────────────────────────────────────────────────────────────

// The saved connection, which this step lists the items of. Looked up again from the list, so it follows a change of
// language.
const activeConnectionConfig = computed(() => connectionLocalisedConfigs.value.find((config) => config.id === dataViewConfig.value?.connectionId));

const breadcrumbs = computed<ConnectionNodeConfig[]>(() => [homeBreadcrumb, ...currentFolderNodes.value]);

const connectionNodeConfigsDataSource = computed<DataSource<LocalisedConfig<ConnectionNodeConfig>>>(() => {
    const folderPath = currentFolderPath.value; // Read synchronously so this computed (and useDataWindow's cache) resets on navigation.
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions -- Read so Vue tracks it as a dependency.
    engineAttempt.value; // Read for the same reason: a retry has to produce a new data source for the window to refetch.
    return {
        rowCount: undefined, // Unknown until the first listNodes response reports totalCount — useDataWindow guarantees that fetch happens.
        getRows: async (start: number, end: number): Promise<{ rows: LocalisedConfig<ConnectionNodeConfig>[]; totalCount: number }> => {
            try {
                const activeConnection = await waitForActiveConnectionConfig();
                const { processRequest } = await useEngine();
                const result = (await processRequest('listNodes', activeConnection, {
                    folderPath,
                    limit: end - start,
                    offset: start
                } as ListNodesOptions)) as ListNodesResult;
                return { rows: result.connectionNodeConfigs as unknown as LocalisedConfig<ConnectionNodeConfig>[], totalCount: result.totalCount };
            } catch (error) {
                // Settled with an empty page as well as raised: the window is waiting on this promise, and a rejection
                // would leave it loading behind the failure it is being told about.
                const data = { folderPath, typeId: 'handled' };
                engineFailure.value = raiseFailure(new AppError('Failed to list the items in this connection.', 'dpuse-app.SelectItemPanel.getRows', data, { cause: error }));
                return { rows: [], totalCount: 0 };
            }
        }
    };
});

// ── Side Effects ─────────────────────────────────────────────────────────────────────────────────────────────────────

// Opens the saved item's folder with the item selected, so a reload or a return to this step shows what was saved; a
// pick that was never saved is not restored. Keyed on the connection's id, so a change of language, which re-localises
// the same connection, does not send the list back to the top folder.
watch(
    () => activeConnectionConfig.value?.id,
    () => {
        const savedItemConfig = dataViewConfig.value?.connectionNodeConfig;
        currentFolderNodes.value = savedItemConfig ? constructFolderNodeConfigs(savedItemConfig.folderPath) : [];
        activeConnectionObjectConfig.value = savedItemConfig;
        loadFolderNodes(activeConnectionConfig.value, savedItemConfig?.folderPath ?? '');
    },
    { immediate: true }
);

watch(activeConnectionObjectConfig, async (newActiveItem) => {
    const currentRequestId = ++previewRequestId.value;
    resetPreviewState();
    if (newActiveItem == null) return;

    try {
        const { processRequest } = await useEngine();
        if (!activeConnectionConfig.value) return;

        const options: PreviewObjectOptions = { chunkSize: undefined, extension: undefined, path: constructItemPath(newActiveItem) };
        const previewConfig = (await processRequest('previewObject', activeConnectionConfig.value, options)) as PreviewConfig;
        if (currentRequestId !== previewRequestId.value || activeConnectionObjectConfig.value !== newActiveItem) return;

        applyPreviewConfig(newActiveItem, previewConfig);
    } catch (error) {
        if (currentRequestId !== previewRequestId.value) return; // A newer selection owns the panel now.
        const data = { typeId: 'handled' };
        engineFailure.value = raiseFailure(new AppError('Failed to preview this item.', 'dpuse-app.SelectItemPanel', data, { cause: error }));
    }
});

// ── Event Handlers ───────────────────────────────────────────────────────────────────────────────────────────────────

// Clearing the failure alone would show the panel again with the same empty window behind it, so the attempt count is
// bumped too: that rebuilds the data source, which is what makes the window ask for its rows a second time.
function handleRetryEngine(): void {
    engineFailure.value = undefined;
    engineAttempt.value++;
}

function handleSelectBreadcrumb(index: number, connectionNodeConfig: ConnectionNodeConfig): void {
    pickItem();
    if (index <= 0) {
        currentFolderNodes.value = [];
        loadFolderNodes(activeConnectionConfig.value, '');
        return;
    }

    currentFolderNodes.value = currentFolderNodes.value.slice(0, index);
    loadFolderNodes(activeConnectionConfig.value, `${connectionNodeConfig.folderPath}/${connectionNodeConfig.name}`);
}

function handleSelectConnectionNode(connectionNodeConfig: ConnectionNodeConfig | undefined): void {
    if (connectionNodeConfig == null) {
        pickItem(); // Clears the selection.
        return;
    }

    if (connectionNodeConfig.typeId === 'folder') {
        currentFolderNodes.value = [...currentFolderNodes.value, connectionNodeConfig];
        pickItem();
        loadFolderNodes(activeConnectionConfig.value, `${connectionNodeConfig.folderPath}/${connectionNodeConfig.name}`);
        return;
    }

    pickItem(connectionNodeConfig);
}

// Saved before moving on, so a reload restores the item, and the data view document can show its structure and data.
async function handleCommitDetail(): Promise<void> {
    const connectionNodeConfig = activeConnectionObjectConfig.value;
    const previewConfig = activePreviewConfig.value;
    if (connectionNodeConfig == null || previewConfig == null || dataViewIsSaving.value || dataViewConfig.value == null) return;

    try {
        const savedDataViewConfig = await updateDataView({
            ...dataViewConfig.value,
            connectionNodeConfig: constructStorableNodeConfig(connectionNodeConfig),
            previewConfig: {
                ...previewConfig,
                inferenceRecords: previewConfig.inferenceRecords.slice(0, SAVED_PREVIEW_RECORD_COUNT),
                parsedRecords: previewConfig.parsedRecords.slice(0, SAVED_PREVIEW_RECORD_COUNT),
                text: undefined // The raw text is the whole preview again, so it is not kept.
            },
            contentAuditConfig: undefined,
            relationshipsAuditConfig: undefined
        });
        emit('task-completed', taskLocalisedConfig);
        void ignoreReportedNavigationFailure(router.push({ name: 'content', params: { dataViewId: savedDataViewConfig.id }, query: route.query }));
    } catch (error) {
        // Announced rather than shown in the panel: the save did not happen, so the item is still here to commit again.
        raiseAppFailure(new AppError('Failed to save data view.', 'dpuse-app.SelectItemPanel.handleCommitDetail', { typeId: 'handled' }, { cause: error }));
    }
}

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

// Read again after waiting rather than taken from 'until', which resolves on the timeout too.
async function waitForActiveConnectionConfig(): Promise<LocalisedConfig<ConnectionConfig>> {
    await until(activeConnectionConfig).toBeTruthy({ timeout: ACTIVE_CONNECTION_CONFIG_WAIT_TIMEOUT_MS });
    if (activeConnectionConfig.value == null) throw new Error('Timed out waiting for an active connection config.');
    return activeConnectionConfig.value;
}

// The pick is saved only when it is committed. It is reported as soon as it is made, so the summary above the step
// shows it; the later steps are cleared in what is reported, because they were worked out from the item it replaces.
function pickItem(connectionNodeConfig?: ConnectionNodeConfig): void {
    activeConnectionObjectConfig.value = connectionNodeConfig;
    if (dataViewConfig.value == null) return;
    emit('choice-changed', {
        ...dataViewConfig.value,
        connectionNodeConfig: connectionNodeConfig ? constructStorableNodeConfig(connectionNodeConfig) : undefined,
        previewConfig: undefined,
        contentAuditConfig: undefined,
        relationshipsAuditConfig: undefined
    });
}

// The breadcrumb trail down to a folder, rebuilt from its path because only the item itself is saved. Each crumb's
// 'folderPath' and 'name' join back into the path to that folder, as a listed folder's do.
function constructFolderNodeConfigs(folderPath: string): ConnectionNodeConfig[] {
    const names = folderPath.split('/').filter((name) => name !== '');
    return names.map((name, index) => ({
        id: `/${names.slice(0, index + 1).join('/')}`,
        label: name,
        description: '',
        icon: null,
        iconDark: null,
        childCount: undefined,
        childNodes: [],
        extension: undefined,
        folderPath: index === 0 ? '' : `/${names.slice(0, index).join('/')}`,
        handle: undefined,
        lastModifiedAt: undefined,
        mimeType: undefined,
        name,
        size: undefined,
        typeId: 'folder'
    }));
}

// A file handle cannot be stored, and children are listed afresh.
function constructStorableNodeConfig(connectionNodeConfig: ConnectionNodeConfig): ConnectionNodeConfig {
    return { ...connectionNodeConfig, childNodes: [], handle: undefined };
}

function resetPreviewState(): void {
    activePreviewConfig.value = undefined;
    previewPercentage.value = 0;
    previewMessage.value = undefined;
    previewTableColumnDefinitions.value = [];
    previewTableDataSource.value = {
        rowCount: 0,
        getRows: (): Promise<{ rows: Record<string, string | null>[] }> => Promise.resolve({ rows: [] })
    };
    text.value = undefined;
}

function applyPreviewConfig(connectionNodeConfig: ConnectionNodeConfig, previewConfig: PreviewConfig): void {
    activePreviewConfig.value = previewConfig;
    const previewSize = previewConfig.size ?? 0;
    const nodeSize = connectionNodeConfig.size ?? 0;
    previewPercentage.value = nodeSize > 0 ? (previewSize / nodeSize) * 100 : 0;
    if (nodeSize === 0) {
        previewMessage.value = `Previewing ${formatNumberAsStorageSize(previewSize)} (total size unknown)`;
    } else if (previewSize === nodeSize) {
        previewMessage.value = `Previewing ${formatNumberAsStorageSize(previewSize)} (entire file)`;
    } else {
        previewMessage.value = `Previewing ${formatNumberAsStorageSize(previewSize)} of ${formatNumberAsStorageSize(nodeSize)} (${formatNumberAsDecimalNumber(previewPercentage.value, 1, 0)}%)`;
    }
    text.value = previewConfig.text;

    const previewColumnKeys = previewConfig.columnConfigs.map((config, index) => config.label.en ?? String(index));

    previewTableColumnDefinitions.value = previewColumnKeys.map<ColumnDef<TableFeatureSet, Record<string, string | null>>>((columnKey) => ({
        accessorKey: columnKey,
        header: columnKey
    }));

    const dataOffset = 1;
    const previewRows = previewConfig.parsedRecords
        .slice(dataOffset)
        .map((record) => Object.fromEntries(record.map((cell, index) => [previewColumnKeys[index] ?? String(index), cell.value])) as Record<string, string | null>);

    previewTableDataSource.value = {
        rowCount: previewRows.length,
        getRows: (start: number, end: number): Promise<{ rows: Record<string, string | null>[] }> => Promise.resolve({ rows: previewRows.slice(start, end) })
    };
}

// Navigate to a folder. Setting currentFolderPath is all that's needed: connectionNodeConfigsDataSource picks it
// up reactively, producing a new DataSource object that useDataWindow detects and fetches fresh blocks for.
function loadFolderNodes(connectionConfig: LocalisedConfig<ConnectionConfig> | undefined, folderPath: string): void {
    if (connectionConfig == null) return;
    currentFolderPath.value = folderPath;
}

const infoString = ref('');

async function getInfo(connectionNodeConfig: ConnectionNodeConfig): Promise<void> {
    try {
        const activeConnection = await waitForActiveConnectionConfig();
        const { processRequest } = await useEngine();
        const options: GetInfoOptions = { path: constructItemPath(connectionNodeConfig) };
        const { info } = (await processRequest('getInfo', activeConnection, options)) as GetInfoResult;
        const infoWithoutChildren = { ...info };
        delete infoWithoutChildren.children;
        infoString.value = JSON.stringify(infoWithoutChildren);
        console.log(infoWithoutChildren);
    } catch (error) {
        const data = { typeId: 'handled' };
        engineFailure.value = raiseFailure(new AppError('Failed to read this item.', 'dpuse-app.SelectItemPanel.getInfo', data, { cause: error }));
    }
}
</script>

<template>
    <ErrorNotice v-if="engineFailure" covers-region :failures="[engineFailure]" @retry="handleRetryEngine" />

    <GridDetailPanel v-else :active-item="activeConnectionObjectConfig" :data-source="connectionNodeConfigsDataSource" :is-compact="true" max-grid-width="400px">
        <template #header="{ isSplit }">
            <div class="flex h-full min-w-0 items-center border-b border-separator px-4 text-sm">
                <!-- The last crumb is the item on show. It leads back to the list, so it stays live only while the list
                     is hidden; 'isSplit' comes from the panel below so the two cannot disagree about that. -->
                <Breadcrumbs class="h-9.25 flex-1" :items="breadcrumbs" :disable-last="isSplit || activeConnectionObjectConfig == null" @select="handleSelectBreadcrumb" />
            </div>
        </template>

        <template #item="{ item }">
            <!-- <ConfigCard v-if="item" :actions="[{ typeId: 'info', onClick: () => getInfo(item) }]" :config="item" :is-compact="true" @click="handleSelectConnectionNode(item)" /> -->
            <!-- The icon and the overline tell a folder, which opens, from an item, which is picked. The overline is not shown
                 on a compact row, but it is read out before the name, so screen readers hear which one it is too. -->
            <ConfigCard
                v-if="item"
                :config="item"
                :fallback-icon="item.typeId === 'folder' ? FolderIcon : FileIcon"
                :is-compact="true"
                :overline="t(TEXT, item.typeId === 'folder' ? 'folder.label' : 'item.label')"
                @click="handleSelectConnectionNode(item)"
            />
        </template>

        <template #detail>
            <div class="relative flex min-h-0 flex-1 flex-col">
                <!-- The usual room after the last row, less the status bar's height: the table already ends above it. -->
                <Table
                    v-show="activeItemAction === 'table'"
                    class="flex-1"
                    :column-definitions="previewTableColumnDefinitions"
                    :data-source="previewTableDataSource"
                    is-column-picker-hidden
                    scroll-area-padding-bottom="calc(var(--vertical-scroll-bottom-screen-inset) - var(--status-bar-height))"
                />
                <TextViewer v-show="activeItemAction === 'text'" class="flex-1" :text="text" />
                <div v-show="activeItemAction === 'details'" class="flex-1 overflow-y-auto overscroll-y-none text-sm">{{ activeConnectionObjectConfig }}</div>
                <!-- How much of the item the preview read, as a thin accent line along the top edge over a neutral bar. A meter
                     rather than a progress bar, because it shows a settled amount, not work under way. -->
                <div
                    :aria-label="t(TEXT, 'preview.aria')"
                    aria-valuemax="100"
                    aria-valuemin="0"
                    :aria-valuenow="Math.round(previewPercentage)"
                    :aria-valuetext="previewMessage"
                    class="relative flex h-(--status-bar-height) w-full flex-none items-center justify-center overflow-hidden border-t border-separator bg-card pt-0.75 text-xs text-muted"
                    role="meter"
                >
                    <div class="absolute top-0 left-0 h-0.75 bg-accent/40" :style="{ width: `${previewPercentage}%` }" />
                    <!-- Centred in the space below the blue line ('pt-0.75' clears its 3px), and trimmed to its letters so it is
                         centred on them rather than sitting high in its line box. -->
                    <div class="relative pl-1 [text-box:trim-both_cap_alphabetic]">{{ previewMessage }}</div>
                </div>
            </div>
        </template>

        <template #detail-action>
            <!-- Disabled until the preview arrives, because the preview is what the commit saves with the item. -->
            <PillButton :disabled="activePreviewConfig == null || dataViewIsSaving" :icon="ArrowRightIcon" label="Select" @click="handleCommitDetail" />
        </template>

        <template #no-selection>
            {{ infoString }}
            <SelectPlaceholder :message="'Select a connection node from the list.'" />
        </template>
    </GridDetailPanel>
</template>
