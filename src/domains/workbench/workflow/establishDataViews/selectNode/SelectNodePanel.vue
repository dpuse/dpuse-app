<script setup lang="ts">
// External Dependencies
import { ArrowBigRightIcon } from 'lucide-vue-next';
import type { ColumnDef } from '@tanstack/vue-table';
import { computed, markRaw, onMounted, ref, shallowRef, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

// DPUse Framework
import type { ConnectionNodeConfig } from '@dpuse/dpuse-shared/component/connection';
import type { LocalisedConfig } from '@dpuse/dpuse-shared/locale';
import type { PreviewConfig } from '@dpuse/dpuse-shared/component/dataView';
import { formatNumberAsDecimalNumber, formatNumberAsStorageSize } from '@dpuse/dpuse-shared/utilities';
import type { ListNodesOptions, ListNodesResult, PreviewObjectOptions } from '@dpuse/dpuse-shared/component/module/connector';

// Local (App) Framework
import type { DataSource } from '@/composables/useDataWindow';
import { displayIsWide } from '@/state/appLayout';
import T from './SelectNodePanel.json';
import { useEngine } from '@/services/useEngine';
import { activeConnectionConfig, activeConnectionNodeConfig } from '@/state/establishDataViews';
import { connectionConfigs, getLocalisedConnection } from '@/state/session';
import { localeId, t } from '@/state/locale';

// Local Components - Static
import ActionCommandBar from '@/components/layout/actionCommandBar/ActionCommandBar.vue';
import Breadcrumbs from '@/components/ui/breadcrumbs/Breadcrumbs.vue';
import GridDetailPanel from '@/components/layout/gridDetailPanel/GridDetailPanel.vue';
import HomeIcon from '@/components/icons/HomeIcon.vue';
import SelectPlaceholder from '@/components/ui/placeholders/SelectPlaceholder.vue';
import Table from '@/components/ui/table/Table.vue';
import type { TaskConfig } from '@/components/ui/tasks/Tasks.vue';
import TextViewer from '@/components/layout/textViewer/TextViewer.vue';
import Tile from '@/components/ui/tile/Tile.vue';

// Options, Properties, Slots & Emits ──────────────────────────────────────────────────────────────────────────────────

const { stepLocalisedConfig } = defineProps<{ stepLocalisedConfig: LocalisedConfig<TaskConfig> }>();

const emit = defineEmits<{ 'step-completed': [stepLocalisedConfig: LocalisedConfig<TaskConfig>] }>();

// State ───────────────────────────────────────────────────────────────────────────────────────────────────────────────

type TabId = 'table' | 'text' | 'details';
const activeTabId = ref<TabId>('text');

const activeItem = shallowRef<ConnectionNodeConfig | undefined>();
const currentFolderNodes = shallowRef<ConnectionNodeConfig[]>([]);

const listNodesResult = shallowRef<ListNodesResult | undefined>();
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

const connectionNodeConfigs = computed<ConnectionNodeConfig[]>(() => listNodesResult.value?.connectionNodeConfigs ?? []);

const currentFolderPath = computed<string>(() => {
    const currentFolderNode = currentFolderNodes.value.at(-1);
    return currentFolderNode == null ? '' : getFolderPath(currentFolderNode);
});

const dataSource = computed<DataSource<ConnectionNodeConfig>>(() => ({
    rowCount: connectionNodeConfigs.value.length,
    getRows: (start: number, end: number): Promise<ConnectionNodeConfig[]> => Promise.resolve(connectionNodeConfigs.value.slice(start, end))
}));

// Side Effects ────────────────────────────────────────────────────────────────────────────────────────────────────────

onMounted(async () => {
    if (activeConnectionConfig.value != null) {
        await loadFolderNodes('');
    }
});

watch(connectionConfigs, async () => {
    if (activeConnectionConfig.value == null) {
        activeConnectionConfig.value = getLocalisedConnection(route.query.conId as string | undefined, localeId.value);
        if (activeConnectionConfig.value == null) {
            router.replace({ name: 'selectConnection', query: { ...route.query, conId: undefined } });
        }
    }
    currentFolderNodes.value = [];
    activeItem.value = undefined;
    activeConnectionNodeConfig.value = undefined;
    await loadFolderNodes('');
});

watch(activeItem, async (newActiveItem) => {
    const currentRequestId = ++previewRequestId.value;

    activeConnectionNodeConfig.value = newActiveItem;
    resetPreviewState();

    if (newActiveItem == null) return;

    const { processRequest } = await useEngine();
    const previewConfig = (await processRequest('previewObject', activeConnectionConfig.value!, getPreviewObjectOptions(newActiveItem))) as PreviewConfig;

    if (currentRequestId !== previewRequestId.value || activeItem.value !== newActiveItem) return;

    applyPreviewConfig(newActiveItem, previewConfig);
});

// UI Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

async function handleSubmit(): Promise<void> {
    emit('step-completed', stepLocalisedConfig);
    await router.push({ name: 'auditContent', query: { ...route.query, wbView: 'auditContent' } });
}

async function selectBreadcrumb(index: number): Promise<void> {
    activeItem.value = undefined;

    if (index === breadcrumbs.value.length - 1) return;

    if (index <= 0) {
        currentFolderNodes.value = [];
        await loadFolderNodes('');
        return;
    }

    currentFolderNodes.value = currentFolderNodes.value.slice(0, index);
    await loadFolderNodes(currentFolderPath.value);
}

async function selectConnectionNode(connectionNodeConfig: ConnectionNodeConfig | undefined): Promise<void> {
    if (connectionNodeConfig == null) {
        activeItem.value = undefined;
        return;
    }

    if (connectionNodeConfig.typeId === 'folder') {
        console.log('### SELECT NODE: SELECT FOLDER', connectionNodeConfig);
        currentFolderNodes.value = [...currentFolderNodes.value, connectionNodeConfig];
        activeItem.value = undefined;
        await loadFolderNodes(currentFolderPath.value);
        return;
    }

    activeItem.value = connectionNodeConfig;
}

// Helpers ─────────────────────────────────────────────────────────────────────────────────────────────────────────────

function getFolderPath(connectionNodeConfig: ConnectionNodeConfig): string {
    if (!('folderPath' in connectionNodeConfig) || !('name' in connectionNodeConfig)) return '';
    return `${connectionNodeConfig.folderPath}/${connectionNodeConfig.name}`;
}

function getObjectPath(connectionNodeConfig: ConnectionNodeConfig): string {
    const extension = connectionNodeConfig.extension == null ? '' : `.${connectionNodeConfig.extension}`;
    return `${connectionNodeConfig.folderPath}/${connectionNodeConfig.name}${extension}`;
}

function getPreviewObjectOptions(connectionNodeConfig: ConnectionNodeConfig): PreviewObjectOptions {
    return { chunkSize: undefined, extension: undefined, path: getObjectPath(connectionNodeConfig) };
}

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

async function loadFolderNodes(folderPath: string): Promise<void> {
    if (activeConnectionConfig.value == null) return;

    const { processRequest } = await useEngine();
    listNodesResult.value = (await processRequest('listNodes', activeConnectionConfig.value, { folderPath } as ListNodesOptions)) as ListNodesResult;
    console.log('### SELECT NODE: FOLDERS LOADED', listNodesResult.value);
}
</script>

<template>
    <GridDetailPanel :active-item="activeItem" :data-source="dataSource" max-list-width="400px" @select="selectConnectionNode($event)">
        <template #header>
            <div class="border-separator flex h-full min-w-0 items-center border-b text-sm">
                <Breadcrumbs class="h-9.25 flex-1" :items="breadcrumbs" :disable-last="displayIsWide || activeItem == null" @select="selectBreadcrumb" />
            </div>
        </template>

        <template #list-item-compact="{ item }">
            <Tile v-if="item" :label="item.label" />
        </template>

        <template #detail>
            <div class="relative flex h-full flex-col pl-4">
                <Table v-show="activeTabId === 'table'" class="flex-1" :column-definitions="previewTableColumnDefinitions" :data-source="previewTableDataSource" />

                <TextViewer v-show="activeTabId === 'text'" class="flex-1" :text="text" />

                <div v-show="activeTabId === 'details'" class="flex-1 overflow-y-auto overscroll-y-none text-sm">{{ activeConnectionNodeConfig }}</div>

                <div
                    class="border-separator bg-backdrop relative flex h-(--status-bar-height) w-full flex-none items-center justify-center overflow-hidden border-x border-t text-xs"
                >
                    <div class="absolute top-0 bottom-px left-0 bg-green-200 dark:bg-green-500/30" :style="{ width: `${previewPercentage}%` }"></div>
                    <div class="relative pl-1">{{ previewMessage }}</div>
                </div>

                <ActionCommandBar
                    v-model="activeTabId"
                    :tabs="[
                        { id: 'table', label: t(T, 'tab.table') },
                        { id: 'text', label: t(T, 'tab.text') },
                        { id: 'details', label: t(T, 'tab.details') }
                    ]"
                    @action="handleSubmit"
                >
                    <template #action>
                        <div class="flex flex-col items-end leading-none">
                            <span>{{ t(T, 'select') }}</span>
                            <span>{{ t(T, 'node') }}</span>
                        </div>
                        <ArrowBigRightIcon class="size-5" :stroke-width="1.25" />
                    </template>
                </ActionCommandBar>
            </div>
        </template>

        <template #no-selection>
            <SelectPlaceholder :message="'Select a connection node from the list on the left.'" />
        </template>
    </GridDetailPanel>
</template>
