<script setup lang="ts">
// The user's connections and data views as a diagram that is drilled down one level at a time. A click on a connector,
// a connection or a data view selects it, which shows its details beside the diagram, and a connector or connection
// also opens to show what it holds. The '+' node is the one node that is an action: it starts a new data view.

// ── External Dependencies & Registrations
import { computed } from 'vue';
import { type RouteLocationRaw, useRoute, useRouter } from 'vue-router';

// ── DPUse Framework
import { localiseConfig } from '@dpuse/dpuse-shared';
import type { ConnectorItemTypeId, DataViewConfig, LocalisedConfig } from '@dpuse/dpuse-shared';

// ── Local Framework
import { connectionLocalisedConfigs } from '@/state/configs';
import { DATA_FORMAT_ICON_CONFIGS } from '@/features/studio/dataViews/_components/dataFormatIcons';
import { ignoreReportedNavigationFailure } from '@/router';
import { resolveAppearanceIcon } from '@/state/appearance';
import { TEXT } from './DataViewDiagram_.json';
import { constructDataViewDiagramData, type DataViewDiagramNode, resolveDataViewDiagramFocus } from './_dataViewDiagram';
import { constructDataViewsViewRoute, isDataViewUntitled } from '@/features/studio/dataViews/_state/dataViews';
import { constructRingColor, readIconColor, useStudioOptions } from '@/features/studio/options/useStudioOptions';
import { type DataViewDiagramFocus, readDataViewDiagramFocus } from '@/features/studio/dataViews/_state/dataViewFocus';
import { localeId, t } from '@/state/locale';

// ── Static Components
import NetworkDiagram from '@/components/ui/NetworkDiagram.vue';

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

const DATA_VIEWS_OPTION_ID = 'dataViews'; // The studio option this screen belongs to, whose icon and colour the top node takes.
// A table or API endpoint has no format, so it shows the icon of its kind that its card shows: Lucide 'sheet' and
// 'braces', as markup because the diagram draws icons from SVG strings. They take the DPUse green and the stroke of the
// delimited-text format icon, as on the card.
const ITEM_TYPE_ICONS: Record<Exclude<ConnectorItemTypeId, 'file'>, string> = {
    apiEndpoint:
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#488f86" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3H7a2 2 0 0 0-2 2v5a2 2 0 0 1-2 2 2 2 0 0 1 2 2v5c0 1.1.9 2 2 2h1"/><path d="M16 21h1a2 2 0 0 0 2-2v-5c0-1.1.9-2 2-2a2 2 0 0 1-2-2V5a2 2 0 0 0-2-2h-1"/></svg>',
    table: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#488f86" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><line x1="3" x2="21" y1="9" y2="9"/><line x1="3" x2="21" y1="15" y2="15"/><line x1="9" x2="9" y1="9" y2="21"/><line x1="15" x2="15" y1="9" y2="21"/></svg>'
};
const ROOT_ICON_COLOR = '#ffffff'; // The top node's icon, on the solid data views colour.
const SETUP_OPTION_ID = 'setup'; // The studio option whose colour every node below the top one, and every line, takes, so only the top node stands out.

// ── Options, Props, Slots & Emits ────────────────────────────────────────────────────────────────────────────────────

const { dataViewLocalisedConfigs, selectedDataViewId } = defineProps<{
    dataViewLocalisedConfigs: LocalisedConfig<DataViewConfig>[];
    selectedDataViewId: string | undefined;
}>();
const emit = defineEmits<{
    add: [connectionId: string]; // Start a new data view on the connection.
    select: [dataViewId: string];
}>();

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

const route = useRoute();
const router = useRouter();
const studioOptionLocalisedConfigs = useStudioOptions();

// ── Derived State ────────────────────────────────────────────────────────────────────────────────────────────────────

// ── Connections and Data Views ─ As the diagram shows them, named in the user's language, with the icon for the
// light or dark appearance.
const diagramConnections = computed(() =>
    connectionLocalisedConfigs.value.map((config) => {
        const connectorLocalisedConfig = localiseConfig(config.connectorConfig, localeId.value);
        return {
            id: config.id,
            label: config.label,
            icon: resolveAppearanceIcon(config.icon, config.iconDark),
            connectorId: config.connectorConfig.id,
            connectorLabel: connectorLocalisedConfig.label,
            connectorIcon: resolveAppearanceIcon(connectorLocalisedConfig.icon, connectorLocalisedConfig.iconDark)
        };
    })
);
const diagramDataViews = computed(() =>
    dataViewLocalisedConfigs.map((config) => ({ id: config.id, label: resolveDataViewLabel(config), icon: resolveDataViewIcon(config), connectionId: config.connectionId }))
);
const dataViewsIcon = computed(() => {
    const dataViewsOption = studioOptionLocalisedConfigs.value.find((config) => config.id === DATA_VIEWS_OPTION_ID);
    return resolveAppearanceIcon(dataViewsOption?.icon, dataViewsOption?.iconDark);
});
const diagramLabels = computed(() => {
    const setupOption = studioOptionLocalisedConfigs.value.find((config) => config.id === SETUP_OPTION_ID);
    const dataViewsColor = readIconColor(dataViewsIcon.value);
    const ringColor = constructRingColor(readIconColor(resolveAppearanceIcon(setupOption?.icon, setupOption?.iconDark)));

    // The top node is the data views icon in white on the data views colour itself, which is as light as a background
    // can be with a white icon still clear on it (3.6:1). Its icon is the option's own, redrawn in white.
    return {
        add: t(TEXT, 'add.label'),
        root: t(TEXT, 'root.label'),
        rootIcon: dataViewsColor == null ? dataViewsIcon.value : dataViewsIcon.value?.replaceAll(dataViewsColor, () => ROOT_ICON_COLOR),
        rootDiscColor: dataViewsColor,
        connectionColor: ringColor,
        dataViewColor: ringColor
    };
});

