<script setup lang="ts">
// ── External Dependencies & Registrations
import { useResizeObserver } from '@vueuse/core';
import { computed, onBeforeUnmount, ref, shallowRef, useTemplateRef, watch } from 'vue';
import { type RouteLocationRaw, useRoute, useRouter } from 'vue-router';

// ── DPUse Framework
import { AppError, localiseConfig, localiseReference } from '@dpuse/dpuse-shared';
import type { ContextConfig, ContextEventReference } from '@dpuse/dpuse-shared';

// ── Local Framework
import type { BreadcrumbConfig } from '@/composables/useBreadcrumbs';
import { defineLazyComponent } from '@/utilities/index.ts';
import { ignoreReportedNavigationFailure } from '@/router';
import { TEXT } from './ContextNetworkPanel_.json';
import { useUnsavedWork } from '@/state/unsavedWork';
import { appearanceIsDark, resolveAppearanceIcon } from '@/state/appearance';
import { type AppFailure, raiseAppFailure, raiseFailure } from '@/state/errors';
import { constructContextDiagramData, type ContextDiagramData, type ContextDiagramFocus, type ContextDiagramView } from './_contextDiagram';
import { constructNewEventQueryConfig, useUpdateEventQuery } from './_eventQueries';
import { constructRingColor, readIconColor, useStudioOptions } from '@/features/studio/options/useStudioOptions';
import { contextConfig, contextConfigStatus } from '@/state/configs';
import type { ContextSearchEntry, RenderContextDiagram } from './_contextDiagram';
import { localeId, t } from '@/state/locale';
import { localiseText, useContextModel } from '@/state/contextModels';

// ── Static Components
import Breadcrumbs from '@/components/ui/Breadcrumbs.vue';
import BusyBar from '@/components/ui/BusyBar.vue';
import ContextSearch from './ContextSearch.vue';
import DiagramZoomControls from '@/components/ui/DiagramZoomControls.vue';
import Dialog from '@/components/ui/dialog/Dialog.vue';
import ErrorNotice from '@/components/ui/error/ErrorNotice.vue';
import RectangleButton from '@/components/ui/action/RectangleButton.vue';
import RetrievalGate from '@/components/ui/RetrievalGate.vue';
import Separator from '@/components/ui/Separator.vue';
import StudioListLayout from '@/features/studio/_components/StudioListLayout.vue';

// ── Dynamic Components
const StudioDescriptorsPanel = defineLazyComponent(() => import('@/features/studio/_components/StudioDescriptorsPanel.vue'), 'StudioDescriptorsPanel');

// ── Types ────────────────────────────────────────────────────────────────────────────────────────────────────────────

// The event a new event query is for, with the names it is first called after.
interface NewEventQueryEvent {
    contextEventReference: ContextEventReference;
    entityLabel: string;
    eventLabel: string;
}

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

const EVENT_QUERIES_OPTION_ID = 'eventQueries'; // The studio option this screen belongs to, whose icon and colour the context node takes.
const ZOOM_STEP = 1.25; // How much one press of a zoom button enlarges the diagram.
const ROOT_ICON_COLOR = '#ffffff'; // The context node's icon, on the solid colour of the option.
const SETUP_OPTION_ID = 'setup'; // The studio option whose colour every node below the context node takes, so only the context node stands out.

// ── Options, Props, Slots & Emits ────────────────────────────────────────────────────────────────────────────────────

// TODO: The hint is switched off for the time being, so 'hint' is not read. Once it shows again: 'const { hint,
// renderContextDiagram } = …'.
const { renderContextDiagram } = defineProps<{
    hint: string; // What a click does in this kind of diagram, because nothing in the diagram itself shows it.
    renderContextDiagram: RenderContextDiagram; // Draws the diagram with one tool, so the same panel could serve another kind of diagram.
}>();

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

// ── Route
const route = useRoute();
const router = useRouter();
const studioOptionLocalisedConfigs = useStudioOptions();

// ── Diagram
const containerElement = useTemplateRef<HTMLDivElement>('container');
const diagramData = shallowRef<ContextDiagramData>(); // What is drawn now, which a click on a node is looked up in.
const diagramIsPending = ref(true); // The diagram area is blank while the tool downloads and draws, so the wait is shown.
const diagramView = shallowRef<ContextDiagramView>();
const renderFailure = shallowRef<AppFailure | undefined>();
const renderCount = ref(0); // Tells a render that a newer one has started while it waited for the tool, so it keeps nothing it drew.

