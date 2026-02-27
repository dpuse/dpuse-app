// App core
import workbenchData from '~/knowledge/workbench.json';

// Local type dependencies.
import type { LocaleId } from '@/locales';
import type { BenchtopLocalisedConfig, WorkbenchConfig, WorkbenchLocalisedConfig } from '@/types/workbench';

// Raw workbench configuration loaded from the knowledge bundle.
const workbenchConfig = workbenchData as WorkbenchConfig;

// Active localised workbench configuration.
let activeLocaleCode: LocaleId | undefined;
let workbenchLocalisedConfig: WorkbenchLocalisedConfig | undefined;

// Composable for loading and caching knowledge data.
export function useKnowledge() {
    return { getBenchtopConfig };
}

// Operations ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// Retrieve benchtop localized configuration by id for the given locale, throwing when missing.
function getBenchtopConfig(id: string, localeCode: LocaleId): BenchtopLocalisedConfig {
    const workbenchLocalisedConfig = getWorkbenchLocalisedConfig(localeCode);
    const benchtopLocalisedConfig = workbenchLocalisedConfig.benchtops.find((benchtopConfig) => benchtopConfig.id === id);
    if (benchtopLocalisedConfig == null) throw new Error(`Cannot retrieve benchtop configuration, invalid benchtop identifier of '${id}'.`);
    return benchtopLocalisedConfig;
}

// Helpers ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// ...
function getWorkbenchLocalisedConfig(localeCode: LocaleId): WorkbenchLocalisedConfig {
    if (workbenchLocalisedConfig == null || activeLocaleCode !== localeCode) workbenchLocalisedConfig = localiseWorkbenchConfig(localeCode);
    return workbenchLocalisedConfig;
}

// Build a localized workbench projection by copying the raw config and applying locale-specific labels and descriptions.
function localiseWorkbenchConfig(localeCode: LocaleId): WorkbenchLocalisedConfig {
    return {
        id: workbenchConfig.id,
        label: workbenchConfig.label[localeCode] ?? workbenchConfig.id,
        description: workbenchConfig.description[localeCode] ?? workbenchConfig.id,
        benchtops: workbenchConfig.benchtops.map((benchtopConfig) => ({
            id: benchtopConfig.id,
            label: benchtopConfig.label[localeCode] ?? workbenchConfig.id,
            description: benchtopConfig.description[localeCode] ?? workbenchConfig.id,
            icon: benchtopConfig.icon,
            options: benchtopConfig.options.map((optionConfig) => ({
                id: optionConfig.id,
                label: optionConfig.label[localeCode] ?? workbenchConfig.id,
                description: optionConfig.description[localeCode] ?? workbenchConfig.id,
                color: optionConfig.color,
                icon: optionConfig.icon,
                step: optionConfig.step,
                tasks: optionConfig.tasks.map((taskConfig) => ({
                    id: taskConfig.id,
                    label: taskConfig.label[localeCode] ?? workbenchConfig.id,
                    description: taskConfig.description[localeCode] ?? workbenchConfig.id
                }))
            }))
        }))
    };
}
