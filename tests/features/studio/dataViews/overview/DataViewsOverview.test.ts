// ── External Dependencies & Registrations
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createMemoryHistory, createRouter, type Router } from 'vue-router';
import { defineComponent, h, type PropType, type SetupContext } from 'vue';
import { mount, type VueWrapper } from '@vue/test-utils';

// ── DPUse Framework
import type { ConnectionConfig, DataViewConfig, LocalisedConfig } from '@dpuse/dpuse-shared';

// ── Local Framework
import { TEXT as CONFIRM_DIALOG_TEXT } from '@/components/ui/dialog/ConfirmDialog_.json';
import { connectionLocalisedConfigs } from '@/state/configs';
import { isDataViewLoaded } from '@/features/studio/dataViews/_state/dataViewStore';
import { TEXT as OVERVIEW_TEXT } from '@/features/studio/dataViews/overview/DataViewsOverview_.json';
import { raiseAppFailure } from '@/state/errors';
import { settle } from '~/tests/support/settle';
import { t } from '@/state/locale';
import { discardDataViewDraft, draftDataViewConfig } from '@/features/studio/dataViews/_state/dataViewDraft';

vi.mock('@/observability/errorTracking', () => import('~/tests/support/errorTracking'));

// A draft's records are kept in a store the tests do not open.
vi.mock('@/features/studio/dataViews/_state/dataViewStore', () => ({ forgetDraftLoad: vi.fn(), isDataViewLoaded: vi.fn(), promoteDraftLoad: vi.fn() }));

// The app builds its connections from the connectors it is sent, so the list is replaced here with one a test can set,
// and a connection is looked up in it.
vi.mock('@/state/configs', async (importOriginal) => {
    const { shallowRef } = await import('vue');
    const connectionLocalisedConfigs = shallowRef<{ id: string }[]>([]);
    const findConnectionLocalisedConfig = (id?: string): object | undefined => connectionLocalisedConfigs.value.find((config) => config.id === id);
    return { ...(await importOriginal<object>()), connectionLocalisedConfigs, findConnectionLocalisedConfig };
});

// The connection and connector panels have their own screens, so each stands in as the name of what it is given. They
// load when first shown, and '__esModule' lets the loader find the stand-in as the module's default export.
vi.mock('@/features/studio/dataViews/selectConnection/SelectConnectionPanel.vue', async () => {
    const { h } = await import('vue');
    const component = {
        props: { connectionLocalisedConfig: { type: Object, default: undefined }, hidesRemoval: Boolean },
        setup(properties: { connectionLocalisedConfig?: { label: string }; hidesRemoval?: boolean }) {
            return (): unknown =>
                h('div', { 'data-removal-hidden': String(properties.hidesRemoval), 'data-test': 'connection-panel' }, properties.connectionLocalisedConfig?.label);
        }
    };
    return { __esModule: true, default: component };
});
vi.mock('@/features/studio/setup/plugins/PluginConnectorPanel.vue', async () => {
    const { h } = await import('vue');
    const component = {
        props: { pluginLocalisedConfig: { type: Object, default: undefined }, setupOptionLocalisedConfig: { type: Object, default: undefined } },
        setup(properties: { pluginLocalisedConfig?: { label: string }; setupOptionLocalisedConfig?: { id: string } }) {
            return (): unknown =>
                h('div', { 'data-setup-option': properties.setupOptionLocalisedConfig?.id, 'data-test': 'connector-panel' }, properties.pluginLocalisedConfig?.label);
        }
    };
    return { __esModule: true, default: component };
});

vi.mock('@/state/errors', async (importOriginal) => ({ ...(await importOriginal<object>()), raiseAppFailure: vi.fn() }));