// ── New Event Query ─ Only stored by the dialog's Save, so its ✕ leaves nothing behind.
const { isPending: eventQueryIsAdding, mutateAsync: addEventQuery } = useUpdateEventQuery();
const newEventQueryEvent = shallowRef<NewEventQueryEvent>(); // The event the dialog is open for.
const newEventQueryDialogIsOpen = ref(false);
const draftDescription = ref('');
const draftLabel = ref('');

// ── Derived State ────────────────────────────────────────────────────────────────────────────────────────────────────

// ── Focus ─ How far the diagram has been drilled down. The URL is its one source, so reload, deep links and
// back/forward all land on the same level. An id the context does not have counts as no focus at that level.
const focusedAreaConfig = computed(() => contextConfig.value?.areas.find((config) => config.id === route.params.areaId));
const focusedModelReferenceConfig = computed(() => focusedAreaConfig.value?.models.find((config) => config.id === route.params.modelId));
const { data: focusedModelConfig, isFetching: focusedModelIsFetching } = useContextModel(() => focusedModelReferenceConfig.value?.id);
const focusedModelIsLoading = computed(() => focusedModelReferenceConfig.value != null && focusedModelIsFetching.value);
const focusedEntityConfig = computed(() => focusedModelConfig.value?.entities.find((config) => config.id === route.params.entityId));
const focus = computed((): ContextDiagramFocus => ({
    areaId: focusedAreaConfig.value?.id,
    modelId: focusedModelReferenceConfig.value?.id,
    entityId: focusedEntityConfig.value?.id
}));

// A model with no entities or no data at all, or an entity with no events, has nothing to show below it, so a message
// says so above the diagram.
const focusedModelIsEmpty = computed(() => focusedModelReferenceConfig.value != null && !focusedModelIsLoading.value && (focusedModelConfig.value?.entities.length ?? 0) === 0);
const statusText = computed(() => {
    const modelReferenceConfig = focusedModelReferenceConfig.value;
    if (modelReferenceConfig && focusedModelIsEmpty.value) return t(TEXT, 'model.empty.text', { model: localiseReference(modelReferenceConfig, localeId.value).label });
    const entityConfig = focusedEntityConfig.value;
    // TODO: The hint is switched off for the time being. Its line is: '… : hint;'
    // return entityConfig?.events.length === 0 ? t(TEXT, 'entity.empty.text', { entity: localiseText(entityConfig.label, localeId.value) }) : hint;
    return entityConfig?.events.length === 0 ? t(TEXT, 'entity.empty.text', { entity: localiseText(entityConfig.label, localeId.value) }) : '';
});

// ── Look ─ The context node is the option's own icon in white on the option's colour, as the data views diagram draws
// its top node. Every other node, and an area's icon, takes the colour of the setup option.
const optionIcon = computed(() => {
    const option = studioOptionLocalisedConfigs.value.find((config) => config.id === EVENT_QUERIES_OPTION_ID);
    return resolveAppearanceIcon(option?.icon, option?.iconDark);
});
const setupColor = computed(() => {
    const setupOption = studioOptionLocalisedConfigs.value.find((config) => config.id === SETUP_OPTION_ID);
    return readIconColor(resolveAppearanceIcon(setupOption?.icon, setupOption?.iconDark));
});

// ── Breadcrumbs ─ The way back up: the context, then the area, model and entity drilled down to. The last one is
// where the user is, so it is not a link.
const breadcrumbs = computed((): BreadcrumbConfig[] => {
    if (contextConfig.value == null) return [];
    const { areaId, modelId, entityId } = focus.value;
    const items: BreadcrumbConfig[] = [{ id: 'context', label: localiseConfig(contextConfig.value, localeId.value).label, to: constructFocusRoute({}) }];
    if (focusedAreaConfig.value) items.push({ id: 'area', label: localiseConfig(focusedAreaConfig.value, localeId.value).label, to: constructFocusRoute({ areaId }) });
    if (focusedModelReferenceConfig.value) {
        items.push({ id: 'model', label: localiseReference(focusedModelReferenceConfig.value, localeId.value).label, to: constructFocusRoute({ areaId, modelId }) });
    }
    if (focusedEntityConfig.value) {
        items.push({ id: 'entity', label: localiseText(focusedEntityConfig.value.label, localeId.value), to: constructFocusRoute({ areaId, modelId, entityId }) });
    }
    return items;
});

