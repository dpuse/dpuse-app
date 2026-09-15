<script setup lang="ts">
// ── External Dependencies & Registrations
import { SquarePenIcon } from '@lucide/vue';
import { ref, shallowRef, watch } from 'vue';

// ── DPUse Framework
import type { ComponentBaseConfig } from '@dpuse/dpuse-shared/component';
import type { ContextModelConfig } from '@dpuse/dpuse-shared/component/context/model';
import type { LocalisedConfig } from '@dpuse/dpuse-shared/locale';
import type { ContextModelDimensionHierarchyConfig, ContextModelDimensionHierarchyNodeConfig } from '@dpuse/dpuse-shared/component/context/model/dimension/hierarchy';

// ── Local Framework
import { defineAsyncPanel } from '@/utilities';
import type { LocalisedDimension, LocalisedDimensionHierarchy, LocalisedDimensionHierarchyNode, LocalisedEntity, LocalisedModel, LocalisedSecondaryMeasure } from './_context';
import { purifyText, useMarkedTool } from '@/services/useMarkedTool';

// ── Data
import modelConfigsData from './_data/modelConfigs.json'; // TODO: remove once loadModel fetches remotely

// ── Static Components
import ActionWrapper from '@/components/ui/action/ActionWrapper.vue';
import ContextDimensionList from './ContextDimensionList.vue';
import ContextEntityList from './ContextEntityList.vue';
import ContextSecondaryMeasureList from './ContextSecondaryMeasureList.vue';
import Dialog from '@/components/ui/dialog/Dialog.vue';
import ErrorNotice from '@/components/ui/error/ErrorNotice.vue';
import type { GridListItem } from './ContextModelList.vue';

// ── Dynamic Components
const ContextDescriptorsPanel = defineAsyncPanel(() => import('./_components/ContextDescriptorsPanel.vue'), 'ContextDescriptorsPanel');
const ContextDimensionDiagramPanel = defineAsyncPanel(() => import('./ContextDimensionDiagramPanel.vue'), 'ContextDimensionDiagramPanel');
const ContextEntityDiagramPanel = defineAsyncPanel(() => import('./ContextEntityDiagramPanel.vue'), 'ContextEntityDiagramPanel');

// ── Options, Props, Slots & Emits ────────────────────────────────────────────────────────────────────────────────────

const { modelReference } = defineProps<{ modelReference: GridListItem<LocalisedConfig<ComponentBaseConfig>> }>();

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

const { markedTool, failure: markedToolFailure, initialise: initialiseMarkedTool } = useMarkedTool();
const modelReferenceDescription = ref('');
const modelReferenceLabel = ref('');
const activeModel = shallowRef<LocalisedModel | undefined>();
const modelDescriptorsDialogIsOpen = ref(false);
const modelDimensionDiagramDialogIsOpen = ref(false);
const modelErdDiagramDialogIsOpen = ref(false);

// ── Side Effects ─────────────────────────────────────────────────────────────────────────────────────────────────────

watch(
    () => modelReference,
    async (newModelReference) => {
        modelReferenceDescription.value = newModelReference.description;
        modelReferenceLabel.value = newModelReference.label;
        activeModel.value = localiseModel(await loadModel(newModelReference.id));
        if (!markedTool.value) await initialiseMarkedTool();
    },
    { immediate: true }
);

// ── Event Handlers ───────────────────────────────────────────────────────────────────────────────────────────────────

function handleRetryMarkedTool(): void {
    void initialiseMarkedTool();
}

function handleShowDimensionTreeDiagram(): void {
    modelDimensionDiagramDialogIsOpen.value = true;
}

function handleShowErdDiagram(): void {
    modelErdDiagramDialogIsOpen.value = true;
}

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

async function loadModel(modelId: string): Promise<ContextModelConfig> {
    // Future: return (await fetch(`/api/model-configs/${modelId}`)).json() as Promise<ContextModelConfig>;
    await new Promise((resolve) => setTimeout(resolve, 400)); // Simulates the network latency the real fetch above will have.
    return (modelConfigsData as unknown as Record<string, ContextModelConfig>)[modelId];
}

function localiseModel(model: ContextModelConfig): LocalisedModel {
    const localisedEntities: LocalisedEntity[] = Array.from(model.entities, (entity) => ({
        ...entity,
        label: localiseText(entity.label),
        description: localiseText(entity.description),
        dataItems: Array.from(entity.dataItems, (dataItem) => ({ ...dataItem, label: localiseText(dataItem.label), description: localiseText(dataItem.description) })),
        events: Array.from(entity.events, (event) => ({
            ...event,
            labelAction: localiseText(event.labelAction),
            labelState: event.labelState ? localiseText(event.labelState) : undefined,
            description: localiseText(event.description)
        })),
        primaryMeasures: Array.from(entity.primaryMeasures, (measure) => ({ ...measure, label: localiseText(measure.label), description: localiseText(measure.description) }))
    }));
    const localisedDimensions: LocalisedDimension[] = Array.from(model.dimensions, (dimension) => ({
        ...dimension,
        label: localiseText(dimension.label),
        description: localiseText(dimension.description),
        hierarchies: Array.from(dimension.hierarchies, localiseHierarchy)
    }));
    const localisedSecondaryMeasures: LocalisedSecondaryMeasure[] = Array.from(model.secondaryMeasures, (measure) => ({
        ...measure,
        label: localiseText(measure.label),
        description: localiseText(measure.description)
    }));
    return {
        ...model,
        label: localiseText(model.label),
        description: localiseText(model.description),
        entities: localisedEntities,
        dimensions: localisedDimensions,
        secondaryMeasures: localisedSecondaryMeasures
    };
}

