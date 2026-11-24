// ── External Dependencies & Registrations
import type { Component } from 'vue';
import { BracesIcon, FileIcon, SheetIcon } from '@lucide/vue';

// ── DPUse Framework
import type { ConnectionNodeConfig, ConnectorItemTypeId, DataFormatId } from '@dpuse/dpuse-shared';

// ── Local Framework
import { DATA_FORMAT_ICON_CONFIGS } from './dataFormatIcons';

// ── Types ────────────────────────────────────────────────────────────────────────────────────────────────────────────

// Either SVG markup, shown with 'ConfigIcon', or a Lucide icon with its tint and stroke.
export interface ItemIcon {
    configIcon?: { icon: string | null | undefined; iconDark?: string | null | undefined };
    icon?: Component;
    iconClass?: string;
    iconStrokeWidth?: number;
}

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

const ITEM_TYPE_ICONS: Record<ConnectorItemTypeId, Component> = { apiEndpoint: BracesIcon, file: FileIcon, table: SheetIcon };

// ── Actions ──────────────────────────────────────────────────────────────────────────────────────────────────────────

// The icon of a chosen item, the same wherever it is shown. An item with an icon of its own shows it. A file shows its
// format's icon once it has been previewed. Any other item shows what kind of item it is. A table connector's items
// always show the table grid, even the application emulator's, whose tables are stored as CSV files. A connector
// released before it said which kind shows the table grid.
export function resolveItemIcon(
    connectionNodeConfig: Pick<ConnectionNodeConfig, 'icon' | 'iconDark'>,
    dataFormatId: DataFormatId | undefined,
    itemTypeId: ConnectorItemTypeId | undefined
): ItemIcon {
    const { icon, iconDark } = connectionNodeConfig;
    if ([icon, iconDark].some((svg) => svg != null && svg !== '')) return { configIcon: { icon, iconDark } };
    if (itemTypeId === 'file' && dataFormatId != null && dataFormatId !== 'unknown') return { configIcon: DATA_FORMAT_ICON_CONFIGS[dataFormatId] };

    // A table or API endpoint has no format icon, so its kind's icon takes the DPUse green and stroke weight the
    // delimited-text format icon uses. A file still to be previewed stays grey until its format icon replaces it.
    const typeIcon = itemTypeId ? ITEM_TYPE_ICONS[itemTypeId] : SheetIcon;
    return itemTypeId === 'file' ? { icon: typeIcon, iconStrokeWidth: 1.5 } : { icon: typeIcon, iconClass: 'text-[#488f86]', iconStrokeWidth: 1.75 };
}