// The overview reads its data views and deletes them through these hooks, so the spec drives them directly: the refs
// below are the query and the mutation, and each test moves them the way a real delete would. The routes to the
// diagram and the list are the app's own.
vi.mock('@/features/studio/dataViews/_state/dataViews', async (importOriginal) => {
    const { ref } = await import('vue');
    // eslint-disable-next-line @typescript-eslint/consistent-type-imports -- Vitest's documented pattern for typing 'importOriginal'.
    const { constructDataViewsViewRoute } = await importOriginal<typeof import('@/features/studio/dataViews/_state/dataViews')>();
    const state = {
        dataViewConfigs: ref<DataViewConfig[]>([]),
        deleteIsPending: ref(false),
        deleteDataView: vi.fn<(id: string) => Promise<void>>()
    };
    return {
        NEW_DATA_VIEW_ID: 'new',
        cancelDataViewRetrieval: vi.fn(),
        constructDataViewsViewRoute,
        constructNewDataViewConfig: (connectionId: string): object => ({ id: 'new', connectionId }),
        useDataViews: (): object => ({
            data: state.dataViewConfigs,
            error: ref(null),
            isError: ref(false),
            isFetching: ref(false),
            isSuccess: ref(true),
            refetch: vi.fn()
        }),
        useDeleteDataView: (): object => ({ isPending: state.deleteIsPending, mutateAsync: state.deleteDataView }),
        stateForTest: state
    };
});

// ── Types ────────────────────────────────────────────────────────────────────────────────────────────────────────────

interface StateForTest {
    dataViewConfigs: { value: DataViewConfig[] };
    deleteIsPending: { value: boolean };
    deleteDataView: ReturnType<typeof vi.fn<(id: string) => Promise<void>>>;
}

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

// Dropbox has two connections, so the diagram can be drilled down to it. SQLite has one.
const CONNECTION_LOCALISED_CONFIGS = [
    buildConnection('work', 'Work', 'dropbox', 'Dropbox'),
    buildConnection('personal', 'Personal', 'dropbox', 'Dropbox'),
    buildConnection('local', 'Local', 'sqlite', 'SQLite')
];
const SALES_DIAGRAM_PATH = '/dataViews/diagram/dropbox/work/a'; // 'Sales' selected in the diagram, under its connection.

// The panes need a measured layout that jsdom cannot give, so this stand-in shows the left pane's content, and the
// selected item's detail and its action.
const MasterDetailPanelStub = {
    props: { selectedItem: { type: Object as PropType<{ id: string }>, default: undefined } },
    setup(properties: { selectedItem?: { id: string } }, { slots }: SetupContext) {
        return (): ReturnType<typeof h> =>
            h('div', [
                slots.master?.({ isSplit: true, openDetail: vi.fn() }),
                ...(properties.selectedItem ? [slots.detail?.({ item: properties.selectedItem, close: vi.fn() }), slots['detail-action']?.({ item: properties.selectedItem })] : [])
            ]);
    }
};

// The list and the diagram have their own tests, so each route stands in as a button that selects the second data view.
// The diagram has a second button, which asks for a new data view on a connection as its add node does.
const DataViewListStub = constructViewStub('list');
const DataViewDiagramStub = constructViewStub('diagram');

// The detail panel stands in as its Delete button, which is all the list reads from it.
const DataViewDetailStub = defineComponent({
    props: { isDeleting: { type: Boolean, default: false } },
    emits: ['delete'],
    setup(properties: { isDeleting: boolean }, { emit }: SetupContext<['delete']>) {
        return (): ReturnType<typeof h> =>
            h(
                'button',
                {
                    'data-test': 'delete',
                    disabled: properties.isDeleting,
                    onClick: () => {
                        emit('delete');
                    }
                },
                'Delete Data View'
            );
    }
});

// ── Tests ────────────────────────────────────────────────────────────────────────────────────────────────────────────

