export interface ContextConfig {
    id: string;
    label: string;
    description: string;
    modelGroups: ModelGroupConfig[];
}

export interface ModelGroupConfig {
    id: string;
    label: string;
    description: string;
    models: ModelConfig[];
}

export interface ModelConfig {
    id: string;
    label: string;
    description: string;
    dimensionGroups: DimensionGroupConfig[];
    entityGroups: EntityGroupConfig[];
    secondaryMeasureGroups: SecondaryMeasureGroupConfig[];
}

export interface DimensionGroupConfig {
    id: string;
    label: string;
    description: string;
}

export interface EntityGroupConfig {
    id: string;
    label: string;
    description: string;
}

export interface SecondaryMeasureGroupConfig {
    id: string;
    label: string;
    description: string;
}
