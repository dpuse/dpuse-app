// ── DPUse Framework
import type { ContextConfig, ContextEventReference, ContextModelConfig, LocaleId } from '@dpuse/dpuse-shared';
import { localiseConfig, localiseReference } from '@dpuse/dpuse-shared';

// ── Local Framework
import { localiseText } from '@/state/contextModels';
import { constructImageIcon, type ContextDiagramFocus } from './_contextDiagram';

// ── Types ────────────────────────────────────────────────────────────────────────────────────────────────────────────

export interface EventQueryDiagramData {
    links: { source: string; target: string }[];
    nodes: EventQueryDiagramNode[];
}

export interface EventQueryDiagramNode {
    id: string;
    label?: string; // Shown beside the node. The context node and the add node have none, because the icon or symbol inside each says what it is.
    level: EventQueryDiagramLevel;
    typeId: EventQueryDiagramNodeTypeId;
    color?: string; // The node's colour, which is that of the part of the app it belongs to. The add node keeps the look of an action.
    discColor?: string; // On the context node: a solid disc behind its icon, so it reads as where the diagram starts.
    icon?: string; // The node's own icon, drawn inside it: the context's, an area's or an event query's.
    isAction?: boolean; // On the add node: drawn as something to do, so it stands apart from the things round it.
    isSelected?: boolean; // On the node whose details show beside the diagram.
    symbol?: string; // On the add node: the '+' drawn inside it.
    title?: string; // On the context node and the add node: its name, shown as its tooltip.
    contextEventReference?: ContextEventReference; // On the add node: the event a new event query is for.
    eventQueryId?: string; // On an event query node: the event query to select.
    focus?: ContextDiagramFocus; // On a node that opens: the level a click on it shows.
}

// A saved event query as the diagram shows it, under the event it is for.
export interface EventQueryDiagramEventQuery {
    id: string;
    label: string;
    contextEventReference: ContextEventReference;
}

// The name of the add node, in the user's language, and how the nodes look, which the caller works out from the app's
// options and appearance.
export interface EventQueryDiagramLook {
    add: string;
    areaIconColor?: string | undefined; // Replaces 'currentColor' in an area's icon, because an icon drawn as an image cannot read the page's text colour.
    eventQueryIcon?: string | undefined;
    isDark?: boolean; // Chooses an area's dark icon, where it has one.
    nodeColor?: string | undefined; // Every node below the context node, in place of its level's colour.
    rootDiscColor?: string | undefined; // The solid disc behind the context node's icon.
    rootIcon?: string | undefined; // Drawn in the context node in place of its label.
}

type EventQueryDiagramLevel = (typeof EVENT_QUERY_DIAGRAM_LEVELS)[EventQueryDiagramNodeTypeId];
type EventQueryDiagramNodeTypeId = keyof typeof EVENT_QUERY_DIAGRAM_LEVELS;

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

// How deep each kind of node sits, which sets its size and colour in the diagram. An event's event queries and its node
// for adding one sit at one level.
const EVENT_QUERY_DIAGRAM_LEVELS = { context: 0, area: 1, model: 2, entity: 3, event: 4, eventQuery: 5, add: 5 } as const;

// ── Actions ──────────────────────────────────────────────────────────────────────────────────────────────────────────