describe('data views overview deletion', () => {
    beforeEach(async () => {
        const state = await getState();
        state.dataViewConfigs.value = [buildDataView('a', 'Sales'), buildDataView('b', 'Stock')];
        state.deleteIsPending.value = false;
        state.deleteDataView.mockReset();
        vi.mocked(raiseAppFailure).mockClear();
        document.body.replaceChildren();
    });

    it('deletes nothing when the user cancels', async () => {
        const state = await getState();
        const router = await buildRouter();
        const wrapper = await mountPanel(router);

        await wrapper.get('[data-test="delete"]').trigger('click');
        await settle();
        findDialogButton(t(CONFIRM_DIALOG_TEXT, 'cancel.label')).click();
        await settle();

        expect(state.deleteDataView).not.toHaveBeenCalled();
        expect(router.currentRoute.value.params.dataViewId).toBe('a');
        wrapper.unmount();
    });

    it('deletes the selected data view, clears it from the URL and moves focus to the message', async () => {
        const state = await getState();
        // The list drops the data view as soon as the delete resolves, as the cache update does.
        state.deleteDataView.mockImplementation((id) => {
            state.dataViewConfigs.value = state.dataViewConfigs.value.filter((config) => config.id !== id);
            return Promise.resolve();
        });
        const router = await buildRouter();
        const wrapper = await mountPanel(router);

        await wrapper.get('[data-test="delete"]').trigger('click');
        await settle();
        findDialogButton(t(OVERVIEW_TEXT, 'delete.confirm.label')).click();
        await settle();

        expect(state.deleteDataView).toHaveBeenCalledWith('a');
        expect(router.currentRoute.value.params.dataViewId).toBeUndefined();
        expect(document.activeElement?.textContent).toBe(t(OVERVIEW_TEXT, 'delete.done.text', { name: 'Sales' }));
        wrapper.unmount();
    });

    it('reports a failed delete and keeps the data view selected', async () => {
        const state = await getState();
        state.deleteDataView.mockRejectedValue(new Error('Store unavailable.'));
        const router = await buildRouter();
        const wrapper = await mountPanel(router);

        await wrapper.get('[data-test="delete"]').trigger('click');
        await settle();
        findDialogButton(t(OVERVIEW_TEXT, 'delete.confirm.label')).click();
        await settle();

        expect(raiseAppFailure).toHaveBeenCalledOnce();
        expect(router.currentRoute.value.params.dataViewId).toBe('a');
        wrapper.unmount();
    });

    it('shows the Delete button as busy while a delete is under way', async () => {
        const state = await getState();
        const router = await buildRouter();
        const wrapper = await mountPanel(router);

        state.deleteIsPending.value = true;
        await settle();

        expect(wrapper.get('[data-test="delete"]').attributes('disabled')).toBeDefined();
        wrapper.unmount();
    });
});

describe('data views overview views', () => {
    beforeEach(async () => {
        const state = await getState();
        state.dataViewConfigs.value = [buildDataView('a', 'Sales', 'work'), buildDataView('b', 'Stock', 'work')];
        setConnections(CONNECTION_LOCALISED_CONFIGS);
        document.body.replaceChildren();
    });

    afterEach(() => {
        setConnections([]);
    });

    it.each([
        ['diagram', '/dataViews/diagram', 'list'],
        ['list', '/dataViews/list/a', 'diagram']
    ])('shows the %s, and not the other view, when the route names it', async (viewId, path, otherViewId) => {
        const router = await buildRouter(path);
        const wrapper = await mountPanel(router);

        expect(wrapper.find(`[data-test="${viewId}"]`).exists()).toBe(true);
        expect(wrapper.find(`[data-test="${otherViewId}"]`).exists()).toBe(false);
        wrapper.unmount();
    });

    it('keeps the one detail panel as it is when the view changes', async () => {
        const router = await buildRouter(SALES_DIAGRAM_PATH);
        const wrapper = await mountPanel(router);
        const detailElement = wrapper.get('[data-test="delete"]').element;

        await router.push('/dataViews/list/a');
        await settle();

        expect(wrapper.get('[data-test="delete"]').element).toBe(detailElement);
        wrapper.unmount();
    });

    it.each([
        ['list', '/dataViews/list/a', '/dataViews/list/b'],
        ['diagram', SALES_DIAGRAM_PATH, '/dataViews/diagram/dropbox/work/b']
    ])('selects the data view chosen in the %s, and stays in that view', async (viewId, path, selectedPath) => {
        const router = await buildRouter(path);
        const wrapper = await mountPanel(router);

        await wrapper.get(`[data-test="${viewId}"]`).trigger('click');
        await settle();

        expect(router.currentRoute.value.path).toBe(selectedPath);
        wrapper.unmount();
    });
});

