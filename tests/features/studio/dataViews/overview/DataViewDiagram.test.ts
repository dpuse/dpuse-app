// ── External Dependencies & Registrations
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createMemoryHistory, createRouter, type Router } from 'vue-router';
import { defineComponent, type PropType } from 'vue';
import { mount, type VueWrapper } from '@vue/test-utils';

// ── DPUse Framework
import type { ConnectionConfig, DataViewConfig, LocalisedConfig } from '@dpuse/dpuse-shared';

// ── Local Framework
import { connectionLocalisedConfigs } from '@/state/configs';
import { DATA_FORMAT_ICON_CONFIGS } from '@/features/studio/dataViews/_components/dataFormatIcons';
import DataViewDiagram from '@/features/studio/dataViews/overview/DataViewDiagram.vue';
import type { DataViewDiagramData } from '@/features/studio/dataViews/overview/_dataViewDiagram';
import { settle } from '~/tests/support/settle';

vi.mock('@/observability/errorTracking', () => import('~/tests/support/errorTracking'));

// The app builds its connections from the connectors it is sent, so the list is replaced here with one a test can set.
vi.mock('@/state/configs', async (importOriginal) => {
    const { shallowRef } = await import('vue');
    return { ...(await importOriginal<object>()), connectionLocalisedConfigs: shallowRef([]) };
});

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

// Dropbox has two connections, so it has a node of its own. SQLite has one, which is shown in its place.
const CONNECTION_LOCALISED_CONFIGS = [
    buildConnection('work', 'Work', 'dropbox', 'Dropbox'),
    buildConnection('personal', 'Personal', 'dropbox', 'Dropbox'),
    buildConnection('local', 'Local', 'sqlite', 'SQLite', 'table')
];
const EMPLOYEES = { id: 'a', label: 'Employees', connectionId: 'work' };
const DATA_VIEW_LOCALISED_CONFIGS = [EMPLOYEES] as LocalisedConfig<DataViewConfig>[];
const WORK_PATH = '/dropbox/work'; // The Work connection's level, as the diagram's route names it.

// The diagram has its own tests, so it stands in as nothing, and a test clicks a node by emitting what it would.
const NetworkDiagramStub = defineComponent({
    props: { data: { type: Object as PropType<DataViewDiagramData>, default: undefined }, linkColor: { type: String, default: undefined } },
    emits: ['nodeClick'],
    render: (): null => null
});

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

const wrappers: VueWrapper[] = [];

// ── Tests ────────────────────────────────────────────────────────────────────────────────────────────────────────────

