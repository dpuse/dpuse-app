// ── DPUse Framework
import type { ContextModelConfig } from '@dpuse/dpuse-shared/component/context/model';
import type { ContextModelDimensionConfig } from '@dpuse/dpuse-shared/component/context/model/dimension';
import type { ContextModelEntityConfig } from '@dpuse/dpuse-shared/component/context/model/entity';
import type { ContextModelEntityDataItemConfig } from '@dpuse/dpuse-shared/component/context/model/entity/dataItem';
import type { ContextModelSecondaryMeasureConfig } from '@dpuse/dpuse-shared/component/context/model/secondaryMeasure';
import type { LocalisedConfig } from '@dpuse/dpuse-shared/locale';

// The localised shapes the model panels render, after 'localiseModel' has collapsed each label/description map down to
// the active locale's string.

// ── Types ────────────────────────────────────────────────────────────────────────────────────────────────────────────

// 'parents', 'characteristics', 'events' and 'primaryMeasures' are not yet present in the dimension or secondary
// measure data; those two panels render them as empty placeholders until it provides them. Entities have their own,
// more accurate type below, grounded in the real shared config.
export interface LocalisedModelItem {
    id: string;
    label: string;
    description: string;
    parents?: string[];
    characteristics?: string[];
    events?: string[];
    primaryMeasures?: string[];
}

// Grounded in the real shared config now that one exists, rather than a local guess at its shape. 'dataItems' is
// localised too, since each one carries its own label/description map. 'events' and 'primaryMeasures' are still the
// local placeholder shape: the shared config now types both as arrays of configs, but the mock model data still
// stores them as keyed objects, so they are not converted until that catches up.
export interface LocalisedEntity extends Omit<LocalisedConfig<ContextModelEntityConfig>, 'dataItems' | 'events' | 'primaryMeasures'> {
    dataItems: LocalisedConfig<ContextModelEntityDataItemConfig>[];
    events?: string[];
    primaryMeasures?: string[];
}

// Grounded in the real shared config now that one exists, rather than a local guess at its shape. 'hierarchies' is
// left unlocalised: 'ContextDimensionsPanel' doesn't render it yet, and the mock model data's hierarchies are a much
// deeper tree (levels, nested children) than the shared config currently models. The four placeholder fields are
// still local, the same as 'LocalisedSecondaryMeasure' — nothing has confirmed a dimension should carry them either.
export interface LocalisedDimension
    extends LocalisedConfig<ContextModelDimensionConfig>,
        Pick<LocalisedModelItem, 'parents' | 'characteristics' | 'events' | 'primaryMeasures'> {}

// Grounded in the real shared config now that one exists, rather than a local guess at its shape. The four placeholder
// fields are still local: 'ContextSecondaryMeasuresPanel' renders the same empty tabs for them as the entity panels do,
// though nothing has yet confirmed a secondary measure should carry these entity-shaped fields at all.
export interface LocalisedSecondaryMeasure
    extends LocalisedConfig<ContextModelSecondaryMeasureConfig>,
        Pick<LocalisedModelItem, 'parents' | 'characteristics' | 'events' | 'primaryMeasures'> {}

// Grounded in the real shared config now that one exists. Its own 'label'/'description' are localised the same way
// as everything nested inside it, even though nothing currently reads them — 'ContextModelPanel' shows
// 'modelReference.label' (the grid item that opened it) in the header, not the model's own.
export interface LocalisedModel extends Omit<LocalisedConfig<ContextModelConfig>, 'entities' | 'dimensions' | 'secondaryMeasures'> {
    entities: LocalisedEntity[];
    dimensions: LocalisedDimension[];
    secondaryMeasures: LocalisedSecondaryMeasure[];
}
