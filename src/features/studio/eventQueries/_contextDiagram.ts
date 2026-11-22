// ── DPUse Framework
import type { ContextConfig, ContextEventReference, ContextModelConfig, LocaleId } from '@dpuse/dpuse-shared';
import { localiseConfig, localiseReference } from '@dpuse/dpuse-shared';

// ── Local Framework
import { localiseText } from '@/state/contextModels';

// ── Types ────────────────────────────────────────────────────────────────────────────────────────────────────────────

// ── Diagram
export interface ContextDiagramData {
    links: ContextDiagramLink[];
    nodes: ContextDiagramNode[];
}

interface ContextDiagramLink {
    source: string;
    target: string;
}

export interface ContextDiagramNode {
    id: string;
    label: string;
    level: ContextDiagramLevel;
    typeId: ContextPartTypeId;
    areaId?: string; // On an area, model or entity node: the area it is, or belongs to.
    contextEventReference?: ContextEventReference; // On an event node: the event an event query started from the node is for.
    entityLabel?: string; // On an event node: its entity's name, which a new event query is named after.
    entityId?: string; // On an entity node: the entity it is.
    modelId?: string; // On a model or entity node: the model it is, or belongs to.
}

// How far the diagram has been drilled down: the whole context, one area, one model of an area, or one entity of a
// model.
export interface ContextDiagramFocus {
    areaId?: string | undefined;
    entityId?: string | undefined;
    modelId?: string | undefined;
}

// A drawn diagram, whichever tool drew it. Only a diagram whose layout can be worked out again has 'triggerAutoLayout',
// and only one that can change to new data in place, without being drawn again from nothing, has 'update'.
export interface ContextDiagramView {
    destroy: () => void;
    resize: () => void;
    triggerAutoLayout?: () => void;
    update?: (data: ContextDiagramData) => void;
}

// Draws the diagram into an element with one tool, and reports each node the user clicks by its id.
export type RenderContextDiagram = (data: ContextDiagramData, renderTo: HTMLElement, onNodeClick: (node: { id: string }) => void) => Promise<ContextDiagramView>;

type ContextDiagramLevel = (typeof CONTEXT_DIAGRAM_LEVELS)[ContextPartTypeId];

// ── Search ─ One thing in the context that search can find, with the names of what it belongs to. The names are kept
// apart, so the caller can put them into a phrase in the user's language.
export interface ContextSearchEntry {
    id: string;
    typeId: Exclude<ContextPartTypeId, 'context'>;
    areaId: string;
    areaLabel: string;
    contextEventReference?: ContextEventReference; // On an event.
    entityId?: string; // On an entity or event.
    entityLabel?: string; // On an entity or event.
    eventLabel?: string; // On an event.
    modelId?: string; // On a model, entity or event.
    modelLabel?: string; // On a model, entity or event.
}

type ContextPartTypeId = 'area' | 'context' | 'entity' | 'event' | 'model';

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

// How deep each kind of node sits in the context, which sets its size and colour in the diagram. A kind keeps its
// colour at every level of drill-down, so an area always looks like an area.
const CONTEXT_DIAGRAM_LEVELS = { context: 0, area: 1, model: 2, entity: 3, event: 4 } as const;

// ── Actions ──────────────────────────────────────────────────────────────────────────────────────────────────────────

