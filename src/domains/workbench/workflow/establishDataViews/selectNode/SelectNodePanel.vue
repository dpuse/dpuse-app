<script setup lang="ts">
// External Dependencies
import type { ColumnDef } from '@tanstack/vue-table';
import { computed, markRaw, nextTick, onMounted, ref, shallowRef, useTemplateRef, watch, type Component } from 'vue';
import { useRoute, useRouter } from 'vue-router';

// DPUse Framework
import type { ConnectionNodeConfig } from '@dpuse/dpuse-shared/component/connection';
import type { LocalisedConfig } from '@dpuse/dpuse-shared/locale';
import type { PreviewConfig } from '@dpuse/dpuse-shared/component/dataView';
import { formatNumberAsDecimalNumber, formatNumberAsStorageSize } from '@dpuse/dpuse-shared/utilities';
import type { ListNodesOptions, ListNodesResult, PreviewObjectOptions } from '@dpuse/dpuse-shared/component/module/connector';

// Local Framework
import type { DataSource } from '@/composables/useDataWindow';
import { localeId } from '@/state/locale';
import type { TabConfig } from '@/composables/useTabs';
import { useBreadcrumbs } from '@/composables/useBreadcrumbs';
import { useEngine } from '@/services/useEngine';
import { useTabs } from '@/composables/useTabs';
import { activeConnectionConfig, activeConnectionNodeConfig } from '@/state/establishDataViews';
import { connectionConfigs, getLocalisedConnection } from '@/state/session';

// Local Components - Static
import Breadcrumbs from '@/components/ui/breadcrumbs/Breadcrumbs.vue';
import Button from '@/components/ui/button/Button.vue';
import GridDetailPanel from '@/components/layout/gridDetailPanel/GridDetailPanel.vue';
import HomeIcon from '@/components/icons/HomeIcon.vue';
import Table from '@/components/ui/table/Table.vue';
import Tabs from '@/components/ui/tabs/Tabs.vue';
import type { TaskConfig } from '../EstablishDataViewsLayout.vue';
import Tile from '@/components/ui/tile/Tile.vue';

// Properties, Slots & Emits ───────────────────────────────────────────────────────────────────────────────────────────

const { taskLocalisedConfig } = defineProps<{ taskLocalisedConfig: LocalisedConfig<TaskConfig> }>();

const emit = defineEmits<{ 'task-completed': [taskLocalisedConfig: LocalisedConfig<TaskConfig>] }>();

// State ───────────────────────────────────────────────────────────────────────────────────────────────────────────────

type TabId = 'table' | 'text';

const activeTabId = ref<TabId>('text');

const activeItem = shallowRef<ConnectionNodeConfig | undefined>();

const listNodesResult = shallowRef<ListNodesResult | undefined>();

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
const textViewerElement = useTemplateRef<HTMLDivElement>('textViewer');

const homeBreadcrumb = { id: 'home', icon: markRaw(HomeIcon), label: 'Home' } as ConnectionNodeConfig;
const { add, breadcrumbs, clearAfterIndex, removeLast } = useBreadcrumbs<ConnectionNodeConfig>([homeBreadcrumb]);

const { tabs } = useTabs([
    { id: 'table', label: 'Table' },
    { id: 'text', label: 'Text' },
    { id: 'details', label: 'Details' }
]);

// Derived State ───────────────────────────────────────────────────────────────────────────────────────────────────────

const connectionNodeConfigs = computed<ConnectionNodeConfig[]>(() => listNodesResult.value?.connectionNodeConfigs ?? []);

const dataSource = shallowRef<DataSource<ConnectionNodeConfig>>({
    rowCount: 0,
    getRows: (): Promise<ConnectionNodeConfig[]> => Promise.resolve([])
});

// Side Effects ────────────────────────────────────────────────────────────────────────────────────────────────────────

onMounted(async () => {
    if (activeConnectionConfig.value != null) {
        const { processRequest } = await useEngine();
        listNodesResult.value = (await processRequest('listNodes', activeConnectionConfig.value, { folderPath: '' } as ListNodesOptions)) as ListNodesResult;
    }

    if (textViewerElement.value) textViewerElement.value.textContent = 'Some text data...';
});

watch(connectionConfigs, async () => {
    if (activeConnectionConfig.value == null) {
        activeConnectionConfig.value = getLocalisedConnection(route.query.conId as string | undefined, localeId.value);
        if (activeConnectionConfig.value == null) {
            router.replace({ name: 'selectConnection', query: { ...route.query, conId: undefined } });
        }
    }
    const { processRequest } = await useEngine();
    listNodesResult.value = (await processRequest('listNodes', activeConnectionConfig.value!, { folderPath: '' } as ListNodesOptions)) as ListNodesResult;
});

watch(
    connectionNodeConfigs,
    (newConnectionNodeConfigs) => {
        dataSource.value = {
            rowCount: newConnectionNodeConfigs.length,
            getRows: (start: number, end: number): Promise<ConnectionNodeConfig[]> => Promise.resolve(newConnectionNodeConfigs.slice(start, end))
        };
    },
    { immediate: true }
);

