// ── External Dependencies & Registrations
import { describe, expect, it } from 'vitest';

// ── Local Framework
import { constructDataViewMapData, findFocusedDataViewMapNode, readDataViewMapFocus, resolveDataViewMapFocus } from '@/features/studio/dataViews/_dataViewMap';

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

const LABELS = { add: 'Add', root: 'Data Views' };

// Dropbox has two connections, as a connector can, and SQLite one.
const CONNECTIONS = [
    { id: 'personal', label: 'Personal', connectorId: 'dropbox', connectorLabel: 'Dropbox' },
    { id: 'work', label: 'Work', connectorId: 'dropbox', connectorLabel: 'Dropbox' },
    { id: 'local', label: 'Local', connectorId: 'sqlite', connectorLabel: 'SQLite' }
];

const DATA_VIEWS = [
    { id: 'a', label: 'Employees', connectionId: 'work' },
    { id: 'b', label: 'Holidays', connectionId: 'personal' }
];

const WORK_FOCUS = { connectorId: 'dropbox', connectionId: 'work' };

// ── Tests ────────────────────────────────────────────────────────────────────────────────────────────────────────────

describe('constructDataViewMapData', () => {
    it('shows a connector that has several connections, and the one connection of a connector that has only one, when nothing is focused', () => {
        const data = constructDataViewMapData(LABELS, CONNECTIONS, DATA_VIEWS, {});

        expect(readNodes(data)).toStrictEqual(['root:Data Views', 'connector:Dropbox', 'connection:Local']);
        expect(data.links).toStrictEqual([
            { source: 'data', target: 'data.dropbox' },
            { source: 'data', target: 'data.sqlite.local' }
        ]);
    });

    it('opens a connector’s one connection straight from the top, with no connector above it', () => {
        const data = constructDataViewMapData(LABELS, CONNECTIONS, DATA_VIEWS, { connectorId: 'sqlite', connectionId: 'local' });

        expect(readNodes(data)).toStrictEqual(['root:Data Views', 'connection:Local', 'add:Add']);
        expect(data.links[0]).toStrictEqual({ source: 'data', target: 'data.sqlite.local' });
    });

    it('gives a connection the same id and colour with or without its connector above it', () => {
        const alone = constructDataViewMapData(
            LABELS,
            CONNECTIONS.filter((connection) => connection.id === 'work'),
            DATA_VIEWS,
            {}
        );
        const grouped = constructDataViewMapData(LABELS, CONNECTIONS, DATA_VIEWS, { connectorId: 'dropbox' });

        const findWork = (data: typeof alone): unknown => data.nodes.find((node) => node.label === 'Work');
        expect(findWork(alone)).toStrictEqual(findWork(grouped));
    });

    it('keeps the focused connector, hides the others and shows its connections', () => {
        const data = constructDataViewMapData(LABELS, CONNECTIONS, DATA_VIEWS, { connectorId: 'dropbox' });

        expect(readNodes(data)).toStrictEqual(['root:Data Views', 'connector:Dropbox', 'connection:Personal', 'connection:Work']);
    });

    it('keeps the path to the focused connection and shows its data views with a node for adding one', () => {
        const data = constructDataViewMapData(LABELS, CONNECTIONS, DATA_VIEWS, WORK_FOCUS);

        expect(readNodes(data)).toStrictEqual(['root:Data Views', 'connector:Dropbox', 'connection:Work', 'dataView:Employees', 'add:Add']);
        expect(data.nodes.find((node) => node.typeId === 'dataView')?.dataViewId).toBe('a');
        expect(data.nodes.find((node) => node.typeId === 'add')?.connectionId).toBe('work');
    });

    it('draws the add node as an action with a plus inside it and no label, named for its tooltip', () => {
        const data = constructDataViewMapData(LABELS, CONNECTIONS, DATA_VIEWS, WORK_FOCUS);

        expect(data.nodes.find((node) => node.typeId === 'add')).toMatchObject({ isAction: true, symbol: '+', title: 'Add' });
        expect(data.nodes.find((node) => node.typeId === 'add')).not.toHaveProperty('label');
    });

    it('falls back to the level above for a connector or connection the user does not have, or a connector with no level of its own', () => {
        expect(constructDataViewMapData(LABELS, CONNECTIONS, DATA_VIEWS, { connectorId: 'gone' })).toStrictEqual(constructDataViewMapData(LABELS, CONNECTIONS, DATA_VIEWS, {}));
        expect(constructDataViewMapData(LABELS, CONNECTIONS, DATA_VIEWS, { connectorId: 'sqlite' })).toStrictEqual(constructDataViewMapData(LABELS, CONNECTIONS, DATA_VIEWS, {}));
        expect(constructDataViewMapData(LABELS, CONNECTIONS, DATA_VIEWS, { connectorId: 'dropbox', connectionId: 'local' })).toStrictEqual(
            constructDataViewMapData(LABELS, CONNECTIONS, DATA_VIEWS, { connectorId: 'dropbox' })
        );
    });

    it('gives every node a unique id and links only nodes that exist', () => {
        const data = constructDataViewMapData(LABELS, CONNECTIONS, DATA_VIEWS, WORK_FOCUS);

        const nodeIds = new Set(data.nodes.map((node) => node.id));
        expect(nodeIds.size).toBe(data.nodes.length);
        expect(data.links.every((link) => nodeIds.has(link.source) && nodeIds.has(link.target))).toBe(true);
    });
});

