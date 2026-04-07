// External Dependencies
import type { BenchtopOptionLocalisedConfig } from '@/types/workbench';
import { type DeepReadonly, readonly, type ShallowRef, shallowRef } from 'vue';

// Source State ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const activeBenchtopOptionConfig = shallowRef<BenchtopOptionLocalisedConfig | undefined>();

// Active Benchtop Composable ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

type ActiveBenchtopInterface = {
    activeBenchtopOptionConfig: DeepReadonly<ShallowRef<BenchtopOptionLocalisedConfig | undefined>>;
};
export function useActiveBenchtop(): ActiveBenchtopInterface {
    return { activeBenchtopOptionConfig: readonly(activeBenchtopOptionConfig) };
}

// Actions ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// TODO: Could this be set automatically via url param?
export function setActiveBenchtop(config: BenchtopOptionLocalisedConfig): void {
    activeBenchtopOptionConfig.value = config;
}
