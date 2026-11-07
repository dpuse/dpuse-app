// ── External Dependencies & Registrations
import { onScopeDispose, shallowRef, watch } from 'vue';

// ── DPUse Framework
import type { ConnectionNodeConfig } from '@dpuse/dpuse-shared';

// ── Types ────────────────────────────────────────────────────────────────────────────────────────────────────────────

export interface ItemStepTrail {
    backLabel: string | undefined; // Set while a narrow screen shows the item's preview in place of the list, so the trail gives way to one button back.
    folderNodeConfigs: ConnectionNodeConfig[]; // The open folder and the folders above it.
    itemConfig: ConnectionNodeConfig | undefined; // The chosen item, saved or not.
    returnToList: () => void;
    revealItem: () => void; // Scrolls the list back to the chosen item.
    selectFolder: (index: number) => void; // 0 is the connection's top folder, 1 the first folder below it, and so on.
}

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

// The data view header always shows the trail, so it stays in place between steps. The item step fills this in, so its
// folders can be opened from the trail. Undefined on every other step, where the trail shows the saved item.
export const itemStepTrail = shallowRef<ItemStepTrail>();

// ── Composables ──────────────────────────────────────────────────────────────────────────────────────────────────────

export function useItemStepTrail(constructTrail: () => ItemStepTrail): void {
    watch(constructTrail, (newTrail) => (itemStepTrail.value = newTrail), { immediate: true });
    onScopeDispose(() => (itemStepTrail.value = undefined));
}
