// ── DPUse Framework
import type { ContextModelSecondaryMeasureConfig } from '@dpuse/dpuse-shared/component/context/model/secondaryMeasure';
import type { LocalisedConfig } from '@dpuse/dpuse-shared/locale';

// The localised shapes the model panels render, after 'localiseModel' has collapsed each label/description map down to
// the active locale's string.

// ── Types ────────────────────────────────────────────────────────────────────────────────────────────────────────────

// 'parents', 'characteristics', 'events' and 'primaryMeasures' are not yet present in the model data; the panels render
// them as empty placeholders until it provides them.
export interface LocalisedModelItem {
    id: string;
    label: string;
    description: string;
    parents?: string[];
    characteristics?: string[];
    events?: string[];
    primaryMeasures?: string[];
}

// Grounded in the real shared config now that one exists, rather than a local guess at its shape. The four placeholder
// fields are still local: 'ContextSecondaryMeasuresPanel' renders the same empty tabs for them as the entity panels do,
// though nothing has yet confirmed a secondary measure should carry these entity-shaped fields at all.
export interface LocalisedSecondaryMeasure
    extends LocalisedConfig<ContextModelSecondaryMeasureConfig>,
        Pick<LocalisedModelItem, 'parents' | 'characteristics' | 'events' | 'primaryMeasures'> {}

export interface LocalisedModel {
    entities: LocalisedModelItem[];
    dimensions: LocalisedModelItem[];
    secondaryMeasures: LocalisedSecondaryMeasure[];
}
