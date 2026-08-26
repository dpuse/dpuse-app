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
import Button from '@/components/ui/button/Button.vue';
import ContextModelDimensionsPanel from './ContextModelDimensionsPanel.vue';
import ContextModelEntitiesPanel from './ContextModelEntitiesPanel.vue';
import ContextModelSecondaryMeasuresPanel from './ContextModelSecondaryMeasuresPanel.vue';
import DialogModal from '@/components/ui/dialog/DialogModal.vue';
import ErrorDisplay from '@/components/ui/error/ErrorDisplay.vue';
import type { GridListItem } from './ContextList.vue';

// ── Dynamic Components
const ContextModelDescriptorsPanel = defineAsyncPanel(() => import('./ContextModelDescriptorsPanel.vue'), 'ContextModelDescriptorsPanel');
const ContextModelEntityRelationshipDiagramPanel = defineAsyncPanel(() => import('./ContextModelEntityRelationshipDiagramPanel.vue'), 'ContextModelEntityRelationshipDiagramPanel');
const ContextModelDimensionSchemaDiagramPanel = defineAsyncPanel(() => import('./ContextModelDimensionSchemaDiagramPanel.vue'), 'ContextModelDimensionSchemaDiagramPanel');

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

interface Properties {
    modelReference: GridListItem<LocalisedConfig<ComponentBaseConfig>>;
}
const { modelReference } = defineProps<Properties>();

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

const { markedTool, error: markedToolError, errorWasReported: markedToolErrorWasReported, initialise: initialiseMarkedTool } = useMarkedTool();

const modelReferenceDescription = ref('');
const modelReferenceLabel = ref('');

const activeModel = shallowRef<LocalisedModel | undefined>();

const dimensionSchemaDiagramIsOpen = ref(false);
const entityRelationshipDiagramIsOpen = ref(false);
const modelDescriptorsDialogIsOpen = ref(false);

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
    <div class="dpuse-prose flex-1 overflow-y-auto overscroll-y-none px-4 pb-(--vertical-scroll-bottom-screen-inset)">
        <div class="max-w-prose">
            <ErrorDisplay v-if="markedToolError" class="mt-4" :error="markedToolError" :error-was-reported="markedToolErrorWasReported" @retry="handleRetryMarkedTool" />

            <!-- Header -->
            <h1 class="flex flex-none items-center justify-between gap-x-3 pt-6">
                {{ modelReference.label }} Model
                <Button class="mr-4" shape="minimal" @click="modelDescriptorsDialogIsOpen = true">
                    <SquarePenIcon class="size-5" stroke-width="1.5" />
                </Button>
            </h1>

            <!-- Description -->
            <div v-html="purifyMarkdown(markedTool, modelReferenceDescription)" />

            <ContextModelEntitiesPanel
                :entities="activeModel?.entities ?? []"
                :marked-tool="markedTool"
                @edit="modelDescriptorsDialogIsOpen = true"
                @show-erd-diagram="entityRelationshipDiagramIsOpen = true"
            />

            <ContextModelDimensionsPanel
                :dimensions="activeModel?.dimensions ?? []"
                :marked-tool="markedTool"
                @edit="modelDescriptorsDialogIsOpen = true"
                @show-tree-diagram="dimensionSchemaDiagramIsOpen = true"
            />

            <ContextModelSecondaryMeasuresPanel :secondary-measures="activeModel?.secondaryMeasures ?? []" :marked-tool="markedTool" @edit="modelDescriptorsDialogIsOpen = true" />
        </div>

        <DialogModal :is-open="modelDescriptorsDialogIsOpen" max-width="90vw" min-height="90vh" sizing="full" :title="`${modelReference.label} Descriptors`" @close="modelDescriptorsDialogIsOpen = false">
            <ContextModelDescriptorsPanel v-if="modelDescriptorsDialogIsOpen" v-model:label="modelReferenceLabel" v-model:description="modelReferenceDescription" />
        </DialogModal>

        <DialogModal :is-open="entityRelationshipDiagramIsOpen" max-width="90vw" min-height="90vh" sizing="full" title="Sample ERD Diagram" @close="entityRelationshipDiagramIsOpen = false">
            <ContextModelEntityRelationshipDiagramPanel v-if="entityRelationshipDiagramIsOpen" />
        </DialogModal>

        <DialogModal :is-open="dimensionSchemaDiagramIsOpen" max-width="90vw" min-height="90vh" sizing="full" title="Sample Dimension Tree Diagram" @close="dimensionSchemaDiagramIsOpen = false">
            <ContextModelDimensionSchemaDiagramPanel v-if="dimensionSchemaDiagramIsOpen" />
        </DialogModal>
    </div>
</template>
