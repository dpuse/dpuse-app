// External Dependencies
import { computed, type ComputedRef } from 'vue';

// App Framework
import type { BenchtopOptionLocalisedConfig } from '@/types/workbench';
import workflowOptionData from '~/knowledge/workbench/benchtops/workflow/workflowOptions.json';
import { localeId, localiseConfigs } from '@/translations';

// Workflow Option Configs Composable ──────────────────────────────────────────────────────────────────────────────────

export function useWorkflowOptionConfigs(): ComputedRef<BenchtopOptionLocalisedConfig[]> {
    return computed(() => localiseConfigs<BenchtopOptionLocalisedConfig>(workflowOptionData, localeId.value));
}