// ── Side Effects ─────────────────────────────────────────────────────────────────────────────────────────────────────

useUnsavedWork(newEventQueryDialogIsOpen); // A reload while the dialog is open loses what was typed.

// Drawn once the context has loaded and its container is on the page. Drawn again from nothing when the language
// changes, because every node label is in the user's language.
watch([contextConfig, localeId, containerElement], () => void renderDiagram(), { immediate: true });

// A move up or down a level, a model's data arriving, or a switch between the light and dark appearance, which can
// change the icons, changes the drawn diagram in place, so the nodes that stay keep their places while the others fade
// in and out.
watch([focusedAreaConfig, focusedModelReferenceConfig, focusedModelConfig, focusedModelIsLoading, focusedEntityConfig, optionIcon, appearanceIsDark], changeLevel);

// The pane can be resized by its splitter, which the window's own resize event does not report.
useResizeObserver(containerElement, () => {
    diagramView.value?.resize();
});

onBeforeUnmount(destroyDiagram);

// ── Event Handlers ───────────────────────────────────────────────────────────────────────────────────────────────────

function handleRetry(): void {
    void renderDiagram();
}

// TODO: Auto-layout is switched off for the time being.
// function handleAutoLayout(): void {
//     diagramView.value?.triggerAutoLayout?.();
// }

function handleZoomIn(): void {
    diagramView.value?.zoomBy?.(ZOOM_STEP);
}

function handleZoomOut(): void {
    diagramView.value?.zoomBy?.(1 / ZOOM_STEP);
}

function handleFit(): void {
    diagramView.value?.fitView?.();
}

// An event starts an event query. An area, a model or an entity opens, hiding its siblings and showing what is below
// it. The node of the level already open closes it again, going back up one level, and so does any node above it: the
// context goes back to the top.
function handleClickNode(clickedNode: { id: string }): void {
    const node = diagramData.value?.nodes.find((candidate) => candidate.id === clickedNode.id);
    if (node == null) return;
    if (node.typeId === 'event') {
        if (node.contextEventReference) openNewEventQueryDialog({ contextEventReference: node.contextEventReference, entityLabel: node.entityLabel ?? '', eventLabel: node.label ?? '' });
        return;
    }

    const { areaId, modelId, entityId } = node;
    const nodeIsOpenLevel = areaId === focus.value.areaId && modelId === focus.value.modelId && entityId === focus.value.entityId;
    if (!nodeIsOpenLevel) focusOn({ areaId, modelId, entityId });
    else if (entityId != null) focusOn({ areaId, modelId });
    else if (modelId != null) focusOn({ areaId });
    else if (areaId != null) focusOn({});
}

// A result opens: an area shows its models, a model its entities and an entity its events. An event opens its entity
// and also starts its event query, as a click on its node would.
function handleSelectSearchEntry(entry: ContextSearchEntry): void {
    focusOn({ areaId: entry.areaId, modelId: entry.modelId, entityId: entry.entityId });
    if (entry.typeId === 'event' && entry.contextEventReference) {
        openNewEventQueryDialog({ contextEventReference: entry.contextEventReference, entityLabel: entry.entityLabel ?? '', eventLabel: entry.eventLabel ?? '' });
    }
}

function handleCloseNewEventQueryDialog(): void {
    newEventQueryDialogIsOpen.value = false;
}

