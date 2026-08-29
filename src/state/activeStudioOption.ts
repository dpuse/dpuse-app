// ── External Dependencies & Registrations
import { shallowRef } from 'vue';

// ── DPUse Framework
import type { LocalisedConfig } from '@dpuse/dpuse-shared/locale';

// ── Local Framework
import type { StudioOptionConfig } from '@/features/studio/options/useOptions';

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

export const activeStudioOptionConfig = shallowRef<LocalisedConfig<StudioOptionConfig> | undefined>();
