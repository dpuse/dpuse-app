// External Dependencies
import type { BenchtopOptionConfig } from '@/domains/workbench/workbench';
import { type Ref, ref, shallowRef } from 'vue';

// DPUse Framework
import type { LocalisedConfig } from '@dpuse/dpuse-shared/locale';

// State ───────────────────────────────────────────────────────────────────────────────────────────────────────────────

export const activeBenchtopId: Ref<'admin' | 'partner' | 'workflow'> = ref('workflow');
export const activeBenchtopOptionConfig = shallowRef<LocalisedConfig<BenchtopOptionConfig> | undefined>();

// Actions ─────────────────────────────────────────────────────────────────────────────────────────────────────────────

// TODO: Could this be set automatically via url param?
export function setActiveBenchtopOption(config: LocalisedConfig<BenchtopOptionConfig>): void {
    activeBenchtopOptionConfig.value = config;
}
