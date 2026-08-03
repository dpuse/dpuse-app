<script setup lang="ts">
// ── External Dependencies & Registrations
import DOMPurify from 'dompurify';
import { ChevronRightIcon, LoaderCircleIcon, NetworkIcon, SquarePenIcon, WorkflowIcon } from '@lucide/vue';
import { defineAsyncComponent, onErrorCaptured, onMounted, ref, shallowRef, useTemplateRef, watch } from 'vue';

// ── DPUse Framework
import type { ComponentBase } from '@dpuse/dpuse-shared/component';
import type { LocalisedConfig } from '@dpuse/dpuse-shared/locale';
import type { MarkedTool as MarkedToolType } from '@dpuse/dpuse-tool-marked-markdown-parser';
import type { D3Tool as D3ToolType, ErdDiagramData, TreeDiagramNode } from '@dpuse/dpuse-tool-d3-visualiser';

// ── Local Framework
import { toolConfigs } from '@/state/session';

// ── Local Components - Static
import type { GridListItem } from './ContextList.vue';

// ── Data
import modelConfigs from './modelConfigs.json';

// ── Local Components - Static
import BaseDialog from '@/components/ui/dialog/BaseDialog.vue';
import Button from '@/components/ui/button/Button.vue';
import ComponentLoadError from '@/components/ui/ComponentLoadError.vue';

// ── Local Components - Dynamic
const ContextModelDescriptorsPanel = defineAsyncComponent(() => import('./ContextModelDescriptorsPanel.vue'));

// ── Types ────────────────────────────────────────────────────────────────────────────────────────────────────────────

type Dimension = { id: string; label: Record<string, string>; description: Record<string, string> };
type Entity = { id: string; label: Record<string, string>; description: Record<string, string> };
type Model = { entities: Entity[]; dimensions: Dimension[] };

type LocalisedDimensions = { id: string; label: string; description: string };
type LocalisedEntity = { id: string; label: string; description: string };
type LocalisedModel = { entities: LocalisedEntity[]; dimensions: LocalisedDimensions[] };

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

const ENTITY_TABS = [
    { id: 'parents', label: 'Parents' },
    { id: 'characteristics', label: 'Characteristics' },
    { id: 'events', label: 'Events' },
    { id: 'primaryMeasures', label: 'Measures' }
];

// Evaluation example: hard-coded ERD, laid out and drawn by dpuse-tool-d3-visualiser's renderErdDiagram (dagre + d3-selection).
const ERD_DATA: ErdDiagramData = {
    nodes: [
        { id: 'organisation', label: 'Organisation', typeId: 'primary' },
        { id: 'organisationalUnit', label: 'Organisational Unit', typeId: 'child' },
        { id: 'person', label: 'Person', typeId: 'primary' },
        { id: 'nationality', label: 'Nationality', typeId: 'child' },
        { id: 'language', label: 'Language', typeId: 'child' }
    ],
    edges: [
        { source: 'organisation', target: 'organisationalUnit' },
        { source: 'organisationalUnit', target: 'organisationalUnit' },
        { source: 'person', target: 'nationality' },
        { source: 'person', target: 'language' }
    ]
};

// Evaluation example: strict tree (single parent per node), laid out and drawn by dpuse-tool-d3-visualiser's renderTreeDiagram (d3-hierarchy + d3-selection).
const DIMENSION_TREE: TreeDiagramNode = {
    id: 'geography',
    label: 'Geography',
    children: [
        {
            id: 'europe',
            label: 'Europe',
            children: [
                { id: 'unitedKingdom', label: 'United Kingdom' },
                { id: 'germany', label: 'Germany' }
            ]
        },
        {
            id: 'northAmerica',
            label: 'North America',
            children: [
                { id: 'unitedStates', label: 'United States' },
                { id: 'canada', label: 'Canada' }
            ]
        }
    ]
};

// ── Options, Properties, Model Value, Slots & Emits ──────────────────────────────────────────────────────────────────

const { modelReference } = defineProps<{ modelReference: GridListItem<LocalisedConfig<ComponentBase>> }>();

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

