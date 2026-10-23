<script setup lang="ts">
// ── External Dependencies & Registrations
import { BracesIcon, CableIcon, ChevronRightIcon, FileIcon, SheetIcon, SquareDashedIcon } from '@lucide/vue';
import { type Component, computed } from 'vue';

// ── DPUse Framework
import type { ConnectionNodeConfig, ConnectorItemTypeId } from '@dpuse/dpuse-shared';

// ── Local Framework
import { t } from '@/state/locale';
import { TEXT } from './DataViewSource_.json';
import { constructItemPath, type DataViewConnection } from './dataViewSummary';

// ── Static Components
import ConfigIcon from '@/components/ui/config/ConfigIcon.vue';

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

// A chosen connection or item takes the main text colour, so it stands apart from the muted text of a line with nothing
// chosen. The difference comes from the chosen lines because muted is already the lightest grey that stays readable.
const CHOSEN_CLASSES = 'text-content';

// A chosen item without an icon of its own shows its file type when it has an extension, as the item list does, and
// otherwise what kind of item it is. A table connector's items always show the table grid, even the application
// emulator's, whose tables are stored as CSV files. A connector released before it said which shows the table grid.
const ITEM_TYPE_ICONS: Record<ConnectorItemTypeId, Component> = { apiEndpoint: BracesIcon, file: FileIcon, table: SheetIcon };

// ── Options, Props, Slots & Emits ────────────────────────────────────────────────────────────────────────────────────

const { connectionId, connectionNodeConfig, dataViewConnection, isSingleLine, itemTypeId } = defineProps<{
    connectionId?: string; // The chosen connection, so one that has since gone reads as unavailable rather than as none chosen.
    connectionIsDraft?: boolean; // Dimmed until the current step saves it.
    connectionNodeConfig: ConnectionNodeConfig | undefined; // Undefined until an item is chosen.
    dataViewConnection: Pick<DataViewConnection, 'icon' | 'iconDark' | 'label'> | undefined; // Undefined until a connection is chosen, or once it has gone.
    isSingleLine?: boolean; // Both on one line where there is room. The item only shows once there is a connection to choose it from.
    itemIsDraft?: boolean; // Dimmed until the current step saves it.
    itemTypeId?: ConnectorItemTypeId; // The connector's kind of item, which picks the icon of an item without its own.
}>();

// ── Derived State ────────────────────────────────────────────────────────────────────────────────────────────────────

const connectionLabel = computed(() => dataViewConnection?.label ?? t(TEXT, connectionId == null ? 'connection.none.text' : 'connection.unavailable.text'));
const itemIsShown = computed(() => !isSingleLine || dataViewConnection != null || connectionNodeConfig != null);
const itemIconIsPresent = computed(() => [connectionNodeConfig?.icon, connectionNodeConfig?.iconDark].some((svg) => svg != null && svg !== ''));
// Messages name the connector's kind of item, e.g. 'No file', and fall back to 'item' for a connector released before
// it said which.
const itemSubject = computed(() => itemTypeId ?? 'item');
const itemTypeIcon = computed(() => {
    if (itemTypeId === 'table') return SheetIcon;
    return itemTypeId ? ITEM_TYPE_ICONS[itemTypeId] : SheetIcon;
});

// The item's folder path then its label, which a connector can set apart from the name the engine uses, e.g. to show a
// file as a table. Split before the label, so a long path is cut in the middle: the start of its folder path and the
// whole label stay in view. The last slash goes with the label, so it still shows when the folder path is cut. The
// tooltip gives the path the engine uses.
const itemPathParts = computed(() => {
    if (!connectionNodeConfig) return;
    return { folderPath: connectionNodeConfig.folderPath, label: `/${connectionNodeConfig.label}`, path: constructItemPath(connectionNodeConfig) };
});
</script>

<template>
    <!-- One line each for the connection and the item, or both on one line, where the connection takes at most half of
         it. Every line starts with an icon, an outline one when nothing is chosen yet, so the text always lines up. The
         text size comes from where it is used. -->
    <div class="flex min-w-0 whitespace-nowrap text-muted" :class="isSingleLine ? 'items-center gap-x-1' : 'flex-col gap-y-1'" data-region="DataViewSource">
        <!-- Connection -->
        <div
            class="flex min-h-4 min-w-0 items-center gap-x-2"
            :class="{ 'max-w-1/2 flex-none': isSingleLine, 'opacity-60': connectionIsDraft, [CHOSEN_CLASSES]: dataViewConnection }"
        >
            <ConfigIcon v-if="dataViewConnection" class="size-5" :icon="dataViewConnection.icon" :icon-dark="dataViewConnection.iconDark" />
            <CableIcon v-else aria-hidden="true" class="size-5 flex-none" :stroke-width="1.5" />
            <span class="min-w-0 truncate" :title="dataViewConnection?.label">{{ connectionLabel }}</span>
        </div>

        <!-- Separator ─ On one line the item's icon alone does not show where the connection ends. A chevron does, and
             reads as a breadcrumb, because the item sits inside the connection. -->
        <ChevronRightIcon v-if="isSingleLine && itemIsShown" aria-hidden="true" class="size-4 flex-none" :stroke-width="1.5" />

        <!-- Item -->
        <div v-if="itemIsShown" class="flex min-h-4 min-w-0 items-center gap-x-2" :class="{ 'opacity-60': itemIsDraft, [CHOSEN_CLASSES]: connectionNodeConfig }">
            <template v-if="connectionNodeConfig && itemPathParts">
                <ConfigIcon v-if="itemIconIsPresent" class="size-5" :icon="connectionNodeConfig.icon" :icon-dark="connectionNodeConfig.iconDark" />
                <component :is="itemTypeIcon" v-else aria-hidden="true" class="size-5 flex-none" :stroke-width="1.5" />
                <!-- The folder path is cut first, down to its ellipsis, and the label only once it alone is too long. -->
                <span class="flex min-w-0" :title="itemPathParts.path">
                    <span class="min-w-0 truncate">{{ itemPathParts.folderPath }}</span>
                    <span class="max-w-full shrink-0 truncate">{{ itemPathParts.label }}</span>
                </span>
            </template>
            <template v-else>
                <SquareDashedIcon aria-hidden="true" class="size-5 flex-none" :stroke-width="1.5" />
                <span class="min-w-0 truncate">{{ t(TEXT, `${itemSubject}.none.text`) }}</span>
            </template>
        </div>
    </div>
</template>
