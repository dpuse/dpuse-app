<script setup lang="ts">
// ── External Dependencies & Registrations
import { SquarePenIcon } from '@lucide/vue';
import { computed, ref, shallowRef, watch } from 'vue';

// ── DPUse Framework
import type { ComponentBaseConfig } from '@dpuse/dpuse-shared/component';
import type { ContextModelConfig } from '@dpuse/dpuse-shared/component/context/model';
import type { ContextModelDimensionConfig } from '@dpuse/dpuse-shared/component/context/model/dimension';
import type { ContextModelEntityConfig } from '@dpuse/dpuse-shared/component/context/model/entity';
import type { ContextModelSecondaryMeasureConfig } from '@dpuse/dpuse-shared/component/context/model/secondaryMeasure';
import type { LocalisedConfig } from '@dpuse/dpuse-shared/locale';

// ── Local Framework
import { T } from './ContextModelPanel_.json';
import { assertDefined, defineAsyncPanel } from '@/utilities';
import { localeId, t } from '@/state/locale';
import { localiseModel, localiseText } from './_context';
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
import ScrollArea from '@/components/ui/scroll/ScrollArea.vue';
import StudioDetailPanel from '@/features/studio/_components/StudioDetailPanel.vue';
import StudioDocumentPanel from '@/features/studio/_components/StudioDocumentPanel.vue';

// ── Dynamic Components
const ContextDescriptorsPanel = defineAsyncPanel(() => import('./_components/ContextDescriptorsPanel.vue'), 'ContextDescriptorsPanel');
const ContextDimensionDiagramPanel = defineAsyncPanel(() => import('./ContextDimensionDiagramPanel.vue'), 'ContextDimensionDiagramPanel');
const ContextEntityDiagramPanel = defineAsyncPanel(() => import('./ContextEntityDiagramPanel.vue'), 'ContextEntityDiagramPanel');

// ── Types ────────────────────────────────────────────────────────────────────────────────────────────────────────────

type DialogId = 'descriptors' | 'dimensionDiagram' | 'erdDiagram';

type ItemCollectionId = 'dimensions' | 'entities' | 'secondaryMeasures';

type ItemConfig = ContextModelDimensionConfig | ContextModelEntityConfig | ContextModelSecondaryMeasureConfig;

// ── Options, Props, Slots & Emits ────────────────────────────────────────────────────────────────────────────────────

const { modelReference } = defineProps<{ modelReference: LocalisedConfig<ComponentBaseConfig> }>();

defineEmits<{ close: [] }>();

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

const activeModelConfig = ref<ContextModelConfig>(); // Deep, so an edit to one item's descriptors re-localises the model.
const descriptorsSubjectLabel = ref(''); // Taken when the dialog opens, so its title holds steady while the label is edited.
const editedItemConfig = shallowRef<ItemConfig>(); // Unset while the dialog is editing the model's own descriptors.
const modelReferenceDescription = ref('');
const modelReferenceLabel = ref('');
const openDialogId = ref<DialogId>(); // One id rather than a flag per dialog, since only one can be open at a time.
const { markedTool, failure: markedToolFailure, initialise: initialiseMarkedTool } = useMarkedTool();

// ── Derived State ────────────────────────────────────────────────────────────────────────────────────────────────────

const activeModel = computed(() => (activeModelConfig.value ? localiseModel(activeModelConfig.value, localeId.value) : undefined)); // Derived, not stored, so a language switch re-localises the loaded model.

// TODO: An item's edits go into its entry for the current language, leaving its other translations as they were.
// TODO: Also edits are not saved to backend.
const descriptorsDescription = computed({
    get: () => (editedItemConfig.value ? localiseText(editedItemConfig.value.description, localeId.value) : modelReferenceDescription.value),
    set: (newDescription: string) => {
        if (editedItemConfig.value) editedItemConfig.value.description[localeId.value] = newDescription;
        else modelReferenceDescription.value = newDescription;
    }
});
// TODO: An item's edits go into its entry for the current language, leaving its other translations as they were.
// TODO: Also edits are not saved to backend.
const descriptorsLabel = computed({
    get: () => (editedItemConfig.value ? localiseText(editedItemConfig.value.label, localeId.value) : modelReferenceLabel.value),
    set: (newLabel: string) => {
        if (editedItemConfig.value) editedItemConfig.value.label[localeId.value] = newLabel;
        else modelReferenceLabel.value = newLabel;
    }
});

// ── Side Effects ─────────────────────────────────────────────────────────────────────────────────────────────────────

watch(
    () => modelReference,
    (newModelReference) => {
        modelReferenceDescription.value = newModelReference.description;
        modelReferenceLabel.value = newModelReference.label;
    },
    { immediate: true }
);

