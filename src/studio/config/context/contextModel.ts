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

export interface LocalisedSecondaryMeasure extends LocalisedModelItem {
    formula: string;
}

export interface LocalisedModel {
    entities: LocalisedModelItem[];
    dimensions: LocalisedModelItem[];
    secondaryMeasures: LocalisedSecondaryMeasure[];
}
