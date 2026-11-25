// ── External Dependencies & Registrations
import { describe, expect, it } from 'vitest';

// ── Local Framework
import { constructDataViewDiagramData } from '@/features/studio/dataViews/overview/_dataViewDiagram';
import { findFocusedDataViewDiagramNode } from '@/features/studio/dataViews/overview/_dataViewDiagram';
import { listDataViewDiagramFolderPaths } from '@/features/studio/dataViews/overview/_dataViewDiagram';
import { resolveDataViewDiagramFocus } from '@/features/studio/dataViews/overview/_dataViewDiagram';

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

const LABELS = { add: 'Add', open: (name: string): string => `Open ${name}`, root: 'Data Views' };

// Dropbox has two connections, as a connector can, and SQLite one.
const CONNECTIONS = [
    { id: 'personal', label: 'Personal', connectorId: 'dropbox', connectorLabel: 'Dropbox' },
    { id: 'work', label: 'Work', connectorId: 'dropbox', connectorLabel: 'Dropbox' },
    { id: 'local', label: 'Local', connectorId: 'sqlite', connectorLabel: 'SQLite' }
];

const DATA_VIEWS = [
    { id: 'a', label: 'Employees', connectionId: 'work', folderPath: '/hr' },
    { id: 'b', label: 'Holidays', connectionId: 'personal', folderPath: '/hr' }
];

// The work connection's data views are in two folders, and one has no item yet, so it is in none.
const FOLDER_DATA_VIEWS = [
    { id: 'a', label: 'Employees', connectionId: 'work', folderPath: '/hr' },
    { id: 'c', label: 'Sales', connectionId: 'work', folderPath: '/finance/2026' },
    { id: 'd', label: 'Payroll', connectionId: 'work', folderPath: '/hr' },
    { id: 'e', label: 'Untitled', connectionId: 'work', folderPath: undefined }
];

const WORK_FOCUS = { connectorId: 'dropbox', connectionId: 'work' };
const HR_FOCUS = { ...WORK_FOCUS, folderPath: '/hr' };

// ── Tests ────────────────────────────────────────────────────────────────────────────────────────────────────────────

describe('constructDataViewDiagramData', () => {
    it('shows a connector that has several connections, and the one connection of a connector that has only one, when nothing is focused', () => {
        const data = constructDataViewDiagramData(LABELS, CONNECTIONS, DATA_VIEWS, {});

        expect(readNodes(data)).toStrictEqual(['root:Data Views', 'connector:Dropbox', 'connection:Local']);
        expect(data.links).toStrictEqual([
            { source: 'data', target: 'data.dropbox' },
            { source: 'data', target: 'data.sqlite.local' }
        ]);
    });

    it('opens a connector’s one connection straight from the top, with no connector above it', () => {
        const data = constructDataViewDiagramData(LABELS, CONNECTIONS, DATA_VIEWS, { connectorId: 'sqlite', connectionId: 'local' });

        expect(readNodes(data)).toStrictEqual(['root:Data Views', 'connection:Local', 'add:Add']);
        expect(data.links[0]).toStrictEqual({ source: 'data', target: 'data.sqlite.local' });
    });

    it('gives a connection the same id and colour with or without its connector above it', () => {
        const alone = constructDataViewDiagramData(
            LABELS,
            CONNECTIONS.filter((connection) => connection.id === 'work'),
            DATA_VIEWS,
            {}
        );
        const grouped = constructDataViewDiagramData(LABELS, CONNECTIONS, DATA_VIEWS, { connectorId: 'dropbox' });

        const findWork = (data: typeof alone): unknown => data.nodes.find((node) => node.label === 'Work');
        expect(findWork(alone)).toStrictEqual(findWork(grouped));
    });

    it('keeps the focused connector, hides the others and shows its connections', () => {
        const data = constructDataViewDiagramData(LABELS, CONNECTIONS, DATA_VIEWS, { connectorId: 'dropbox' });

        expect(readNodes(data)).toStrictEqual(['root:Data Views', 'connector:Dropbox', 'connection:Personal', 'connection:Work']);
    });

    it('keeps the path to the focused connection and shows its data views with a node for adding one', () => {
        const data = constructDataViewDiagramData(LABELS, CONNECTIONS, DATA_VIEWS, WORK_FOCUS);

        expect(readNodes(data)).toStrictEqual(['root:Data Views', 'connector:Dropbox', 'connection:Work', 'dataView:Employees', 'add:Add']);
        expect(data.nodes.find((node) => node.typeId === 'dataView')?.dataViewId).toBe('a');
        expect(data.nodes.find((node) => node.typeId === 'add')?.connectionId).toBe('work');
    });

    it('draws the add node as an action with a plus inside it and no label, named for its tooltip', () => {
        const data = constructDataViewDiagramData(LABELS, CONNECTIONS, DATA_VIEWS, WORK_FOCUS);

        expect(data.nodes.find((node) => node.typeId === 'add')).toMatchObject({ isAction: true, symbol: '+', title: 'Add' });
        expect(data.nodes.find((node) => node.typeId === 'add')).not.toHaveProperty('label');
    });

    it('falls back to the level above for a connector or connection the user does not have, or a connector with no level of its own', () => {
        expect(constructDataViewDiagramData(LABELS, CONNECTIONS, DATA_VIEWS, { connectorId: 'gone' })).toStrictEqual(constructDataViewDiagramData(LABELS, CONNECTIONS, DATA_VIEWS, {}));
        expect(constructDataViewDiagramData(LABELS, CONNECTIONS, DATA_VIEWS, { connectorId: 'sqlite' })).toStrictEqual(constructDataViewDiagramData(LABELS, CONNECTIONS, DATA_VIEWS, {}));
        expect(constructDataViewDiagramData(LABELS, CONNECTIONS, DATA_VIEWS, { connectorId: 'dropbox', connectionId: 'local' })).toStrictEqual(
            constructDataViewDiagramData(LABELS, CONNECTIONS, DATA_VIEWS, { connectorId: 'dropbox' })
        );
    });

    it('gives every node a unique id and links only nodes that exist', () => {
        const data = constructDataViewDiagramData(LABELS, CONNECTIONS, DATA_VIEWS, WORK_FOCUS);

        const nodeIds = new Set(data.nodes.map((node) => node.id));
        expect(nodeIds.size).toBe(data.nodes.length);
        expect(data.links.every((link) => nodeIds.has(link.source) && nodeIds.has(link.target))).toBe(true);
    });
});

