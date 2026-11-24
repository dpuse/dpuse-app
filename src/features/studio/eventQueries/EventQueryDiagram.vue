<script setup lang="ts">
// The context and the user's event queries as a diagram that is drilled down one level at a time, as the data views
// diagram is. A click on an area, a model, an entity or an event selects it, which shows its details beside the
// diagram, and opens it to show what it holds. An event holds its event queries, and a click on one selects it. The '+'
// node under an event is the one node that is an action: it starts a new event query for the event.

// ── External Dependencies & Registrations
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';

// ── DPUse Framework
import { localiseReference } from '@dpuse/dpuse-shared';
import type { ContextEventReference, EventQueryConfig, LocalisedConfig } from '@dpuse/dpuse-shared';

// ── Local Framework
import { ignoreReportedNavigationFailure } from '@/router';
import { localiseText } from '@/state/contextModels';
import { TEXT } from './EventQueryDiagram_.json';
import { appearanceIsDark, resolveAppearanceIcon } from '@/state/appearance';
import { constructContextDiagramRoute, readContextDiagramFocus, useContextDiagramFocus } from './_contextDiagramFocus';
import { constructEventQueryDiagramData, type EventQueryDiagramData, type EventQueryDiagramNode, resolveEventQueryDiagramFocus } from './_eventQueryDiagram';
import { constructRingColor, readIconColor, useStudioOptions } from '@/features/studio/options/useStudioOptions';
import { contextConfig, contextConfigStatus } from '@/state/configs';
import type { ContextDiagramFocus, ContextSearchEntry } from './_contextDiagram';
import { localeId, t } from '@/state/locale';

// ── Static Components
import BusyBar from '@/components/ui/BusyBar.vue';
import ContextSearch from './ContextSearch.vue';
import NetworkDiagram from '@/components/ui/NetworkDiagram.vue';
import RetrievalGate from '@/components/ui/RetrievalGate.vue';

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

const EVENT_QUERIES_OPTION_ID = 'eventQueries'; // The studio option this screen belongs to, whose icon and colour the context node takes.
const ROOT_ICON_COLOR = '#ffffff'; // The context node's icon, on the solid colour of the option.
const SETUP_OPTION_ID = 'setup'; // The studio option whose colour every node below the context node, and every line, takes, so only the context node stands out.

// ── Options, Props, Slots & Emits ────────────────────────────────────────────────────────────────────────────────────

const { eventQueryLocalisedConfigs, selectedEventQueryId } = defineProps<{
    eventQueryLocalisedConfigs: LocalisedConfig<EventQueryConfig>[];
    selectedEventQueryId: string | undefined;
}>();
const emit = defineEmits<{
    add: [contextEventReference: ContextEventReference]; // Start a new event query for the event.
    select: [eventQueryId: string];
}>();

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

const route = useRoute();
const router = useRouter();
const studioOptionLocalisedConfigs = useStudioOptions();

// ── Derived State ────────────────────────────────────────────────────────────────────────────────────────────────────

// ── Focus ─ How far the diagram has been drilled down: to the selected event query's event, or else the level the URL
// names, so reload, links and back/forward all land on the same level.
const selectedEventQuery = computed(() => eventQueryLocalisedConfigs.find((config) => config.id === selectedEventQueryId));
const { focus, focusedEntityConfig, focusedModelConfig, focusedModelIsLoading, focusedModelReferenceConfig } = useContextDiagramFocus(() =>
    resolveEventQueryDiagramFocus(readContextDiagramFocus(route.params), selectedEventQuery.value)
);

// A model with no entities, or an entity with no events, has nothing to show below it, so a message says so above the
// diagram.
const statusText = computed(() => {
    const modelReferenceConfig = focusedModelReferenceConfig.value;
    if (modelReferenceConfig && !focusedModelIsLoading.value && (focusedModelConfig.value?.entities.length ?? 0) === 0) {
        return t(TEXT, 'model.empty.text', { model: localiseReference(modelReferenceConfig, localeId.value).label });
    }
    const entityConfig = focusedEntityConfig.value;
    return entityConfig?.events.length === 0 ? t(TEXT, 'entity.empty.text', { entity: localiseText(entityConfig.label, localeId.value) }) : '';
});

