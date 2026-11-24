// ── External Dependencies & Registrations
import { describe, expect, it } from 'vitest';

// ── Local Framework
import { constructDataViewDiagramData, findFocusedDataViewDiagramNode, readDataViewDiagramFocus, resolveDataViewDiagramFocus } from '@/features/studio/dataViews/_dataViewDiagram';

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
        expect(resolveDataViewDiagramFocus(CONNECTIONS, {}, { connectionId: 'local' })).toStrictEqual({ connectorId: 'sqlite', connectionId: 'local' });
        expect(resolveDataViewDiagramFocus(CONNECTIONS, WORK_FOCUS)).toStrictEqual(WORK_FOCUS);
        expect(resolveDataViewDiagramFocus(CONNECTIONS, WORK_FOCUS, { connectionId: 'gone' })).toStrictEqual(WORK_FOCUS);
    });
});

describe('readDataViewDiagramFocus', () => {
    it('reads the level from the route’s path, where a part left out names no level', () => {
        expect(readDataViewDiagramFocus({ connectorId: 'dropbox', connectionId: 'work', dataViewId: 'a' })).toStrictEqual(WORK_FOCUS);
        expect(readDataViewDiagramFocus({ connectorId: 'dropbox', connectionId: '' })).toStrictEqual({ connectorId: 'dropbox', connectionId: undefined });
        expect(readDataViewDiagramFocus({ connectorId: ['dropbox', 'sqlite'] })).toStrictEqual({ connectorId: undefined, connectionId: undefined });
    });
});

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

// The add node has a name in place of a label.
function readNodes(data: { nodes: { label?: string; title?: string; typeId: string }[] }): string[] {
    return data.nodes.map((node) => `${node.typeId}:${node.label ?? node.title ?? ''}`);
}
