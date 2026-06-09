// ── External Dependencies
import { computed, type ComputedRef } from 'vue';

// ── DPUse Framework
import { localiseConfigs, type LocalisedConfig } from '@dpuse/dpuse-shared/locale';

// ── Local (App) Framework
import { activeBenchtopId } from '@/state/activeBenchtop';
import type { BenchtopOptionConfig } from '@/domains/workbench/workbench';
import { localeId } from '@/state/locale';
import workbenchOptionData from './workbenchOptions.json';

// ── Composable ───────────────────────────────────────────────────────────────────────────────────────────────────────

// TODO: Pass id for cases where we want the 'workflow' option config, regardless of the active selection.
export function useWorkbenchOptionConfigs(): ComputedRef<LocalisedConfig<BenchtopOptionConfig>[]> {
    return computed(() => localiseConfigs<BenchtopOptionConfig>(workbenchOptionData[activeBenchtopId.value].options, localeId.value));
}
