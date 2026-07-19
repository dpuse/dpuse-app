// ── External Dependencies & Registrations
import { shallowRef } from 'vue';

// ── DPUse Framework
import type { LocalisedConfig } from '@dpuse/dpuse-shared/locale';

// ── Local Framework
import type { WorkbenchOptionConfig } from '../domains/workbench/useWorkbenchOptions';

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

export const activeBenchtopOptionConfig = shallowRef<LocalisedConfig<WorkbenchOptionConfig> | undefined>();
