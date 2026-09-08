<script setup lang="ts">
// ── External Dependencies & Registrations
import { SquarePenIcon } from '@lucide/vue';
import { ref, shallowRef, watch } from 'vue';

// ── DPUse Framework
import type { ComponentBaseConfig } from '@dpuse/dpuse-shared/component';
import type { LocalisedConfig } from '@dpuse/dpuse-shared/locale';

// ── Local Framework
import { defineAsyncPanel } from '@/utilities';
import { useDialogs } from '@/state/dialogs';
import type { LocalisedModel, LocalisedModelItem, LocalisedSecondaryMeasure } from './contextModel';
import { purifyMarkdown, useMarkedTool } from '@/services/useMarkedTool';

// ── Data
import modelConfigsData from './data/modelConfigs.json'; // TODO: remove once loadModel fetches remotely

// ── Static Components
import BaseButton from '@/components/ui/button/BaseButton.vue';
import ConfigContextModelDimensionsPanel from './ConfigContextModelDimensionsPanel.vue';
import ConfigContextModelEntitiesPanel from './ConfigContextModelEntitiesPanel.vue';
import ConfigContextModelSecondaryMeasuresPanel from './ConfigContextModelSecondaryMeasuresPanel.vue';
import DialogShell from '@/components/ui/dialog/DialogShell.vue';
import ErrorShell from '@/components/ui/error/ErrorShell.vue';
import type { GridListItem } from './ConfigContextModelList.vue';

// ── Dynamic Components
// The two diagram panels are not here: they stand up from the URL alone, so they are registered in '@/state/dialogs'
// and rendered by the app's own frame. This one edits state that only this panel holds, which the URL cannot restore,
// so it stays local until the selected model is itself part of the route.
const ConfigContextModelDescriptorsPanel = defineAsyncPanel(() => import('./ConfigContextModelDescriptorsPanel.vue'), 'ConfigContextModelDescriptorsPanel');

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

const { markedTool, failure: markedToolFailure, initialise: initialiseMarkedTool } = useMarkedTool();

const modelReferenceDescription = ref('');
const modelReferenceLabel = ref('');

const activeModel = shallowRef<LocalisedModel | undefined>();

const modelDescriptorsDialogIsOpen = ref(false);
const { openDialog } = useDialogs();

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
    void openDialog('modelDimensionDiagram');
}

function handleShowErdDiagram(): void {
    void openDialog('modelErdDiagram');
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
    <ErrorShell v-if="markedToolFailure" covers-region :failures="[markedToolFailure]" @retry="handleRetryMarkedTool" />

    <div v-else class="dpuse-prose flex-1 overflow-y-auto overscroll-y-none px-4 pb-(--vertical-scroll-bottom-screen-inset)">
        <div class="max-w-prose">
            <!-- Header -->
            <h1 class="flex flex-none items-center justify-between gap-x-3 pt-6">
                {{ modelReference.label }} Model
                <BaseButton class="mr-4" @click="modelDescriptorsDialogIsOpen = true">
                    <SquarePenIcon class="size-5" stroke-width="1.5" />
                </BaseButton>
            </h1>

            <!-- Description -->
            <div v-html="purifyMarkdown(markedTool, modelReferenceDescription)" />

            <ConfigContextModelEntitiesPanel
                :entities="activeModel?.entities ?? []"
                :marked-tool="markedTool"
                @edit="modelDescriptorsDialogIsOpen = true"
                @show-erd-diagram="handleShowErdDiagram"
            />

            <ConfigContextModelDimensionsPanel
                :dimensions="activeModel?.dimensions ?? []"
                :marked-tool="markedTool"
                @edit="modelDescriptorsDialogIsOpen = true"
                @show-tree-diagram="handleShowDimensionTreeDiagram"
            />

            <ConfigContextModelSecondaryMeasuresPanel
                :secondary-measures="activeModel?.secondaryMeasures ?? []"
                :marked-tool="markedTool"
                @edit="modelDescriptorsDialogIsOpen = true"
            />
        </div>

        <DialogShell
            :is-open="modelDescriptorsDialogIsOpen"
            max-width="90vw"
            min-height="90vh"
            sizing="full"
            :title="`${modelReference.label} Descriptors`"
            @close="modelDescriptorsDialogIsOpen = false"
        >
            <ConfigContextModelDescriptorsPanel v-if="modelDescriptorsDialogIsOpen" v-model:label="modelReferenceLabel" v-model:description="modelReferenceDescription" />
        </DialogShell>
    </div>
</template>
