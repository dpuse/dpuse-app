// ── External Dependencies & Registrations
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createMemoryHistory, createRouter, type Router } from 'vue-router';
import { defineComponent, type PropType } from 'vue';
import { mount, type VueWrapper } from '@vue/test-utils';

// ── DPUse Framework
import type { ConnectionConfig, DataViewConfig, LocalisedConfig } from '@dpuse/dpuse-shared';

// ── Local Framework
import { connectionLocalisedConfigs } from '@/state/configs';
import { DATA_FORMAT_ICON_CONFIGS } from '@/features/studio/dataViews/_dataFormatIcons';
import DataViewMap from '@/features/studio/dataViews/DataViewMap.vue';
import type { DataViewMapData } from '@/features/studio/dataViews/_dataViewMap';
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
    buildConnection('local', 'Local', 'sqlite', 'SQLite')
];
const EMPLOYEES = { id: 'a', label: 'Employees', connectionId: 'work' };
const DATA_VIEW_LOCALISED_CONFIGS = [EMPLOYEES] as LocalisedConfig<DataViewConfig>[];
const WORK_QUERY = 'dvConnector=dropbox&dvConnection=work';

// The diagram has its own tests, so it stands in as nothing, and a test clicks a node by emitting what it would.
const NetworkDiagramStub = defineComponent({
    props: { data: { type: Object as PropType<DataViewMapData>, default: undefined } },
    emits: ['nodeClick'],
    render: (): null => null
});

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

const wrappers: VueWrapper[] = [];

// ── Tests ────────────────────────────────────────────────────────────────────────────────────────────────────────────

describe('data view map', () => {
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
            expect(router.currentRoute.value.query).toMatchObject({ dvConnector: 'sqlite', dvConnection: 'local' });
            expect(shownLabels(wrapper)).toStrictEqual(['Data Views', 'Local', 'Add data view']);

            const { fullPath } = router.currentRoute.value;
            await clickNode(wrapper, 'Local');
            expect(router.currentRoute.value.fullPath).toBe(fullPath);
        });

        it('opens a connector when it is clicked, and keeps the level in the URL', async () => {
            const { router, wrapper } = await mountMap();

            await clickNode(wrapper, 'Dropbox');

            expect(router.currentRoute.value.query).toMatchObject({ dvConnector: 'dropbox' });
            expect(shownLabels(wrapper)).toStrictEqual(['Data Views', 'Dropbox', 'Work', 'Personal']);
        });

        it('shows a connection’s data views with a node for adding one', async () => {
            const { wrapper } = await mountMap(`?${WORK_QUERY}`);

            expect(shownLabels(wrapper)).toStrictEqual(['Data Views', 'Dropbox', 'Work', 'Employees', 'Add data view']);
        });

        it('goes back up to a node above the open level when that node is clicked, and to the top from the top node', async () => {
            const { router, wrapper } = await mountMap(`?${WORK_QUERY}`);

            await clickNode(wrapper, 'Dropbox');
            expect(router.currentRoute.value.query).not.toHaveProperty('dvConnection');
            expect(router.currentRoute.value.query).toMatchObject({ dvConnector: 'dropbox' });

            await clickNode(wrapper, 'Data Views');
            expect(router.currentRoute.value.query).not.toHaveProperty('dvConnector');
            expect(shownLabels(wrapper)).toStrictEqual(['Data Views', 'Dropbox', 'Local']);
        });

        it('shows the selected data view’s connection, whatever level the URL names', async () => {
            const { wrapper } = await mountMap('', 'a');

            expect(shownLabels(wrapper)).toStrictEqual(['Data Views', 'Dropbox', 'Work', 'Employees', 'Add data view']);
        });
    });

    describe('path', () => {
        it('shows no path at the top, where it would only repeat the top node', async () => {
            const { wrapper } = await mountMap();

            expect(wrapper.find('[data-region="Breadcrumbs"]').exists()).toBe(false);
        });

        it('lists the levels above the selected node as links back up, and the selected node as text', async () => {
            const { wrapper } = await mountMap(`?${WORK_QUERY}`);
            const trail = wrapper.get('[data-region="Breadcrumbs"]');

            expect(trail.findAll('a').map((link) => link.text())).toStrictEqual(['Data Views', 'Dropbox']);
            expect(trail.text()).toContain('Work');

            await wrapper.setProps({ selectedDataViewId: 'a' });

            expect(trail.findAll('a').map((link) => link.text())).toStrictEqual(['Data Views', 'Dropbox', 'Work']);
            expect(trail.text()).toContain('Employees');
        });
    });

    describe('selecting', () => {
        it('marks the connector or connection the diagram is drilled down to as selected, and never the top node', async () => {
            const { router, wrapper } = await mountMap('?dvConnector=dropbox');
            expect(selectedLabels(wrapper)).toStrictEqual(['Dropbox']);

            await clickNode(wrapper, 'Work');
            expect(selectedLabels(wrapper)).toStrictEqual(['Work']);

            await clickNode(wrapper, 'Data Views');
            expect(router.currentRoute.value.query).not.toHaveProperty('dvConnector');
            expect(selectedLabels(wrapper)).toStrictEqual([]);
        });

        it('asks for a data view to be selected when its node is clicked, and marks it in place of its connection once it is', async () => {
            const { wrapper } = await mountMap(`?${WORK_QUERY}`);

            await clickNode(wrapper, 'Employees');
            expect(wrapper.emitted('select')).toStrictEqual([['a']]);

            await wrapper.setProps({ selectedDataViewId: 'a' });
            expect(selectedLabels(wrapper)).toStrictEqual(['Employees']);
        });

        it('keeps every node and link when a data view is selected, so the diagram is not laid out again', async () => {
            const { wrapper } = await mountMap(`?${WORK_QUERY}`);
            const { links, nodes } = shownData(wrapper);

            await wrapper.setProps({ selectedDataViewId: 'a' });

            expect(shownData(wrapper).links).toStrictEqual(links);
            expect(shownData(wrapper).nodes.map((node) => node.id)).toStrictEqual(nodes.map((node) => node.id));
        });

        it('selects the connection in the data view’s place when the connection is clicked', async () => {
            const { router, wrapper } = await mountMap(`/a?${WORK_QUERY}`, 'a');

            await clickNode(wrapper, 'Work');

            expect(router.currentRoute.value.path).toBe('/dataViews');
            expect(router.currentRoute.value.query).toMatchObject({ dvConnector: 'dropbox', dvConnection: 'work' });
        });

        it('asks for a new data view on the connection when the add node is clicked', async () => {
            const { router, wrapper } = await mountMap(`?${WORK_QUERY}`);
            const { fullPath } = router.currentRoute.value;

            await clickNode(wrapper, 'Add data view');

            expect(wrapper.emitted('add')).toStrictEqual([['work']]);
            expect(router.currentRoute.value.fullPath).toBe(fullPath);
        });
    });

    describe('colours', () => {
        it('draws data views in the colour of their option bar button, and the top node, connectors and connections in the colour of Setup’s', async () => {
            const { wrapper } = await mountMap(`?${WORK_QUERY}`);
            const colors = Object.fromEntries(shownData(wrapper).nodes.map((node) => [node.label ?? node.title, node.color]));

            expect(colors.Employees).toBe('#5686d6');
            expect(colors['Data Views']).toBe('#52525b');
            expect(colors.Dropbox).toBe('#52525b');
            expect(colors.Work).toBe('#52525b');
            expect(colors['Add data view']).toBeUndefined();
        });
    });

    describe('icons', () => {
        it('gives the top node, a connector and a connection its own icon, and a data view with no item the data views icon', async () => {
            const { wrapper } = await mountMap(`?${WORK_QUERY}`);
            const icons = Object.fromEntries(shownData(wrapper).nodes.map((node) => [node.label ?? node.title, node.icon]));

            expect(icons['Data Views']).toContain('<svg');
            expect(icons.Dropbox).toBe('<svg data-id="dropbox"/>');
            expect(icons.Work).toBe('<svg data-id="work"/>');
            expect(icons.Employees).toBe(icons['Data Views']);
        });

        it('gives a data view its item’s own icon, or else its file’s format icon, as its card does', async () => {
            const { wrapper } = await mountMap(`?${WORK_QUERY}`);
            const readEmployeesIcon = (): string | undefined => shownData(wrapper).nodes.find((node) => node.label === 'Employees')?.icon;

            // 'Work' reads files, so a previewed file shows its format.
            await wrapper.setProps({ dataViewLocalisedConfigs: [{ ...EMPLOYEES, readingConfig: { dataFormatId: 'json' } }] });
            expect(readEmployeesIcon()).toBe(DATA_FORMAT_ICON_CONFIGS.json.icon);

            await wrapper.setProps({
                dataViewLocalisedConfigs: [{ ...EMPLOYEES, connectionNodeConfig: { icon: '<svg data-id="item"/>' }, readingConfig: { dataFormatId: 'json' } }]
            });
            expect(readEmployeesIcon()).toBe('<svg data-id="item"/>');
        });
    });
});

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

