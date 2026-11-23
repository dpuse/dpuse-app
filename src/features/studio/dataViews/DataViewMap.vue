<script setup lang="ts">
// The user's connections and data views as a diagram that is drilled down one level at a time. A click on a connector,
// a connection or a data view selects it, which shows its details beside the diagram, and a connector or connection
// also opens to show what it holds. The '+' node is the one node that is an action: it starts a new data view.

// ── External Dependencies & Registrations
import { computed } from 'vue';
import { type RouteLocationRaw, useRoute, useRouter } from 'vue-router';

// ── DPUse Framework
import { localiseConfig } from '@dpuse/dpuse-shared';
import type { DataViewConfig, LocalisedConfig } from '@dpuse/dpuse-shared';

// ── Local Framework
import { appearanceIsDark } from '@/state/appearance';
import type { BreadcrumbConfig } from '@/composables/useBreadcrumbs';
import { connectionLocalisedConfigs } from '@/state/configs';
import { DATA_FORMAT_ICON_CONFIGS } from './_dataFormatIcons';
import { ignoreReportedNavigationFailure } from '@/router';
import { TEXT } from './DataViewMap_.json';
import { useStudioOptions } from '@/features/studio/options/useStudioOptions';
import { constructDataViewMapData, type DataViewMapFocus, type DataViewMapNode, readDataViewMapFocus, resolveDataViewMapFocus } from './_dataViewMap';
import { localeId, t } from '@/state/locale';

// ── Static Components
import Breadcrumbs from '@/components/ui/Breadcrumbs.vue';
import NetworkDiagram from '@/components/ui/NetworkDiagram.vue';

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

const DATA_VIEWS_OPTION_ID = 'dataViews'; // The studio option this screen belongs to, whose icon the top node shows and whose colour data views take.
const SETUP_OPTION_ID = 'setup'; // The studio option connectors and connections are set up in, whose colour they and the top node take.

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
const mapConnections = computed(() =>
    connectionLocalisedConfigs.value.map((config) => {
        const connectorLocalisedConfig = localiseConfig(config.connectorConfig, localeId.value);
        return {
            id: config.id,
            label: config.label,
            icon: resolveIcon(config.icon, config.iconDark),
            connectorId: config.connectorConfig.id,
            connectorLabel: connectorLocalisedConfig.label,
            connectorIcon: resolveIcon(connectorLocalisedConfig.icon, connectorLocalisedConfig.iconDark)
        };
    })
);
const mapDataViews = computed(() =>
    dataViewLocalisedConfigs.map((config) => ({ id: config.id, label: config.label, icon: resolveDataViewIcon(config), connectionId: config.connectionId }))
);
const mapLabels = computed(() => {
    const dataViewsOption = studioOptionLocalisedConfigs.value.find((config) => config.id === DATA_VIEWS_OPTION_ID);
    const setupOption = studioOptionLocalisedConfigs.value.find((config) => config.id === SETUP_OPTION_ID);
    return {
        add: t(TEXT, 'add.label'),
        root: t(TEXT, 'root.label'),
        rootIcon: resolveIcon(dataViewsOption?.icon, dataViewsOption?.iconDark),
        connectionColor: readIconColor(resolveIcon(setupOption?.icon, setupOption?.iconDark)),
        dataViewColor: readIconColor(resolveIcon(dataViewsOption?.icon, dataViewsOption?.iconDark))
    };
});

// ── Focus ─ How far the diagram has been drilled down: to the selected data view's connection, or else the level the
// URL names, so reload, links and back/forward all land on the same level. Each part is read by itself, because
// selecting a data view changes the URL but not the level, and the diagram must then stay as drawn.
const selectedMapDataView = computed(() => mapDataViews.value.find((dataView) => dataView.id === selectedDataViewId));
const focus = computed(() => resolveDataViewMapFocus(mapConnections.value, readDataViewMapFocus(route.query), selectedMapDataView.value));
const focusedConnectorId = computed(() => focus.value.connectorId);
const focusedConnectionId = computed(() => focus.value.connectionId);

// ── Diagram ─ The level the focus asks for, with the selected node marked.
const mapData = computed(() =>
    constructDataViewMapData(
        mapLabels.value,
        mapConnections.value,
        mapDataViews.value,
        { connectorId: focusedConnectorId.value, connectionId: focusedConnectionId.value },
        selectedMapDataView.value?.id
    )
);