// ── Look ─ The context node is the option's own icon in white on the option's colour, as the data views diagram draws
// its top node. Every other node, an area's icon and every line take the colour of the setup option.
const optionIcon = computed(() => {
    const option = studioOptionLocalisedConfigs.value.find((config) => config.id === EVENT_QUERIES_OPTION_ID);
    return resolveAppearanceIcon(option?.icon, option?.iconDark);
});
const setupColor = computed(() => {
    const setupOption = studioOptionLocalisedConfigs.value.find((config) => config.id === SETUP_OPTION_ID);
    return readIconColor(resolveAppearanceIcon(setupOption?.icon, setupOption?.iconDark));
});
const ringColor = computed(() => constructRingColor(setupColor.value));

// ── Diagram ─ The level the focus asks for, with the selected node marked. The level stays as it is while a model's
// data loads, so the model is not shown bare and then again with its entities.
const diagramData = computed<EventQueryDiagramData | undefined>((previousData) => {
    if (contextConfig.value == null) return;
    if (previousData && focusedModelIsLoading.value) return previousData;
    const optionColor = readIconColor(optionIcon.value);
    const look = {
        add: t(TEXT, 'add.label'),
        areaIconColor: setupColor.value,
        eventQueryIcon: optionIcon.value,
        isDark: appearanceIsDark.value,
        nodeColor: ringColor.value,
        rootDiscColor: optionColor,
        rootIcon: optionColor == null ? optionIcon.value : optionIcon.value?.replaceAll(optionColor, () => ROOT_ICON_COLOR)
    };
    const eventQueries = eventQueryLocalisedConfigs.map((config) => ({ id: config.id, label: config.label, contextEventReference: config.contextEventReference }));
    return constructEventQueryDiagramData(contextConfig.value, localeId.value, focus.value, {
        eventQueries,
        focusedModelConfig: focusedModelConfig.value,
        look,
        selectedEventQueryId: selectedEventQuery.value?.id
    });
});

// ── Event Handlers ───────────────────────────────────────────────────────────────────────────────────────────────────

// An event query is selected. The add node starts a new event query for its event. Any other node is selected and
// opened, which shows the level below it and hides its siblings. A node above the open level goes back up to it, and
// the context node clears the selection. An area, model, entity or event already selected changes nothing.
function handleClickNode(node: EventQueryDiagramNode): void {
    if (node.typeId === 'eventQuery' && node.eventQueryId != null) emit('select', node.eventQueryId);
    else if (node.typeId === 'add' && node.contextEventReference != null) emit('add', node.contextEventReference);
    else if (node.focus && (selectedEventQuery.value != null || !isSameFocus(node.focus, focus.value))) focusOn(node.focus);
}

// A result opens as a click on its node would: an area shows its models, a model its entities, an entity its events and
// an event its event queries.
function handleSelectSearchEntry(entry: ContextSearchEntry): void {
    focusOn({ areaId: entry.areaId, modelId: entry.modelId, entityId: entry.entityId, eventId: entry.contextEventReference?.eventId });
}

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

// A push, so the browser's back button returns to the node selected before. No event query stays selected, because the
// area, model, entity or event of the level is selected in its place.
function focusOn(newFocus: ContextDiagramFocus): void {
    void ignoreReportedNavigationFailure(router.push(constructContextDiagramRoute(newFocus, route.query)));
}

function isSameFocus(left: ContextDiagramFocus, right: ContextDiagramFocus): boolean {
    return left.areaId === right.areaId && left.modelId === right.modelId && left.entityId === right.entityId && left.eventId === right.eventId;
}
</script>

<template>
    <div class="flex min-h-0 min-w-0 flex-1 flex-col" data-region="EventQueryDiagram">
        <!-- Waits for the context, because the diagram is drawn from it. -->
        <RetrievalGate :status="contextConfigStatus">
            <!-- Search ─ It jumps to anything in the context by name. -->
            <div class="flex flex-none justify-end px-page pt-2">
                <ContextSearch class="w-full sm:w-80" @select="handleSelectSearchEntry" />
            </div>

            <!-- Status ─ A model or an entity with nothing below it says so. The row is hidden while it has nothing to say,
                 so the diagram has the room. -->
            <div v-show="statusText !== ''" class="flex flex-none items-center px-page py-2">
                <p class="text-sm text-muted" role="status">{{ statusText }}</p>
            </div>

            <BusyBar v-if="focusedModelIsLoading" class="mx-page flex-none" />

            <!-- The lines take the nodes' ring colour, so the diagram reads as one drawing. -->
            <NetworkDiagram :data="diagramData" :label="t(TEXT, 'diagram.aria')" :link-color="ringColor" @node-click="handleClickNode" />
        </RetrievalGate>
    </div>
</template>
