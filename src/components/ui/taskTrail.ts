// ── External Dependencies & Registrations
import type { Component } from 'vue';
import type { RouteLocationRaw } from 'vue-router';

// ── Types ────────────────────────────────────────────────────────────────────────────────────────────────────────────

export interface TaskTrailContent {
    back?: { label: string; select: () => void }; // Replaces every crumb but the last with one button back, e.g. while a narrow screen shows a preview in place of its list.
    items: TaskTrailItem[];
    label: string; // Names the row for screen readers.
    tooltip?: string;
}

// A crumb goes somewhere when it has 'to' or 'select'. Otherwise it is text.
export interface TaskTrailItem {
    id: string;
    label: string;
    configIcon?: { icon: string | null | undefined; iconDark?: string | null | undefined }; // A config's own icon.
    icon?: Component; // An icon for a crumb with no config icon.
    isLabelHidden?: boolean; // Shows only the icon. The label becomes the tooltip.
    select?: () => void;
    to?: RouteLocationRaw;
}
