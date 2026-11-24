// ── External Dependencies & Registrations
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { computed, defineComponent, h, ref } from 'vue';
import { createMemoryHistory, createRouter, type Router, RouterView, useRoute } from 'vue-router';
import { enableAutoUnmount, mount } from '@vue/test-utils';

// ── DPUse Framework
import type { ConnectionConfig, DataViewConfig, LocalisedConfig } from '@dpuse/dpuse-shared';

// ── Local Framework
import { isDataViewTaskRoute } from '@/features/studio/dataViews/_useDataViewTasks';
import { settle } from '~/tests/support/settle';
import { useDataViewRedirects } from '@/features/studio/dataViews/_useDataViewRedirects';
import { configStatus, connectionLocalisedConfigs } from '@/state/configs';
import { dataViewHasChanges, draftDataViewConfig } from '@/features/studio/dataViews/_state/dataViewDraft';
import { lastDataViewsViewId, NEW_DATA_VIEW_ID } from '@/features/studio/dataViews/_state/dataViews';

enableAutoUnmount(afterEach);

vi.mock('@/observability/errorTracking', () => import('~/tests/support/errorTracking'));

// A draft's records are kept in a store the tests do not open.
vi.mock('@/features/studio/dataViews/_state/dataViewStore', () => ({ forgetDataViewLoads: vi.fn(), forgetDraftLoad: vi.fn(), promoteDraftLoad: vi.fn() }));

// Whether the account's connections have arrived, and which account's store is open, are refs a test can set.
vi.mock('@/state/session', async (importOriginal) => {
    const { ref } = await import('vue');
    return { ...(await importOriginal<object>()), accountConnectionsStatusTypeId: ref('ready') };
});
vi.mock('@/services/workspaceStore', async (importOriginal) => {
    const { ref } = await import('vue');
    return { ...(await importOriginal<object>()), workspaceStoreId: ref<string>() };
});

// The app builds its connections from the connectors it is sent, so the list is replaced with one a test can set.
vi.mock('@/state/configs', async (importOriginal) => {
    const { shallowRef } = await import('vue');
    return { ...(await importOriginal<object>()), configStatus: shallowRef({ typeId: 'ready' }), connectionLocalisedConfigs: shallowRef<{ id: string }[]>([]) };
});

// ── Types ────────────────────────────────────────────────────────────────────────────────────────────────────────────

type DataViewRedirects = ReturnType<typeof useDataViewRedirects>;

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

const WORK_CONNECTION = { id: 'work', label: 'Work' } as unknown as LocalisedConfig<ConnectionConfig>;
const SALES_DATA_VIEW = { id: 'a', label: { en: 'Sales' }, description: {}, icon: null, iconDark: null, typeId: 'dataView', connectionId: 'work' } as DataViewConfig;

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

const dataViewConfig = ref<DataViewConfig>(); // What the layout has loaded, which each test sets as the layout would.

// ── Tests ────────────────────────────────────────────────────────────────────────────────────────────────────────────

describe('useDataViewRedirects', () => {
    beforeEach(async () => {
        dataViewConfig.value = undefined;
        draftDataViewConfig.value = undefined;
        lastDataViewsViewId.value = 'list';
        setConnections([WORK_CONNECTION]);
        (configStatus as unknown as { value: object }).value = { typeId: 'ready' };
        await setAccountConnectionsStatus('ready');
        await setWorkspaceStoreId(undefined);
    });

    describe('leaving unsaved changes', () => {
        it('lets the user move between the steps of a data view without asking', async () => {
            const { redirects, router } = await mountRedirects('/dataViews/a/connections', { hasChanges: true });

            await router.push('/dataViews/a/items');
            await settle();

            expect(redirects.leaveConfirmIsOpen.value).toBe(false);
            expect(router.currentRoute.value.name).toBe('item');
            expect(dataViewHasChanges.value).toBe(true);
        });

        it('asks before leaving, and keeps the user and their changes when they stay', async () => {
            const { redirects, router } = await mountRedirects('/dataViews/a/items', { hasChanges: true });

            const navigation = router.push('/dataViews/list');
            await settle();
            expect(redirects.leaveConfirmIsOpen.value).toBe(true);
            redirects.cancelLeave();
            await navigation;

            expect(router.currentRoute.value.name).toBe('item');
            expect(dataViewHasChanges.value).toBe(true);
        });

        it('discards the changes and leaves once the user agrees', async () => {
            const { redirects, router } = await mountRedirects('/dataViews/a/items', { hasChanges: true });

            const navigation = router.push('/');
            await settle();
            redirects.confirmLeave();
            await navigation;

            expect(router.currentRoute.value.name).toBe('studio');
            expect(dataViewHasChanges.value).toBe(false);
        });

        it('leaves without asking when nothing has changed', async () => {
            const { redirects, router } = await mountRedirects('/dataViews/a/items', { hasChanges: false });

            await router.push('/dataViews/list');
            await settle();

            expect(redirects.leaveConfirmIsOpen.value).toBe(false);
            expect(router.currentRoute.value.name).toBe('dataViewList');
        });

        it('opens a data view the list has just started, without asking', async () => {
            const { redirects, router } = await mountRedirects('/dataViews/list', { hasChanges: true }); // The list starts a draft, then opens it.

            await router.push('/dataViews/new/items');
            await settle();

            expect(redirects.leaveConfirmIsOpen.value).toBe(false);
            expect(router.currentRoute.value.name).toBe('item');
        });
    });

    describe('redirects', () => {
        it('sends a data view being added back to the list when a later task opens with nothing to work on', async () => {
            const { router } = await mountRedirects('/dataViews/new/items', { hasChanges: false });

            expect(router.currentRoute.value.name).toBe('dataViewList');
        });

        it('leaves a data view being added on its connection task, where it starts', async () => {
            const { router } = await mountRedirects('/dataViews/new/connections', { hasChanges: false });

            expect(router.currentRoute.value.name).toBe('connection');
        });

        it('sends a task back to the list, with its data view selected, when its connection has gone', async () => {
            dataViewConfig.value = SALES_DATA_VIEW;
            const { router } = await mountRedirects('/dataViews/a/items', { hasChanges: true });
            expect(router.currentRoute.value.name).toBe('item');

            setConnections([]);
            await settle();

            expect(router.currentRoute.value.fullPath).toBe('/dataViews/list/a');
            expect(dataViewHasChanges.value).toBe(false);
        });

        it('waits for the account’s connections before deciding a connection has gone', async () => {
            await setAccountConnectionsStatus('pending');
            dataViewConfig.value = SALES_DATA_VIEW;
            setConnections([]);
            const { router } = await mountRedirects('/dataViews/a/items', { hasChanges: false });

            expect(router.currentRoute.value.name).toBe('item');
        });

        it('goes back to the view with nothing selected when the user moves to another account’s store', async () => {
            await setWorkspaceStoreId('guest');
            const { router } = await mountRedirects('/dataViews/a/items', { hasChanges: true });

            await setWorkspaceStoreId('account');
            await settle();

            expect(router.currentRoute.value.fullPath).toBe('/dataViews/list');
            expect(dataViewHasChanges.value).toBe(false);
        });

        it('stays put when the first store is chosen after the session check', async () => {
            const { router } = await mountRedirects('/dataViews/a/items', { hasChanges: true });

            await setWorkspaceStoreId('guest');
            await settle();

            expect(router.currentRoute.value.name).toBe('item');
        });
    });
});

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