describe('selection and icons', () => {
    it('marks the focused connector or connection as selected, the selected data view in its connection’s place, and never the top node', () => {
        const readSelected = (data: ReturnType<typeof constructDataViewDiagramData>): string[] => data.nodes.filter((node) => node.isSelected === true).map((node) => node.typeId);

        expect(readSelected(constructDataViewDiagramData(LABELS, CONNECTIONS, DATA_VIEWS, {}))).toStrictEqual([]);
        expect(readSelected(constructDataViewDiagramData(LABELS, CONNECTIONS, DATA_VIEWS, { connectorId: 'dropbox' }))).toStrictEqual(['connector']);
        expect(readSelected(constructDataViewDiagramData(LABELS, CONNECTIONS, DATA_VIEWS, WORK_FOCUS))).toStrictEqual(['connection']);
        expect(readSelected(constructDataViewDiagramData(LABELS, CONNECTIONS, DATA_VIEWS, WORK_FOCUS, 'a'))).toStrictEqual(['dataView']);
    });

    it('gives the selected data view an open badge in the action fill and outline and names it for opening, and no other node', () => {
        const labels = { ...LABELS, dataViewColor: '#222222', openDiscColor: 'var(--pill)', openRingColor: 'var(--pill-border)' };
        const data = constructDataViewDiagramData(labels, CONNECTIONS, DATA_VIEWS, WORK_FOCUS, 'a');

        expect(data.nodes.filter((node) => node.badge != null || node.accessibleLabel != null)).toMatchObject([
            { accessibleLabel: 'Open Employees', badge: 'arrowRight', color: 'var(--pill-border)', discColor: 'var(--pill)', label: 'Employees' }
        ]);
        expect(constructDataViewDiagramData(LABELS, CONNECTIONS, DATA_VIEWS, WORK_FOCUS).nodes.some((node) => node.badge != null)).toBe(false);
    });

    it('keeps the connection selected when the selected data view belongs to another connection', () => {
        const data = constructDataViewDiagramData(LABELS, CONNECTIONS, DATA_VIEWS, WORK_FOCUS, 'b');

        expect(data.nodes.filter((node) => node.isSelected === true).map((node) => node.label)).toStrictEqual(['Work']);
    });

    it('gives the top node, a connector, a connection and a data view the icon it is handed, and leaves a node without one plain', () => {
        const connections = CONNECTIONS.map((connection) => ({
            ...connection,
            icon: `<svg data-id="${connection.id}"/>`,
            connectorIcon: `<svg data-id="${connection.connectorId}"/>`
        }));
        const dataViews = DATA_VIEWS.map((dataView) => ({ ...dataView, icon: `<svg data-id="${dataView.id}"/>` }));
        const data = constructDataViewDiagramData({ ...LABELS, rootIcon: '<svg data-id="root"/>' }, connections, dataViews, WORK_FOCUS);
        const plainData = constructDataViewDiagramData(LABELS, CONNECTIONS, DATA_VIEWS, WORK_FOCUS);

        expect(data.nodes.map((node) => node.icon)).toStrictEqual(['<svg data-id="root"/>', '<svg data-id="dropbox"/>', '<svg data-id="work"/>', '<svg data-id="a"/>', undefined]);
        expect(plainData.nodes.every((node) => !('icon' in node))).toBe(true);
    });
});

