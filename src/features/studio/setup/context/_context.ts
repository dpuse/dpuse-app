// ── DPUse Framework
import { DEFAULT_LOCALE_ID } from '@dpuse/dpuse-shared';
import type {
    ContextModelConfig,
    ContextModelDimensionConfig,
    ContextModelDimensionHierarchyConfig,
    ContextModelDimensionHierarchyLevelConfig,
    ContextModelDimensionHierarchyNodeConfig,
    ContextModelEntityConfig,
    ContextModelEntityDataItemConfig,
    ContextModelEntityEventConfig,
    ContextModelEntityPrimaryMeasureConfig,
    ContextModelSecondaryMeasureConfig,
    LocaleId,
    LocalisedConfig
} from '@dpuse/dpuse-shared';

// ── Types ────────────────────────────────────────────────────────────────────────────────────────────────────────────

export interface LocalisedModel extends Omit<LocalisedConfig<ContextModelConfig>, 'entities' | 'dimensions' | 'secondaryMeasures'> {
    entities: LocalisedEntity[];
    dimensions: LocalisedDimension[];
    secondaryMeasures: LocalisedSecondaryMeasure[];
}

export interface LocalisedEntity extends Omit<LocalisedConfig<ContextModelEntityConfig>, 'dataItems' | 'events' | 'primaryMeasures'> {
    dataItems: LocalisedConfig<ContextModelEntityDataItemConfig>[];
    events: LocalisedEntityEvent[];
    primaryMeasures: LocalisedConfig<ContextModelEntityPrimaryMeasureConfig>[];
}

export interface LocalisedEntityEvent extends Omit<ContextModelEntityEventConfig, 'labelAction' | 'labelState' | 'description'> {
    labelAction: string;
    labelState?: string;
    description: string;
}

export interface LocalisedDimension extends Omit<LocalisedConfig<ContextModelDimensionConfig>, 'hierarchies'> {
    hierarchies: LocalisedDimensionHierarchy[];
}

export interface LocalisedDimensionHierarchy extends Omit<LocalisedConfig<ContextModelDimensionHierarchyConfig>, 'levels' | 'children'> {
    levels: LocalisedConfig<ContextModelDimensionHierarchyLevelConfig>[];
    children: LocalisedDimensionHierarchyNode[];
}

export interface LocalisedDimensionHierarchyNode extends Omit<LocalisedConfig<ContextModelDimensionHierarchyNodeConfig>, 'children'> {
    children?: LocalisedDimensionHierarchyNode[];
}

export type LocalisedSecondaryMeasure = LocalisedConfig<ContextModelSecondaryMeasureConfig>;

// A heading row carries only what it shows, and the required 'isHeader' lets a check narrow a row to one kind or the
// other.
export type GridListItem<T> = { id: string; isHeader: true; label: string } | (T & { isHeader: false });

// ── Actions ──────────────────────────────────────────────────────────────────────────────────────────────────────────

export function localiseModel(model: ContextModelConfig, localeId: LocaleId): LocalisedModel {
    return {
        ...model,
        label: localiseText(model.label, localeId),
        description: localiseText(model.description, localeId),
        entities: Array.from(model.entities, (entity) => ({
            ...entity,
            label: localiseText(entity.label, localeId),
            description: localiseText(entity.description, localeId),
            dataItems: Array.from(entity.dataItems, (dataItem) => ({
                ...dataItem,
                label: localiseText(dataItem.label, localeId),
                description: localiseText(dataItem.description, localeId)
            })),
            events: Array.from(entity.events, (event) => ({
                ...event,
                labelAction: localiseText(event.labelAction, localeId),
                labelState: event.labelState ? localiseText(event.labelState, localeId) : undefined,
                description: localiseText(event.description, localeId)
            })),
            primaryMeasures: Array.from(entity.primaryMeasures, (measure) => ({
                ...measure,
                label: localiseText(measure.label, localeId),
                description: localiseText(measure.description, localeId)
            }))
        })),
        dimensions: Array.from(model.dimensions, (dimension) => ({
            ...dimension,
            label: localiseText(dimension.label, localeId),
            description: localiseText(dimension.description, localeId),
            hierarchies: Array.from(dimension.hierarchies, (hierarchy) => localiseHierarchy(hierarchy, localeId))
        })),
        secondaryMeasures: Array.from(model.secondaryMeasures, (measure) => ({
            ...measure,
            label: localiseText(measure.label, localeId),
            description: localiseText(measure.description, localeId)
        }))
    };
}

// 'label'/'description' are locale maps, but not always: some primary measures (e.g. 'personLanguage') give a plain
// string instead. 'description' can also be absent entirely on data items, events, and primary measures whose type
// declares it optional — this still has to cope with that being 'undefined' at runtime. A missing translation falls
// back to the default locale, as 'localiseConfig' does.
export function localiseText(value: string | Partial<Record<string, string>> | undefined, localeId: LocaleId): string {
    return typeof value === 'string' ? value : (value?.[localeId] ?? value?.[DEFAULT_LOCALE_ID] ?? '');
}

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

function localiseHierarchy(hierarchy: ContextModelDimensionHierarchyConfig, localeId: LocaleId): LocalisedDimensionHierarchy {
    return {
        ...hierarchy,
        label: localiseText(hierarchy.label, localeId),
        description: localiseText(hierarchy.description, localeId),
        levels: Array.from(hierarchy.levels, (level) => ({ ...level, label: localiseText(level.label, localeId), description: localiseText(level.description, localeId) })),
        children: Array.from(hierarchy.children, (node) => localiseHierarchyNode(node, localeId))
    };
}

// Recursive to match 'ContextModelDimensionHierarchyNodeConfig' — a hierarchy nests arbitrarily deep (the age
// hierarchy's leaves are individual years), so there is no fixed depth to unroll.
function localiseHierarchyNode(node: ContextModelDimensionHierarchyNodeConfig, localeId: LocaleId): LocalisedDimensionHierarchyNode {
    return {
        ...node,
        label: localiseText(node.label, localeId),
        description: localiseText(node.description, localeId),
        children: node.children ? Array.from(node.children, (child) => localiseHierarchyNode(child, localeId)) : undefined
    };
}
