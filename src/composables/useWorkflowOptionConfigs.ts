// External Dependencies
import { computed, type ComputedRef } from 'vue';

// Local Framework
import type { BenchtopOptionLocalisedConfig } from '@/types/workbench';
import { localeId } from '@/translations';
import { localiseConfigs } from '@dpuse/dpuse-shared/locale';
import workflowOptionData from '~/knowledge/workbench/benchtops/workflow/workflowOptions.json';

// Composable ──────────────────────────────────────────────────────────────────────────────────────────────────────────

export function useWorkflowOptionConfigs(): ComputedRef<BenchtopOptionLocalisedConfig[]> {
    return computed(() => localiseConfigs<BenchtopOptionLocalisedConfig>(workflowOptionData, localeId.value));
}
