// External Dependencies
import type { BenchtopOptionLocalisedConfig } from '@/types/workbench';
import { shallowRef } from 'vue';

// State ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const activeBenchtopOptionConfig = shallowRef<BenchtopOptionLocalisedConfig | undefined>();

// Actions ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// TODO: Could this be set automatically via url param?
export function setActiveBenchtop(config: BenchtopOptionLocalisedConfig): void {
    activeBenchtopOptionConfig.value = config;
}