// The new event query opens in the list once it is saved, selected, so the user sees where it went.
async function handleSaveNewEventQuery(): Promise<void> {
    const contextEventReference = newEventQueryEvent.value?.contextEventReference;
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

// The level stays as it is while a model's data loads, so the model is not shown bare and then again with its
// entities.
async function renderDiagram(): Promise<void> {
    if (contextConfig.value == null || containerElement.value == null || focusedModelIsLoading.value) return;

    const thisRenderCount = ++renderCount.value;
    renderFailure.value = undefined;
    diagramIsPending.value = true;
    try {
        destroyDiagram(); // A retry or a change of language replaces the diagram rather than drawing a second one.
        diagramData.value = constructDiagramData(contextConfig.value);
        const view = await renderContextDiagram(diagramData.value, containerElement.value, handleClickNode);
        if (thisRenderCount === renderCount.value) diagramView.value = view;
        else view.destroy();
    } catch (error) {
        renderFailure.value = raiseFailure(
            new AppError('Failed to render the context diagram.', 'dpuse-app.ContextNetworkPanel.renderDiagram', { data: { typeId: 'handled' }, cause: error })
        );
    } finally {
        if (thisRenderCount === renderCount.value) diagramIsPending.value = false;
    }
}

// A diagram that cannot change in place, or one not drawn yet, is drawn from nothing.
function changeLevel(): void {
    if (contextConfig.value == null || focusedModelIsLoading.value) return;
    if (diagramView.value?.update == null) {
        void renderDiagram();
        return;
    }
    diagramData.value = constructDiagramData(contextConfig.value);
    diagramView.value.update(diagramData.value);
}

function constructDiagramData(currentContextConfig: ContextConfig): ContextDiagramData {
    const color = readIconColor(optionIcon.value);
    const look = {
        areaIconColor: setupColor.value,
        isDark: appearanceIsDark.value,
        nodeColor: constructRingColor(setupColor.value),
        rootDiscColor: color,
        rootIcon: color == null ? optionIcon.value : optionIcon.value?.replaceAll(color, () => ROOT_ICON_COLOR)
    };
    return constructContextDiagramData(currentContextConfig, localeId.value, focus.value, { focusedModelConfig: focusedModelConfig.value, look });
}

function destroyDiagram(): void {
    diagramView.value?.destroy();
    diagramView.value = undefined;
}

// A push, so the browser's back button goes back up a level.
function focusOn(newFocus: ContextDiagramFocus): void {
    void ignoreReportedNavigationFailure(router.push(constructFocusRoute(newFocus)));
}

function constructFocusRoute({ areaId, modelId, entityId }: ContextDiagramFocus): RouteLocationRaw {
    return { name: 'eventQueries', params: { areaId, modelId, entityId }, query: route.query };
}

function openNewEventQueryDialog(event: NewEventQueryEvent): void {
    newEventQueryEvent.value = event;
    draftDescription.value = '';
    draftLabel.value = t(TEXT, 'newEventQuery.name.text', { entity: event.entityLabel, event: event.eventLabel });
    newEventQueryDialogIsOpen.value = true;
}
</script>

<template>
    <StudioListLayout>
        <Separator class="flex-none" />

        <!-- Waits for the context, because the diagram is drawn from it. -->
        <RetrievalGate :status="contextConfigStatus">
            <!-- Level and Search ─ Shown even when the diagram fails, because both still work without it. The trail
                 says which level is drawn and leads back up. Search jumps to anything by name. -->
            <div class="flex flex-none flex-wrap items-center gap-x-3 gap-y-2 px-page pt-2">
                <nav :aria-label="t(TEXT, 'breadcrumbs.aria')" class="min-w-0 flex-1 text-sm">
                    <Breadcrumbs disable-last :items="breadcrumbs" />
                </nav>
                <ContextSearch class="w-full sm:w-80" @select="handleSelectSearchEntry" />
            </div>

            <ErrorNotice v-if="renderFailure" :failures="[renderFailure]" @retry="handleRetry" />

            <!-- Status ─ A model or an entity with nothing below it says so. The row is hidden while it has nothing to say,
                 so the diagram has the room. TODO: Auto-layout and the hint are switched off for the time being. The
                 button is: RectangleButton v-if="diagramView?.triggerAutoLayout" variant="outline"
                 @click="handleAutoLayout", holding t(TEXT, 'autoLayout.label'). -->
            <div v-show="!renderFailure && statusText !== ''" class="flex flex-none flex-wrap items-center gap-x-3 gap-y-2 px-page py-2">
                <p class="text-sm text-muted" role="status">{{ statusText }}</p>
            </div>

            <BusyBar v-if="diagramIsPending || focusedModelIsLoading" class="mx-page" />

            <!-- 'v-show' rather than 'v-if' ─ The container stays on the page, so a retry after a failure has an element
                 to draw into. -->
            <div v-show="!renderFailure" class="relative min-h-0 w-full flex-1">
                <div ref="container" :aria-busy="diagramIsPending" :aria-label="t(TEXT, 'diagram.aria')" class="absolute inset-0" role="group" />

                <!-- Zoom ─ Only for a diagram drawn by a tool that can zoom. -->
                <DiagramZoomControls v-if="diagramView?.zoomBy" class="absolute top-2 right-2" @fit="handleFit" @zoom-in="handleZoomIn" @zoom-out="handleZoomOut" />
            </div>
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
