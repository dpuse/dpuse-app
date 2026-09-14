// ── DPUse Framework
import type { ContextModelConfig } from '@dpuse/dpuse-shared/component/context/model';
import type { ContextModelDimensionConfig } from '@dpuse/dpuse-shared/component/context/model/dimension';
import type { ContextModelEntityConfig } from '@dpuse/dpuse-shared/component/context/model/entity';
import type { ContextModelEntityDataItemConfig } from '@dpuse/dpuse-shared/component/context/model/entity/dataItem';
import type { ContextModelEntityEventConfig } from '@dpuse/dpuse-shared/component/context/model/entity/event';
import type { ContextModelEntityPrimaryMeasureConfig } from '@dpuse/dpuse-shared/component/context/model/entity/primaryMeasure';
import type { ContextModelSecondaryMeasureConfig } from '@dpuse/dpuse-shared/component/context/model/secondaryMeasure';
import type { LocalisedConfig } from '@dpuse/dpuse-shared/locale';
import type {
    ContextModelDimensionHierarchyConfig,
    ContextModelDimensionHierarchyLevelConfig,
    ContextModelDimensionHierarchyNodeConfig
} from '@dpuse/dpuse-shared/component/context/model/dimension/hierarchy';

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