describe('data view diagram', () => {
    beforeEach(() => {
        setConnections(CONNECTION_LOCALISED_CONFIGS);
    });

    afterEach(() => {
        for (const wrapper of wrappers.splice(0)) wrapper.unmount();
        setConnections([]);
    });

    describe('drilling down and up', () => {
        it('shows a connector with several connections, and the one connection of any other, at the top', async () => {
            const { wrapper } = await mountMap();

            expect(shownLabels(wrapper)).toStrictEqual(['Data Views', 'Dropbox', 'Local']);
        });

        it('opens a connector’s one connection straight from the top, and changes nothing when it is clicked again', async () => {
            const { router, wrapper } = await mountMap();

            await clickNode(wrapper, 'Local');
            expect(router.currentRoute.value.path).toBe('/dataViews/diagram/sqlite/local');
            expect(shownLabels(wrapper)).toStrictEqual(['Data Views', 'Local', 'Add data view']);

            const { fullPath } = router.currentRoute.value;
            await clickNode(wrapper, 'Local');
            expect(router.currentRoute.value.fullPath).toBe(fullPath);
        });

        it('opens a connector when it is clicked, and keeps the level in the URL', async () => {
            const { router, wrapper } = await mountMap();

            await clickNode(wrapper, 'Dropbox');

            expect(router.currentRoute.value.path).toBe('/dataViews/diagram/dropbox');
            expect(shownLabels(wrapper)).toStrictEqual(['Data Views', 'Dropbox', 'Work', 'Personal']);
        });

        it('shows a connection’s data views with a node for adding one', async () => {
            const { wrapper } = await mountMap(WORK_PATH);

            expect(shownLabels(wrapper)).toStrictEqual(['Data Views', 'Dropbox', 'Work', 'Employees', 'Add data view']);
        });

        it('goes back up to a node above the open level when that node is clicked, and to the top from the top node', async () => {
            const { router, wrapper } = await mountMap(WORK_PATH);

            await clickNode(wrapper, 'Dropbox');
            expect(router.currentRoute.value.path).toBe('/dataViews/diagram/dropbox');

            await clickNode(wrapper, 'Data Views');
            expect(router.currentRoute.value.path).toBe('/dataViews/diagram');
            expect(shownLabels(wrapper)).toStrictEqual(['Data Views', 'Dropbox', 'Local']);
        });

        it('shows the selected data view’s connection, whatever level the URL names', async () => {
            const { wrapper } = await mountMap('', 'a');

            expect(shownLabels(wrapper)).toStrictEqual(['Data Views', 'Dropbox', 'Work', 'Employees', 'Add data view']);
        });
    });

    describe('selecting', () => {
        it('marks the connector or connection the diagram is drilled down to as selected, and never the top node', async () => {
            const { router, wrapper } = await mountMap('/dropbox');
            expect(selectedLabels(wrapper)).toStrictEqual(['Dropbox']);

            await clickNode(wrapper, 'Work');
            expect(selectedLabels(wrapper)).toStrictEqual(['Work']);

            await clickNode(wrapper, 'Data Views');
            expect(router.currentRoute.value.path).toBe('/dataViews/diagram');
            expect(selectedLabels(wrapper)).toStrictEqual([]);
        });

        it('asks for a data view to be selected when its node is clicked, and marks it in place of its connection once it is', async () => {
            const { wrapper } = await mountMap(WORK_PATH);

            await clickNode(wrapper, 'Employees');
            expect(wrapper.emitted('select')).toStrictEqual([['a']]);

            await wrapper.setProps({ selectedDataViewId: 'a' });
            expect(selectedLabels(wrapper)).toStrictEqual(['Employees']);
        });

        it('opens a data view on a double-click, and reports a slower second click on it as a click on the selected node', async () => {
            const { wrapper } = await mountMap(WORK_PATH);
            const dateNow = vi.spyOn(Date, 'now').mockReturnValue(1000);

            await clickNode(wrapper, 'Employees');
            await wrapper.setProps({ selectedDataViewId: 'a' });
            dateNow.mockReturnValue(1300);
            await clickNode(wrapper, 'Employees');
            expect(wrapper.emitted('select')).toStrictEqual([['a']]);
            expect(wrapper.emitted('open')).toStrictEqual([[]]);

            dateNow.mockReturnValue(3000);
            await clickNode(wrapper, 'Employees');
            expect(wrapper.emitted('open')).toHaveLength(1);
            expect(wrapper.emitted('reselect')).toStrictEqual([[]]);
            dateNow.mockRestore();
        });

        it('reports a click on the connection it is drilled down to, with no data view selected, as a click on the selected node', async () => {
            const { router, wrapper } = await mountMap(WORK_PATH);
            const { fullPath } = router.currentRoute.value;

            await clickNode(wrapper, 'Work');

            expect(wrapper.emitted('reselect')).toStrictEqual([[]]);
            expect(router.currentRoute.value.fullPath).toBe(fullPath);
        });

        it('reports a click away from every node, and changes nothing itself', async () => {
            const { router, wrapper } = await mountMap(`${WORK_PATH}/a`, 'a');
            const { fullPath } = router.currentRoute.value;

            wrapper.getComponent(NetworkDiagramStub).vm.$emit('backgroundClick');
            await settle();

            expect(wrapper.emitted('clear')).toStrictEqual([[]]);
            expect(router.currentRoute.value.fullPath).toBe(fullPath);
        });

        it('draws the selected data view as any other selected node, with no badge', async () => {
            const { wrapper } = await mountMap(`${WORK_PATH}/a`, 'a');

            const node = shownData(wrapper).nodes.find((candidate) => candidate.label === 'Employees');
            expect(node).toMatchObject({ isSelected: true });
            expect(node).not.toHaveProperty('badge');
            expect(node).not.toHaveProperty('discColor');
        });

        it('keeps every node and link when a data view is selected, so the diagram is not laid out again', async () => {
            const { wrapper } = await mountMap(WORK_PATH);
            const { links, nodes } = shownData(wrapper);

            await wrapper.setProps({ selectedDataViewId: 'a' });

            expect(shownData(wrapper).links).toStrictEqual(links);
            expect(shownData(wrapper).nodes.map((node) => node.id)).toStrictEqual(nodes.map((node) => node.id));
        });

        it('selects the connection in the data view’s place when the connection is clicked', async () => {
            const { router, wrapper } = await mountMap(`${WORK_PATH}/a`, 'a');

            await clickNode(wrapper, 'Work');

            expect(router.currentRoute.value.path).toBe('/dataViews/diagram/dropbox/work');
        });

        it('asks for a new data view on the connection when the add node is clicked', async () => {
            const { router, wrapper } = await mountMap(WORK_PATH);
            const { fullPath } = router.currentRoute.value;

            await clickNode(wrapper, 'Add data view');

            expect(wrapper.emitted('add')).toStrictEqual([['work']]);
            expect(router.currentRoute.value.fullPath).toBe(fullPath);
        });
    });

    describe('names', () => {
        it('names a data view the user has not named after its item, and keeps a name the user gave it', async () => {
            const { wrapper } = await mountMap(WORK_PATH);
            const connectionNodeConfig = { label: 'employees.csv' };
            const readDataViewLabels = (): (string | undefined)[] =>
                shownData(wrapper)
                    .nodes.filter((node) => node.typeId === 'dataView')
                    .map((node) => node.label);

            await wrapper.setProps({
                dataViewLocalisedConfigs: [
                    { ...EMPLOYEES, connectionNodeConfig },
                    { ...EMPLOYEES, id: 'b', label: 'Untitled Data View', connectionNodeConfig },
                    { ...EMPLOYEES, id: 'c', label: 'Untitled Data View' }
                ]
            });

            // The last has no item yet, so it has nothing better to be called.
            expect(readDataViewLabels()).toStrictEqual(['Employees', 'employees.csv', 'Untitled Data View']);
        });
    });

    describe('colours', () => {
        it('draws data views, connectors and connections in the colour of Setup’s option bar button', async () => {
            const { wrapper } = await mountMap(WORK_PATH);
            const colors = Object.fromEntries(shownData(wrapper).nodes.map((node) => [node.label ?? node.title, node.color]));

            // A soft shade of the colour, as the pill's border is of the pill's text colour.
            expect(colors.Employees).toBe('color-mix(in oklab, #52525b 45%, var(--color-surface))');
            expect(colors.Dropbox).toBe('color-mix(in oklab, #52525b 45%, var(--color-surface))');
            expect(colors.Work).toBe(colors.Dropbox);
            expect(colors['Add data view']).toBeUndefined();
        });

        it('draws the lines between nodes in the nodes’ ring colour', async () => {
            const { wrapper } = await mountMap(WORK_PATH);
            const employees = shownData(wrapper).nodes.find((node) => node.label === 'Employees');

            expect(wrapper.getComponent(NetworkDiagramStub).props('linkColor')).toBe(employees?.color);
        });

        it('sets the top node apart as the data views icon in white on the data views colour, and no other node', async () => {
            const { wrapper } = await mountMap(WORK_PATH);
            const [rootNode, ...otherNodes] = shownData(wrapper).nodes;

            expect(rootNode.discColor).toBe('#5686d6');
            expect(rootNode.color).toBe('#5686d6');
            expect(rootNode.icon).toContain('stroke="#ffffff"');
            expect(rootNode.icon).not.toContain('#5686d6');
            expect(otherNodes.every((node) => node.discColor === undefined)).toBe(true);
        });
    });

    describe('icons', () => {
        it('gives the top node, a connector and a connection its own icon, and a data view with no item the data views icon in its own colour', async () => {
            const { wrapper } = await mountMap(WORK_PATH);
            const icons = Object.fromEntries(shownData(wrapper).nodes.map((node) => [node.label ?? node.title, node.icon]));

            expect(icons['Data Views']).toContain('<svg');
            expect(icons.Dropbox).toBe('<svg data-id="dropbox"/>');
            expect(icons.Work).toBe('<svg data-id="work"/>');
            expect(icons.Employees).toContain('stroke="#5686d6"');
        });

        it('gives a data view its item’s own icon, or else its file’s format icon, as its card does', async () => {
            const { wrapper } = await mountMap(WORK_PATH);
            const readEmployeesIcon = (): string | undefined => shownData(wrapper).nodes.find((node) => node.label === 'Employees')?.icon;

            // 'Work' reads files, so a previewed file shows its format.
            await wrapper.setProps({ dataViewLocalisedConfigs: [{ ...EMPLOYEES, readingConfig: { dataFormatId: 'json' } }] });
            expect(readEmployeesIcon()).toBe(DATA_FORMAT_ICON_CONFIGS.json.icon);

            await wrapper.setProps({
                dataViewLocalisedConfigs: [{ ...EMPLOYEES, connectionNodeConfig: { icon: '<svg data-id="item"/>' }, readingConfig: { dataFormatId: 'json' } }]
            });
            expect(readEmployeesIcon()).toBe('<svg data-id="item"/>');
        });

        it('draws a connection’s folders in neutral grey, not in the colour of its items', async () => {
            const { wrapper } = await mountMap('/sqlite/local');
            await wrapper.setProps({ dataViewLocalisedConfigs: [buildTable('a', '/sales'), buildTable('b', '/staff')] });
            const folderIcons = shownData(wrapper)
                .nodes.filter((node) => node.label === 'sales' || node.label === 'staff')
                .map((node) => node.icon);

            expect(folderIcons).toHaveLength(2);
            for (const icon of folderIcons) expect(icon).toContain('stroke="#52525b"');
        });

        it('gives a data view on a table its kind’s icon once its item is chosen, as its card does', async () => {
            const { wrapper } = await mountMap('/sqlite/local');
            const readPeopleIcon = (): string | undefined => shownData(wrapper).nodes.find((node) => node.label === 'People')?.icon;

            await wrapper.setProps({ dataViewLocalisedConfigs: [{ id: 'b', label: 'People', connectionId: 'local' }] });
            expect(readPeopleIcon()).toContain('stroke="#5686d6"');

            await wrapper.setProps({ dataViewLocalisedConfigs: [{ id: 'b', label: 'People', connectionId: 'local', connectionNodeConfig: { label: 'People' } }] });
            expect(readPeopleIcon()).toContain('stroke="#488f86"');
            expect(readPeopleIcon()).toContain('<rect width="18" height="18"');
        });
    });
});

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

