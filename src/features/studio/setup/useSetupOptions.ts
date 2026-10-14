// ── External Dependencies & Registrations
import { computed, type ComputedRef } from 'vue';

// ── DPUse Framework
import { localiseConfigs } from '@dpuse/dpuse-shared';
import type { BaseConfig, ConnectorConfig, CookbookConfig, LocalisedConfig, PresenterConfig, ToolConfig } from '@dpuse/dpuse-shared';

// ── Local Framework
import { localeId } from '@/state/locale';

// ── Data
import setupOptionConfigsData from './_data/setupOptionConfigs.json';

// ── Types ────────────────────────────────────────────────────────────────────────────────────────────────────────────

export interface SetupOptionConfig<TIcon = string> extends Omit<BaseConfig, 'icon' | 'iconDark'> {
    icon: TIcon | null;
    iconDark: TIcon | null;
    to?: string;
    rightAligned?: boolean;
}

// The module types loaded at run time, as listed under 'Manage Configuration'. A union rather than 'ModuleConfig', so
// each panel can narrow on 'typeId' and reach its own fields.
export type PluginConfig = ConnectorConfig | CookbookConfig | PresenterConfig | ToolConfig;

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

const SETUP_OPTION_CONFIGS = setupOptionConfigsData as SetupOptionConfig[]; // JSON imports aren't checked against the type, so the shape is asserted here.

// ── Composables ──────────────────────────────────────────────────────────────────────────────────────────────────────

export function useSetupOptions(): ComputedRef<LocalisedConfig<SetupOptionConfig>[]> {
    return computed(() => localiseConfigs<SetupOptionConfig>(SETUP_OPTION_CONFIGS, localeId.value));
}