// The context and the user's event queries drilled down to one level, as a small network. The path from the context
// down to the focused area, model, entity or event is always shown, and below it only the next level: the context's
// areas, or the focused area's models, the focused model's entities, the focused entity's events, or the focused
// event's event queries with a node for adding one. The siblings of the nodes on the path are left out. A focus that
// names something the context does not have falls back to the level above. The model's entities are left out until its
// data has loaded. Every node's id is prefixed with its parent's id, so a node keeps its id at every level, and ids are
// unique even where two entities share an event id. The selected node is the selected event query, or else the focused
// area, model, entity or event. The context node is never selected, because it stands for nothing being selected.
export function constructEventQueryDiagramData(
    contextConfig: ContextConfig,
    localeId: LocaleId,
    focus: ContextDiagramFocus,
    {
        eventQueries = [],
        focusedModelConfig,
        look,
        selectedEventQueryId
    }: {
        eventQueries?: EventQueryDiagramEventQuery[];
        focusedModelConfig?: ContextModelConfig | null | undefined;
        look: EventQueryDiagramLook;
        selectedEventQueryId?: string | undefined;
    }
): EventQueryDiagramData {
    const contextLabel = localiseConfig(contextConfig, localeId).label;
    const data: EventQueryDiagramData = {
        links: [],
        nodes: [
            {
                id: contextConfig.id,
                ...(look.rootIcon == null ? { label: contextLabel } : { title: contextLabel, icon: look.rootIcon }),
                level: EVENT_QUERY_DIAGRAM_LEVELS.context,
                typeId: 'context',
                ...(look.rootIcon != null && look.rootDiscColor != null && { color: look.rootDiscColor, discColor: look.rootDiscColor }),
                focus: {}
            }
        ]
    };
    const addNode = (parentId: string, node: EventQueryDiagramNode): void => {
        data.nodes.push(node);
        data.links.push({ source: parentId, target: node.id });
    };
    const nodeColor = look.nodeColor == null ? {} : { color: look.nodeColor };

    const focusedAreaConfig = contextConfig.areas.find((config) => config.id === focus.areaId);
    const focusedModelReferenceConfig = focusedAreaConfig?.models.find((config) => config.id === focus.modelId);
    const focusedEntityConfig = focusedModelReferenceConfig == null ? undefined : focusedModelConfig?.entities.find((config) => config.id === focus.entityId);
    const focusedEventConfig = focusedEntityConfig?.events.find((config) => config.id === focus.eventId);
    const focusedEventQueries = focusedEventConfig ? eventQueries.filter((eventQuery) => isFocusedEvent(eventQuery.contextEventReference, focus)) : [];
    const isEventQuerySelected = focusedEventQueries.some((eventQuery) => eventQuery.id === selectedEventQueryId);
    const deepestFocusTypeId = [focusedEventConfig && 'event', focusedEntityConfig && 'entity', focusedModelReferenceConfig && 'model', focusedAreaConfig && 'area'].find(
        (typeId) => typeId != null
    );
    const isFocusSelected = (typeId: EventQueryDiagramNodeTypeId): boolean => !isEventQuerySelected && typeId === deepestFocusTypeId;

    // Areas
    const areaConfigs = focusedAreaConfig ? [focusedAreaConfig] : contextConfig.areas;
    for (const areaConfig of areaConfigs) {
        const areaIcon = constructImageIcon(look.isDark === true ? (areaConfig.iconDark ?? areaConfig.icon) : areaConfig.icon, look.areaIconColor);
        addNode(contextConfig.id, {
            id: `${contextConfig.id}.${areaConfig.id}`,
            label: localiseConfig(areaConfig, localeId).label,
            level: EVENT_QUERY_DIAGRAM_LEVELS.area,
            typeId: 'area',
            ...nodeColor,
            ...(areaIcon != null && { icon: areaIcon }),
            isSelected: isFocusSelected('area'),
            focus: { areaId: areaConfig.id }
        });
    }
    if (!focusedAreaConfig) return data;

    // Models
    const areaNodeId = `${contextConfig.id}.${focusedAreaConfig.id}`;
    const modelReferenceConfigs = focusedModelReferenceConfig ? [focusedModelReferenceConfig] : focusedAreaConfig.models;
    for (const modelReferenceConfig of modelReferenceConfigs) {
        addNode(areaNodeId, {
            id: `${areaNodeId}.${modelReferenceConfig.id}`,
            label: localiseReference(modelReferenceConfig, localeId).label,
            level: EVENT_QUERY_DIAGRAM_LEVELS.model,
            typeId: 'model',
            ...nodeColor,
            isSelected: isFocusSelected('model'),
            focus: { areaId: focusedAreaConfig.id, modelId: modelReferenceConfig.id }
        });
    }
    if (!focusedModelReferenceConfig) return data;

    // Entities ─ The model's id comes from the area's list, because the model's own data does not carry it.
    const modelNodeId = `${areaNodeId}.${focusedModelReferenceConfig.id}`;
    const modelFocus = { areaId: focusedAreaConfig.id, modelId: focusedModelReferenceConfig.id };
    const entityConfigs = focusedEntityConfig ? [focusedEntityConfig] : (focusedModelConfig?.entities ?? []);
    for (const entityConfig of entityConfigs) {
        addNode(modelNodeId, {
            id: `${modelNodeId}.${entityConfig.id}`,
            label: localiseText(entityConfig.label, localeId),
            level: EVENT_QUERY_DIAGRAM_LEVELS.entity,
            typeId: 'entity',
            ...nodeColor,
            isSelected: isFocusSelected('entity'),
            focus: { ...modelFocus, entityId: entityConfig.id }
        });
    }
    if (!focusedEntityConfig) return data;

    // Events
    const entityNodeId = `${modelNodeId}.${focusedEntityConfig.id}`;
    const entityFocus = { ...modelFocus, entityId: focusedEntityConfig.id };
    const eventConfigs = focusedEventConfig ? [focusedEventConfig] : focusedEntityConfig.events;
    for (const eventConfig of eventConfigs) {
        addNode(entityNodeId, {
            id: `${entityNodeId}.${eventConfig.id}`,
            label: localiseText(eventConfig.labelAction, localeId),
            level: EVENT_QUERY_DIAGRAM_LEVELS.event,
            typeId: 'event',
            ...nodeColor,
            isSelected: isFocusSelected('event'),
            focus: { ...entityFocus, eventId: eventConfig.id }
        });
    }
    if (!focusedEventConfig) return data;

    // Event Queries and Add ─ The focused event's event queries, and a node that starts a new one for it.
    const eventNodeId = `${entityNodeId}.${focusedEventConfig.id}`;
    for (const eventQuery of focusedEventQueries) {
        addNode(eventNodeId, {
            id: `${eventNodeId}.eventQuery.${eventQuery.id}`,
            label: eventQuery.label,
            level: EVENT_QUERY_DIAGRAM_LEVELS.eventQuery,
            typeId: 'eventQuery',
            ...nodeColor,
            ...(look.eventQueryIcon != null && look.eventQueryIcon !== '' && { icon: look.eventQueryIcon }),
            isSelected: eventQuery.id === selectedEventQueryId,
            eventQueryId: eventQuery.id
        });
    }
    addNode(eventNodeId, {
        id: `${eventNodeId}.add`,
        level: EVENT_QUERY_DIAGRAM_LEVELS.add,
        typeId: 'add',
        isAction: true,
        symbol: '+',
        title: look.add,
        contextEventReference: { ...entityFocus, eventId: focusedEventConfig.id }
    });
    return data;
}

// The level the diagram shows: the selected event query's event, so the event query is always in view, or else the
// level the URL names.
export function resolveEventQueryDiagramFocus(urlFocus: ContextDiagramFocus, selectedEventQuery?: Pick<EventQueryDiagramEventQuery, 'contextEventReference'>): ContextDiagramFocus {
    const reference = selectedEventQuery?.contextEventReference;
    return reference == null ? urlFocus : { areaId: reference.areaId, modelId: reference.modelId, entityId: reference.entityId, eventId: reference.eventId };
}

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

function isFocusedEvent(reference: ContextEventReference | undefined, focus: ContextDiagramFocus): boolean {
    return (
        reference != null &&
        reference.areaId === focus.areaId &&
        reference.modelId === focus.modelId &&
        reference.entityId === focus.entityId &&
        reference.eventId === focus.eventId
    );
}