describe('colours', () => {
    it('gives connectors and connections one colour, data views another, the top node its solid colour, and the add node none', () => {
        const labels = { ...LABELS, connectionColor: '#111111', dataViewColor: '#222222', rootDiscColor: '#333333' };
        const data = constructDataViewDiagramData(labels, CONNECTIONS, DATA_VIEWS, WORK_FOCUS);

        expect(data.nodes.map((node) => node.discColor)).toStrictEqual(['#333333', undefined, undefined, undefined, undefined]);

        expect(data.nodes.map((node) => `${node.typeId}:${node.color ?? ''}`)).toStrictEqual([
            'root:#333333',
            'connector:#111111',
            'connection:#111111',
            'dataView:#222222',
            'add:'
        ]);
    });
});

describe('top node', () => {
    it('has no label, because its icon says what it is, and is named for its tooltip', () => {
        const [rootNode] = constructDataViewDiagramData(LABELS, CONNECTIONS, DATA_VIEWS, {}).nodes;

        expect(rootNode).not.toHaveProperty('label');
        expect(rootNode.title).toBe('Data Views');
    });
});

describe('folders', () => {
    it('shows no folder when a connection’s data views are all in one', () => {
        const data = constructDataViewDiagramData(LABELS, CONNECTIONS, DATA_VIEWS, { ...WORK_FOCUS, folderPath: '/hr' });

        expect(readNodes(data)).toStrictEqual(['root:Data Views', 'connector:Dropbox', 'connection:Work', 'dataView:Employees', 'add:Add']);
    });

    it('shows a connection’s folders in the order their first data view is listed, beside a data view in no folder', () => {
        const data = constructDataViewDiagramData(LABELS, CONNECTIONS, FOLDER_DATA_VIEWS, WORK_FOCUS);

        expect(readNodes(data)).toStrictEqual(['root:Data Views', 'connector:Dropbox', 'connection:Work', 'folder:hr', 'folder:finance/2026', 'dataView:Untitled', 'add:Add']);
        expect(data.nodes.find((node) => node.typeId === 'folder')?.focus).toStrictEqual(HR_FOCUS);
        expect(data.nodes.filter((node) => node.isSelected === true).map((node) => node.typeId)).toStrictEqual(['connection']);
    });

    it('opens a folder to show its data views one level lower, keeps the add node on the connection, and hides the other folders', () => {
        const data = constructDataViewDiagramData(LABELS, CONNECTIONS, FOLDER_DATA_VIEWS, HR_FOCUS);

        expect(readNodes(data)).toStrictEqual(['root:Data Views', 'connector:Dropbox', 'connection:Work', 'folder:hr', 'dataView:Employees', 'dataView:Payroll', 'add:Add']);
        expect(data.nodes.filter((node) => node.isSelected === true).map((node) => node.typeId)).toStrictEqual(['folder']);
        expect(data.nodes.filter((node) => node.typeId !== 'root').map((node) => node.level)).toStrictEqual([1, 2, 3, 4, 4, 3]);
        expect(data.links.slice(-3).map((link) => link.source)).toStrictEqual(['data.dropbox.work.folder./hr', 'data.dropbox.work.folder./hr', 'data.dropbox.work']);
        expect(data.nodes.find((node) => node.typeId === 'add')?.connectionId).toBe('work');
    });

    it('selects the selected data view in its folder’s place', () => {
        const data = constructDataViewDiagramData(LABELS, CONNECTIONS, FOLDER_DATA_VIEWS, HR_FOCUS, 'd');

        expect(data.nodes.filter((node) => node.isSelected === true).map((node) => node.label)).toStrictEqual(['Payroll']);
    });

    it('falls back to the connection for a folder it does not show', () => {
        expect(constructDataViewDiagramData(LABELS, CONNECTIONS, FOLDER_DATA_VIEWS, { ...WORK_FOCUS, folderPath: '/gone' })).toStrictEqual(
            constructDataViewDiagramData(LABELS, CONNECTIONS, FOLDER_DATA_VIEWS, WORK_FOCUS)
        );
    });

    it('names the top folder of a file store, and cuts a long path at its start with the whole path as its tooltip', () => {
        const longPath = '/reports/regional/quarterly/2026';
        const dataViews = [
            { id: 'a', label: 'Employees', connectionId: 'work', folderPath: '' },
            { id: 'c', label: 'Sales', connectionId: 'work', folderPath: longPath }
        ];
        const folderNodes = constructDataViewDiagramData(LABELS, CONNECTIONS, dataViews, WORK_FOCUS).nodes.filter((node) => node.typeId === 'folder');

        expect(folderNodes[0]).toMatchObject({ label: '/' });
        expect(folderNodes[0]).not.toHaveProperty('title');
        expect(folderNodes[1]).toMatchObject({ accessibleLabel: longPath, label: '…regional/quarterly/2026', title: longPath });
        expect(folderNodes[1]?.label).toHaveLength(24);
    });

    it('gives a folder its connection’s folder icon and the connection colour', () => {
        const connections = CONNECTIONS.map((connection) => ({ ...connection, folderIcon: '<svg data-id="folder"/>' }));
        const data = constructDataViewDiagramData({ ...LABELS, connectionColor: '#111111' }, connections, FOLDER_DATA_VIEWS, WORK_FOCUS);

        expect(data.nodes.find((node) => node.typeId === 'folder')).toMatchObject({ color: '#111111', icon: '<svg data-id="folder"/>' });
    });
});

