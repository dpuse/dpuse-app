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
    label?: string; // Every node but a context node drawn as an icon alone, which has a 'title' in its place.
    level: ContextDiagramLevel;
    typeId: ContextPartTypeId;
    areaId?: string; // On an area, model or entity node: the area it is, or belongs to.
    color?: string; // The node's colour, when the caller gives one: the ring round an icon, or else the whole node.
    contextEventReference?: ContextEventReference; // On an event node: the event an event query started from the node is for.
    discColor?: string; // On a context node with an icon: the solid disc behind the icon.
    entityLabel?: string; // On an event node: its entity's name, which a new event query is named after.
    entityId?: string; // On an entity node: the entity it is.
    icon?: string; // On a context or area node that has one: SVG markup drawn inside the node.
    modelId?: string; // On a model or entity node: the model it is, or belongs to.
    title?: string; // On a context node with an icon: its name, shown as a tooltip and read by screen readers.
}

// How the context node and the area nodes are drawn, which the caller works out from the app's options and appearance.
export interface ContextDiagramLook {
    areaIconColor?: string | undefined; // Replaces 'currentColor' in an area's icon, because an icon drawn as an image cannot read the page's text colour.
    isDark?: boolean; // Chooses an area's dark icon, where it has one.
    nodeColor?: string | undefined; // Every node below the context node, in place of its level's colour.
    rootDiscColor?: string | undefined; // The solid disc behind the context node's icon.
    rootIcon?: string | undefined; // Drawn in the context node in place of its label.
}

// How far the diagram has been drilled down: the whole context, one area, one model of an area, or one entity of a
// model.
export interface ContextDiagramFocus {
    areaId?: string | undefined;
    entityId?: string | undefined;
    modelId?: string | undefined;
}

// A drawn diagram, whichever tool drew it. Only a diagram whose layout can be worked out again has 'triggerAutoLayout',
// only one that can change to new data in place, without being drawn again from nothing, has 'update', and only one
// that can zoom has 'fitView' and 'zoomBy'.
export interface ContextDiagramView {
    destroy: () => void;
    fitView?: () => void; // Shows the whole diagram again.
    resize: () => void;
    triggerAutoLayout?: () => void;
    update?: (data: ContextDiagramData) => void;
    zoomBy?: (factor: number) => void; // Zooms in for a factor above 1, out for one below.
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

const SVG_NAMESPACE = 'http://www.w3.org/2000/svg';

// ── Actions ──────────────────────────────────────────────────────────────────────────────────────────────────────────

// The context drilled down to one level, as a small network, so the nodes stay large enough to read. The path from
// the context down to the focused area, model or entity is always shown, and below it only the next level: the
// context's areas, or the focused area's models, or the focused model's entities, or the focused entity's events. The
// siblings of the nodes on the path are left out. A focus that names an area, model or entity the context does not
// have falls back to the level above. The model's entities are left out until its data has loaded. Every node's id is prefixed with its parent's id, so a
// node keeps its id at every level, and ids are unique even where two entities share an event id. A context node given
// an icon shows the icon alone on a solid disc, with its name as a tooltip, and an area shows its own icon.
export function constructContextDiagramData(
    contextConfig: ContextConfig,
    localeId: LocaleId,
    focus: ContextDiagramFocus,
    { focusedModelConfig, look = {} }: { focusedModelConfig?: ContextModelConfig | null | undefined; look?: ContextDiagramLook } = {}
): ContextDiagramData {
    const contextLabel = localiseConfig(contextConfig, localeId).label;
    const data: ContextDiagramData = {
        links: [],
        nodes: [
            {
                id: contextConfig.id,
                ...(look.rootIcon == null ? { label: contextLabel } : { title: contextLabel, icon: look.rootIcon }),
                level: CONTEXT_DIAGRAM_LEVELS.context,
                typeId: 'context',
                ...(look.rootIcon != null && look.rootDiscColor != null && { color: look.rootDiscColor, discColor: look.rootDiscColor })
            }
        ]
    };
    const nodeColor = look.nodeColor == null ? {} : { color: look.nodeColor };
    const focusedAreaConfig = contextConfig.areas.find((config) => config.id === focus.areaId);
    const areaConfigs = focusedAreaConfig ? [focusedAreaConfig] : contextConfig.areas;
    for (const areaConfig of areaConfigs) {
        const areaNodeId = `${contextConfig.id}.${areaConfig.id}`;
        const areaIcon = constructImageIcon(look.isDark === true ? (areaConfig.iconDark ?? areaConfig.icon) : areaConfig.icon, look.areaIconColor);
        data.nodes.push({
            id: areaNodeId,
            label: localiseConfig(areaConfig, localeId).label,
            level: CONTEXT_DIAGRAM_LEVELS.area,
            typeId: 'area',
            areaId: areaConfig.id,
            ...nodeColor,
            ...(areaIcon != null && { icon: areaIcon })
        });
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
            ...nodeColor,
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
            ...nodeColor,
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
            ...nodeColor,
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

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

// An icon written to sit in the page is made ready to be drawn as an image, which is a document of its own: it cannot
// read the page's text colour, so 'currentColor' becomes the colour given, and it must name the SVG namespace.
function constructImageIcon(icon: null | string | undefined, color: string | undefined): string | undefined {
    if (icon == null || icon === '') return undefined;
    const coloredIcon = color == null ? icon : icon.replaceAll('currentColor', () => color);
    return coloredIcon.includes('xmlns=') ? coloredIcon : coloredIcon.replace('<svg', () => `<svg xmlns="${SVG_NAMESPACE}"`);
}
