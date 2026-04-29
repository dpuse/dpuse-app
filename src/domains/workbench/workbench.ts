// DPUse Framework
import type { LocaleLabel } from '@dpuse/dpuse-shared/locale';

// Types ──────────────────────────────────────────────────────────────────────────────────────────────────────────────

export interface WorkbenchConfig {
    id: string;
    label: LocaleLabel;
    description: LocaleLabel;
    benchtops: BenchtopConfig[];
}

interface BenchtopConfig {
    id: string;
    label: LocaleLabel;
    description: LocaleLabel;
    icon: string;
    options: BenchtopOptionConfig[];
}

export interface BenchtopOptionConfig {
    id: string;
    label: LocaleLabel;
    description: LocaleLabel;
    color: string;
    icon: string;
    step: number;
    tasks: BenchtopOptionStepConfig[];
}

interface BenchtopOptionStepConfig {
    id: string;
    label: LocaleLabel;
    description: LocaleLabel;
}
