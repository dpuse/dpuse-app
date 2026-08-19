<script setup lang="ts">
// ── External Dependencies & Registrations
import { ArrowBigRightIcon } from '@lucide/vue';
import type { ColumnDef } from '@tanstack/vue-table';
import { computed, markRaw, ref, shallowRef, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

// ── DPUse Framework
import type { LocalisedConfig } from '@dpuse/dpuse-shared/locale';
import type { PreviewConfig } from '@dpuse/dpuse-shared/component/dataView';
import type { ConnectionConfig, ConnectionNodeConfig } from '@dpuse/dpuse-shared/component/connection';
import { formatNumberAsDecimalNumber, formatNumberAsStorageSize } from '@dpuse/dpuse-shared/utilities';
import type { GetInfoOptions, GetInfoResult, ListNodesOptions, ListNodesResult, PreviewObjectOptions } from '@dpuse/dpuse-shared/component/module/connector';

// ── Local Framework
import { activeMetaStoreConnectionConfig } from '@/state/session';
import type { DataSource } from '@/composables/useDataWindow';
import T from './SelectItemPanel.json';
import { t } from '@/state/locale';
import { useEngine } from '@/services/useEngine';
import { viewportIsWide } from '@/state/appLayout';
import { activeConnectionConfig, activeDataViewConfig, connectionLocalisedConfigs, getDataViewRecord, setConnectionNodeConfig } from '@/state/dataViews';

// ── Local Components - Static
import Breadcrumbs from '@/components/framework/Breadcrumbs.vue';
import ConfigCard from '@/components/framework/ConfigCard.vue';
import GridDetailPanel from '@/components/framework/GridDetailPanel.vue';
import HomeIcon from '@/components/icons/HomeIcon.vue';
import SelectPlaceholder from '@/components/ui/placeholders/SelectPlaceholder.vue';
import StepActionButton from '@/components/ui/button/StepActionButton.vue';
import Table from '@/components/ui/table/Table.vue';
import type { TableFeatureSet } from '@/components/ui/table/tableFeatures';
import type { TaskConfig } from '@/components/ui/TaskBar.vue';
import TextViewer from '@/components/ui/TextViewer.vue';

const ITEM_ACTIONS = [
    { id: 'table', label: 'Table' },
    { id: 'text', label: 'Text' },
    { id: 'details', label: 'Details' }
];

// useDataWindow's retry-with-backoff (~900ms total) is tuned for transient blips, not a cold app boot — on a fresh
// deploy in particular, downloading new bundles, waking configMonitor/accountMonitor's Durable Objects, and then
// resolving the active connection via getDataViewRecord's own engine round-trip (SelectItemPanel watcher above)
// can easily take longer than that. So instead of a short fixed retry, wait directly on the value itself.
// Deciding whether the connection has genuinely disappeared (vs. just not resolved yet) is EstablishDataViewsLayout's
// job, not this function's — it redirects away (unmounting this component) once that's confirmed, so this only
// needs a generous timeout as a last-resort bail-out for the case where neither ever happens.
const ACTIVE_CONNECTION_CONFIG_WAIT_TIMEOUT_MS = 20_000;

function waitForActiveConnectionConfig(): Promise<LocalisedConfig<ConnectionConfig>> {
    if (activeConnectionConfig.value != null) return Promise.resolve(activeConnectionConfig.value);

    return new Promise((resolve, reject) => {
        const timeoutId = setTimeout(() => {
            stopWatching();
            reject(new Error('Timed out waiting for an active connection config.'));
        }, ACTIVE_CONNECTION_CONFIG_WAIT_TIMEOUT_MS);

        const stopWatching = watch(activeConnectionConfig, (newActiveConnectionConfig) => {
            if (newActiveConnectionConfig == null) return;
            clearTimeout(timeoutId);
            stopWatching();
            resolve(newActiveConnectionConfig);
        });
    });
}

// ── Options, Properties, Model Value, Slots & Emits ──────────────────────────────────────────────────────────────────

const { taskLocalisedConfig } = defineProps<{ taskLocalisedConfig: LocalisedConfig<TaskConfig> }>();

const emit = defineEmits<{ 'task-completed': [taskLocalisedConfig: LocalisedConfig<TaskConfig>] }>();

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

const activeItemAction = ref('table');

const activeConnectionObjectConfig = shallowRef<ConnectionNodeConfig | undefined>();

const currentFolderNodes = shallowRef<ConnectionNodeConfig[]>([]);

const currentFolderPath = ref('');

const previewRequestId = ref(0);

const previewPercentage = ref(0);
const previewMessage = ref<string>();
const previewTableColumnDefinitions = shallowRef<ColumnDef<TableFeatureSet, Record<string, string | null>>[]>([]);
const previewTableDataSource = shallowRef<DataSource<Record<string, string | null>>>({
    rowCount: 0,
    getRows: (): Promise<{ rows: Record<string, string | null>[] }> => Promise.resolve({ rows: [] })
});

const route = useRoute();
const router = useRouter();

const text = ref<string | undefined>();

// TODO: Fix this icon data type compatibility issue.
const homeBreadcrumb = { id: 'home', icon: markRaw(HomeIcon), label: 'Home' } as unknown as ConnectionNodeConfig;

// ── Derived State ────────────────────────────────────────────────────────────────────────────────────────────────────

const breadcrumbs = computed<ConnectionNodeConfig[]>(() => [homeBreadcrumb, ...currentFolderNodes.value]);

const connectionNodeConfigsDataSource = computed<DataSource<LocalisedConfig<ConnectionNodeConfig>>>(() => {
    const folderPath = currentFolderPath.value; // Read synchronously so this computed (and useDataWindow's cache) resets on navigation.
    return {
        rowCount: undefined, // Unknown until the first listNodes response reports totalCount — useDataWindow guarantees that fetch happens.
        getRows: async (start: number, end: number): Promise<{ rows: LocalisedConfig<ConnectionNodeConfig>[]; totalCount: number }> => {
            const activeConnection = await waitForActiveConnectionConfig();
            const { processRequest } = await useEngine();
            const result = (await processRequest('listNodes', activeConnection, {
                folderPath,
                limit: end - start,
                offset: start
            } as ListNodesOptions)) as ListNodesResult;
            return { rows: result.connectionNodeConfigs as unknown as LocalisedConfig<ConnectionNodeConfig>[], totalCount: result.totalCount };
        }
    };
});

// ── Side Effects ─────────────────────────────────────────────────────────────────────────────────────────────────────

// Re-establish the data view when local metastore connection config changes (for example, after a reload or if the metastore connector is reloaded).
// Immediate so a direct deep-link/refresh into this panel (where activeConnectionConfig was never set this
// session) still resolves it — but skipped when a connection is already set in memory: for a brand new,
// unsaved data view, getDataViewRecord's NEW_DATA_VIEW_ID branch calls setActiveDataViewConfig() with no
// argument, which resets activeDataViewConfig (including connectionId) to a blank default — re-running that
// on every mount would wipe out the connection SelectConnectionList just set in memory before navigating here.
watch(
    activeMetaStoreConnectionConfig,
    async (newLocalMetaStoreConnectionConfig) => {
        if (newLocalMetaStoreConnectionConfig == null || activeConnectionConfig.value != null) return;

        const dataViewConfig = await getDataViewRecord(newLocalMetaStoreConnectionConfig, route);
        if (dataViewConfig.connectionId == null) {
            router.replace({ name: 'selectConnection', query: { ...route.query, sView: 'selectConnection' } });
        } else {
            activeConnectionConfig.value = connectionLocalisedConfigs.value.find((localisedConnectionConfig) => localisedConnectionConfig.id == dataViewConfig.connectionId);
        }
    },
    { immediate: true }
);

watch(activeConnectionConfig, (newActiveConnectionConfig) => loadFolderNodes(newActiveConnectionConfig, ''), { immediate: true });

watch(activeConnectionObjectConfig, async (newActiveItem) => {
    const currentRequestId = ++previewRequestId.value;

    // setConnectionNodeConfig(newActiveItem);
    resetPreviewState();

    if (newActiveItem == null) return;

    const { processRequest } = await useEngine();
    const options: PreviewObjectOptions = { chunkSize: undefined, extension: undefined, path: buildObjectPath(newActiveItem) };
    const previewConfig = (await processRequest('previewObject', activeConnectionConfig.value!, options)) as PreviewConfig;

    if (currentRequestId !== previewRequestId.value || activeConnectionObjectConfig.value !== newActiveItem) return;

    applyPreviewConfig(newActiveItem, previewConfig);
});

// ── Event Handlers ───────────────────────────────────────────────────────────────────────────────────────────────────

function handleSelectBreadcrumb(index: number, connectionNodeConfig: ConnectionNodeConfig): void {
    activeConnectionObjectConfig.value = undefined;

    // if (index === breadcrumbs.value.length - 1) return;

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
        // Clear the selection.
        activeConnectionObjectConfig.value = undefined;
        return;
    }

    if (connectionNodeConfig.typeId === 'folder') {
        currentFolderNodes.value = [...currentFolderNodes.value, connectionNodeConfig];
        activeConnectionObjectConfig.value = undefined;
        loadFolderNodes(activeConnectionConfig.value, `${connectionNodeConfig.folderPath}/${connectionNodeConfig.name}`);
        return;
    }

    activeConnectionObjectConfig.value = connectionNodeConfig;
}

