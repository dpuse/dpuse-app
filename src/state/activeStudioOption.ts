// ── External Dependencies & Registrations
import { shallowRef } from 'vue';

// ── DPUse Framework
import type { LocalisedConfig } from '@dpuse/dpuse-shared/locale';

// ── API Framework
import type { StudioOptionConfig } from '../studio/useStudioOptions';

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

export const activeStudioOptionConfig = shallowRef<LocalisedConfig<StudioOptionConfig> | undefined>();
