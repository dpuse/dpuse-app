// ── External Dependencies
import { computed, type ComputedRef } from 'vue';

// ── DPUse Framework
import { localiseConfigs, type LocalisedConfig } from '@dpuse/dpuse-shared/locale';

// ── Local (App) Framework
import type { BenchtopOptionConfig } from '@/domains/workbench/workbench';
import { localeId } from '@/state/locale';
import workbenchOptionData from './workbenchOptions.json';

// ── Composable ───────────────────────────────────────────────────────────────────────────────────────────────────────

export function useWorkbenchOptionConfigs(id: 'admin' | 'partner' | 'workflow'): ComputedRef<LocalisedConfig<BenchtopOptionConfig>[]> {
    return computed(() => localiseConfigs<BenchtopOptionConfig>(workbenchOptionData[id].options, localeId.value));
}
