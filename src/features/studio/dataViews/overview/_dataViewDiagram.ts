// ── Local Framework
import { assertDefined } from '@/utilities/index.ts';
import type { DataViewDiagramFocus } from '@/features/studio/dataViews/_state/dataViewFocus';

// ── Types ────────────────────────────────────────────────────────────────────────────────────────────────────────────

export interface DataViewDiagramData {
    links: { source: string; target: string }[];
    nodes: DataViewDiagramNode[];
}

export interface DataViewDiagramNode {
    id: string;
    label?: string; // Shown beside the node. The top node and the add node have none, because the icon or symbol inside each says what it is.
    level: number; // How deep the node sits, which sets its size and colour.
    typeId: DataViewDiagramNodeTypeId;
    color?: string; // The node's colour, which is that of the part of the app it belongs to. The add node keeps the look of an action.
    discColor?: string; // On the top node: a solid disc behind its icon, so it reads as where the diagram starts.
    icon?: string; // The node's own icon, drawn inside it. A data view has its item's icon, or that of its item's format.
    isAction?: boolean; // On the add node: drawn as something to do, so it stands apart from the things round it.
    isSelected?: boolean; // On the node whose details show beside the diagram.
    accessibleLabel?: string; // On a folder: its whole path, which is what screen readers call it.
    symbol?: string; // On the add node: the '+' drawn inside it.
    title?: string; // On the top node and the add node: its name, shown as its tooltip. On a folder: its whole path.
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
    folderIcon?: string | undefined; // A database for a connector that holds tables, or else a folder.
}

