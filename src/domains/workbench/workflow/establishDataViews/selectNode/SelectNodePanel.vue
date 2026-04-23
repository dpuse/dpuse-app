<script setup lang="ts">
// External Dependencies
import { computed, onMounted, ref, shallowRef, useTemplateRef, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

// DPUse Framework
import type { ConnectionNodeConfig } from '@dpuse/dpuse-shared/component/connection';
import type { LocalisedConfig } from '@dpuse/dpuse-shared/locale';
import type { PreviewConfig } from '@dpuse/dpuse-shared/component/dataView';
import type { ListNodesOptions, ListNodesResult, PreviewObjectOptions } from '@dpuse/dpuse-shared/component/module/connector';

// Local Framework
import type { DataSource } from '@/composables/useDataWindow';
import { localeId } from '@/translations';
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

const textViewerElement = useTemplateRef<HTMLDivElement>('textViewer');
const listNodesResult = shallowRef<ListNodesResult | undefined>();
const route = useRoute();
const router = useRouter();
const text = ref<string | undefined>();

// Derived State ───────────────────────────────────────────────────────────────────────────────────────────────────────

const connectionNodeConfigs = computed<ConnectionNodeConfig[]>(() => listNodesResult.value?.connectionNodeConfigs ?? []);

const dataSource = computed(
    (): DataSource<ConnectionNodeConfig> => ({
        rowCount: connectionNodeConfigs.value.length,
        getRows: (start: number, end: number): Promise<ConnectionNodeConfig[]> => Promise.resolve(connectionNodeConfigs.value.slice(start, end))
    })
);

// Side Effects ────────────────────────────────────────────────────────────────────────────────────────────────────────

onMounted(async () => {
    if (activeConnectionConfig.value != null) {
        const { processRequest } = await useEngine();
        listNodesResult.value = (await processRequest('listNodes', activeConnectionConfig.value, { folderPath: '/' } as ListNodesOptions)) as ListNodesResult;
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
    listNodesResult.value = (await processRequest('listNodes', activeConnectionConfig.value, { folderPath: '/' } as ListNodesOptions)) as ListNodesResult;
});

// UI Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

async function selectConnectionNode(connectionNodeConfig: ConnectionNodeConfig): Promise<void> {
    activeConnectionNodeConfig.value = connectionNodeConfig;

    const { processRequest } = await useEngine();
    // '/ENGAGEMENT_START_EVENTS_202405121858.csv' or '/WDI_Data.csv'
    const previewObjectOptions: PreviewObjectOptions = { chunkSize: undefined, extension: undefined, path: '/ENGAGEMENT_START_EVENTS_202405121858.csv' };
    const previewConfig = (await processRequest('previewObject', activeConnectionConfig.value, previewObjectOptions)) as PreviewConfig;
    console.log(2222, previewConfig);
    text.value = previewConfig.text;
}
</script>

<template>
    <GridDetailPanel class="flex-1" :data-source="dataSource" max-list-width="400px" @select-item="selectConnectionNode($event)">
        <template #list-item-compact="{ item }">
            <Tile v-if="item" class="min-w-0 truncate" :label="item.label" />
        </template>

        <template #detail="{ item }">
            <div class="flex h-full flex-col">
                <div class="border-boundary flex-1 overflow-auto overscroll-none border-x bg-[#fdfdfd] text-sm">
                    <pre><code ref="textViewer">{{ text }}</code></pre>
                </div>

                <div class="border-separator flex flex-none justify-end border-t pt-3 pb-4">
                    <Button type="submit" variant="primary">Next</Button>
                </div>
            </div>
        </template>

        <template #no-selection>
            <div class="pt-4">Select a node...</div>
        </template>
    </GridDetailPanel>
</template>
