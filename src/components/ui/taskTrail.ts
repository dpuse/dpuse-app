// ── External Dependencies & Registrations
import type { Component } from 'vue';
import type { RouteLocationRaw } from 'vue-router';

// ── Types ────────────────────────────────────────────────────────────────────────────────────────────────────────────

export interface TaskTrailContent {
    back?: { label: string; select: () => void }; // Replaces every crumb but the last with one button back, e.g. while a narrow screen shows a preview in place of its list.
    emptyText?: string; // Shown pale and in italics while there are no crumbs, so an empty row does not look like a missing one.
    items: TaskTrailItem[];
    label: string; // Names the row for screen readers.
    tooltip?: string;
}

// A crumb goes somewhere when it has 'to' or 'select'. Otherwise it is text.
export interface TaskTrailItem {
    id: string;
    label: string;
    compactIcon?: Component; // Shown in place of the label while the trail is too narrow for every label, e.g. a folder's.
    configIcon?: { icon: string | null | undefined; iconDark?: string | null | undefined }; // A config's own icon.
    icon?: Component; // An icon for a crumb with no config icon.
    iconClass?: string; // Tints 'icon', e.g. an item's kind in the DPUse green.
    iconStrokeWidth?: number; // Defaults to 1.5.
    isLabelHidden?: boolean; // Shows only the icon. The label becomes the tooltip.
    select?: () => void;
    to?: RouteLocationRaw;
}
