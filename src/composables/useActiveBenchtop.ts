import type { BenchtopOptionLocalisedConfig } from '@/types/workbench';
import { readonly, shallowRef } from 'vue';

type ActiveBenchtopInterface = { activeBenchtopOptionConfig: typeof activeBenchtopOptionConfigReadonly; setActiveBenchtop: (config: BenchtopOptionLocalisedConfig) => void };

const activeBenchtopOptionConfig = shallowRef<BenchtopOptionLocalisedConfig | undefined>();
const activeBenchtopOptionConfigReadonly = readonly(activeBenchtopOptionConfig);

function setActiveBenchtop(config: BenchtopOptionLocalisedConfig): void {
    activeBenchtopOptionConfig.value = config;
}

export function useActiveBenchtop(): ActiveBenchtopInterface {
    return { activeBenchtopOptionConfig: activeBenchtopOptionConfigReadonly, setActiveBenchtop };
}
