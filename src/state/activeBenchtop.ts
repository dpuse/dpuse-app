// External Dependencies
import type { BenchtopOptionConfig } from '~/src/domains/workbench/workbench';
import { shallowRef } from 'vue';

// DPUse Framework
import type { LocalisedConfig } from '@dpuse/dpuse-shared/locale';

// State ───────────────────────────────────────────────────────────────────────────────────────────────────────────────

export const activeBenchtopOptionConfig = shallowRef<LocalisedConfig<BenchtopOptionConfig> | undefined>();

// Actions ─────────────────────────────────────────────────────────────────────────────────────────────────────────────

// TODO: Could this be set automatically via url param?
export function setActiveBenchtop(config: LocalisedConfig<BenchtopOptionConfig>): void {
    activeBenchtopOptionConfig.value = config;
}