describe('selection and icons', () => {
    it('marks the focused connector or connection as selected, the selected data view in its connection’s place, and never the top node', () => {
        const readSelected = (data: ReturnType<typeof constructDataViewMapData>): string[] => data.nodes.filter((node) => node.isSelected === true).map((node) => node.typeId);

        expect(readSelected(constructDataViewMapData(LABELS, CONNECTIONS, DATA_VIEWS, {}))).toStrictEqual([]);
        expect(readSelected(constructDataViewMapData(LABELS, CONNECTIONS, DATA_VIEWS, { connectorId: 'dropbox' }))).toStrictEqual(['connector']);
        expect(readSelected(constructDataViewMapData(LABELS, CONNECTIONS, DATA_VIEWS, WORK_FOCUS))).toStrictEqual(['connection']);
        expect(readSelected(constructDataViewMapData(LABELS, CONNECTIONS, DATA_VIEWS, WORK_FOCUS, 'a'))).toStrictEqual(['dataView']);
    });

    it('keeps the connection selected when the selected data view belongs to another connection', () => {
        const data = constructDataViewMapData(LABELS, CONNECTIONS, DATA_VIEWS, WORK_FOCUS, 'b');

        expect(data.nodes.filter((node) => node.isSelected === true).map((node) => node.label)).toStrictEqual(['Work']);
    });

    it('gives the top node, a connector, a connection and a data view the icon it is handed, and leaves a node without one plain', () => {
        const connections = CONNECTIONS.map((connection) => ({
            ...connection,
            icon: `<svg data-id="${connection.id}"/>`,
            connectorIcon: `<svg data-id="${connection.connectorId}"/>`
        }));
        const dataViews = DATA_VIEWS.map((dataView) => ({ ...dataView, icon: `<svg data-id="${dataView.id}"/>` }));
        const data = constructDataViewMapData({ ...LABELS, rootIcon: '<svg data-id="root"/>' }, connections, dataViews, WORK_FOCUS);
        const plainData = constructDataViewMapData(LABELS, CONNECTIONS, DATA_VIEWS, WORK_FOCUS);

        expect(data.nodes.map((node) => node.icon)).toStrictEqual(['<svg data-id="root"/>', '<svg data-id="dropbox"/>', '<svg data-id="work"/>', '<svg data-id="a"/>', undefined]);
        expect(plainData.nodes.every((node) => !('icon' in node))).toBe(true);
    });
});

describe('colours', () => {
    it('gives the top node, connectors and connections one colour, data views another, and the add node none', () => {
        const data = constructDataViewMapData({ ...LABELS, connectionColor: '#111111', dataViewColor: '#222222' }, CONNECTIONS, DATA_VIEWS, WORK_FOCUS);

        expect(data.nodes.map((node) => `${node.typeId}:${node.color ?? ''}`)).toStrictEqual([
            'root:#111111',
            'connector:#111111',
            'connection:#111111',
            'dataView:#222222',
            'add:'
        ]);
    });
});

describe('findFocusedDataViewMapNode', () => {
    it('finds the connection a focus names, or else its connector when the connector has a node of its own', () => {
        expect(findFocusedDataViewMapNode(CONNECTIONS, WORK_FOCUS)).toStrictEqual({ typeId: 'connection', connectionId: 'work', connectorId: 'dropbox' });
        expect(findFocusedDataViewMapNode(CONNECTIONS, { connectorId: 'dropbox' })).toStrictEqual({ typeId: 'connector', connectorId: 'dropbox' });
        expect(findFocusedDataViewMapNode(CONNECTIONS, { connectorId: 'dropbox', connectionId: 'local' })).toStrictEqual({ typeId: 'connector', connectorId: 'dropbox' });
    });

    it('finds nothing for the top, a connector the user does not have, or a connector with one connection', () => {
        expect(findFocusedDataViewMapNode(CONNECTIONS, {})).toBeUndefined();
        expect(findFocusedDataViewMapNode(CONNECTIONS, { connectorId: 'gone' })).toBeUndefined();
        expect(findFocusedDataViewMapNode(CONNECTIONS, { connectorId: 'sqlite' })).toBeUndefined();
    });
});

describe('resolveDataViewMapFocus', () => {
    it('shows the selected data view’s connection, or else the level the URL names', () => {
        expect(resolveDataViewMapFocus(CONNECTIONS, {}, { connectionId: 'local' })).toStrictEqual({ connectorId: 'sqlite', connectionId: 'local' });
        expect(resolveDataViewMapFocus(CONNECTIONS, WORK_FOCUS)).toStrictEqual(WORK_FOCUS);
        expect(resolveDataViewMapFocus(CONNECTIONS, WORK_FOCUS, { connectionId: 'gone' })).toStrictEqual(WORK_FOCUS);
    });
});

describe('readDataViewMapFocus', () => {
    it('reads the level from the URL, ignoring a parameter given more than once', () => {
        expect(readDataViewMapFocus({ dvConnector: 'dropbox', dvConnection: 'work', dvView: 'diagram' })).toStrictEqual(WORK_FOCUS);
        expect(readDataViewMapFocus({ dvConnector: ['dropbox', 'sqlite'] })).toStrictEqual({ connectorId: undefined, connectionId: undefined });
    });
});

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

// The add node has a name in place of a label.
function readNodes(data: { nodes: { label?: string; title?: string; typeId: string }[] }): string[] {
    return data.nodes.map((node) => `${node.typeId}:${node.label ?? node.title ?? ''}`);
}
