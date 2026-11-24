// ── Local Framework
import type { DataViewDiagramFocus } from '@/features/studio/dataViews/_state/dataViewFocus';

// ── Types ────────────────────────────────────────────────────────────────────────────────────────────────────────────

export interface DataViewDiagramData {
    links: { source: string; target: string }[];
    nodes: DataViewDiagramNode[];
}

export interface DataViewDiagramNode {
    id: string;
    label?: string; // Shown beside the node. The top node and the add node have none, because the icon or symbol inside each says what it is.
    level: DataViewDiagramLevel;
    typeId: DataViewDiagramNodeTypeId;
    color?: string; // The node's colour, which is that of the part of the app it belongs to. The add node keeps the look of an action.
    discColor?: string; // On the top node: a solid disc behind its icon, so it reads as where the diagram starts.
    icon?: string; // The node's own icon, drawn inside it. A data view has its item's icon, or that of its item's format.
    isAction?: boolean; // On the add node: drawn as something to do, so it stands apart from the things round it.
    isSelected?: boolean; // On the node whose details show beside the diagram.
    symbol?: string; // On the add node: the '+' drawn inside it.
    title?: string; // On the top node and the add node: its name, shown as its tooltip.
    connectionId?: string; // On the add node: the connection a new data view is started on.
    dataViewId?: string; // On a data view node: the data view to select.
    focus?: DataViewDiagramFocus; // On a node that opens: the level a click on it shows.
}

// A connection as the diagram shows it, with its connector.
export interface DataViewDiagramConnection {
    id: string;
    label: string;
    icon?: string | undefined;
    connectorId: string;
    connectorLabel: string;
    connectorIcon?: string | undefined;
}

// A saved data view as the diagram shows it.
export interface DataViewDiagramDataView {
    id: string;
    label: string;
    icon?: string | undefined;
    connectionId: string;
}

// The top node and the add node, named in the user's language by the caller, and how the nodes look: the top node's
// icon and the solid colour behind it, and the ring colours of the connectors and connections and of the data views.
export interface DataViewDiagramLabels {
    add: string;
    root: string;
    rootIcon?: string | undefined;
    rootDiscColor?: string | undefined;
    connectionColor?: string | undefined;
    dataViewColor?: string | undefined;
}

// The connector or connection a focus opens, which is also the one selected while no data view is.
export type DataViewDiagramFocusedNode = { typeId: 'connection'; connectionId: string; connectorId: string } | { typeId: 'connector'; connectorId: string };

type DataViewDiagramLevel = (typeof DATA_VIEW_DIAGRAM_LEVELS)[DataViewDiagramNodeTypeId];
type DataViewDiagramNodeTypeId = keyof typeof DATA_VIEW_DIAGRAM_LEVELS;

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

// How deep each kind of node sits, which sets its size and colour in the diagram. A connection's data views and its
// node for adding one sit at one level.
const DATA_VIEW_DIAGRAM_LEVELS = { root: 0, connector: 1, connection: 2, add: 3, dataView: 3 } as const;
const ROOT_NODE_ID = 'data';

// ── Actions ──────────────────────────────────────────────────────────────────────────────────────────────────────────

