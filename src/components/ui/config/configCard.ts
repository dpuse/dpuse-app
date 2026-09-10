// The action contract a ConfigCard's host fills in. Held beside the component rather than inside it, because
// '<script setup>' cannot export a value and call sites need the type to declare their own action lists.

// ── External Dependencies & Registrations ────────────────────────────────────────────────────────────────────────────

// ── DPUse Framework
import type { BaseConfig } from '@dpuse/dpuse-shared';
import type { LocalisedConfig } from '@dpuse/dpuse-shared/locale';

// ── Types ────────────────────────────────────────────────────────────────────────────────────────────────────────────

export type ActionTypeId = 'delete' | 'info' | 'open';

export interface Action<T extends BaseConfig = BaseConfig> {
    typeId: ActionTypeId;
    onClick: (item: LocalisedConfig<T>) => void;
}