const activeModel = shallowRef();
const activeEntityTab = shallowRef(ENTITY_TABS[0]);
const expandedDimensionId = ref<string | null>(null);
const expandedEntityId = ref<string | null>(null);
const open = ref(false);
const purifiedDescription = ref('');
const modelDescription = ref('');
const modelReferenceLabel = ref('');
const modelMap = modelConfigs as Record<string, Model>;
const erdContainer = useTemplateRef<HTMLDivElement>('erdContainer');
const dimensionTreeContainer = useTemplateRef<HTMLDivElement>('dimensionTreeContainer');
const markedTool = shallowRef<MarkedToolType>();
const descriptorsPanelError = ref<unknown>(null);

// ── Side Effects ─────────────────────────────────────────────────────────────────────────────────────────────────────

onErrorCaptured((error) => {
    descriptorsPanelError.value = error;
    return false;
});

const toolReady = new Promise<void>((resolve) => {
    watch(
        toolConfigs,
        (newToolConfigs) => {
            if (newToolConfigs.length === 0) return;
            resolve();
        },
        { immediate: true }
    );
});

onMounted(async () => {
    await toolReady;

    const [markedToolInstance, d3Tool] = await Promise.all([loadMarkedTool(), loadD3Tool()]);
    markedTool.value = markedToolInstance;
    if (erdContainer.value) await d3Tool.renderErdDiagram(ERD_DATA, erdContainer.value);
    if (dimensionTreeContainer.value) await d3Tool.renderTreeDiagram(DIMENSION_TREE, dimensionTreeContainer.value);
});

watch(
    () => modelReference,
    async (newModelReference) => {
        modelDescription.value = newModelReference.description + newModelReference.description + newModelReference.description + newModelReference.description;
        modelReferenceLabel.value = newModelReference.label;
        activeModel.value = localiseModel(modelMap[newModelReference.id]);

        markedTool.value ??= await loadMarkedTool();
        purifiedDescription.value = DOMPurify.sanitize(markedTool.value.render(newModelReference.description));
    },
    { immediate: true }
);

// ── Event Handlers ───────────────────────────────────────────────────────────────────────────────────────────────────

function toggleEntity(entityId: string): void {
    expandedEntityId.value = expandedEntityId.value === entityId ? null : entityId;
}

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

function localiseModel(model: Model): LocalisedModel {
    const localisedEntities: LocalisedEntity[] = Array.from(model.entities, (entity) => ({ ...entity, label: entity.label.en, description: entity.description.en }));
    const localisedDimensions: LocalisedEntity[] = Array.from(model.dimensions, (dimension) => ({
        ...dimension,
        label: dimension.label.en,
        description: dimension.description.en
    }));
    return { ...model, entities: localisedEntities, dimensions: localisedDimensions };
}

function purifyText(text: string): string {
    if (!markedTool.value) return '';
    return DOMPurify.sanitize(markedTool.value.render(text));
}

async function loadMarkedTool(): Promise<MarkedToolType> {
    const toolModuleConfig = toolConfigs.value.find((config) => config.id === 'dpuse-tool-marked-markdown-parser');
    if (!toolModuleConfig) throw new Error('No Marked tool module configuration.');

    const url = `https://engine-eu.dpuse.app/tools/marked-markdown-parser_v${toolModuleConfig.version}/dpuse-tool-marked-markdown-parser.es.js`;
    const module = (await import(/* @vite-ignore */ url)) as { MarkedTool: new () => MarkedToolType };
    const MarkedTool = module.MarkedTool;
    return new MarkedTool();
}

async function loadD3Tool(): Promise<D3ToolType> {
    const toolModuleConfig = toolConfigs.value.find((config) => config.id === 'dpuse-tool-d3-visualiser');
    if (!toolModuleConfig) throw new Error('No D3 tool module configuration.');

    const url = `https://engine-eu.dpuse.app/tools/d3-visualiser_v${toolModuleConfig.version}/dpuse-tool-d3-visualiser.es.js`;
    const module = (await import(/* @vite-ignore */ url)) as { D3Tool: new () => D3ToolType };
    const D3Tool = module.D3Tool;
    return new D3Tool();
}
</script>