// ── Breadcrumbs ─ The way back up: every level from the top down to the selected node. The last one is where the user
// is, so it is not a link. None at the top, where the one crumb would only repeat the top node.
const breadcrumbs = computed((): BreadcrumbConfig[] => {
    const levelNodes = mapData.value.nodes.filter((node) => node.focus != null && isOnFocusPath(node.focus));
    const levelCrumbs = levelNodes.map((node) => ({ id: node.id, label: node.label ?? '', to: constructFocusRoute(node.focus ?? {}) }));
    const selectedDataViewNode = mapData.value.nodes.find((node) => node.typeId === 'dataView' && node.isSelected === true);
    const crumbs = selectedDataViewNode ? [...levelCrumbs, { id: selectedDataViewNode.id, label: selectedDataViewNode.label ?? '' }] : levelCrumbs;
    return crumbs.length > 1 ? crumbs : [];
});

// ── Event Handlers ───────────────────────────────────────────────────────────────────────────────────────────────────

// A data view is selected. The add node starts a new data view on its connection. Any other node is selected and
// opened, which shows the level below it and hides its siblings. A node above the open level goes back up to it, and
// the top node clears the selection. The node already selected changes nothing.
function handleClickNode(node: DataViewMapNode): void {
    if (node.typeId === 'dataView' && node.dataViewId != null) emit('select', node.dataViewId);
    else if (node.typeId === 'add' && node.connectionId != null) emit('add', node.connectionId);
    else if (node.focus && (selectedMapDataView.value != null || !isSameFocus(node.focus, focus.value))) focusOn(node.focus);
}

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

// A push, so the browser's back button returns to the node selected before.
function focusOn(newFocus: DataViewMapFocus): void {
    void ignoreReportedNavigationFailure(router.push(constructFocusRoute(newFocus)));
}

// No data view stays selected, because the connector or connection of the level is selected in its place. A part of
// the focus that is not set is left out of the URL.
function constructFocusRoute(newFocus: DataViewMapFocus): RouteLocationRaw {
    const query = { ...route.query, dvConnector: newFocus.connectorId, dvConnection: newFocus.connectionId };
    return { name: 'dataViews', params: { dataViewId: undefined }, query };
}

function isSameFocus(left: DataViewMapFocus, right: DataViewMapFocus): boolean {
    return left.connectorId === right.connectorId && left.connectionId === right.connectionId;
}

// A level is on the way down to the one shown when the focus agrees with every part it sets.
function isOnFocusPath(nodeFocus: DataViewMapFocus): boolean {
    const { connectorId, connectionId } = focus.value;
    return (nodeFocus.connectorId == null || nodeFocus.connectorId === connectorId) && (nodeFocus.connectionId == null || nodeFocus.connectionId === connectionId);
}

// A data view shows what kind of item it reads, as its card does: the item's own icon, or else, for a file, the icon of
// its format. One with neither, such as a table or a data view with no item chosen yet, shows the data views icon, so
// every node has an icon and is the same size.
function resolveDataViewIcon(dataViewLocalisedConfig: LocalisedConfig<DataViewConfig>): string | undefined {
    const { connectionId, connectionNodeConfig, readingConfig } = dataViewLocalisedConfig;
    const itemIcon = resolveIcon(connectionNodeConfig?.icon, connectionNodeConfig?.iconDark);
    if (itemIcon != null && itemIcon !== '') return itemIcon;

    const itemTypeId = connectionLocalisedConfigs.value.find((config) => config.id === connectionId)?.connectorConfig.itemTypeId;
    const dataFormatId = readingConfig?.dataFormatId;
    if (itemTypeId !== 'file' || dataFormatId == null || dataFormatId === 'unknown') return mapLabels.value.rootIcon;
    const formatIconConfig = DATA_FORMAT_ICON_CONFIGS[dataFormatId];
    return resolveIcon(formatIconConfig.icon, formatIconConfig.iconDark);
}

// An option's colour is the one its icon is drawn in, because the option bar's configs hold no colour of their own.
// A node then matches the option's button in the bar without the colour being written down twice.
function readIconColor(icon: string | undefined): string | undefined {
    return icon == null ? undefined : /stroke="(#[\da-f]{3,8})"/i.exec(icon)?.[1];
}

// The diagram draws one icon, so it is given the one for the current appearance. The dark one falls back to the light.
function resolveIcon(icon: null | string | undefined, iconDark: null | string | undefined): string | undefined {
    return (appearanceIsDark.value ? (iconDark ?? icon) : icon) ?? undefined;
}
</script>

<template>
    <div class="flex min-h-0 min-w-0 flex-1 flex-col" data-region="DataViewMap">
        <!-- Path ─ Says what is selected and leads back up. Its row keeps its height at the top level, where it is empty,
             so the diagram does not move down when the first node is opened. -->
        <div class="h-8 flex-none px-page pt-2 text-sm">
            <nav v-if="breadcrumbs.length > 0" :aria-label="t(TEXT, 'breadcrumbs.aria')">
                <Breadcrumbs disable-last :items="breadcrumbs" />
            </nav>
        </div>

        <NetworkDiagram :data="mapData" :label="t(TEXT, 'diagram.aria')" @node-click="handleClickNode" />
    </div>
</template>
