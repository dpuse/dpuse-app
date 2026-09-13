<script setup lang="ts">
// ── External Dependencies & Registrations
import { SquarePenIcon } from '@lucide/vue';
import { ref, shallowRef, watch } from 'vue';

// ── DPUse Framework
import type { ComponentBaseConfig } from '@dpuse/dpuse-shared/component';
import type { LocalisedConfig } from '@dpuse/dpuse-shared/locale';

// ── Local Framework
import { defineAsyncPanel } from '@/utilities';
import type { LocalisedModel, LocalisedModelItem, LocalisedSecondaryMeasure } from './contextModel';
import { purifyMarkdown, useMarkedTool } from '@/services/useMarkedTool';

// ── Data
import modelConfigsData from './data/modelConfigs.json'; // TODO: remove once loadModel fetches remotely

// ── Static Components
import ActionWrapper from '@/components/ui/action/ActionWrapper.vue';
import ContextDimensionsPanel from './ContextDimensionsPanel.vue';
import ContextEntitiesPanel from './ContextEntitiesPanel.vue';
import ContextSecondaryMeasuresPanel from './ContextSecondaryMeasuresPanel.vue';
import Dialog from '@/components/ui/dialog/Dialog.vue';
import ErrorNotice from '@/components/ui/error/ErrorNotice.vue';
import type { GridListItem } from './ContextModelList.vue';

// ── Dynamic Components
// All three are local, not registered in '@/state/dialogs': each depends on state only this panel holds — the
// loaded model, or refs this panel owns — which the URL cannot restore, so none can stand up from it alone.
const ContextDescriptorsPanel = defineAsyncPanel(() => import('./ContextDescriptorsPanel.vue'), 'ContextDescriptorsPanel');
const ContextDimensionSchemaDiagramPanel = defineAsyncPanel(() => import('./ContextDimensionSchemaDiagramPanel.vue'), 'ContextDimensionSchemaDiagramPanel');
const ContextEntityRelationshipDiagramPanel = defineAsyncPanel(() => import('./ContextEntityRelationshipDiagramPanel.vue'), 'ContextEntityRelationshipDiagramPanel');

// ── Types ────────────────────────────────────────────────────────────────────────────────────────────────────────────

interface Dimension {
    id: string;
    label: Record<string, string>;
    description: Record<string, string>;
}
interface Entity {
    id: string;
    label: Record<string, string>;
    description: Record<string, string>;
}
interface SecondaryMeasure {
    id: string;
    label: Record<string, string>;
    description: Record<string, string>;
    formula: string;
}
interface Model {
    entities: Entity[];
    dimensions: Dimension[];
    secondaryMeasures: SecondaryMeasure[];
}

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

// eslint-disable-next-line @typescript-eslint/require-await
async function loadModel(modelId: string): Promise<Model> {
    // Future: return (await fetch(`/api/model-configs/${modelId}`)).json() as Promise<Model>;
    return (modelConfigsData as Record<string, Model>)[modelId];
}

function localiseModel(model: Model): LocalisedModel {
    const localisedEntities: LocalisedModelItem[] = Array.from(model.entities, (entity) => ({ ...entity, label: entity.label.en, description: entity.description.en }));
    const localisedDimensions: LocalisedModelItem[] = Array.from(model.dimensions, (dimension) => ({
        ...dimension,
        label: dimension.label.en,
        description: dimension.description.en
    }));
    const localisedSecondaryMeasures: LocalisedSecondaryMeasure[] = Array.from(model.secondaryMeasures, (measure) => ({
        ...measure,
        label: measure.label.en,
        description: measure.description.en
    }));
    return { ...model, entities: localisedEntities, dimensions: localisedDimensions, secondaryMeasures: localisedSecondaryMeasures };
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
            <div v-html="purifyMarkdown(markedTool, modelReferenceDescription)" />

            <ContextEntitiesPanel
                :entities="activeModel?.entities ?? []"
                :marked-tool="markedTool"
                @edit="modelDescriptorsDialogIsOpen = true"
                @show-erd-diagram="handleShowErdDiagram"
            />

            <ContextDimensionsPanel
                :dimensions="activeModel?.dimensions ?? []"
                :marked-tool="markedTool"
                @edit="modelDescriptorsDialogIsOpen = true"
                @show-tree-diagram="handleShowDimensionTreeDiagram"
            />

            <ContextSecondaryMeasuresPanel :secondary-measures="activeModel?.secondaryMeasures ?? []" :marked-tool="markedTool" @edit="modelDescriptorsDialogIsOpen = true" />
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
            <ContextDimensionSchemaDiagramPanel v-if="modelDimensionDiagramDialogIsOpen" />
        </Dialog>

        <Dialog :is-open="modelErdDiagramDialogIsOpen" max-width="90vw" min-height="90vh" sizing="full" @close="modelErdDiagramDialogIsOpen = false">
            <ContextEntityRelationshipDiagramPanel v-if="modelErdDiagramDialogIsOpen" />
        </Dialog>
    </div>
</template>
