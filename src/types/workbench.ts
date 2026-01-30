/**
 * Shared types describing the knowledge-workbench JSON data.
 */

interface WorkbenchConfig {
    id: string;
    label: Record<string, string>;
    description: Record<string, string>;
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
    icon: string;
    options: BenchtopOptionConfig[];
}

type BenchtopLocalisedConfig = Omit<BenchtopConfig, 'label' | 'description' | 'options'> & {
    label: string;
    description: string;
    options: BenchtopOptionLocalisedConfig[];
};

interface BenchtopOptionConfig {
    id: string;
    label: Record<string, string>;
    description: Record<string, string>;
    color: string;
    icon: string;
    step: number;
    tasks: BenchtopOptionTaskConfig[];
}

type BenchtopOptionLocalisedConfig = Omit<BenchtopOptionConfig, 'label' | 'description' | 'tasks'> & {
    label: string;
    description: string;
    tasks: BenchtopOptionTaskLocalisedConfig[];
};

interface BenchtopOptionTaskConfig {
    id: string;
    label: Record<string, string>;
    description: Record<string, string>;
}

type BenchtopOptionTaskLocalisedConfig = Omit<BenchtopOptionTaskConfig, 'label' | 'description'> & {
    label: string;
    description: string;
};

// Exposures.
export type { BenchtopLocalisedConfig, BenchtopOptionLocalisedConfig, BenchtopOptionTaskLocalisedConfig, WorkbenchConfig, WorkbenchLocalisedConfig };
