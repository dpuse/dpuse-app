// ── External Dependencies
import type { BenchtopOptionConfig } from '@/domains/workbench/workbench';
import { shallowRef } from 'vue';

// ── DPUse Framework
import type { LocalisedConfig } from '@dpuse/dpuse-shared/locale';

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

export const activeBenchtopOptionConfig = shallowRef<LocalisedConfig<BenchtopOptionConfig> | undefined>();