// The user's connections and data views drilled down to one level, as a small network. The path from the top down to
// the focused connector or connection is always shown, and below it only the next level: every connector, or its one
// connection in its place, or the focused connector's connections, or the focused connection's data views with a node
// for adding one. The siblings of the nodes on the path are left out. Every node's id is prefixed with its parent's id,
// so a node keeps its id at every level. The selected node is the selected data view, or else the focused connector or
// connection. The top node is never selected, because it stands for nothing being selected.
export function constructDataViewDiagramData(
    labels: DataViewDiagramLabels,
    connections: DataViewDiagramConnection[],
    dataViews: DataViewDiagramDataView[],
    focus: DataViewDiagramFocus,
    selectedDataViewId?: string
): DataViewDiagramData {
    const rootNode: DataViewDiagramNode = {
        id: ROOT_NODE_ID,
        level: DATA_VIEW_DIAGRAM_LEVELS.root,
        typeId: 'root',
        ...constructLook(labels.rootIcon, labels.rootDiscColor),
        ...(labels.rootDiscColor != null && { discColor: labels.rootDiscColor }),
        title: labels.root,
        focus: {}
    };
    const data: DataViewDiagramData = { links: [], nodes: [rootNode] };
    const addNode = (parentId: string, node: DataViewDiagramNode): void => {
        data.nodes.push(node);
        data.links.push({ source: parentId, target: node.id });
    };
    const focusedNode = findFocusedDataViewDiagramNode(connections, focus);
    const focusedConnectionId = focusedNode?.typeId === 'connection' ? focusedNode.connectionId : undefined;
    const isDataViewSelected = dataViews.some((dataView) => dataView.id === selectedDataViewId && dataView.connectionId === focusedConnectionId);

    // Connectors and Connections ─ A connector has a node of its own only when the user has several connections to it,
    // because then it groups them. A connector with one connection is left out, and its connection hangs straight off
    // the top, so the same name is not shown twice, one above the other. The connection keeps its own colour and its
    // id either way. Connectors come in the order their first connection is listed.
    const connectorIds = new Set(connections.map((connection) => connection.connectorId));
    for (const connectorId of connectorIds) {
        if (focusedNode != null && connectorId !== focusedNode.connectorId) continue;
        const connectorConnections = connections.filter((connection) => connection.connectorId === connectorId);
        const connectorNodeId = `${ROOT_NODE_ID}.${connectorId}`;
        const connectorIsShown = connectorConnections.length > 1;
        if (connectorIsShown) {
            addNode(ROOT_NODE_ID, {
                id: connectorNodeId,
                label: connectorConnections[0]?.connectorLabel,
                level: DATA_VIEW_DIAGRAM_LEVELS.connector,
                typeId: 'connector',
                ...constructLook(connectorConnections[0]?.connectorIcon, labels.connectionColor),
                isSelected: focusedNode?.typeId === 'connector',
                focus: { connectorId }
            });
        }
        if (connectorIsShown && focusedNode == null) continue; // Its connections show once it is opened.

        for (const connection of connectorConnections) {
            if (focusedConnectionId != null && connection.id !== focusedConnectionId) continue;
            addNode(connectorIsShown ? connectorNodeId : ROOT_NODE_ID, {
                id: `${connectorNodeId}.${connection.id}`,
                label: connection.label,
                level: DATA_VIEW_DIAGRAM_LEVELS.connection,
                typeId: 'connection',
                ...constructLook(connection.icon, labels.connectionColor),
                isSelected: connection.id === focusedConnectionId && !isDataViewSelected,
                focus: { connectorId, connectionId: connection.id }
            });
        }
    }
    if (focusedNode?.typeId !== 'connection') return data;

    // Data Views and Add ─ The focused connection's data views, and a node that starts a new one on it.
    const connectionNodeId = `${ROOT_NODE_ID}.${focusedNode.connectorId}.${focusedNode.connectionId}`;
    for (const dataView of dataViews) {
        if (dataView.connectionId !== focusedNode.connectionId) continue;
        addNode(connectionNodeId, {
            id: `${connectionNodeId}.dataView.${dataView.id}`,
            label: dataView.label,
            level: DATA_VIEW_DIAGRAM_LEVELS.dataView,
            typeId: 'dataView',
            ...constructLook(dataView.icon, labels.dataViewColor),
            isSelected: dataView.id === selectedDataViewId,
            dataViewId: dataView.id
        });
    }
    addNode(connectionNodeId, {
        id: `${connectionNodeId}.add`,
        level: DATA_VIEW_DIAGRAM_LEVELS.add,
        typeId: 'add',
        isAction: true,
        symbol: '+',
        title: labels.add,
        connectionId: focusedNode.connectionId
    });
    return data;
}

// The connector or connection a focus opens. A focus that names a connection the user does not have falls back to its
// connector, and one that names a connector the user does not have, or one with no node of its own, to the top.
export function findFocusedDataViewDiagramNode(connections: Pick<DataViewDiagramConnection, 'connectorId' | 'id'>[], focus: DataViewDiagramFocus): DataViewDiagramFocusedNode | undefined {
    const { connectorId, connectionId } = focus;
    if (connectorId == null) return undefined;
    if (connectionId != null && connections.some((connection) => connection.id === connectionId && connection.connectorId === connectorId)) {
        return { typeId: 'connection', connectionId, connectorId };
    }
    return connections.filter((connection) => connection.connectorId === connectorId).length > 1 ? { typeId: 'connector', connectorId } : undefined;
}

// The level the diagram shows: the selected data view's connection, so the data view is always in view, or else the
// level the URL names.
export function resolveDataViewDiagramFocus(
    connections: Pick<DataViewDiagramConnection, 'connectorId' | 'id'>[],
    urlFocus: DataViewDiagramFocus,
    selectedDataView?: Pick<DataViewDiagramDataView, 'connectionId'>
): DataViewDiagramFocus {
    const connection = selectedDataView == null ? undefined : connections.find((candidate) => candidate.id === selectedDataView.connectionId);
    return connection == null ? urlFocus : { connectorId: connection.connectorId, connectionId: connection.id };
}

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

// A node with no icon or no colour carries no such field at all, so it is drawn in its level's own look.
function constructLook(icon: string | undefined, color: string | undefined): { color?: string; icon?: string } {
    return { ...(icon != null && icon !== '' && { icon }), ...(color != null && color !== '' && { color }) };
}