// The context drilled down to one level, as a small network, so the nodes stay large enough to read. The path from
// the context down to the focused area, model or entity is always shown, and below it only the next level: the
// context's areas, or the focused area's models, or the focused model's entities, or the focused entity's events. The
// siblings of the nodes on the path are left out. A focus that names an area, model or entity the context does not
// have falls back to the level above. The model's entities are left out until its data has loaded. Every node's id is prefixed with its parent's id, so a
// node keeps its id at every level, and ids are unique even where two entities share an event id.
export function constructContextDiagramData(
    contextConfig: ContextConfig,
    localeId: LocaleId,
    focus: ContextDiagramFocus,
    focusedModelConfig?: ContextModelConfig | null
): ContextDiagramData {
    const data: ContextDiagramData = {
        links: [],
        nodes: [{ id: contextConfig.id, label: localiseConfig(contextConfig, localeId).label, level: CONTEXT_DIAGRAM_LEVELS.context, typeId: 'context' }]
    };
    const focusedAreaConfig = contextConfig.areas.find((config) => config.id === focus.areaId);
    const areaConfigs = focusedAreaConfig ? [focusedAreaConfig] : contextConfig.areas;
    for (const areaConfig of areaConfigs) {
        const areaNodeId = `${contextConfig.id}.${areaConfig.id}`;
        data.nodes.push({ id: areaNodeId, label: localiseConfig(areaConfig, localeId).label, level: CONTEXT_DIAGRAM_LEVELS.area, typeId: 'area', areaId: areaConfig.id });
        data.links.push({ source: contextConfig.id, target: areaNodeId });
    }
    if (!focusedAreaConfig) return data;

    const areaNodeId = `${contextConfig.id}.${focusedAreaConfig.id}`;
    const focusedModelReferenceConfig = focusedAreaConfig.models.find((config) => config.id === focus.modelId);
    const modelReferenceConfigs = focusedModelReferenceConfig ? [focusedModelReferenceConfig] : focusedAreaConfig.models;
    for (const modelReferenceConfig of modelReferenceConfigs) {
        const modelNodeId = `${areaNodeId}.${modelReferenceConfig.id}`;
        data.nodes.push({
            id: modelNodeId,
            label: localiseReference(modelReferenceConfig, localeId).label,
            level: CONTEXT_DIAGRAM_LEVELS.model,
            typeId: 'model',
            areaId: focusedAreaConfig.id,
            modelId: modelReferenceConfig.id
        });
        data.links.push({ source: areaNodeId, target: modelNodeId });
    }
    if (!focusedModelReferenceConfig) return data;

    const modelNodeId = `${areaNodeId}.${focusedModelReferenceConfig.id}`;
    const modelFocus = { areaId: focusedAreaConfig.id, modelId: focusedModelReferenceConfig.id }; // The model's id comes from the area's list, because the model's own data does not carry it.
    const focusedEntityConfig = focusedModelConfig?.entities.find((config) => config.id === focus.entityId);
    const entityConfigs = focusedEntityConfig ? [focusedEntityConfig] : (focusedModelConfig?.entities ?? []);
    for (const entityConfig of entityConfigs) {
        const entityNodeId = `${modelNodeId}.${entityConfig.id}`;
        data.nodes.push({
            id: entityNodeId,
            label: localiseText(entityConfig.label, localeId),
            level: CONTEXT_DIAGRAM_LEVELS.entity,
            typeId: 'entity',
            ...modelFocus,
            entityId: entityConfig.id
        });
        data.links.push({ source: modelNodeId, target: entityNodeId });
    }
    if (!focusedEntityConfig) return data;

    const entityNodeId = `${modelNodeId}.${focusedEntityConfig.id}`;
    const entityLabel = localiseText(focusedEntityConfig.label, localeId);
    for (const eventConfig of focusedEntityConfig.events) {
        const eventNodeId = `${entityNodeId}.${eventConfig.id}`;
        data.nodes.push({
            id: eventNodeId,
            label: localiseText(eventConfig.labelAction, localeId),
            level: CONTEXT_DIAGRAM_LEVELS.event,
            typeId: 'event',
            contextEventReference: { ...modelFocus, entityId: focusedEntityConfig.id, eventId: eventConfig.id },
            entityLabel
        });
        data.links.push({ source: entityNodeId, target: eventNodeId });
    }
    return data;
}

// Everything in the context that can be found by name: every area and model, and the entities and events of each model
// whose data is given. A model whose data has not loaded yet is still listed, without its entities.
export function constructContextSearchEntries(contextConfig: ContextConfig, localeId: LocaleId, modelConfigsById: ReadonlyMap<string, ContextModelConfig>): ContextSearchEntry[] {
    const entries: ContextSearchEntry[] = [];
    for (const areaConfig of contextConfig.areas) {
        const area = { areaId: areaConfig.id, areaLabel: localiseConfig(areaConfig, localeId).label };
        entries.push({ id: areaConfig.id, typeId: 'area', ...area });

        for (const modelReferenceConfig of areaConfig.models) {
            const model = { ...area, modelId: modelReferenceConfig.id, modelLabel: localiseReference(modelReferenceConfig, localeId).label };
            const modelEntryId = `${areaConfig.id}.${modelReferenceConfig.id}`;
            entries.push({ id: modelEntryId, typeId: 'model', ...model });

            const entityConfigs = modelConfigsById.get(modelReferenceConfig.id)?.entities ?? [];
            for (const entityConfig of entityConfigs) {
                const entity = { ...model, entityId: entityConfig.id, entityLabel: localiseText(entityConfig.label, localeId) };
                const entityEntryId = `${modelEntryId}.${entityConfig.id}`;
                entries.push({ id: entityEntryId, typeId: 'entity', ...entity });

                for (const eventConfig of entityConfig.events) {
                    entries.push({
                        id: `${entityEntryId}.${eventConfig.id}`,
                        typeId: 'event',
                        ...entity,
                        contextEventReference: { areaId: areaConfig.id, modelId: modelReferenceConfig.id, entityId: entityConfig.id, eventId: eventConfig.id },
                        eventLabel: localiseText(eventConfig.labelAction, localeId)
                    });
                }
            }
        }
    }
    return entries;
}
