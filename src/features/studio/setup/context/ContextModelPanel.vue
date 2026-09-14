<script setup lang="ts">
// ── External Dependencies & Registrations
import { SquarePenIcon } from '@lucide/vue';
import { ref, shallowRef, watch } from 'vue';

// ── DPUse Framework
import type { ComponentBaseConfig } from '@dpuse/dpuse-shared/component';
import type { ContextModelConfig } from '@dpuse/dpuse-shared/component/context/model';
import type { ContextModelEntityConfig } from '@dpuse/dpuse-shared/component/context/model/entity';
import type { ContextModelEntityDataItemConfig } from '@dpuse/dpuse-shared/component/context/model/entity/dataItem';
import type { LocalisedConfig } from '@dpuse/dpuse-shared/locale';

// ── Local Framework
import { defineAsyncPanel } from '@/utilities';
import type { LocalisedDimension, LocalisedEntity, LocalisedModel, LocalisedSecondaryMeasure } from './contextModel';
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
        dataItems: Array.from(rawEntityDataItems(entity), (dataItem) => ({ ...dataItem, label: localiseText(dataItem.label), description: localiseText(dataItem.description) })),
        // Placeholders, not converted: the shared config types both as arrays of configs, but the mock model data
        // still stores them as keyed objects — see 'LocalisedEntity'.
        events: undefined,
        primaryMeasures: undefined
    }));
    const localisedDimensions: LocalisedDimension[] = Array.from(model.dimensions, (dimension) => ({
        ...dimension,
        label: localiseText(dimension.label),
        description: localiseText(dimension.description)
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

// The mock model data still calls this field 'characteristics'; the shared config names it 'dataItems'.
function rawEntityDataItems(entity: ContextModelEntityConfig): ContextModelEntityDataItemConfig[] {
    return (entity as unknown as { characteristics?: ContextModelEntityDataItemConfig[] }).characteristics ?? entity.dataItems;
}

// The shared config declares 'label'/'description' as always present, but the mock model data doesn't reliably
// populate every field it declares required — some entries (e.g. a bare '{ entityTypeId: "country" }' data item)
// have neither. Defensive despite what the type promises, until the data actually matches it.
function localiseText(value: Partial<Record<string, string>> | undefined): string {
    return value?.en ?? '';
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
