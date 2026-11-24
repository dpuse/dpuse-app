// ── DPUse Framework
import type { ContextConfig, ContextEventReference, ContextModelConfig, LocaleId } from '@dpuse/dpuse-shared';
import { localiseConfig, localiseReference } from '@dpuse/dpuse-shared';

// ── Local Framework
import { localiseText } from '@/state/contextModels';

// ── Types ────────────────────────────────────────────────────────────────────────────────────────────────────────────

// How far the diagram has been drilled down: the whole context, one area, one model of an area, one entity of a model,
// or one event of an entity.
export interface ContextDiagramFocus {
    areaId?: string | undefined;
    entityId?: string | undefined;
    eventId?: string | undefined;
    modelId?: string | undefined;
}

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

const SVG_NAMESPACE = 'http://www.w3.org/2000/svg';

// ── Actions ──────────────────────────────────────────────────────────────────────────────────────────────────────────

// An icon written to sit in the page is made ready to be drawn as an image, which is a document of its own: it cannot
// read the page's text colour, so 'currentColor' becomes the colour given, and it must name the SVG namespace.
export function constructImageIcon(icon: null | string | undefined, color: string | undefined): string | undefined {
    if (icon == null || icon === '') return undefined;
    const coloredIcon = color == null ? icon : icon.replaceAll('currentColor', () => color);
    return coloredIcon.includes('xmlns=') ? coloredIcon : coloredIcon.replace('<svg', () => `<svg xmlns="${SVG_NAMESPACE}"`);
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