// Keyed on the id alone: a language switch hands over a new reference object for the same model, which 'activeModel'
// re-localises without a reload.
watch(
    () => modelReference.id,
    async (newModelId) => {
        activeModelConfig.value = await loadModel(newModelId);
        if (!markedTool.value) await initialiseMarkedTool();
    },
    { immediate: true }
);

// ── Event Handlers ───────────────────────────────────────────────────────────────────────────────────────────────────

function handleCloseDialog(): void {
    openDialogId.value = undefined;
}

function handleEditItem(itemCollectionId: ItemCollectionId, item: { id: string; label: string }): void {
    const itemConfigs: ItemConfig[] = assertDefined(activeModelConfig.value, 'Expected a loaded model before editing one of its items.')[itemCollectionId];
    editedItemConfig.value = assertDefined(
        itemConfigs.find((itemConfig) => itemConfig.id === item.id),
        `Expected a model item with id '${item.id}'.`
    );
    descriptorsSubjectLabel.value = item.label;
    openDialogId.value = 'descriptors';
}

function handleEditModel(): void {
    editedItemConfig.value = undefined;
    descriptorsSubjectLabel.value = modelReference.label;
    openDialogId.value = 'descriptors';
}

function handleOpenDialog(dialogId: DialogId): void {
    openDialogId.value = dialogId;
}

function handleRetryMarkedTool(): void {
    void initialiseMarkedTool();
}

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

async function loadModel(modelId: string): Promise<ContextModelConfig | undefined> {
    // Future: return (await fetch(`/api/model-configs/${modelId}`)).json() as Promise<ContextModelConfig | undefined>;
    await new Promise((resolve) => setTimeout(resolve, 400)); // Simulates the network latency the real fetch above will have.
    const modelConfig = (modelConfigsData as unknown as Record<string, ContextModelConfig | undefined>)[modelId];
    return modelConfig ? structuredClone(modelConfig) : undefined; // A copy, as a fetch would return, so edits don't write into the imported JSON.
}
</script>

<template>
    <!-- Covers the region, as the same failure does in the chat: the descriptions render blank without the formatter,
         so what is left is a page of empty headings. Placed outside the prose column it replaces, which is padded and
         measure-limited for reading and would otherwise inset the failure from the region it is meant to fill. -->
    <ErrorNotice v-if="markedToolFailure" covers-region :failures="[markedToolFailure]" @retry="handleRetryMarkedTool" />

    <StudioDetailPanel v-else data-region="ContextModelPanel">
        <ScrollArea scroll-area-padding-bottom="var(--vertical-scroll-bottom-screen-inset)">
            <StudioDocumentPanel
                class="max-w-prose"
                :icon="modelReference.icon"
                :icon-dark="modelReference.iconDark"
                :overline="t(T, 'models.label')"
                :title="modelReference.label"
                @close="$emit('close')"
            >
                <template #actions>
                    <ActionWrapper :aria-label="t(T, 'edit.aria', { label: modelReference.label })" @click="handleEditModel">
                        <SquarePenIcon class="size-5" stroke-width="1.5" />
                    </ActionWrapper>
                </template>

                <!-- Description -->
                <div v-html="purifyText(modelReferenceDescription)" />

                <ContextEntityList :entities="activeModel?.entities ?? []" @edit="handleEditItem('entities', $event)" @show-erd-diagram="handleOpenDialog('erdDiagram')" />

                <ContextDimensionList
                    :dimensions="activeModel?.dimensions ?? []"
                    @edit="handleEditItem('dimensions', $event)"
                    @show-tree-diagram="handleOpenDialog('dimensionDiagram')"
                />

                <ContextSecondaryMeasureList :secondary-measures="activeModel?.secondaryMeasures ?? []" @edit="handleEditItem('secondaryMeasures', $event)" />
            </StudioDocumentPanel>
        </ScrollArea>

        <!-- Only the descriptors panel takes a 'title': both diagram panels render their own 'DialogHeader'. -->
        <Dialog
            :is-open="openDialogId !== undefined"
            max-width="90vw"
            min-height="90vh"
            sizing="full"
            :title="openDialogId === 'descriptors' ? t(T, 'descriptors.title', { label: descriptorsSubjectLabel }) : undefined"
            @close="handleCloseDialog"
        >
            <ContextDescriptorsPanel v-if="openDialogId === 'descriptors'" v-model:label="descriptorsLabel" v-model:description="descriptorsDescription" />
            <ContextDimensionDiagramPanel v-else-if="openDialogId === 'dimensionDiagram'" />
            <ContextEntityDiagramPanel v-else-if="openDialogId === 'erdDiagram'" />
        </Dialog>
    </StudioDetailPanel>
</template>