describe('data views overview diagram selection', () => {
    beforeEach(async () => {
        const state = await getState();
        state.dataViewConfigs.value = [buildDataView('a', 'Sales')];
        setConnections(CONNECTION_LOCALISED_CONFIGS);
        document.body.replaceChildren();
    });

    afterEach(() => {
        setConnections([]);
        discardDataViewDraft();
    });

    it('shows the connection the diagram is drilled down to, without Delete or Hide, and starts a data view on it from its action', async () => {
        const router = await buildRouter('/dataViews/diagram/dropbox/work');
        const wrapper = await mountPanel(router);

        const connectionPanel = wrapper.get('[data-test="connection-panel"]');
        expect(connectionPanel.text()).toBe('Work');
        expect(connectionPanel.attributes('data-removal-hidden')).toBe('true');

        await findButton(wrapper, t(OVERVIEW_TEXT, 'detail.add.label'))?.trigger('click');
        await settle();

        expect(draftDataViewConfig.value).toMatchObject({ connectionId: 'work' });
        expect(router.currentRoute.value.name).toBe('item');
        expect(router.currentRoute.value.params.dataViewId).toBe('new');
        wrapper.unmount();
    });

    it('shows the connector the diagram is drilled down to, as Setup does, with no action', async () => {
        const router = await buildRouter('/dataViews/diagram/dropbox');
        const wrapper = await mountPanel(router);

        const connectorPanel = wrapper.get('[data-test="connector-panel"]');
        expect(connectorPanel.text()).toBe('Dropbox');
        expect(connectorPanel.attributes('data-setup-option')).toBe('connectors');
        expect(findButton(wrapper, t(OVERVIEW_TEXT, 'detail.add.label'))).toBeUndefined();
        wrapper.unmount();
    });

    it('shows the selected data view in place of the connection it belongs to', async () => {
        const router = await buildRouter(SALES_DIAGRAM_PATH);
        const wrapper = await mountPanel(router);

        expect(wrapper.find('[data-test="delete"]').exists()).toBe(true);
        expect(wrapper.find('[data-test="connection-panel"]').exists()).toBe(false);
        wrapper.unmount();
    });

    it('starts a data view on the connection whose add node is clicked in the diagram, and opens the item step', async () => {
        const router = await buildRouter('/dataViews/diagram/sqlite/local');
        const wrapper = await mountPanel(router);

        await wrapper.get('[data-test="diagram-add"]').trigger('click');
        await settle();

        expect(draftDataViewConfig.value).toMatchObject({ connectionId: 'local' });
        expect(router.currentRoute.value.name).toBe('item');
        wrapper.unmount();
    });
});

describe('opening a data view', () => {
    async function openSelectedDataView(connectionNodeConfig: DataViewConfig['connectionNodeConfig'], isLoaded: boolean): Promise<unknown> {
        const state = await getState();
        state.dataViewConfigs.value = [{ ...buildDataView('a', 'Sales'), connectionNodeConfig }];
        vi.mocked(isDataViewLoaded).mockReturnValue(isLoaded);
        const router = await buildRouter();
        const wrapper = await mountPanel(router);

        const openButton = wrapper.findAll('button').find((candidate) => candidate.text() === t(OVERVIEW_TEXT, 'detail.open.label'));
        await openButton?.trigger('click');
        await settle();

        const routeName = router.currentRoute.value.name; // Taken before the unmount, which resets the router.
        wrapper.unmount();
        return routeName;
    }

    const itemConfig = { folderPath: '', label: 'sales', name: 'sales' } as DataViewConfig['connectionNodeConfig'];

    it('opens at Explore Data once the records are loaded', async () => {
        expect(await openSelectedDataView(itemConfig, true)).toBe('data');
    });

    it('opens at the item while its records are not loaded', async () => {
        expect(await openSelectedDataView(itemConfig, false)).toBe('item');
    });

    it('opens at the connection of a data view with no item chosen', async () => {
        expect(await openSelectedDataView(undefined, false)).toBe('connection');
    });
});

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

