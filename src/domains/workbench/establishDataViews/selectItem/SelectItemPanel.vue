<script setup lang="ts">
// External Dependencies & Registrations
import { ArrowBigRightIcon } from 'lucide-vue-next';
import type { ColumnDef } from '@tanstack/vue-table';
import { computed, markRaw, ref, shallowRef, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

// DPUse Framework
import type { LocalisedConfig } from '@dpuse/dpuse-shared/locale';
import type { PreviewConfig } from '@dpuse/dpuse-shared/component/dataView';
import type { ConnectionConfig, ConnectionNodeConfig } from '@dpuse/dpuse-shared/component/connection';
import { formatNumberAsDecimalNumber, formatNumberAsStorageSize } from '@dpuse/dpuse-shared/utilities';
import type { ListNodesOptions, ListNodesResult, PreviewObjectOptions } from '@dpuse/dpuse-shared/component/module/connector';

// Local (App) Framework
import { activeMetaStoreConnectionConfig } from '@/state/session';
import type { DataSource } from '@/composables/useDataWindow';
import T from './SelectItemPanel.json';
import { t } from '@/state/locale';
import { useEngine } from '@/services/useEngine';
import { viewportIsWide } from '@/state/appLayout';
import {
    activeConnectionConfig,
    activeConnectionNodeConfigs,
    activeDataViewConfig,
    connectionLocalisedConfigs,
    establishDataView,
    setConnectionNodeConfig
} from '@/state/establishDataViews';

// Local Components - Static
import Breadcrumbs from '@/components/framework/Breadcrumbs.vue';
import Card from '@/components/ui/Card.vue';
import GridDetailPanel from '@/components/framework/gridDetailPanel/GridDetailPanel.vue';
import HomeIcon from '@/components/icons/HomeIcon.vue';
import SelectPlaceholder from '@/components/ui/placeholders/SelectPlaceholder.vue';
import Table from '@/components/ui/table/Table.vue';
import type { TaskConfig } from '@/components/ui/TaskBar.vue';
import TextViewer from '@/components/ui/TextViewer.vue';

const ITEM_ACTIONS = [
    { id: 'table', label: 'Table' },
    { id: 'text', label: 'Text' },
    { id: 'details', label: 'Details' }
];

// Options, Properties, Slots & Emits ──────────────────────────────────────────────────────────────────────────────────

const { taskLocalisedConfig } = defineProps<{ taskLocalisedConfig: LocalisedConfig<TaskConfig> }>();

const emit = defineEmits<{ 'task-completed': [taskLocalisedConfig: LocalisedConfig<TaskConfig>] }>();

// State ───────────────────────────────────────────────────────────────────────────────────────────────────────────────

const activeItemAction = ref(ITEM_ACTIONS[0]);

const activeConnectionObjectConfig = shallowRef<ConnectionNodeConfig | undefined>();

const activeItemId = ref<'table' | 'text' | 'details'>('text');

const currentFolderNodes = shallowRef<ConnectionNodeConfig[]>([]);

const previewRequestId = ref(0);

const previewPercentage = ref(0);
const previewMessage = ref<string>();
const previewTableColumnDefinitions = shallowRef<ColumnDef<Record<string, string | null>>[]>([]);
const previewTableDataSource = shallowRef<DataSource<Record<string, string | null>>>({
    rowCount: 0,
    getRows: (): Promise<Record<string, string | null>[]> => Promise.resolve([])
});

const route = useRoute();
const router = useRouter();

const text = ref<string | undefined>();

// TODO: Fix this icon data type compatibility issue.
const homeBreadcrumb = { id: 'home', icon: markRaw(HomeIcon), label: 'Home' } as unknown as ConnectionNodeConfig;

// Derived State ───────────────────────────────────────────────────────────────────────────────────────────────────────

const breadcrumbs = computed<ConnectionNodeConfig[]>(() => [homeBreadcrumb, ...currentFolderNodes.value]);

const connectionNodeConfigsDataSource = computed<DataSource<ConnectionNodeConfig>>(() => ({
    rowCount: activeConnectionNodeConfigs.value.length,
    getRows: (start: number, end: number): Promise<ConnectionNodeConfig[]> => Promise.resolve(activeConnectionNodeConfigs.value.slice(start, end))
}));

// Side Effects ────────────────────────────────────────────────────────────────────────────────────────────────────────

// Re-establish the data view when local metastore connection config changes (for example, after a reload or if the metastore connector is reloaded).
watch(activeMetaStoreConnectionConfig, async (newLocalMetaStoreConnectionConfig) => {
    if (newLocalMetaStoreConnectionConfig == null) {
        return;
    } else {
        const dataViewConfig = await establishDataView(newLocalMetaStoreConnectionConfig, route);
        if (dataViewConfig.connectionId == null) {
            router.replace({ name: 'selectConnection', query: { ...route.query, wbView: 'selectConnection' } });
        } else {
            activeConnectionConfig.value = connectionLocalisedConfigs.value.find((localisedConnectionConfig) => localisedConnectionConfig.id == dataViewConfig.connectionId);
        }
    }
});

watch(activeConnectionConfig, async (newActiveConnectionConfig) => await loadFolderNodes(newActiveConnectionConfig, ''), { immediate: true });

watch(activeConnectionObjectConfig, async (newActiveItem) => {
    const currentRequestId = ++previewRequestId.value;

    // setConnectionNodeConfig(newActiveItem);
    resetPreviewState();

    if (newActiveItem == null) return;

    const { processRequest } = await useEngine();
    const extension = newActiveItem.extension == null ? '' : `.${newActiveItem.extension}`;
    const objectPath = `${newActiveItem.folderPath}/${newActiveItem.name}${extension}`;
    const options: PreviewObjectOptions = { chunkSize: undefined, extension: undefined, path: objectPath };
    const previewConfig = (await processRequest('previewObject', activeConnectionConfig.value!, options)) as PreviewConfig;

    if (currentRequestId !== previewRequestId.value || activeConnectionObjectConfig.value !== newActiveItem) return;

    applyPreviewConfig(newActiveItem, previewConfig);
});

// ── UI Event Handlers ────────────────────────────────────────────────────────────────────────────────────────────────

function handleClearSelection() {}

async function handleSelectBreadcrumb(index: number, connectionNodeConfig: ConnectionNodeConfig): Promise<void> {
    activeConnectionObjectConfig.value = undefined;

    // if (index === breadcrumbs.value.length - 1) return;

    if (index <= 0) {
        currentFolderNodes.value = [];
        await loadFolderNodes(activeConnectionConfig.value, '');
        return;
    }

    currentFolderNodes.value = currentFolderNodes.value.slice(0, index);
    await loadFolderNodes(activeConnectionConfig.value, `${connectionNodeConfig.folderPath}/${connectionNodeConfig.name}`);
}

async function handleSelectConnectionNode(connectionNodeConfig: ConnectionNodeConfig | undefined): Promise<void> {
    if (connectionNodeConfig == null) {
        // Clear the selection.
        activeConnectionObjectConfig.value = undefined;
        return;
    }

    if (connectionNodeConfig.typeId === 'folder') {
        currentFolderNodes.value = [...currentFolderNodes.value, connectionNodeConfig];
        activeConnectionObjectConfig.value = undefined;
        await loadFolderNodes(activeConnectionConfig.value, `${connectionNodeConfig.folderPath}/${connectionNodeConfig.name}`);
        return;
    }

    activeConnectionObjectConfig.value = connectionNodeConfig;
}

async function handleCommitDetail(): Promise<void> {
    emit('task-completed', taskLocalisedConfig);
    await router.push({ name: 'auditContent', query: { ...route.query, wbView: 'auditContent' } });
}

// Helpers ─────────────────────────────────────────────────────────────────────────────────────────────────────────────

function resetPreviewState(): void {
    previewPercentage.value = 0;
    previewMessage.value = undefined;
    previewTableColumnDefinitions.value = [];
    previewTableDataSource.value = {
        rowCount: 0,
        getRows: (): Promise<Record<string, string | null>[]> => Promise.resolve([])
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

    previewTableColumnDefinitions.value = previewColumnKeys.map<ColumnDef<Record<string, string | null>>>((columnKey) => ({
        accessorKey: columnKey,
        header: columnKey
    }));

    const dataOffset = 1;
    const previewRows = previewConfig.parsedRecords
        .slice(dataOffset)
        .map((record) => Object.fromEntries(record.map((cell, index) => [previewColumnKeys[index] ?? String(index), cell.value])) as Record<string, string | null>);

    previewTableDataSource.value = {
        rowCount: previewRows.length,
        getRows: (start: number, end: number): Promise<Record<string, string | null>[]> => Promise.resolve(previewRows.slice(start, end))
    };
}

async function loadFolderNodes(connectionConfig: LocalisedConfig<ConnectionConfig> | undefined, folderPath: string): Promise<void> {
    if (connectionConfig == null) return;

    const { processRequest } = await useEngine();
    const listNodesResult = (await processRequest('listNodes', connectionConfig, { folderPath } as ListNodesOptions)) as ListNodesResult;
    activeConnectionNodeConfigs.value = listNodesResult.connectionNodeConfigs;
}
</script>

<template>
    <GridDetailPanel
        v-model:active-item-action="activeItemAction"
        :active-item="activeConnectionObjectConfig"
        :data-source="connectionNodeConfigsDataSource"
        :is-compact="true"
        :item-actions="ITEM_ACTIONS"
        max-list-width="400px"
        @commit-detail="handleCommitDetail"
        @select="handleSelectConnectionNode($event)"
    >
        <template #header>
            <div class="flex h-full min-w-0 items-center border-b border-separator text-sm">
                <Breadcrumbs class="h-9.25 flex-1" :items="breadcrumbs" :disable-last="viewportIsWide || activeConnectionObjectConfig == null" @select="handleSelectBreadcrumb" />
            </div>
        </template>

        <template #detail-header="{ item }">
            <div class="ml-4 flex h-10 items-center gap-x-1 border-b border-separator">
                <div class="flex size-7 items-center justify-center">
                    <div v-if="item.icon" aria-hidden="true" class="block w-6 dark:hidden" v-html="item.icon" />
                    <div v-if="item.icon" aria-hidden="true" class="hidden w-6 dark:block" v-html="item.icon" />
                </div>
                <span class="ml-1 min-w-0 truncate">{{ item.label }}</span>
            </div>
        </template>

        <template #grid-item="{ item }">
            <Card v-if="item" :icon="item.icon ?? undefined" :is-compact="true" :label="item.label" />
        </template>

        <template #detail>
            <div class="relative flex h-full flex-col pl-4">
                <Table v-show="activeItemAction.id === 'table'" class="flex-1" :column-definitions="previewTableColumnDefinitions" :data-source="previewTableDataSource" />

                <TextViewer v-show="activeItemAction.id === 'text'" class="flex-1" :text="text" />

                <div v-show="activeItemAction.id === 'details'" class="flex-1 overflow-y-auto overscroll-y-none text-sm">{{ activeDataViewConfig?.connectionNodeConfig }}</div>

                <div class="relative flex h-(--status-bar-height) w-full flex-none items-center justify-center overflow-hidden border-t border-separator bg-amber-100 text-xs">
                    <div class="absolute top-0 bottom-0 left-0 bg-green-200 dark:bg-green-500/30" :style="{ width: `${previewPercentage}%` }"></div>
                    <div class="relative pl-1">{{ previewMessage }}</div>
                </div>

                <!-- <ActionBar
                    v-model="activeItemId"
                    class="fixed right-(--safe-right-offset) bottom-(--safe-bottom-offset)"
                    clear-action
                    commit-action-variant="select"
                    :item-actions="[
                        { id: 'table', label: t(T, 'tab.table') },
                        { id: 'text', label: t(T, 'tab.text') },
                        { id: 'details', label: t(T, 'tab.details') }
                    ]"
                    @clear="handleClearSelection"
                    @commit="handleSelectItem"
                /> -->
            </div>
        </template>

        <template #no-selection>
            <SelectPlaceholder :message="'Select a connection node from the list on the left.'" />
        </template>
    </GridDetailPanel>
</template>
