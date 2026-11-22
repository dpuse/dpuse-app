// ── DPUse Framework
import type { ContextConfig, ContextEventReference, ContextModelConfig, LocaleId } from '@dpuse/dpuse-shared';
import { localiseConfig, localiseReference } from '@dpuse/dpuse-shared';

// ── Local Framework
import { localiseText } from '@/state/contextModels';

// ── Types ────────────────────────────────────────────────────────────────────────────────────────────────────────────

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
    typeId: keyof typeof CONTEXT_DIAGRAM_LEVELS;
    contextEventReference?: ContextEventReference; // On an event node: the event an event query started from the node is for.
    entityLabel?: string; // On an event node: its entity's name, which a new event query is named after.
    modelId?: string; // On a model node: the model to load when the node is opened.
}

type ContextDiagramLevel = (typeof CONTEXT_DIAGRAM_LEVELS)[keyof typeof CONTEXT_DIAGRAM_LEVELS];

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

const CONTEXT_DIAGRAM_LEVELS = { context: 0, area: 1, model: 2, entity: 3, event: 4 } as const; // How deep each kind of node sits, which sets its size and colour in the diagram.

// ── Actions ──────────────────────────────────────────────────────────────────────────────────────────────────────────

// The context as a network: the context in the middle, its areas around it, and each area's models around the area.
// A model that has been opened also shows its entities, and each entity its events. Every node's id is prefixed with
// its parent's id, so ids are unique even where two areas list one model or two entities share an event id.
export function constructContextDiagramData(
    contextConfig: ContextConfig,
    localeId: LocaleId,
    openModelConfigsByNodeId: ReadonlyMap<string, ContextModelConfig>
): ContextDiagramData {
    const data: ContextDiagramData = {
        links: [],
        nodes: [{ id: contextConfig.id, label: localiseConfig(contextConfig, localeId).label, level: CONTEXT_DIAGRAM_LEVELS.context, typeId: 'context' }]
    };

    for (const areaConfig of contextConfig.areas) {
        const areaNodeId = `${contextConfig.id}.${areaConfig.id}`;
        data.nodes.push({ id: areaNodeId, label: localiseConfig(areaConfig, localeId).label, level: CONTEXT_DIAGRAM_LEVELS.area, typeId: 'area' });
        data.links.push({ source: contextConfig.id, target: areaNodeId });

        for (const modelReferenceConfig of areaConfig.models) {
            const modelNodeId = `${areaNodeId}.${modelReferenceConfig.id}`;
            const modelLabel = localiseReference(modelReferenceConfig, localeId).label;
            data.nodes.push({ id: modelNodeId, label: modelLabel, level: CONTEXT_DIAGRAM_LEVELS.model, typeId: 'model', modelId: modelReferenceConfig.id });
            data.links.push({ source: areaNodeId, target: modelNodeId });

            const openModelConfig = openModelConfigsByNodeId.get(modelNodeId);
            if (openModelConfig) addModelEntities(data, modelNodeId, { areaId: areaConfig.id, modelId: modelReferenceConfig.id }, openModelConfig, localeId);
        }
    }
    return data;
}

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

// The model's id comes from the area's list, because the model's own data does not carry it.
function addModelEntities(
    data: ContextDiagramData,
    modelNodeId: string,
    modelReference: Pick<ContextEventReference, 'areaId' | 'modelId'>,
    modelConfig: ContextModelConfig,
    localeId: LocaleId
): void {
    for (const entityConfig of modelConfig.entities) {
        const entityNodeId = `${modelNodeId}.${entityConfig.id}`;
        const entityLabel = localiseText(entityConfig.label, localeId);
        data.nodes.push({ id: entityNodeId, label: entityLabel, level: CONTEXT_DIAGRAM_LEVELS.entity, typeId: 'entity' });
        data.links.push({ source: modelNodeId, target: entityNodeId });

        for (const eventConfig of entityConfig.events) {
            const eventNodeId = `${entityNodeId}.${eventConfig.id}`;
            data.nodes.push({
                id: eventNodeId,
                label: localiseText(eventConfig.labelAction, localeId),
                level: CONTEXT_DIAGRAM_LEVELS.event,
                typeId: 'event',
                contextEventReference: { ...modelReference, entityId: entityConfig.id, eventId: eventConfig.id },
                entityLabel
            });
            data.links.push({ source: entityNodeId, target: eventNodeId });
        }
    }
}