function buildConnection(id: string, label: string, connectorId: string, connectorLabel: string, itemTypeId = 'file'): LocalisedConfig<ConnectionConfig> {
    const connectorConfig = { id: connectorId, label: { en: connectorLabel }, description: {}, icon: `<svg data-id="${connectorId}"/>`, itemTypeId };
    return { id, label, description: '', icon: `<svg data-id="${id}"/>`, connectorConfig } as unknown as LocalisedConfig<ConnectionConfig>;
}

// The list is a plain ref here, in place of the app's computed one.
function setConnections(configs: LocalisedConfig<ConnectionConfig>[]): void {
    (connectionLocalisedConfigs as unknown as { value: LocalisedConfig<ConnectionConfig>[] }).value = configs;
}

// A data view on a table of the 'local' connection, in the given folder.
function buildTable(id: string, folderPath: string): object {
    return { id, label: id, connectionId: 'local', connectionNodeConfig: { folderPath, label: id } };
}

async function mountMap(levelPath = '', selectedDataViewId?: string): Promise<{ router: Router; wrapper: VueWrapper }> {
    const component = { render: (): null => null };
    const router = createRouter({
        history: createMemoryHistory(),
        routes: [
            { name: 'dataViewDiagram', path: '/dataViews/diagram/:connectorId?/:connectionId?/:dataViewId?', component },
            { name: 'dataViewList', path: '/dataViews/list/:dataViewId?', component },
            { name: 'item', path: '/dataViews/:dataViewId/items', component }
        ]
    });
    await router.push(`/dataViews/diagram${levelPath}`);
    await router.isReady();
    const wrapper = mount(DataViewDiagram, {
        props: { dataViewLocalisedConfigs: DATA_VIEW_LOCALISED_CONFIGS, selectedDataViewId },
        global: { plugins: [router], stubs: { NetworkDiagram: NetworkDiagramStub } }
    });
    wrappers.push(wrapper);
    await settle();
    return { router, wrapper };
}

function shownData(wrapper: VueWrapper): DataViewDiagramData {
    const data = wrapper.getComponent(NetworkDiagramStub).props('data');
    if (!data) throw new Error('The diagram has been given nothing to draw.');
    return data;
}

function selectedLabels(wrapper: VueWrapper): (string | undefined)[] {
    return shownData(wrapper)
        .nodes.filter((node) => node.isSelected === true)
        .map((node) => node.label);
}

function shownLabels(wrapper: VueWrapper): string[] {
    return shownData(wrapper).nodes.map((node) => node.label ?? node.title ?? ''); // The add node has a name in place of a label.
}

async function clickNode(wrapper: VueWrapper, label: string): Promise<void> {
    const node = shownData(wrapper).nodes.find((candidate) => (candidate.label ?? candidate.title) === label);
    if (!node) throw new Error(`The diagram has no '${label}' node.`);
    wrapper.getComponent(NetworkDiagramStub).vm.$emit('nodeClick', node);
    await settle();
}
