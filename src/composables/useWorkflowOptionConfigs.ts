// External Dependencies
import { computed, type ComputedRef } from 'vue';

// DPUse Framework
import { localiseConfigs, type LocalisedConfig } from '@dpuse/dpuse-shared/locale';

// Local Framework
import type { BenchtopOptionConfig } from '@/types/workbench';
import { localeId } from '@/translations';
import workflowOptionData from '~/knowledge/workbench/benchtops/workflow/workflowOptions.json';

// Composable ──────────────────────────────────────────────────────────────────────────────────────────────────────────

export function useWorkflowOptionConfigs(): ComputedRef<LocalisedConfig<BenchtopOptionConfig>[]> {
    return computed(() => localiseConfigs<BenchtopOptionConfig>(workflowOptionData, localeId.value));
}
