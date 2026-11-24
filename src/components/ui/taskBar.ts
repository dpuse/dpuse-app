// ── External Dependencies & Registrations
import type { RouteLocationRaw } from 'vue-router';

// ── DPUse Framework
import type { LocaleDescription, LocaleLabel, LocalisedConfig } from '@dpuse/dpuse-shared';

// ── Types ────────────────────────────────────────────────────────────────────────────────────────────────────────────

// The label is also given split over two lines for a narrow bar. Each language sets its own split, because word order
// differs between languages and the words cannot be joined or divided in code.
export interface TaskConfig {
    id: string;
    label: LocaleLabel;
    labelLine1: LocaleLabel;
    labelLine2: LocaleLabel;
    description: LocaleDescription;
    enableUpTo: number;
    number: number;
}

// 'detail' names what was chosen in a step, such as the connection. It is read out with the step; the host shows it on
// screen wherever there is room for it.
export type TaskBarItem = LocalisedConfig<TaskConfig> & { detail?: string; disabled: boolean; to?: RouteLocationRaw };