// A view stands in as a button that selects the second data view. The list hands over the data view, as a card does,
// and the diagram its id, as a node does. The diagram's second button asks for a new data view on the 'local' connection.
function constructViewStub(viewId: 'diagram' | 'list'): object {
    return {
        emits: ['add', 'select'],
        setup(_properties: object, { emit }: SetupContext<['add', 'select']>) {
            const selectButton = (): ReturnType<typeof h> =>
                h(
                    'button',
                    {
                        'data-test': viewId,
                        onClick: () => {
                            emit('select', viewId === 'list' ? { id: 'b' } : 'b');
                        }
                    },
                    viewId
                );
            const addButton = (): ReturnType<typeof h> =>
                h('button', {
                    'data-test': 'diagram-add',
                    onClick: () => {
                        emit('add', 'local');
                    }
                });
            return (): ReturnType<typeof h> => h('div', viewId === 'diagram' ? [selectButton(), addButton()] : [selectButton()]);
        }
    };
}

function buildConnection(id: string, label: string, connectorId: string, connectorLabel: string): LocalisedConfig<ConnectionConfig> {
    return { id, label, description: '', connectorConfig: { id: connectorId, label: { en: connectorLabel }, description: {} } } as unknown as LocalisedConfig<ConnectionConfig>;
}

// The list is a plain ref here, in place of the app's computed one.
function setConnections(configs: LocalisedConfig<ConnectionConfig>[]): void {
    (connectionLocalisedConfigs as unknown as { value: LocalisedConfig<ConnectionConfig>[] }).value = configs;
}

function findButton(wrapper: VueWrapper, label: string): ReturnType<VueWrapper['findAll']>[number] | undefined {
    return wrapper.findAll('button').find((candidate) => candidate.text() === label);
}

function buildDataView(id: string, label: string, connectionId?: string): DataViewConfig {
    return { id, label: { en: label }, description: {}, icon: null, iconDark: null, typeId: 'dataView', connectionId } as DataViewConfig;
}

async function getState(): Promise<StateForTest> {
    const module_ = (await import('@/features/studio/dataViews/_state/dataViews')) as unknown as { stateForTest: StateForTest };
    return module_.stateForTest;
}

// The overview is mounted by itself, so its 'RouterView' shows the diagram or list route at the top level. The data
// view 'a' starts selected in the list, which needs no connection to show it.
async function buildRouter(path = '/dataViews/list/a'): Promise<Router> {
    const component = { render: (): null => null };
    const router = createRouter({
        history: createMemoryHistory(),
        routes: [
            { name: 'dataViewDiagram', path: '/dataViews/diagram/:connectorId?/:connectionId?/:dataViewId?', component: DataViewDiagramStub },
            { name: 'dataViewList', path: '/dataViews/list/:dataViewId?', component: DataViewListStub },
            { name: 'connection', path: '/dataViews/:dataViewId/connections', component },
            { name: 'item', path: '/dataViews/:dataViewId/items', component },
            { name: 'data', path: '/dataViews/:dataViewId/data', component }
        ]
    });
    await router.push(path);
    await router.isReady();
    return router;
}

async function mountPanel(router: Router): Promise<VueWrapper> {
    const panelModule = await import('@/features/studio/dataViews/overview/DataViewsOverview.vue');
    const wrapper = mount(panelModule.default, {
        attachTo: document.body, // Focus only moves between elements in the document.
        global: {
            plugins: [router],
            stubs: {
                DataViewDetail: DataViewDetailStub,
                MasterDetailPanel: MasterDetailPanelStub,
                Transition: false
            }
        }
    });
    await settle();
    return wrapper;
}

function findDialogButton(label: string): HTMLButtonElement {
    const button = [...document.querySelectorAll<HTMLButtonElement>('[data-region="ConfirmDialog"] button')].find((candidate) => candidate.textContent.trim() === label);
    if (!button) throw new Error(`The confirm dialog has no '${label}' button.`);
    return button;
}
