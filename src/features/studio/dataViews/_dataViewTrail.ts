// ── External Dependencies & Registrations
import { CableIcon } from '@lucide/vue';

// ── DPUse Framework
import type { ConnectionNodeConfig } from '@dpuse/dpuse-shared';

// ── Local Framework
import type { ItemStepTrail } from './_itemStepTrail';
import { constructItemPath, type DataViewConnection } from './dataViewSummary';
import type { TaskTrailContent, TaskTrailItem } from '@/components/ui/taskTrail';

// ── Types ────────────────────────────────────────────────────────────────────────────────────────────────────────────

interface DataViewTrailLabels {
    home: string; // Stands for the connection before one is chosen.
    trail: string; // Names the row for screen readers.
}

// ── Actions ──────────────────────────────────────────────────────────────────────────────────────────────────────────

// A data view's trail: its connection, then the folders down to its item, then the item. The item task passes its
// 'ItemStepTrail', which shows the open folder and the chosen item and makes the folders links. Anywhere else the saved
// item shows as text. A connection with nothing after it shows its name, because its icon alone would not say which one
// it is.
export function constructDataViewTrail(
    connection: Pick<DataViewConnection, 'icon' | 'iconDark' | 'label'> | undefined,
    savedItemConfig: ConnectionNodeConfig | undefined,
    itemStepTrail: ItemStepTrail | undefined,
    labels: DataViewTrailLabels
): TaskTrailContent {
    const folderLabels = itemStepTrail
        ? itemStepTrail.folderNodeConfigs.map((folderNodeConfig) => folderNodeConfig.label)
        : (savedItemConfig?.folderPath.split('/').filter((folderLabel) => folderLabel !== '') ?? []);
    const itemConfig = itemStepTrail ? itemStepTrail.itemConfig : savedItemConfig;

    // Index 0 is the connection's top folder and each folder follows it. The open folder is the last one and is text,
    // because opening it again would do nothing.
    const selectFolder = (index: number): (() => void) | undefined => {
        if (itemStepTrail == null || index >= folderLabels.length) return undefined;
        return (): void => {
            itemStepTrail.selectFolder(index);
        };
    };

    const connectionItem: TaskTrailItem = {
        id: 'connection',
        label: connection?.label ?? labels.home,
        ...(connection ? { configIcon: { icon: connection.icon, iconDark: connection.iconDark } } : { icon: CableIcon }),
        isLabelHidden: itemStepTrail != null || itemConfig != null || connection == null,
        select: selectFolder(0)
    };
    const folderItems = folderLabels.map((folderLabel, index): TaskTrailItem => ({ id: `folder-${String(index)}`, label: folderLabel, select: selectFolder(index + 1) }));
    const itemItems: TaskTrailItem[] = itemConfig ? [{ id: 'item', label: itemConfig.label, select: itemStepTrail?.revealItem }] : []; // On the item task, the item scrolls the list back to it.

    return {
        back: itemConfig && itemStepTrail?.backLabel != null ? { label: itemStepTrail.backLabel, select: itemStepTrail.returnToList } : undefined, // A narrow screen shows the item's preview in place of the list.
        items: [connectionItem, ...folderItems, ...itemItems],
        label: labels.trail,
        tooltip: itemConfig ? constructItemPath(itemConfig) : undefined // The path the engine uses.
    };
}
