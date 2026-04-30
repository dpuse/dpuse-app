<script setup lang="ts">
// External Dependencies
import 'overlayscrollbars/overlayscrollbars.css';
import type { ColumnDef } from '@tanstack/vue-table';
import { OverlayScrollbarsComponent } from 'overlayscrollbars-vue';
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
import T from './SelectNodePanel.json';
import type { TabConfig } from '@/composables/useTabs';
import { useEngine } from '@/services/useEngine';
import { useTabs } from '@/composables/useTabs';
import { activeConnectionConfig, activeConnectionNodeConfig } from '@/state/establishDataViews';
import { connectionConfigs, getLocalisedConnection } from '@/state/session';
import { localeId, t } from '@/state/locale';

// Local Components - Static
import Breadcrumbs from '@/components/ui/breadcrumbs/Breadcrumbs.vue';
import Button from '@/components/ui/button/Button.vue';
import GridDetailPanel from '@/components/layout/gridDetailPanel/GridDetailPanel.vue';
import HomeIcon from '@/components/icons/HomeIcon.vue';
import SelectPlaceholder from '@/components/ui/placeholders/SelectPlaceholder.vue';
import type { StepConfig } from '@/components/ui/steps/Steps.vue';
import Table from '@/components/ui/table/Table.vue';
import Tabs from '@/components/ui/tabs/Tabs.vue';
import Tile from '@/components/ui/tile/Tile.vue';

// Properties, Slots & Emits ───────────────────────────────────────────────────────────────────────────────────────────

const { stepLocalisedConfig } = defineProps<{ stepLocalisedConfig: LocalisedConfig<StepConfig> }>();

const emit = defineEmits<{ 'step-completed': [stepLocalisedConfig: LocalisedConfig<StepConfig>] }>();

// State ───────────────────────────────────────────────────────────────────────────────────────────────────────────────

type TabId = 'table' | 'text';
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

const homeBreadcrumb = { id: 'home', icon: markRaw(HomeIcon), label: 'Home' } as ConnectionNodeConfig;

const { tabs } = useTabs([
    { id: 'table', label: 'Table' },
    { id: 'text', label: 'Text' },
    { id: 'details', label: 'Details' }
]);

// Derived State ───────────────────────────────────────────────────────────────────────────────────────────────────────

const breadcrumbs = computed<ConnectionNodeConfig[]>(() => {
    if (activeItem.value == null) return [homeBreadcrumb, ...currentFolderNodes.value];
    return [homeBreadcrumb, ...currentFolderNodes.value, activeItem.value];
});

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
    if (index === breadcrumbs.value.length - 1) return;

    activeItem.value = undefined;

    if (index <= 0) {
        currentFolderNodes.value = [];
        await loadFolderNodes('');
        return;
    }

    currentFolderNodes.value = currentFolderNodes.value.slice(0, index);
    await loadFolderNodes(currentFolderPath.value);
}

async function selectConnectionNode(connectionNodeConfig: ConnectionNodeConfig): Promise<void> {
    if (connectionNodeConfig.typeId === 'folder') {
        currentFolderNodes.value = [...currentFolderNodes.value, connectionNodeConfig];
        activeItem.value = undefined;
        await loadFolderNodes(currentFolderPath.value);
        return;
    }

    activeItem.value = connectionNodeConfig;
}

function selectTab(tabConfig: TabConfig): void {
    activeTabId.value = tabConfig.id as TabId;
}

// Helpers ─────────────────────────────────────────────────────────────────────────────────────────────────────────────

function getFolderPath(connectionNodeConfig: ConnectionNodeConfig): string {
    if (!('folderPath' in connectionNodeConfig) || !('name' in connectionNodeConfig)) return '';
    return `${connectionNodeConfig.folderPath}/${connectionNodeConfig.name}`;
}

function getNodeKey(connectionNodeConfig: ConnectionNodeConfig): string {
    if (connectionNodeConfig.typeId === 'folder') return `folder:${getFolderPath(connectionNodeConfig)}`;
    return `node:${getObjectPath(connectionNodeConfig)}`;
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
    previewMessage.value =
        previewPercentage.value == null
            ? `Previewed ${formatNumberAsStorageSize(previewSize)} (total size unknown).`
            : `Previewed ${formatNumberAsStorageSize(previewSize)} of ${formatNumberAsStorageSize(nodeSize)} (${formatNumberAsDecimalNumber(previewPercentage.value, 2, 0)}%).`;
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
}
</script>

<template>
    <div class="flex flex-1 flex-col overflow-hidden">
        <!-- Body -->
        <GridDetailPanel
            :active-item="activeItem"
            class="flex-1"
            :data-source="dataSource"
            :get-item-key="getNodeKey"
            max-list-width="400px"
            @select="selectConnectionNode($event)"
        >
            <template #header>
                <div class="border-separator flex h-full min-w-0 items-center border-b text-sm">
                    <Breadcrumbs class="h-9.25 flex-1" :items="breadcrumbs" @select="selectBreadcrumb" />

                    <Tabs class="ml-4 h-full flex-none shrink-0" :active-item-id="activeTabId" :items="tabs" @select="selectTab">
                        <template #default="{ item }">{{ item.label }}</template>
                    </Tabs>
                </div>
            </template>

            <template #list-item-compact="{ item }">
                <Tile v-if="item" :label="item.label" />
            </template>

            <template #detail>
                <div class="flex h-full flex-col pl-4">
                    <div class="border-separator relative flex h-5 w-full flex-none items-center border-x border-b bg-amber-50 text-xs">
                        <div class="absolute top-0 bottom-0 left-0 bg-green-200" :style="{ width: `${previewPercentage}%` }"></div>
                        <div class="relative pl-1 text-zinc-600">{{ previewMessage }}</div>
                    </div>

                    <Table v-if="activeTabId === 'table'" :column-definitions="previewTableColumnDefinitions" :data-source="previewTableDataSource" />

                    <OverlayScrollbarsComponent v-else class="min-h-0 flex-1" defer :options="{ scrollbars: { autoHide: 'leave', theme: 'os-theme-dark' } }">
                        <div class="border-separator border-x px-0.5 text-sm">
                            <pre><code ref="textViewer">{{ text }}</code></pre>
                        </div>
                    </OverlayScrollbarsComponent>

                    <!-- <div class="border-boundary flex h-16.25 flex-none flex-col overflow-hidden border-t">
                        <form class="border-boundary flex flex-1 justify-end gap-x-2 overflow-hidden border-t" @submit.prevent="handleSubmit">
                            <div class="flex-1 overflow-y-auto overscroll-y-none text-sm">{{ activeConnectionNodeConfig }}</div>
                            <Button class="mt-1 max-h-10" type="submit" variant="primary">{{ t(T, 'next') }}</Button>
                        </form>
                    </div> -->
                </div>
            </template>

            <template #no-selection>
                <SelectPlaceholder :message="'Select a connection node from the list on the left.'" />
            </template>
        </GridDetailPanel>
    </div>
</template>