describe('listDataViewDiagramFolderPaths', () => {
    it('lists a connection’s folders only when there are several', () => {
        expect(listDataViewDiagramFolderPaths(FOLDER_DATA_VIEWS, 'work')).toStrictEqual(['/hr', '/finance/2026']);
        expect(listDataViewDiagramFolderPaths(DATA_VIEWS, 'work')).toStrictEqual([]);
        expect(listDataViewDiagramFolderPaths(FOLDER_DATA_VIEWS, 'personal')).toStrictEqual([]);
    });
});

describe('findFocusedDataViewDiagramNode', () => {
    it('finds the connection a focus names, or else its connector when the connector has a node of its own', () => {
        expect(findFocusedDataViewDiagramNode(CONNECTIONS, WORK_FOCUS)).toStrictEqual({ typeId: 'connection', connectionId: 'work', connectorId: 'dropbox' });
        expect(findFocusedDataViewDiagramNode(CONNECTIONS, { connectorId: 'dropbox' })).toStrictEqual({ typeId: 'connector', connectorId: 'dropbox' });
        expect(findFocusedDataViewDiagramNode(CONNECTIONS, { connectorId: 'dropbox', connectionId: 'local' })).toStrictEqual({ typeId: 'connector', connectorId: 'dropbox' });
    });

    it('finds nothing for the top, a connector the user does not have, or a connector with one connection', () => {
        expect(findFocusedDataViewDiagramNode(CONNECTIONS, {})).toBeUndefined();
        expect(findFocusedDataViewDiagramNode(CONNECTIONS, { connectorId: 'gone' })).toBeUndefined();
        expect(findFocusedDataViewDiagramNode(CONNECTIONS, { connectorId: 'sqlite' })).toBeUndefined();
    });
});

describe('resolveDataViewDiagramFocus', () => {
    it('shows the selected data view’s connection, or else the level the URL names', () => {
        const noFolder = { folderPath: undefined };
        expect(resolveDataViewDiagramFocus(CONNECTIONS, DATA_VIEWS, {}, { connectionId: 'local', folderPath: '/main' })).toStrictEqual({ connectorId: 'sqlite', connectionId: 'local', ...noFolder });
        expect(resolveDataViewDiagramFocus(CONNECTIONS, DATA_VIEWS, WORK_FOCUS)).toStrictEqual({ ...WORK_FOCUS, ...noFolder });
        expect(resolveDataViewDiagramFocus(CONNECTIONS, DATA_VIEWS, WORK_FOCUS, { connectionId: 'gone', folderPath: undefined })).toStrictEqual({ ...WORK_FOCUS, ...noFolder });
    });

    it('shows the selected data view’s folder, or else the folder the URL names, only when its connection shows folders', () => {
        expect(resolveDataViewDiagramFocus(CONNECTIONS, FOLDER_DATA_VIEWS, WORK_FOCUS, { connectionId: 'work', folderPath: '/finance/2026' })).toStrictEqual({
            ...WORK_FOCUS,
            folderPath: '/finance/2026'
        });
        expect(resolveDataViewDiagramFocus(CONNECTIONS, FOLDER_DATA_VIEWS, HR_FOCUS)).toStrictEqual(HR_FOCUS);
        expect(resolveDataViewDiagramFocus(CONNECTIONS, DATA_VIEWS, HR_FOCUS)).toStrictEqual({ ...WORK_FOCUS, folderPath: undefined });
    });
});

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

// The add node has a name in place of a label.
function readNodes(data: { nodes: { label?: string; title?: string; typeId: string }[] }): string[] {
    return data.nodes.map((node) => `${node.typeId}:${node.label ?? node.title ?? ''}`);
}
