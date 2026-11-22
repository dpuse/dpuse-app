<script setup lang="ts">
// ── External Dependencies & Registrations
import { useResizeObserver } from '@vueuse/core';
import { onBeforeUnmount, ref, shallowRef, useTemplateRef, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

// ── DPUse Framework
import { AppError } from '@dpuse/dpuse-shared';
import type { ContextModelConfig } from '@dpuse/dpuse-shared';
import type { D3NetworkView, Tool as D3Tool, NetworkDiagramNode } from '@dpuse/dpuse-tool-d3-visualiser';

// ── Local Framework
import { defineLazyComponent } from '@/utilities/index.ts';
import { establishContextModelConfig } from '@/state/contextModels';
import { establishTool } from '@/services/tools';
import { ignoreReportedNavigationFailure } from '@/router';
import { TEXT } from './ContextNetworkPanel_.json';
import { useUnsavedWork } from '@/state/unsavedWork';
import { type AppFailure, raiseAppFailure, raiseFailure } from '@/state/errors';
import { constructContextDiagramData, type ContextDiagramData, type ContextDiagramNode } from './_contextDiagram';
import { constructNewEventQueryConfig, useUpdateEventQuery } from './_eventQueries';
import { contextConfig, contextConfigStatus } from '@/state/configs';
import { localeId, t } from '@/state/locale';

// ── Static Components
import BusyBar from '@/components/ui/BusyBar.vue';
import Dialog from '@/components/ui/dialog/Dialog.vue';
import ErrorNotice from '@/components/ui/error/ErrorNotice.vue';
import RectangleButton from '@/components/ui/action/RectangleButton.vue';
import RetrievalGate from '@/components/ui/RetrievalGate.vue';
import Separator from '@/components/ui/Separator.vue';
import StudioListLayout from '@/features/studio/_components/StudioListLayout.vue';

// ── Dynamic Components
const StudioDescriptorsPanel = defineLazyComponent(() => import('@/features/studio/_components/StudioDescriptorsPanel.vue'), 'StudioDescriptorsPanel');

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

// ── Route
const route = useRoute();
const router = useRouter();

// ── Diagram
const containerElement = useTemplateRef<HTMLDivElement>('container');
const diagramData = shallowRef<ContextDiagramData>(); // What is drawn now, which a click on a node is looked up in.
const diagramIsPending = ref(true); // The diagram area is blank while the d3 tool downloads and draws, so the wait is shown.
const diagramView = shallowRef<D3NetworkView>();
const renderFailure = shallowRef<AppFailure | undefined>();
const renderCount = ref(0); // Tells a render that a newer one has started while it waited for the tool, so it draws nothing.

// ── Open Models ─ The models whose entities and events are shown, by node id. Replaced whole on each change, so the
// diagram is drawn again.
const openModelConfigsByNodeId = shallowRef<ReadonlyMap<string, ContextModelConfig>>(new Map());
const modelIsLoading = ref(false);
const emptyModelLabel = ref<string>(); // The last model opened that had nothing to show, named in a message so the click is not met with silence.

// ── New Event Query ─ Only stored by the dialog's Save, so its ✕ leaves nothing behind.
const { isPending: eventQueryIsAdding, mutateAsync: addEventQuery } = useUpdateEventQuery();
const newEventQueryNode = shallowRef<ContextDiagramNode>(); // The event node the dialog is open for.
const newEventQueryDialogIsOpen = ref(false);
const draftDescription = ref('');
const draftLabel = ref('');

// ── Side Effects ─────────────────────────────────────────────────────────────────────────────────────────────────────

useUnsavedWork(newEventQueryDialogIsOpen); // A reload while the dialog is open loses what was typed.

// Drawn once the context has loaded and its container is on the page. Drawn again when a model is opened or closed,
// and when the language changes, because the node labels are in the user's language.
watch([contextConfig, localeId, containerElement, openModelConfigsByNodeId], () => void renderDiagram(), { immediate: true });

// The pane can be resized by its splitter, which the window's own resize event does not report.
useResizeObserver(containerElement, () => {
    diagramView.value?.resize();
});

onBeforeUnmount(destroyDiagram);

// ── Event Handlers ───────────────────────────────────────────────────────────────────────────────────────────────────

function handleRetry(): void {
    void renderDiagram();
}

function handleAutoLayout(): void {
    diagramView.value?.triggerAutoLayout();
}

// A model opens or closes, and an event starts an event query. The other nodes have nothing to open.
function handleClickNode(clickedNode: NetworkDiagramNode): void {
    const node = diagramData.value?.nodes.find((candidate) => candidate.id === clickedNode.id);
    if (node?.typeId === 'model') void toggleModel(node);
    else if (node?.typeId === 'event') openNewEventQueryDialog(node);
}

function handleCloseNewEventQueryDialog(): void {
    newEventQueryDialogIsOpen.value = false;
}

// The new event query opens in the list once it is saved, selected, so the user sees where it went.
async function handleSaveNewEventQuery(): Promise<void> {
    const contextEventReference = newEventQueryNode.value?.contextEventReference;
    if (contextEventReference == null || eventQueryIsAdding.value) return;

    newEventQueryDialogIsOpen.value = false;
    try {
        const eventQueryConfig = await addEventQuery(constructNewEventQueryConfig(contextEventReference, localeId.value, draftLabel.value.trim(), draftDescription.value));
        await ignoreReportedNavigationFailure(router.push({ name: 'eventQueryList', params: { eventQueryId: eventQueryConfig.id }, query: route.query }));
    } catch (error) {
        // Announced rather than shown in the diagram, which is still correct.
        raiseAppFailure(new AppError('Failed to save event query.', 'dpuse-app.ContextNetworkPanel.handleSaveNewEventQuery', { data: { typeId: 'handled' }, cause: error }));
    }
}

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

async function renderDiagram(): Promise<void> {
    if (contextConfig.value == null || containerElement.value == null) return;

    const thisRenderCount = ++renderCount.value;
    renderFailure.value = undefined;
    diagramIsPending.value = true;
    try {
        const d3Tool = await establishTool<D3Tool>('d3-visualiser');
        if (thisRenderCount !== renderCount.value) return;

        destroyDiagram(); // A retry, an opened model or a change of language replaces the diagram rather than drawing a second one.
        diagramData.value = constructContextDiagramData(contextConfig.value, localeId.value, openModelConfigsByNodeId.value);
        // Wider spacing than the tool's defaults, so the labels below neighbouring nodes do not overlap. The wider graph
        // is then zoomed out to fit the pane.
        diagramView.value = await d3Tool.renderNetworkDiagram(diagramData.value, containerElement.value, {
            chargeStrength: -500,
            fitsView: true,
            linkDistance: 90,
            onNodeClick: handleClickNode
        });
        diagramView.value.triggerAutoLayout(); // The tool first places every node on one circle, which hides which model belongs to which area.
    } catch (error) {
        renderFailure.value = raiseFailure(
            new AppError('Failed to render the context diagram.', 'dpuse-app.ContextNetworkPanel.renderDiagram', { data: { typeId: 'handled' }, cause: error })
        );
    } finally {
        if (thisRenderCount === renderCount.value) diagramIsPending.value = false;
    }
}

function destroyDiagram(): void {
    diagramView.value?.destroy();
    diagramView.value = undefined;
}

// A model with no entities, or with no data at all, opens to nothing, so a message says so.
async function toggleModel(modelNode: ContextDiagramNode): Promise<void> {
    if (modelNode.modelId == null || modelIsLoading.value) return;

    emptyModelLabel.value = undefined;
    const openModelConfigs = new Map(openModelConfigsByNodeId.value);
    if (openModelConfigs.delete(modelNode.id)) {
        openModelConfigsByNodeId.value = openModelConfigs;
        return;
    }

    modelIsLoading.value = true;
    try {
        const modelConfig = await establishContextModelConfig(modelNode.modelId);
        if (modelConfig == null || modelConfig.entities.length === 0) {
            emptyModelLabel.value = modelNode.label;
            return;
        }
        openModelConfigsByNodeId.value = openModelConfigs.set(modelNode.id, modelConfig);
    } catch (error) {
        // Announced rather than shown in place of the diagram, which is still correct without the model's entities.
        raiseAppFailure(
            new AppError(`Failed to load context model '${modelNode.modelId}'.`, 'dpuse-app.ContextNetworkPanel.toggleModel', { data: { typeId: 'handled' }, cause: error })
        );
    } finally {
        modelIsLoading.value = false;
    }
}

function openNewEventQueryDialog(eventNode: ContextDiagramNode): void {
    newEventQueryNode.value = eventNode;
    draftDescription.value = '';
    draftLabel.value = t(TEXT, 'newEventQuery.name.text', { entity: eventNode.entityLabel ?? '', event: eventNode.label });
    newEventQueryDialogIsOpen.value = true;
}
</script>

<template>
    <StudioListLayout>
        <Separator class="flex-none" />

        <!-- Waits for the context, because the diagram is drawn from it. -->
        <RetrievalGate :status="contextConfigStatus">
            <ErrorNotice v-if="renderFailure" :failures="[renderFailure]" @retry="handleRetry" />

            <!-- Toolbar ─ The hint says what a click does, because nothing in the diagram itself shows that models open
                 and events start an event query. A model that opens to nothing says so in its place. -->
            <div v-show="!renderFailure" class="flex flex-none flex-wrap items-center gap-x-3 gap-y-2 px-page py-2">
                <RectangleButton :disabled="diagramIsPending" variant="outline" @click="handleAutoLayout">{{ t(TEXT, 'autoLayout.label') }}</RectangleButton>
                <p class="text-sm text-muted" role="status">{{ emptyModelLabel == null ? t(TEXT, 'hint.text') : t(TEXT, 'model.empty.text', { model: emptyModelLabel }) }}</p>
            </div>

            <BusyBar v-if="diagramIsPending || modelIsLoading" class="mx-page" />

            <!-- 'v-show' rather than 'v-if' ─ The container stays on the page, so a retry after a failure has an element
                 to draw into. -->
            <div v-show="!renderFailure" ref="container" :aria-busy="diagramIsPending" :aria-label="t(TEXT, 'diagram.aria')" class="min-h-0 w-full flex-1" role="group" />
        </RetrievalGate>

        <Dialog
            :is-open="newEventQueryDialogIsOpen"
            max-width="90vw"
            min-height="90vh"
            sizing="full"
            :title="t(TEXT, 'newEventQuery.title')"
            @close="handleCloseNewEventQueryDialog"
        >
            <StudioDescriptorsPanel v-model:label="draftLabel" v-model:description="draftDescription" />
            <div class="flex flex-none justify-end p-4">
                <RectangleButton :disabled="eventQueryIsAdding" variant="primary" @click="handleSaveNewEventQuery">{{ t(TEXT, 'newEventQuery.save.label') }}</RectangleButton>
            </div>
        </Dialog>
    </StudioListLayout>
</template>
