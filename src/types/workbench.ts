/**
 * Shared types describing the knowledge-workbench JSON data.
 */

interface WorkbenchConfig {
    id: string;
    label: Record<string, string>;
    description: Record<string, string>;
    colors: WorkbenchColors;
    icon: string;
    benchtops: BenchtopConfig[];
}

type WorkbenchLocalisedConfig = Omit<WorkbenchConfig, 'label' | 'description' | 'benchtops'> & {
    label: string;
    description: string;
    benchtops: BenchtopLocalisedConfig[];
};

interface BenchtopConfig {
    id: string;
    label: Record<string, string>;
    description: Record<string, string>;
    colors: WorkbenchColors;
    icon: string;
    primaryOptions: BenchtopPrimaryOptionConfig[];
    secondaryOptions: BenchtopSecondaryOptionConfig[];
}

type BenchtopLocalisedConfig = Omit<BenchtopConfig, 'label' | 'description' | 'primaryOptions' | 'secondaryOptions'> & {
    label: string;
    description: string;
    primaryOptions: BenchtopPrimaryOptionLocalisedConfig[];
    secondaryOptions: BenchtopSecondaryOptionLocalisedConfig[];
};

interface BenchtopPrimaryOptionConfig {
    id: string;
    label: Record<string, string>;
    description: Record<string, string>;
    state: BenchtopOptionState;
    step?: number;
    tasks: BenchtopPrimaryOptionTaskConfig[];
}

type BenchtopPrimaryOptionLocalisedConfig = Omit<BenchtopPrimaryOptionConfig, 'label' | 'description' | 'tasks'> & {
    label: string;
    description: string;
    tasks: BenchtopOptionTaskLocalisedConfig[];
};

interface BenchtopPrimaryOptionTaskConfig {
    id: string;
    label: Record<string, string>;
    description: Record<string, string>;
}

type BenchtopOptionTaskLocalisedConfig = Omit<BenchtopPrimaryOptionTaskConfig, 'label' | 'description'> & {
    label: string;
    description: string;
};

interface BenchtopSecondaryOptionConfig {
    id: string;
    label: Record<string, string>;
    description: Record<string, string>;
    state: BenchtopOptionState;
    step?: number;
}

type BenchtopSecondaryOptionLocalisedConfig = Omit<BenchtopSecondaryOptionConfig, 'label' | 'description'> & {
    label: string;
    description: string;
};

type BenchtopOptionState = BenchtopOptionSingleState | BenchtopOptionBooleanState;

type BenchtopOptionSingleState = {
    kind: 'single';
    single: BenchtopOptionStateCharacteristics;
};

type BenchtopOptionBooleanState = {
    kind: 'boolean';
    true: BenchtopOptionStateCharacteristics;
    false: BenchtopOptionStateCharacteristics;
};

type BenchtopOptionStateCharacteristics = {
    colors: WorkbenchColors;
    icon: string;
};

type WorkbenchColors = { text: { dark?: string; light: string } };

// Exposures.
export type { BenchtopLocalisedConfig, BenchtopOptionState, BenchtopPrimaryOptionLocalisedConfig, BenchtopOptionTaskLocalisedConfig, WorkbenchConfig, WorkbenchLocalisedConfig };