// UI Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

async function handleSubmit(): Promise<void> {
    emit('task-completed', taskLocalisedConfig);
    await router.push({ name: 'auditContent', query: { ...route.query, wbView: 'auditContent' } });
}

async function selectBreadcrumb(index: number, connectionNodeConfig: ConnectionNodeConfig): Promise<void> {
    const selectedItem = activeItem.value;
    activeItem.value = undefined;
    activeConnectionNodeConfig.value = undefined;
    text.value = undefined;
    await nextTick();

    clearAfterIndex(index);

    const folderPath = getFolderPath(connectionNodeConfig);
    if (selectedItem != null && folderPath === selectedItem.folderPath) return;

    const { processRequest } = await useEngine();
    listNodesResult.value = (await processRequest('listNodes', activeConnectionConfig.value!, { folderPath } as ListNodesOptions)) as ListNodesResult;
}

async function selectConnectionNode(connectionNodeConfig: ConnectionNodeConfig): Promise<void> {
    text.value = undefined;
    await nextTick();

    if (connectionNodeConfig.typeId === 'folder') {
        if (activeItem.value != null) {
            activeItem.value = undefined;
            activeConnectionNodeConfig.value = undefined;
            removeLast();
        }
        add(connectionNodeConfig);
        const { processRequest } = await useEngine();
        const path = getFolderPath(connectionNodeConfig);
        listNodesResult.value = (await processRequest('listNodes', activeConnectionConfig.value!, { folderPath: path } as ListNodesOptions)) as ListNodesResult;
    } else {
        add(connectionNodeConfig);
        activeItem.value = connectionNodeConfig;
        activeConnectionNodeConfig.value = connectionNodeConfig;
        const { processRequest } = await useEngine();
        const extension = connectionNodeConfig.extension == null ? '' : `.${connectionNodeConfig.extension}`;
        const path = `${connectionNodeConfig.folderPath}/${connectionNodeConfig.name}${extension}`;
        const previewObjectOptions: PreviewObjectOptions = { chunkSize: undefined, extension: undefined, path };
        const previewConfig = (await processRequest('previewObject', activeConnectionConfig.value!, previewObjectOptions)) as PreviewConfig;

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
}

function selectTab(tabConfig: TabConfig): void {
    activeTabId.value = tabConfig.id as TabId;
}

// Helpers ─────────────────────────────────────────────────────────────────────────────────────────────────────────────

function getFolderPath(connectionNodeConfig: ConnectionNodeConfig): string {
    if (!('folderPath' in connectionNodeConfig) || !('name' in connectionNodeConfig)) return '';
    return `${connectionNodeConfig.folderPath}/${connectionNodeConfig.name}`;
}
</script>

<template>
    <div class="flex flex-1 flex-col overflow-hidden">
        <!-- Body -->
        <GridDetailPanel v-model:active-item="activeItem" class="flex-1" :data-source="dataSource" max-list-width="400px" @select-item="selectConnectionNode($event)">
            <template #header>
                <div class="border-separator flex h-full min-w-0 items-center border-b text-sm">
                    <Breadcrumbs class="h-9.25 flex-1" :items="breadcrumbs" @select="selectBreadcrumb" />

                    <Tabs class="ml-4 h-full flex-none shrink-0" :active-item-id="activeTabId" :items="tabs" @select="selectTab">
                        <template #default="{ item }">{{ item.label }}</template>
                    </Tabs>
                </div>
            </template>

            <template #list-item-compact="{ item }">
                <Tile v-if="item" class="min-w-0 truncate" :label="item.label" />
            </template>

            <template #detail>
                <div class="flex h-full flex-col">
                    <div class="border-separator relative h-4 w-full flex-none border-x bg-[#fdfdfd] text-xs">
                        <div class="absolute top-0 bottom-0 left-0 bg-green-200" :style="{ width: `${previewPercentage}%` }"></div>
                        <div class="relative pl-1 text-zinc-600">{{ previewMessage }}</div>
                    </div>

                    <Table v-if="activeTabId === 'table'" :column-definitions="previewTableColumnDefinitions" :data-source="previewTableDataSource" />

                    <div v-else class="border-separator flex-1 overflow-auto overscroll-none border-x px-0.5 text-sm">
                        <pre><code ref="textViewer">{{ text }}</code></pre>
                    </div>

                    <div class="border-boundary flex h-16.25 flex-none flex-col overflow-hidden border-t">
                        <!-- -->

                        <!-- -->
                        <form class="border-boundary flex flex-1 justify-end gap-x-2 overflow-hidden border-t" @submit.prevent="handleSubmit">
                            <div class="flex-1 overflow-y-auto overscroll-y-none text-sm">{{ activeConnectionNodeConfig }}</div>
                            <Button class="mt-1 max-h-10" type="submit" variant="primary">Next</Button>
                        </form>
                    </div>
                </div>
            </template>

            <template #no-selection>
                <div class="bg-backdrop flex h-full items-center justify-center pt-[5%]">Select a node...</div>
            </template>
        </GridDetailPanel>
    </div>
</template>
