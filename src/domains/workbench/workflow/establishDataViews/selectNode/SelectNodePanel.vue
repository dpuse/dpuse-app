<script setup lang="ts">
// External Dependencies
import { ArrowBigLeftIcon } from 'lucide-vue-next';
import { computed, nextTick, onMounted, ref, shallowRef, useTemplateRef, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

// DPUse Framework
import type { ConnectionNodeConfig } from '@dpuse/dpuse-shared/component/connection';
import type { LocalisedConfig } from '@dpuse/dpuse-shared/locale';
import type { ListNodesOptions, ListNodesResult, PreviewObjectOptions } from '@dpuse/dpuse-shared/component/module/connector';
import type { ParsingRecord, PreviewConfig } from '@dpuse/dpuse-shared/component/dataView';

// Local Framework
import type { DataSource } from '@/composables/useDataWindow';
import { localeId } from '@/state/locale';
import { useEngine } from '@/services/useEngine';
import { activeConnectionConfig, activeConnectionNodeConfig } from '@/state/establishDataViews';
import { connectionConfigs, getLocalisedConnection } from '@/state/session';

// Local Components - Static
import Button from '@/components/ui/button/Button.vue';
import GridDetailPanel from '@/components/layout/gridDetailPanel/GridDetailPanel.vue';
import type { TaskConfig } from '../EstablishDataViewsLayout.vue';
import Tile from '@/components/ui/tile/Tile.vue';
import Breadcrumbs, { type BreadcrumbConfig } from '@/components/ui/breadcrumbs/Breadcrumbs.vue';
import Tabs, { type TabConfig } from '@/components/ui/tabs/Tabs.vue';

// Properties, Slots & Emits ───────────────────────────────────────────────────────────────────────────────────────────

const { taskLocalisedConfig } = defineProps<{ taskLocalisedConfig: LocalisedConfig<TaskConfig> }>();

defineEmits<{ 'task-completed': [taskLocalisedConfig: LocalisedConfig<TaskConfig>] }>();

// State ───────────────────────────────────────────────────────────────────────────────────────────────────────────────

type TabId = 'table' | 'text';
const activeTabId = ref<TabId>('text');
const listNodesResult = shallowRef<ListNodesResult | undefined>();
const parsedRecords = shallowRef<ParsingRecord[]>([]);
const route = useRoute();
const router = useRouter();
const text = ref<string | undefined>();
const textViewerElement = useTemplateRef<HTMLDivElement>('textViewer');

const breadcrumbs = ref<BreadcrumbConfig[]>([{ id: 'home', label: 'Home' }]);

const tabs = ref<TabConfig[]>([
    { id: 'table', label: 'Table' },
    { id: 'text', label: 'Text' }
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
    listNodesResult.value = (await processRequest('listNodes', activeConnectionConfig.value, { folderPath: '' } as ListNodesOptions)) as ListNodesResult;
});

watch(
    connectionNodeConfigs,
    (connectionNodes) => {
        dataSource.value = {
            rowCount: connectionNodes.length,
            getRows: (start: number, end: number): Promise<ConnectionNodeConfig[]> => Promise.resolve(connectionNodes.slice(start, end))
        };
    },
    { immediate: true }
);

// UI Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

async function selectBreadcrumb(breadcrumbConfig: BreadcrumbConfig): Promise<void> {
    const { processRequest } = await useEngine();
    listNodesResult.value = (await processRequest('listNodes', activeConnectionConfig.value, { folderPath: '' } as ListNodesOptions)) as ListNodesResult;
}

async function selectConnectionNode(connectionNodeConfig: ConnectionNodeConfig): Promise<void> {
    text.value = undefined;
    await nextTick();

    if (connectionNodeConfig.typeId === 'folder') {
        activeConnectionNodeConfig.value = undefined;
        const { processRequest } = await useEngine();
        const path = `${connectionNodeConfig.folderPath}/${connectionNodeConfig.name}`;
        listNodesResult.value = (await processRequest('listNodes', activeConnectionConfig.value, { folderPath: path } as ListNodesOptions)) as ListNodesResult;
    } else {
        breadcrumbs.value[1] = connectionNodeConfig;
        activeConnectionNodeConfig.value = connectionNodeConfig;
        const { processRequest } = await useEngine();
        const extension = connectionNodeConfig.extension == null ? '' : `.${connectionNodeConfig.extension}`;
        const path = `${connectionNodeConfig.folderPath}/${connectionNodeConfig.name}${extension}`;
        const previewObjectOptions: PreviewObjectOptions = { chunkSize: undefined, extension: undefined, path };
        const previewConfig = (await processRequest('previewObject', activeConnectionConfig.value, previewObjectOptions)) as PreviewConfig;

        text.value = previewConfig.text;
        parsedRecords.value = previewConfig.parsedRecords;
    }
}

function selectTab(tabConfig: TabConfig): void {
    activeTabId.value = tabConfig.id as TabId;
}
</script>

<template>
    <div class="flex flex-1 flex-col overflow-hidden">
        <!-- Body -->
        <GridDetailPanel class="flex-1" :data-source="dataSource" max-list-width="400px" @select-item="selectConnectionNode($event)">
            <template #header>
                <div class="border-separator flex h-full items-center justify-between border-b text-sm">
                    <Breadcrumbs class="flex flex-none py-2" :items="breadcrumbs" @select="selectBreadcrumb" />
                    <Tabs class="h-full" :items="tabs" @select="selectTab">
                        <template #default="{ item }">{{ item.label }}</template>
                    </Tabs>
                </div>
            </template>

            <template #list-item-compact="{ item }">
                <Tile v-if="item" class="min-w-0 truncate" :label="item.label" />
            </template>

            <template #detail>
                <div class="flex h-full flex-col">
                    <div v-if="activeTabId === 'table'" class="border-boundary flex-1 overflow-auto overscroll-none border-x bg-zinc-200 text-sm">{{ parsedRecords }}</div>

                    <div v-else class="border-separator flex-1 overflow-auto overscroll-none border-x px-0.5 text-sm">
                        <pre><code ref="textViewer">{{ text }}</code></pre>
                    </div>

                    <div class="border-separator flex h-16.25 flex-none flex-col border-t">
                        <div class="border-separator h-2.75 w-full flex-none border-x border-b bg-zinc-50"></div>
                        <div class="flex max-h-40 flex-1 justify-end gap-x-2 overflow-hidden">
                            <div class="flex-1 overflow-y-auto overscroll-y-none text-sm">{{ activeConnectionNodeConfig }}</div>
                            <Button class="max-h-10" type="submit" variant="primary">Next</Button>
                        </div>
                    </div>
                </div>
            </template>

            <template #no-selection>
                <div class="flex h-full items-center justify-center bg-zinc-50 pt-[5%]">Select a node...</div>
            </template>
        </GridDetailPanel>
    </div>
</template>
