// ── External Dependencies & Registrations
import { computed, type ComputedRef } from 'vue';

// ── DPUse Framework
import { localiseConfigs, type LocalisedConfig } from '@dpuse/dpuse-shared/locale';

// ── Local Framework
import { localeId } from '@/state/locale';
import type { SetupOptionConfig } from '@/utilities/index.ts';

// ── Data
import setupOptionConfigsData from './_data/setupOptionConfigs.json';

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

const SETUP_OPTION_CONFIGS = setupOptionConfigsData as SetupOptionConfig[]; // JSON imports aren't checked against the type, so the shape is asserted here.

// ── Composables ──────────────────────────────────────────────────────────────────────────────────────────────────────

export function useSetupOptions(): ComputedRef<LocalisedConfig<SetupOptionConfig>[]> {
    return computed(() => localiseConfigs<SetupOptionConfig>(SETUP_OPTION_CONFIGS, localeId.value));
}