function localiseHierarchy(hierarchy: ContextModelDimensionHierarchyConfig): LocalisedDimensionHierarchy {
    return {
        ...hierarchy,
        label: localiseText(hierarchy.label),
        description: localiseText(hierarchy.description),
        levels: Array.from(hierarchy.levels, (level) => ({ ...level, label: localiseText(level.label), description: localiseText(level.description) })),
        children: Array.from(hierarchy.children, localiseHierarchyNode)
    };
}

// Recursive to match 'ContextModelDimensionHierarchyNodeConfig' — a hierarchy nests arbitrarily deep (the age
// hierarchy's leaves are individual years), so there is no fixed depth to unroll.
function localiseHierarchyNode(node: ContextModelDimensionHierarchyNodeConfig): LocalisedDimensionHierarchyNode {
    return {
        ...node,
        label: localiseText(node.label),
        description: localiseText(node.description),
        children: node.children ? Array.from(node.children, localiseHierarchyNode) : undefined
    };
}

// 'label'/'description' are locale maps, but not always: some primary measures (e.g. 'personLanguage') give a plain
// string instead. 'description' can also be absent entirely on data items, events, and primary measures whose type
// declares it optional — this still has to cope with that being 'undefined' at runtime.
function localiseText(value: string | Partial<Record<string, string>> | undefined): string {
    return typeof value === 'string' ? value : (value?.en ?? '');
}
</script>

<template>
    <!-- Covers the region, as the same failure does in the chat: the descriptions render blank without the formatter,
         so what is left is a page of empty headings. Placed outside the prose column it replaces, which is padded and
         measure-limited for reading and would otherwise inset the failure from the region it is meant to fill. -->
    <ErrorNotice v-if="markedToolFailure" covers-region :failures="[markedToolFailure]" @retry="handleRetryMarkedTool" />

    <div v-else class="dpuse-prose flex-1 overflow-y-auto overscroll-y-none px-4 pb-(--vertical-scroll-bottom-screen-inset)">
        <div class="max-w-prose">
            <!-- Header -->
            <h1 class="flex flex-none items-center justify-between gap-x-3 pt-6">
                {{ modelReference.label }} Model
                <ActionWrapper class="mr-4" @click="modelDescriptorsDialogIsOpen = true">
                    <SquarePenIcon class="size-5" stroke-width="1.5" />
                </ActionWrapper>
            </h1>

            <!-- Description -->
            <div v-html="purifyText(modelReferenceDescription)" />

            <ContextEntityList :entities="activeModel?.entities ?? []" @edit="modelDescriptorsDialogIsOpen = true" @show-erd-diagram="handleShowErdDiagram" />

            <ContextDimensionList
                :dimensions="activeModel?.dimensions ?? []"
                @edit="modelDescriptorsDialogIsOpen = true"
                @show-tree-diagram="handleShowDimensionTreeDiagram"
            />

            <ContextSecondaryMeasureList :secondary-measures="activeModel?.secondaryMeasures ?? []" @edit="modelDescriptorsDialogIsOpen = true" />
        </div>

        <Dialog
            :is-open="modelDescriptorsDialogIsOpen"
            max-width="90vw"
            min-height="90vh"
            sizing="full"
            :title="`${modelReference.label} Descriptors`"
            @close="modelDescriptorsDialogIsOpen = false"
        >
            <ContextDescriptorsPanel v-if="modelDescriptorsDialogIsOpen" v-model:label="modelReferenceLabel" v-model:description="modelReferenceDescription" />
        </Dialog>

        <!-- No 'title' passed through: both diagram panels render their own 'DialogHeader', unlike 'ContextDescriptorsPanel' above. -->
        <Dialog :is-open="modelDimensionDiagramDialogIsOpen" max-width="90vw" min-height="90vh" sizing="full" @close="modelDimensionDiagramDialogIsOpen = false">
            <ContextDimensionDiagramPanel v-if="modelDimensionDiagramDialogIsOpen" />
        </Dialog>

        <Dialog :is-open="modelErdDiagramDialogIsOpen" max-width="90vw" min-height="90vh" sizing="full" @close="modelErdDiagramDialogIsOpen = false">
            <ContextEntityDiagramPanel v-if="modelErdDiagramDialogIsOpen" />
        </Dialog>
    </div>
</template>
