<script setup lang="ts">
// ── External Dependencies & Registrations
import { computed } from 'vue';
import type { RouteLocationRaw } from 'vue-router';
import { CableIcon, ChevronRightIcon, DatabaseIcon, FolderIcon, SquareDashedIcon } from '@lucide/vue';

// ── DPUse Framework
import type { ConnectionNodeConfig, ConnectorItemTypeId, DataFormatId } from '@dpuse/dpuse-shared';

// ── Local Framework
import { resolveItemIcon } from './itemIcon';
import { t } from '@/state/locale';
import { TEXT } from './DataViewSource_.json';
import { constructItemPath, type DataViewConnection } from '@/features/studio/dataViews/_state/dataViewSummary';

// ── Static Components
import ConfigIcon from '@/components/ui/config/ConfigIcon.vue';
import StepLink from './StepLink.vue';

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

// A chosen connection or item takes the main text colour, so it stands apart from the muted text of a line with nothing
// chosen. The difference comes from the chosen lines because muted is already the lightest grey that stays readable.
const CHOSEN_CLASSES = 'text-content';

// A line's link sits at its right end, so the links line up down the lines and never move with the text. It keeps its
// full width, and the text beside it is cut short first.
const LINK_CLASSES = 'ml-auto pl-4';

// ── Options, Props, Slots & Emits ────────────────────────────────────────────────────────────────────────────────────

// A link at the end of a line, such as to the step that changes what the line names.
interface SourceLink {
    label: string; // What going to the step is for, which screen readers hear.
    stepNumber: number;
    to: RouteLocationRaw;
}

const { connectionId, connectionNodeConfig, dataFormatId, dataViewConnection, isFolderLineShown, isSingleLine, itemTypeId, store } = defineProps<{
    connectionId?: string; // The chosen connection, so one that has since gone reads as unavailable rather than as none chosen.
    connectionIsDraft?: boolean; // Dimmed until the current step saves it.
    connectionLink?: SourceLink | undefined; // At the end of the connection's line.
    connectionNodeConfig: ConnectionNodeConfig | undefined; // Undefined until an item is chosen.
    dataFormatId?: DataFormatId; // The item's format, once it has been previewed, which picks its format icon.
    dataViewConnection: Pick<DataViewConnection, 'icon' | 'iconDark' | 'label'> | undefined; // Undefined until a connection is chosen, or once it has gone.
    isFolderLineShown?: boolean; // The item's folder on a line of its own, and the item's name alone on the next, where a full list of details follows.
    isSingleLine?: boolean; // Both on one line where there is room. The item only shows once there is a connection to choose it from.
    itemIsDraft?: boolean; // Dimmed until the current step saves it.
    itemLink?: SourceLink | undefined; // At the end of the item's line.
    itemTypeId?: ConnectorItemTypeId; // The connector's kind of item, which picks the icon of an item without its own.
    store?: { icon?: string | null; iconDark?: string | null; isLoaded: boolean; label: string } | undefined; // Where the records are loaded, on a line of its own after the item, and whether they are there yet.
    storeLink?: SourceLink | undefined; // At the end of the store's line.
}>();

// ── Derived State ────────────────────────────────────────────────────────────────────────────────────────────────────

const connectionLabel = computed(() => dataViewConnection?.label ?? t(TEXT, connectionId == null ? 'connection.none.text' : 'connection.unavailable.text'));
const itemIsShown = computed(() => !isSingleLine || dataViewConnection != null || connectionNodeConfig != null);
// Messages name the connector's kind of item, e.g. 'No file', and fall back to 'item' for a connector released before
// it said which.
const itemSubject = computed(() => itemTypeId ?? 'item');
const itemIcon = computed(() => (connectionNodeConfig ? resolveItemIcon(connectionNodeConfig, dataFormatId, itemTypeId) : undefined));

// The item's folder path then its label, which a connector can set apart from the name the engine uses, e.g. to show a
// file as a table. Split before the label, so a long path is cut in the middle: the start of its folder path and the
// whole label stay in view. The last slash goes with the label, so it still shows when the folder path is cut. The
// tooltip gives the path the engine uses.
const itemPathParts = computed(() => {
    if (!connectionNodeConfig) return;
    return { folderPath: connectionNodeConfig.folderPath, label: `/${connectionNodeConfig.label}`, path: constructItemPath(connectionNodeConfig) };
});

// ── Folder Line ─ The item's name is the one the engine uses, with any extension, such as a DBnomics series code. An item
// at the top of its connection has an empty folder path, shown as the top folder.
const folderLineIsShown = computed(() => isFolderLineShown && !isSingleLine && connectionNodeConfig != null);
const itemFolderPath = computed(() => (connectionNodeConfig?.folderPath == null || connectionNodeConfig.folderPath === '' ? '/' : connectionNodeConfig.folderPath));
const itemName = computed(() => {
    if (!connectionNodeConfig) return;
    return connectionNodeConfig.extension == null ? connectionNodeConfig.name : `${connectionNodeConfig.name}.${connectionNodeConfig.extension}`;
});