function buildConnection(id: string, label: string, connectorId: string, connectorLabel: string): LocalisedConfig<ConnectionConfig> {
    const connectorConfig = { id: connectorId, label: { en: connectorLabel }, description: {}, icon: `<svg data-id="${connectorId}"/>`, itemTypeId: 'file' };
    return { id, label, description: '', icon: `<svg data-id="${id}"/>`, connectorConfig } as unknown as LocalisedConfig<ConnectionConfig>;
}

// The list is a plain ref here, in place of the app's computed one.
function setConnections(configs: LocalisedConfig<ConnectionConfig>[]): void {
    (connectionLocalisedConfigs as unknown as { value: LocalisedConfig<ConnectionConfig>[] }).value = configs;
}

async function mountMap(search = '', selectedDataViewId?: string): Promise<{ router: Router; wrapper: VueWrapper }> {
    const component = { render: (): null => null };
    const router = createRouter({
        history: createMemoryHistory(),
        routes: [
            { name: 'dataViews', path: '/dataViews/:dataViewId?', component },
            { name: 'item', path: '/dataViews/:dataViewId/items', component }
        ]
    });
    await router.push(`/dataViews${search}`);
    await router.isReady();
    const wrapper = mount(DataViewMap, {
        props: { dataViewLocalisedConfigs: DATA_VIEW_LOCALISED_CONFIGS, selectedDataViewId },
        global: { plugins: [router], stubs: { NetworkDiagram: NetworkDiagramStub } }
    });
    wrappers.push(wrapper);
    await settle();
    return { router, wrapper };
}

function shownData(wrapper: VueWrapper): DataViewMapData {
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