// ── Focus ─ How far the diagram has been drilled down: to the selected data view's connection, or else the level the
// URL names, so reload, links and back/forward all land on the same level. Each part is read by itself, because
// selecting a data view changes the URL but not the level, and the diagram must then stay as drawn.
const selectedDiagramDataView = computed(() => diagramDataViews.value.find((dataView) => dataView.id === selectedDataViewId));
const focus = computed(() => resolveDataViewDiagramFocus(diagramConnections.value, readDataViewDiagramFocus(route.params), selectedDiagramDataView.value));
const focusedConnectorId = computed(() => focus.value.connectorId);
const focusedConnectionId = computed(() => focus.value.connectionId);

// ── Diagram ─ The level the focus asks for, with the selected node marked.
const diagramData = computed(() =>
    constructDataViewDiagramData(
        diagramLabels.value,
        diagramConnections.value,
        diagramDataViews.value,
        { connectorId: focusedConnectorId.value, connectionId: focusedConnectionId.value },
        selectedDiagramDataView.value?.id
    )
);

// ── Event Handlers ───────────────────────────────────────────────────────────────────────────────────────────────────

// A data view is selected. The add node starts a new data view on its connection. Any other node is selected and
// opened, which shows the level below it and hides its siblings. A node above the open level goes back up to it, and
// the top node clears the selection. The node already selected changes nothing.
function handleClickNode(node: DataViewDiagramNode): void {
    if (node.typeId === 'dataView' && node.dataViewId != null) emit('select', node.dataViewId);
    else if (node.typeId === 'add' && node.connectionId != null) emit('add', node.connectionId);
    else if (node.focus && (selectedDiagramDataView.value != null || !isSameFocus(node.focus, focus.value))) focusOn(node.focus);
}

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

// A push, so the browser's back button returns to the node selected before.
function focusOn(newFocus: DataViewDiagramFocus): void {
    void ignoreReportedNavigationFailure(router.push(constructFocusRoute(newFocus)));
}

// No data view stays selected, because the connector or connection of the level is selected in its place.
function constructFocusRoute(newFocus: DataViewDiagramFocus): RouteLocationRaw {
    return constructDataViewsViewRoute('diagram', route.query, { focus: newFocus });
}

function isSameFocus(left: DataViewDiagramFocus, right: DataViewDiagramFocus): boolean {
    return left.connectorId === right.connectorId && left.connectionId === right.connectionId;
}

// A data view the user has not named yet is named after its item, so two of them on one connection can be told
// apart without opening each. One with no item yet keeps the name it was given.
function resolveDataViewLabel(dataViewLocalisedConfig: LocalisedConfig<DataViewConfig>): string {
    const { connectionNodeConfig, label } = dataViewLocalisedConfig;
    return connectionNodeConfig != null && isDataViewUntitled(label) ? connectionNodeConfig.label : label;
}

// A data view shows what kind of item it reads, as its card does: the item's own icon, or else the icon of a file's
// format or of a table's or API endpoint's kind. One with none of these, such as a data view with no item chosen yet or
// a file not yet previewed, shows the data views icon, so every node has an icon and is the same size.
function resolveDataViewIcon(dataViewLocalisedConfig: LocalisedConfig<DataViewConfig>): string | undefined {
    const { connectionId, connectionNodeConfig, readingConfig } = dataViewLocalisedConfig;
    const itemIcon = resolveAppearanceIcon(connectionNodeConfig?.icon, connectionNodeConfig?.iconDark);
    if (itemIcon != null && itemIcon !== '') return itemIcon;

    const itemTypeId = connectionLocalisedConfigs.value.find((config) => config.id === connectionId)?.connectorConfig.itemTypeId; // Undefined when the data view's connection is gone.
    if (itemTypeId == null) return dataViewsIcon.value;
    if (itemTypeId !== 'file') return connectionNodeConfig == null ? dataViewsIcon.value : ITEM_TYPE_ICONS[itemTypeId];
    const dataFormatId = readingConfig?.dataFormatId;
    if (dataFormatId == null || dataFormatId === 'unknown') return dataViewsIcon.value;
    const formatIconConfig = DATA_FORMAT_ICON_CONFIGS[dataFormatId];
    return resolveAppearanceIcon(formatIconConfig.icon, formatIconConfig.iconDark);
}
</script>

<template>
    <div class="flex min-h-0 min-w-0 flex-1 flex-col" data-region="DataViewDiagram">
        <!-- The lines take the nodes' ring colour, so the diagram reads as one drawing. -->
        <NetworkDiagram :data="diagramData" :label="t(TEXT, 'diagram.aria')" :link-color="diagramLabels.dataViewColor" @node-click="handleClickNode" />
    </div>
</template>
