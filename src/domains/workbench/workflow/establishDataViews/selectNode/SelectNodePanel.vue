<script setup lang="ts">
// External Dependencies
import { computed, nextTick, onMounted, ref, shallowRef, useTemplateRef, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

// DPUse Framework
import type { ConnectionNodeConfig } from '@dpuse/dpuse-shared/component/connection';
import type { LocalisedConfig } from '@dpuse/dpuse-shared/locale';
import type { ListNodesOptions, ListNodesResult, PreviewObjectOptions } from '@dpuse/dpuse-shared/component/module/connector';
import type { ParsingRecord, PreviewConfig } from '@dpuse/dpuse-shared/component/dataView';

// Local Framework
import type { Breadcrumb } from '@/components/ui/breadcrumbs/Breadcrumbs.vue';
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

// Properties, Slots & Emits ───────────────────────────────────────────────────────────────────────────────────────────

const { taskLocalisedConfig } = defineProps<{ taskLocalisedConfig: LocalisedConfig<TaskConfig> }>();

defineEmits<{ 'task-completed': [taskLocalisedConfig: LocalisedConfig<TaskConfig>] }>();

// State ───────────────────────────────────────────────────────────────────────────────────────────────────────────────

const activeTabId = ref<'table' | 'text'>('text');
const listNodesResult = shallowRef<ListNodesResult | undefined>();
const parsedRecords = shallowRef<ParsingRecord[]>([]);
const route = useRoute();
const router = useRouter();
const text = ref<string | undefined>();
const textViewerElement = useTemplateRef<HTMLDivElement>('textViewer');

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

async function selectBreadcrumb(breadcrumb: Breadcrumb): Promise<void> {
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
</script>

<template>
    <GridDetailPanel class="flex-1" :data-source="dataSource" max-list-width="400px" @select-breadcrumb="selectBreadcrumb($event)" @select-item="selectConnectionNode($event)">
        <template #list-item-compact="{ item }">
            <Tile v-if="item" class="min-w-0 truncate" :label="item.label" />
        </template>

        <template #detail>
            <div class="flex h-full flex-col">
                <div v-if="activeTabId === 'table'" class="border-boundary flex-1 overflow-auto overscroll-none border-x bg-zinc-200 text-sm">{{ parsedRecords }}</div>

                <div v-else class="border-boundary flex-1 overflow-auto overscroll-none border-x bg-[#fdfdfd] text-sm">
                    <pre><code ref="textViewer">{{ text }}</code></pre>
                </div>

                <div class="border-separator flex h-16.25 max-h-40 flex-none justify-end gap-x-2 border-t">
                    <div class="flex">
                        <button @click="activeTabId = 'table'">Table</button>
                        <button @click="activeTabId = 'text'">Text</button>
                    </div>
                    <div class="overflow-y-auto overscroll-y-none">{{ activeConnectionNodeConfig }}</div>
                    <Button class="mt-3 mb-4" type="submit" variant="primary">Next</Button>
                </div>
            </div>
        </template>

        <template #no-selection>
            <div class="pt-4">Select a node...</div>
        </template>
    </GridDetailPanel>
</template>