// The data view routes sit under one parent, as they do under 'DataViewsLayout', so the route guards are the parent's.
async function buildRouter(path: string, host: object): Promise<Router> {
    const component = { render: (): null => null };
    const router = createRouter({
        history: createMemoryHistory(),
        routes: [
            { name: 'studio', path: '/', component },
            {
                path: '/dataViews',
                component: host,
                children: [
                    { name: 'dataViewList', path: 'list/:dataViewId?', component },
                    { name: 'connection', path: ':dataViewId/connections', component },
                    { name: 'item', path: ':dataViewId/items', component },
                    { name: 'data', path: ':dataViewId/data', component }
                ]
            }
        ]
    });
    await router.push(path);
    await router.isReady();
    return router;
}

// The composable runs in the component the router shows for the data view routes, as it does in the layout, so it can
// guard leaving them. The open-view route it is handed is the list's, with the open data view selected.
async function mountRedirects(path: string, { hasChanges }: { hasChanges: boolean }): Promise<{ redirects: DataViewRedirects; router: Router }> {
    if (hasChanges) draftDataViewConfig.value = { ...SALES_DATA_VIEW, id: path.includes(`/${NEW_DATA_VIEW_ID}/`) ? NEW_DATA_VIEW_ID : 'a' };
    let redirects: DataViewRedirects | undefined;
    const Host = defineComponent({
        setup() {
            const route = useRoute();
            const routeIsTask = computed(() => isDataViewTaskRoute(route.name));
            const dataViewIsNew = computed(() => routeIsTask.value && route.params.dataViewId === NEW_DATA_VIEW_ID);
            redirects = useDataViewRedirects({
                constructOpenDataViewRoute: () => ({ name: 'dataViewList', params: { dataViewId: dataViewConfig.value?.id } }),
                dataViewConfig,
                dataViewIsNew,
                routeIsTask
            });
            return renderRouterView;
        }
    });
    const router = await buildRouter(path, Host);
    mount({ render: renderRouterView }, { global: { plugins: [router] } });
    await settle();
    if (redirects == null) throw new Error('The composable did not run.');
    return { redirects, router };
}

function renderRouterView(): ReturnType<typeof h> {
    return h(RouterView);
}

// The list is a plain ref here, in place of the app's computed one.
function setConnections(configs: LocalisedConfig<ConnectionConfig>[]): void {
    (connectionLocalisedConfigs as unknown as { value: LocalisedConfig<ConnectionConfig>[] }).value = configs;
}

async function setAccountConnectionsStatus(typeId: 'pending' | 'ready'): Promise<void> {
    const module_ = (await import('@/state/session')) as unknown as { accountConnectionsStatusTypeId: { value: string } };
    module_.accountConnectionsStatusTypeId.value = typeId;
}

async function setWorkspaceStoreId(id: string | undefined): Promise<void> {
    const module_ = (await import('@/services/workspaceStore')) as unknown as { workspaceStoreId: { value: string | undefined } };
    module_.workspaceStoreId.value = id;
}