async function handleCommitDetail(): Promise<void> {
    emit('task-completed', taskLocalisedConfig);
    await router.push({ name: 'auditContent', query: { ...route.query, sView: 'auditContent' } });
}

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

function buildObjectPath(connectionNodeConfig: ConnectionNodeConfig): string {
    const extension = connectionNodeConfig.extension == null ? '' : `.${connectionNodeConfig.extension}`;
    return `${connectionNodeConfig.folderPath}/${connectionNodeConfig.name}${extension}`;
}

function resetPreviewState(): void {
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
    const activeConnection = await waitForActiveConnectionConfig();
    const { processRequest } = await useEngine();
    const options: GetInfoOptions = { path: buildObjectPath(connectionNodeConfig) };
    const { info } = (await processRequest('getInfo', activeConnection, options)) as GetInfoResult;
    const infoWithoutChildren = { ...info };
    delete infoWithoutChildren.children;
    infoString.value = JSON.stringify(infoWithoutChildren);
    console.log(infoWithoutChildren);
}
</script>

<template>
    <GridDetailPanel
        :active-item="activeConnectionObjectConfig"
        :data-source="connectionNodeConfigsDataSource"
        :is-compact="true"
        max-list-width="400px"
        @select="handleSelectConnectionNode($event)"
    >
        <template #header>
            <div class="flex h-full min-w-0 items-center border-b border-separator text-sm">
                <Breadcrumbs class="h-9.25 flex-1" :items="breadcrumbs" :disable-last="viewportIsWide || activeConnectionObjectConfig == null" @select="handleSelectBreadcrumb" />
            </div>
        </template>

        <template #grid-item="{ item }">
            <ConfigCard v-if="item" :actions="[{ typeId: 'info', onClick: () => getInfo(item) }]" :config="item" :is-compact="true" />
        </template>

        <template #detail="{ item, clear }">
            <!-- TODO: @close="clear" -->
            <div class="ml-4 flex h-10 flex-none items-center gap-x-1 border-b border-separator" @close="clear">
                <div class="flex size-7 items-center justify-center">
                    <div v-if="item.icon" aria-hidden="true" class="block w-6 dark:hidden" v-html="item.icon" />
                    <div v-if="item.icon" aria-hidden="true" class="hidden w-6 dark:block" v-html="item.icon" />
                </div>
                <span class="ml-1 min-w-0 truncate">{{ item.label }}</span>
            </div>
            <div class="relative flex min-h-0 flex-1 flex-col pl-4">
                <Table v-show="activeItemAction === 'table'" class="flex-1" :column-definitions="previewTableColumnDefinitions" :data-source="previewTableDataSource" />
                <TextViewer v-show="activeItemAction === 'text'" class="flex-1" :text="text" />
                <div v-show="activeItemAction === 'details'" class="flex-1 overflow-y-auto overscroll-y-none text-sm">{{ activeDataViewConfig?.connectionNodeConfig }}</div>
                <div class="relative flex h-(--status-bar-height) w-full flex-none items-center justify-center overflow-hidden border-t border-separator bg-amber-100 text-xs">
                    <div class="absolute inset-y-0 left-0 bg-green-200 dark:bg-green-500/30" :style="{ width: `${previewPercentage}%` }"></div>
                    <div class="relative pl-1">{{ previewMessage }}</div>
                </div>
                <StepActionButton label="Select" @click="handleCommitDetail" />
            </div>
        </template>

        <template #no-selection>
            {{ infoString }}
            <SelectPlaceholder :message="'Select a connection node from the list.'" />
        </template>
    </GridDetailPanel>
</template>
