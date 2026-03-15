// External Dependencies
import type { BenchtopOptionLocalisedConfig } from '@/types/workbench';
import { type DeepReadonly, readonly, type ShallowRef, shallowRef } from 'vue';

// Composable
type ActiveBenchtopInterface = {
    activeBenchtopOptionConfig: DeepReadonly<ShallowRef<BenchtopOptionLocalisedConfig | undefined>>;
    setActiveBenchtop: (config: BenchtopOptionLocalisedConfig) => void;
};
export function useActiveBenchtop(): ActiveBenchtopInterface {
    return { activeBenchtopOptionConfig: readonly(activeBenchtopOptionConfig), setActiveBenchtop };
}

// Reactive State ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const activeBenchtopOptionConfig = shallowRef<BenchtopOptionLocalisedConfig | undefined>();

// Actions ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function setActiveBenchtop(config: BenchtopOptionLocalisedConfig): void {
    activeBenchtopOptionConfig.value = config;
}