// ── Store Line ─ Only below a separate folder line, as the last part of where the data view's records go.
const storeLineIsShown = computed(() => store != null && isFolderLineShown && !isSingleLine);
const storeIconIsPresent = computed(() => [store?.icon, store?.iconDark].some((svg) => svg != null && svg !== ''));
const storeText = computed(() => {
    if (store == null) return '';
    return store.isLoaded ? store.label : t(TEXT, 'store.notLoaded.text', { store: store.label });
});
</script>

<template>
    <!-- One line each for the connection and the item, and for the folder and the store where a full document follows,
         or the connection and the item on one line, where the connection takes at most half of it. A line ends in a link
         only where the caller gives it somewhere to go, such as the step that changes it. Every line starts with an icon, an outline one when nothing is chosen yet, so the text always lines up. The
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
            <StepLink v-if="connectionLink" :class="LINK_CLASSES" :label="connectionLink.label" :step-number="connectionLink.stepNumber" :to="connectionLink.to" />
        </div>

        <!-- Separator ─ On one line the item's icon alone does not show where the connection ends. A chevron does, and
             reads as a breadcrumb, because the item sits inside the connection. -->
        <ChevronRightIcon v-if="isSingleLine && itemIsShown" aria-hidden="true" class="size-4 flex-none" :stroke-width="1.75" />

        <!-- Folder -->
        <div v-if="folderLineIsShown" class="flex min-h-4 min-w-0 items-center gap-x-2" :class="[CHOSEN_CLASSES, { 'opacity-60': itemIsDraft }]">
            <FolderIcon aria-hidden="true" class="size-5 flex-none" :stroke-width="1.5" />
            <span class="min-w-0 truncate" :title="itemFolderPath">{{ itemFolderPath }}</span>
        </div>

        <!-- Item ─ Dimmed while unsaved, and always when there is none, so 'No file' never looks like a chosen item. Only
             the icon and text are dimmed, so the link at the end never looks disabled. -->
        <div v-if="itemIsShown" class="flex min-h-4 min-w-0 items-center" :class="{ [CHOSEN_CLASSES]: connectionNodeConfig }">
            <span class="flex min-w-0 items-center gap-x-2" :class="{ 'opacity-60': itemIsDraft || !connectionNodeConfig }">
            <template v-if="connectionNodeConfig && itemPathParts && itemIcon">
                <ConfigIcon v-if="itemIcon.configIcon" class="size-5" :icon="itemIcon.configIcon.icon" :icon-dark="itemIcon.configIcon.iconDark" />
                <component :is="itemIcon.icon" v-else aria-hidden="true" class="size-5 flex-none" :class="itemIcon.iconClass" :stroke-width="itemIcon.iconStrokeWidth" />
                <span v-if="folderLineIsShown" class="min-w-0 truncate" :title="itemPathParts.path">{{ itemName }}</span>
                <!-- The folder path is cut first, down to its ellipsis, and the label only once it alone is too long. -->
                <span v-else class="flex min-w-0" :title="itemPathParts.path">
                    <span class="min-w-0 truncate">{{ itemPathParts.folderPath }}</span>
                    <span class="max-w-full shrink-0 truncate">{{ itemPathParts.label }}</span>
                </span>
            </template>
            <template v-else>
                <SquareDashedIcon aria-hidden="true" class="size-5 flex-none" :stroke-width="1.5" />
                <span class="min-w-0 truncate">{{ t(TEXT, `${itemSubject}.none.text`) }}</span>
            </template>
            </span>
            <StepLink v-if="itemLink" :class="LINK_CLASSES" :label="itemLink.label" :step-number="itemLink.stepNumber" :to="itemLink.to" />
        </div>

        <!-- Store -->
        <div v-if="storeLineIsShown && store" class="flex min-h-4 min-w-0 items-center gap-x-2" :class="CHOSEN_CLASSES">
            <ConfigIcon v-if="storeIconIsPresent" class="size-5" :icon="store.icon" :icon-dark="store.iconDark" />
            <DatabaseIcon v-else aria-hidden="true" class="size-5 flex-none" :stroke-width="1.5" />
            <span class="min-w-0 truncate" :title="storeText">{{ storeText }}</span>
            <StepLink v-if="storeLink" :class="LINK_CLASSES" :label="storeLink.label" :step-number="storeLink.stepNumber" :to="storeLink.to" />
        </div>
    </div>
</template>