// A saved data view as the diagram shows it.
export interface DataViewDiagramDataView {
    id: string;
    label: string;
    icon?: string | undefined;
    connectionId: string;
    folderPath: string | undefined; // The folder or database that holds the data view's item. Undefined until an item is chosen.
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

type DataViewDiagramNodeTypeId = keyof typeof DATA_VIEW_DIAGRAM_LEVELS;

// A connection's folders as the diagram shows them. Folders that hold no data view and lead to only one folder are
// merged into the folder below them, so a long path with nothing on the way is one node.
interface DataViewDiagramFolderTree {
    rootPath: string; // The folder every data view of the connection is in or below. Its data views show on the connection itself.
    folders: Map<string, { label: string; parentPath: string | undefined }>; // Each folder node by its path, named by its path below its parent node. The top folders have no parent path.
}

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

// How deep each kind of node sits, which sets its size and colour in the diagram. A connection's top folders, its data
// views and its node for adding one sit at one level. Each folder opened sits one level deeper, and what it holds one
// level below it.
const DATA_VIEW_DIAGRAM_LEVELS = { root: 0, connector: 1, connection: 2, folder: 3, add: 3, dataView: 3 } as const;
const MAXIMUM_FOLDER_LABEL_LENGTH = 24; // The diagram's own limit, which cuts a label at its end. A folder is cut at its start instead, because the end of its path names it.
const ROOT_NODE_ID = 'data';

// ── Actions ──────────────────────────────────────────────────────────────────────────────────────────────────────────

// The user's connections and data views drilled down to one level, as a small network. The path from the top down to
// the focused connector or connection is always shown, and below it only the next level: every connector, or its one
// connection in its place, or the focused connector's connections, or the focused connection's data views with a node
// for adding one. A connection whose data views are in more than one folder or database shows those as a tree, and
// each folder opens to show its folders and data views. The siblings of the nodes on the path are left out, except the
// node for adding a data view, which stays on its connection. Every node's id is prefixed with its parent's id, so a
// node keeps its id at every level. The selected node is the selected data view, or else the focused connector, connection or folder. The
// top node is never selected, because it stands for nothing being selected.
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
    const folderTree = focusedConnectionId == null ? undefined : constructFolderTree(dataViews, focusedConnectionId);
    const focusedFolderPath = folderTree == null || focus.folderPath == null ? undefined : findShownFolderPath(folderTree, focus.folderPath);
    const shownDataViews = folderTree == null ? [] : dataViews.filter((dataView) => dataView.connectionId === focusedConnectionId && isDataViewShown(folderTree, dataView, focusedFolderPath));
    const isDataViewSelected = shownDataViews.some((dataView) => dataView.id === selectedDataViewId);

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
                isSelected: connection.id === focusedConnectionId && focusedFolderPath == null && !isDataViewSelected,
                focus: { connectorId, connectionId: connection.id }
            });
        }
    }
    if (focusedNode?.typeId !== 'connection') return data;

    // Folders ─ Shown only where they group the data views, as a connector is: the folders from the top down to the
    // focused one, and the folders in it. A data view with no item yet is in no folder, so it stays on the connection.
    // Folders come in the order their first data view is listed. A folder's node is named by its path below the node
    // above it, and its tooltip and screen-reader name give its whole path.
    const shownFolderTree = assertDefined(folderTree);
    const connectionNodeId = `${ROOT_NODE_ID}.${focusedNode.connectorId}.${focusedNode.connectionId}`;
    const focusedConnection = connections.find((connection) => connection.id === focusedNode.connectionId);
    const constructFolderNodeId = (folderPath: string | undefined): string => (folderPath == null ? connectionNodeId : `${connectionNodeId}.folder.${folderPath}`);
    const focusedFolderPaths = listFolderPathsDownTo(shownFolderTree, focusedFolderPath);
    const openFolderPaths = [...shownFolderTree.folders].filter(([, folder]) => folder.parentPath === focusedFolderPath).map(([folderPath]) => folderPath);
    for (const [index, folderPath] of [...focusedFolderPaths, ...openFolderPaths].entries()) {
        const folder = assertDefined(shownFolderTree.folders.get(folderPath));
        addNode(constructFolderNodeId(folder.parentPath), {
            id: constructFolderNodeId(folderPath),
            label: constructFolderLabel(folder.label),
            level: DATA_VIEW_DIAGRAM_LEVELS.folder + Math.min(index, focusedFolderPaths.length),
            typeId: 'folder',
            ...constructLook(focusedConnection?.folderIcon, labels.connectionColor),
            accessibleLabel: folderPath,
            title: folderPath,
            isSelected: folderPath === focusedFolderPath && !isDataViewSelected,
            focus: { connectorId: focusedNode.connectorId, connectionId: focusedNode.connectionId, folderPath }
        });
    }

    // Data Views and Add ─ The data views of the focused folder, or else of the focused connection outside any folder it
    // shows. The node that starts a new data view stays on the connection, beside its folders, because a new data view
    // chooses its item, and so its folder, after it is started.
    const dataViewParentNodeId = constructFolderNodeId(focusedFolderPath);
    for (const dataView of shownDataViews) {
        addNode(dataViewParentNodeId, {
            id: `${dataViewParentNodeId}.dataView.${dataView.id}`,
            label: dataView.label,
            level: DATA_VIEW_DIAGRAM_LEVELS.dataView + focusedFolderPaths.length,
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

// The level the diagram shows: the selected data view's connection, and its folder when the connection shows folders,
// so the data view is always in view, or else the level the URL names. A folder the connection no longer shows, such as
// one merged into another after a data view was added or deleted, falls back to the nearest folder above it that it
// does show.
export function resolveDataViewDiagramFocus(
    connections: Pick<DataViewDiagramConnection, 'connectorId' | 'id'>[],
    dataViews: Pick<DataViewDiagramDataView, 'connectionId' | 'folderPath'>[],
    urlFocus: DataViewDiagramFocus,
    selectedDataView?: Pick<DataViewDiagramDataView, 'connectionId' | 'folderPath'>
): DataViewDiagramFocus {
    const connection = selectedDataView == null ? undefined : connections.find((candidate) => candidate.id === selectedDataView.connectionId);
    const focus = connection == null ? urlFocus : { connectorId: connection.connectorId, connectionId: connection.id, folderPath: selectedDataView?.folderPath };
    const folderTree = focus.connectionId == null ? undefined : constructFolderTree(dataViews, focus.connectionId);
    return { connectorId: focus.connectorId, connectionId: focus.connectionId, folderPath: folderTree == null || focus.folderPath == null ? undefined : findShownFolderPath(folderTree, focus.folderPath) };
}

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

// A node with no icon or no colour carries no such field at all, so it is drawn in its level's own look.
// Builds the tree from the folders that hold the connection's data views. Each folder lists the folders below it that
// lead to a data view, in the order their first data view is listed. The tree starts at the deepest folder that every
// data view is in or below, because a folder above it groups nothing.
function constructFolderTree(dataViews: Pick<DataViewDiagramDataView, 'connectionId' | 'folderPath'>[], connectionId: string): DataViewDiagramFolderTree {
    const childPaths = new Map<string, Set<string>>();
    const dataViewFolderPaths = new Set<string>();
    for (const dataView of dataViews) {
        if (dataView.connectionId !== connectionId || dataView.folderPath == null) continue;
        const segments = splitFolderPath(dataView.folderPath);
        dataViewFolderPaths.add(joinFolderPath(segments));
        for (const index of segments.keys()) {
            const parentPath = joinFolderPath(segments.slice(0, index));
            const childPath = joinFolderPath(segments.slice(0, index + 1));
            childPaths.set(parentPath, (childPaths.get(parentPath) ?? new Set<string>()).add(childPath));
        }
    }

    // A folder with no data views of its own and one folder below it is merged into that folder.
    const findMergedPath = (folderPath: string): string => {
        const folderChildPaths = [...(childPaths.get(folderPath) ?? [])];
        const [onlyChildPath] = folderChildPaths;
        return folderChildPaths.length !== 1 || dataViewFolderPaths.has(folderPath) ? folderPath : findMergedPath(onlyChildPath);
    };
    const rootPath = findMergedPath('');
    const folders: DataViewDiagramFolderTree['folders'] = new Map();
    const addFolders = (parentPath: string, parentNodePath: string | undefined): void => {
        const folderChildPaths = childPaths.get(parentPath) ?? [];
        for (const childPath of folderChildPaths) {
            const folderPath = findMergedPath(childPath);
            folders.set(folderPath, { label: folderPath.slice(parentPath.length + 1), parentPath: parentNodePath });
            addFolders(folderPath, folderPath);
        }
    };
    addFolders(rootPath, undefined);
    return { rootPath, folders };
}

// The folder itself when the tree shows it, or else the nearest folder above it that the tree shows. Undefined when
// none is shown, which is the connection itself.
function findShownFolderPath(folderTree: DataViewDiagramFolderTree, folderPath: string): string | undefined {
    const segments = splitFolderPath(folderPath);
    return segments.map((_segment, index) => joinFolderPath(segments.slice(0, segments.length - index))).find((candidatePath) => folderTree.folders.has(candidatePath));
}

// The folders from the top of the tree down to the given one, which come first. None for the connection itself.
function listFolderPathsDownTo(folderTree: DataViewDiagramFolderTree, folderPath: string | undefined): string[] {
    return folderPath == null ? [] : [...listFolderPathsDownTo(folderTree, folderTree.folders.get(folderPath)?.parentPath), folderPath];
}

// A data view shows in its own folder's node. On the connection itself show the data views in the tree's top folder,
// and those with no item yet, which are in no folder.
function isDataViewShown(folderTree: DataViewDiagramFolderTree, dataView: Pick<DataViewDiagramDataView, 'folderPath'>, focusedFolderPath: string | undefined): boolean {
    return dataView.folderPath == null ? focusedFolderPath == null : joinFolderPath(splitFolderPath(dataView.folderPath)) === (focusedFolderPath ?? folderTree.rootPath);
}

// A folder is named by its path below the node above it. A long path keeps its end, which names the folder, and loses
// its start.
function constructFolderLabel(label: string): string {
    return label.length > MAXIMUM_FOLDER_LABEL_LENGTH ? `…${label.slice(-(MAXIMUM_FOLDER_LABEL_LENGTH - 1))}` : label;
}

// Every connector writes a folder's path with a slash before each name, and the top folder as the empty path. Paths are
// split and joined again so that a trailing or doubled slash cannot make one folder look like two.
function splitFolderPath(folderPath: string): string[] {
    return folderPath.split('/').filter((segment) => segment !== '');
}

function joinFolderPath(segments: string[]): string {
    return segments.map((segment) => `/${segment}`).join('');
}

function constructLook(icon: string | undefined, color: string | undefined): { color?: string; icon?: string } {
    return { ...(icon != null && icon !== '' && { icon }), ...(color != null && color !== '' && { color }) };
}