<template>
    <div class="dpuse-prose flex-1 overflow-y-auto overscroll-y-none px-4 pb-(--vertical-scroll-bottom-screen-inset)">
        <div class="max-w-prose">
            <!-- Header -->
            <h1 class="flex flex-none items-center justify-between gap-x-3 pt-6">
                {{ modelReference.label }} Model
                <Button class="mr-4" shape="minimal" @click="open = true">
                    <SquarePenIcon class="size-5" stroke-width="1.5" />
                </Button>
            </h1>

            <!-- Description -->
            <div v-html="purifiedDescription" />

            <BaseDialog v-model="open" :title="`${modelReference.label} Descriptors`" @save="open = false">
                <ComponentLoadError v-if="descriptorsPanelError" :error="descriptorsPanelError" name="ContextModelDescriptorsPanel" class="flex-1" />
                <Suspense v-else-if="open">
                    <template #default>
                        <ContextModelDescriptorsPanel v-model:label="modelReferenceLabel" v-model:description="modelDescription" />
                    </template>
                    <template #fallback>
                        <div class="flex flex-1 items-center justify-center">
                            <LoaderCircleIcon class="animate-spin text-muted" />
                        </div>
                    </template>
                </Suspense>
            </BaseDialog>

            <!-- <h3>Schematic</h3> -->

            <!-- ERD evaluation: layout and rendering via dpuse-tool-d3-visualiser's renderErdDiagram (dagre + d3-selection) -->
            <!-- <div ref="erdContainer" /> -->

            <!-- Dimension tree evaluation: layout and rendering via dpuse-tool-d3-visualiser's renderTreeDiagram (d3-hierarchy + d3-selection) -->
            <!-- <div ref="dimensionTreeContainer" /> -->

            <!-- Entities -->
            <h2 class="flex flex-none items-center justify-between gap-x-3">
                Entities
                <Button class="mr-4" shape="minimal" @click="open = true">
                    <NetworkIcon class="size-5" stroke-width="1.5" />
                </Button>
            </h2>

            <p>The entities that make up this model.</p>

            <div
                v-for="entity in activeModel.entities"
                :key="entity.id"
                class="mt-2 max-w-prose border"
                :class="expandedEntityId === entity.id ? 'rounded-md  border-separator' : 'rounded-md border-backdrop'"
            >
                <div
                    role="button"
                    tabindex="0"
                    :aria-expanded="expandedEntityId === entity.id"
                    class="flex items-center gap-x-2 bg-backdrop py-2 pr-4 pl-2"
                    :class="expandedEntityId === entity.id ? 'rounded-t-md' : 'rounded-md'"
                    @click="toggleEntity(entity.id)"
                    @keydown.enter="toggleEntity(entity.id)"
                    @keydown.space.prevent="toggleEntity(entity.id)"
                >
                    <ChevronRightIcon class="size-5" stroke-width="1.5" />
                    <div class="flex-1">{{ entity.label }}</div>
                    <Button class="" shape="minimal" @click="open = true">
                        <SquarePenIcon class="size-5" stroke-width="1.5" />
                    </Button>
                </div>

                <div v-if="expandedEntityId === entity.id" class="overflow-y-hidden rounded-b-md px-4 pb-4">
                    <!-- Description -->
                    <div v-html="purifyText(entity.description)" />

                    <!-- Entity Tabs -->
                    <div class="flex flex-none items-center gap-x-3 overflow-x-auto overscroll-x-none border-b border-separator">
                        <template v-for="entityTab in ENTITY_TABS" :key="entityTab.id">
                            <Button
                                class="border-y-2 border-t-transparent py-1.25"
                                :class="entityTab.id === activeEntityTab.id ? 'border-b-blue-400' : 'border-b-transparent'"
                                shape="minimal"
                                @click="activeEntityTab = entityTab"
                            >
                                <div>{{ entityTab.label }}</div>
                            </Button>
                        </template>
                    </div>

                    <!-- Parents Panel -->
                    <div v-show="activeEntityTab.id === 'parents'" class="py-1">
                        <div v-for="parent in entity.parents" :key="parent">
                            {{ parent }}
                        </div>
                    </div>

                    <!-- Characteristics Panel -->
                    <div v-show="activeEntityTab.id === 'characteristics'" class="py-1">
                        <div v-for="characteristic in entity.characteristics" :key="characteristic">
                            {{ characteristic }}
                        </div>
                    </div>

                    <!-- Events Panel -->
                    <div v-show="activeEntityTab.id === 'events'" class="py-1">
                        <!-- <div v-for="event in entity.events" :key="event.id">{{ event.id }}</div> -->
                        {{ entity.events }}
                    </div>

                    <!-- Primary Measures Panel -->
                    <div v-show="activeEntityTab.id === 'primaryMeasures'" class="py-1">
                        <!-- <div v-for="primaryMeasure in entity.primaryMeasures" :key="primaryMeasure.id">{{ primaryMeasure.id }}</div> -->
                        {{ entity.primaryMeasures }}
                    </div>
                </div>
            </div>

            <!-- Dimensions -->
            <h2 class="flex flex-none items-center justify-between gap-x-3">Dimensions</h2>

            <div
                v-for="dimension in activeModel.dimensions"
                :key="dimension.id"
                class="mt-2 max-w-prose border"
                :class="expandedDimensionId === dimension.id ? 'rounded-md  border-separator' : 'rounded-md border-backdrop'"
            >
                <div
                    role="button"
                    tabindex="0"
                    :aria-expanded="expandedDimensionId === dimension.id"
                    class="flex items-center gap-x-2 bg-backdrop py-2 pr-4 pl-2"
                    :class="expandedDimensionId === dimension.id ? 'rounded-t-md' : 'rounded-md'"
                    @click="toggleEntity(dimension.id)"
                    @keydown.enter="toggleEntity(dimension.id)"
                    @keydown.space.prevent="toggleEntity(dimension.id)"
                >
                    <ChevronRightIcon class="size-5" stroke-width="1.5" />
                    <div class="flex-1">{{ dimension.label }}</div>
                    <Button class="" shape="minimal" @click="open = true">
                        <SquarePenIcon class="size-5" stroke-width="1.5" />
                    </Button>
                </div>

                <div v-if="expandedDimensionId === dimension.id" class="overflow-y-hidden rounded-b-md px-4 pb-4">
                    <!-- Description -->
                    <div v-html="purifyText(dimension.description)" />

                    <!-- Entity Tabs -->
                    <div class="flex flex-none items-center gap-x-3 overflow-x-auto overscroll-x-none border-b border-separator">
                        <template v-for="entityTab in ENTITY_TABS" :key="entityTab.id">
                            <Button
                                class="border-y-2 border-t-transparent py-1.25"
                                :class="entityTab.id === activeEntityTab.id ? 'border-b-blue-400' : 'border-b-transparent'"
                                shape="minimal"
                                @click="activeEntityTab = entityTab"
                            >
                                <div>{{ entityTab.label }}</div>
                            </Button>
                        </template>
                    </div>

                    <!-- Parents Panel -->
                    <div v-show="activeEntityTab.id === 'parents'" class="py-1">
                        <div v-for="parent in dimension.parents" :key="parent">
                            {{ parent }}
                        </div>
                    </div>

                    <!-- Characteristics Panel -->
                    <div v-show="activeEntityTab.id === 'characteristics'" class="py-1">
                        <div v-for="characteristic in dimension.characteristics" :key="characteristic">
                            {{ characteristic }}
                        </div>
                    </div>

                    <!-- Events Panel -->
                    <div v-show="activeEntityTab.id === 'events'" class="py-1">
                        <!-- <div v-for="event in entity.events" :key="event.id">{{ event.id }}</div> -->
                        {{ dimension.events }}
                    </div>

                    <!-- Primary Measures Panel -->
                    <div v-show="activeEntityTab.id === 'primaryMeasures'" class="py-1">
                        <!-- <div v-for="primaryMeasure in entity.primaryMeasures" :key="primaryMeasure.id">{{ primaryMeasure.id }}</div> -->
                        {{ dimension.primaryMeasures }}
                    </div>
                </div>
            </div>

            <!-- Secondary Measures -->
            <h2 class="flex flex-none items-center justify-between gap-x-3">Secondary Measures</h2>
        </div>
    </div>
</template>
